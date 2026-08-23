create table if not exists public.practice_generation_usage (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid not null references public.user_profiles(id) on delete restrict,
  source_kind text not null,
  consumed_at timestamptz not null default now(),
  constraint practice_generation_usage_source_kind_check
    check (source_kind in ('brief', 'document'))
);

create index if not exists practice_generation_usage_user_consumed_at_idx
  on public.practice_generation_usage (user_id, consumed_at desc);

alter table public.practice_generation_usage enable row level security;
revoke all privileges on table public.practice_generation_usage from anon, authenticated;
grant all privileges on table public.practice_generation_usage to service_role;

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

  -- Serialize generation reservations per account so simultaneous requests
  -- cannot oversubscribe the monthly allowance.
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
    v_limit := 50;
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

revoke all on function public.reserve_v2_practice_generation(uuid, text)
  from public, anon, authenticated;
grant execute on function public.reserve_v2_practice_generation(uuid, text)
  to service_role;
