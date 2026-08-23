create table if not exists public.practice_run_usage (
  id uuid primary key default extensions.uuid_generate_v4(),
  session_id uuid not null unique references public.sessions(id) on delete cascade,
  practice_id uuid not null references public.practices(id) on delete restrict,
  funder_user_id uuid not null references public.user_profiles(id) on delete restrict,
  consumed_at timestamptz not null default now()
);

create index if not exists practice_run_usage_funder_consumed_at_idx
  on public.practice_run_usage (funder_user_id, consumed_at desc);

alter table public.practice_run_usage enable row level security;
revoke all privileges on table public.practice_run_usage from anon, authenticated;
grant all privileges on table public.practice_run_usage to service_role;

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

  -- Serialize reservations for the same owner so concurrent first answers
  -- cannot oversubscribe the monthly allowance.
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
    v_limit := 50;
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
