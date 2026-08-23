create or replace function public.reserve_v2_practice_run(p_session_id uuid)
returns table (
  allowed boolean,
  already_reserved boolean,
  funder_user_id uuid,
  plan text,
  used integer,
  run_limit integer
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_practice_id uuid;
  v_funder_user_id uuid;
  v_existing boolean;
  v_subscription_status text;
  v_plan text;
  v_limit integer;
  v_used integer;
begin
  select s.practice_id, p.created_by
    into v_practice_id, v_funder_user_id
  from public.sessions s
  join public.practices p on p.id = s.practice_id
  where s.id = p_session_id;

  if not found then
    raise exception 'Session % was not found for Practice-run reservation.', p_session_id;
  end if;

  perform 1
  from public.user_profiles up
  where up.id = v_funder_user_id
  for update;

  if not found then
    raise exception 'Practice owner % has no user profile.', v_funder_user_id;
  end if;

  select exists (
    select 1
    from public.practice_run_usage pru
    where pru.session_id = p_session_id
  ) into v_existing;

  select s.status::text
    into v_subscription_status
  from public.subscriptions s
  where s.candidate_id = v_funder_user_id
    and s.status::text in ('active', 'trialing')
  order by s.created desc nulls last
  limit 1;

  if v_subscription_status in ('active', 'trialing') then
    v_plan := 'pro';
    v_limit := 30;
  else
    v_plan := 'free';
    v_limit := 3;
  end if;

  select count(*)::integer
    into v_used
  from public.practice_run_usage pru
  where pru.funder_user_id = v_funder_user_id
    and pru.consumed_at >= date_trunc('month', now())
    and pru.consumed_at < date_trunc('month', now()) + interval '1 month';

  if v_existing then
    return query select true, true, v_funder_user_id, v_plan, v_used, v_limit;
    return;
  end if;

  if v_used >= v_limit then
    return query select false, false, v_funder_user_id, v_plan, v_used, v_limit;
    return;
  end if;

  insert into public.practice_run_usage (session_id, practice_id, funder_user_id)
  values (p_session_id, v_practice_id, v_funder_user_id);

  v_used := v_used + 1;
  return query select true, false, v_funder_user_id, v_plan, v_used, v_limit;
end;
$$;

revoke all on function public.reserve_v2_practice_run(uuid) from public, anon, authenticated;
grant execute on function public.reserve_v2_practice_run(uuid) to service_role;

create or replace function public.reserve_v2_practice_generation(
  p_user_id uuid,
  p_source_kind text
)
returns table (
  allowed boolean,
  plan text,
  used integer,
  generation_limit integer
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_subscription_status text;
  v_plan text;
  v_limit integer;
  v_used integer;
begin
  if p_source_kind not in ('brief', 'document') then
    raise exception 'Unsupported Practice generation source kind: %', p_source_kind;
  end if;

  perform 1
  from public.user_profiles up
  where up.id = p_user_id
  for update;

  if not found then
    raise exception 'Practice generation user % has no user profile.', p_user_id;
  end if;

  select s.status::text
    into v_subscription_status
  from public.subscriptions s
  where s.candidate_id = p_user_id
    and s.status::text in ('active', 'trialing')
  order by s.created desc nulls last
  limit 1;

  if v_subscription_status in ('active', 'trialing') then
    v_plan := 'pro';
    v_limit := 30;
  else
    v_plan := 'free';
    v_limit := 3;
  end if;

  select count(*)::integer
    into v_used
  from public.practice_generation_usage pgu
  where pgu.user_id = p_user_id
    and pgu.consumed_at >= date_trunc('month', now())
    and pgu.consumed_at < date_trunc('month', now()) + interval '1 month';

  if v_used >= v_limit then
    return query select false, v_plan, v_used, v_limit;
    return;
  end if;

  insert into public.practice_generation_usage (user_id, source_kind)
  values (p_user_id, p_source_kind);

  v_used := v_used + 1;
  return query select true, v_plan, v_used, v_limit;
end;
$$;

revoke all on function public.reserve_v2_practice_generation(uuid, text) from public, anon, authenticated;
grant execute on function public.reserve_v2_practice_generation(uuid, text) to service_role;
