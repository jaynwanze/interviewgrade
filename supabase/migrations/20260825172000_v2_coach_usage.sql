create table if not exists public.coach_usage (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid not null references public.user_profiles(id) on delete restrict,
  session_id uuid not null references public.sessions(id) on delete cascade,
  consumed_at timestamptz not null default now()
);

create index if not exists coach_usage_user_session_consumed_at_idx
  on public.coach_usage (user_id, session_id, consumed_at desc);

alter table public.coach_usage enable row level security;
revoke all privileges on table public.coach_usage from anon, authenticated;
grant all privileges on table public.coach_usage to service_role;

create or replace function public.reserve_v2_coach_request(
  p_user_id uuid,
  p_session_id uuid
)
returns table (
  allowed boolean,
  session_used integer,
  session_limit integer,
  burst_used integer,
  burst_limit integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_session_used integer;
  v_burst_used integer;
  v_session_limit constant integer := 5;
  v_burst_limit constant integer := 3;
  v_window interval := interval '10 minutes';
begin
  perform 1
  from public.user_profiles up
  where up.id = p_user_id
  for update;

  if not found then
    raise exception 'Coach user % has no user profile.', p_user_id;
  end if;

  select count(*)::integer
    into v_session_used
  from public.coach_usage cu
  where cu.user_id = p_user_id
    and cu.session_id = p_session_id;

  select count(*)::integer
    into v_burst_used
  from public.coach_usage cu
  where cu.user_id = p_user_id
    and cu.consumed_at >= now() - v_window;

  if v_session_used >= v_session_limit then
    return query select false, v_session_used, v_session_limit, v_burst_used, v_burst_limit, 0;
    return;
  end if;

  if v_burst_used >= v_burst_limit then
    return query select false, v_session_used, v_session_limit, v_burst_used, v_burst_limit, 600;
    return;
  end if;

  insert into public.coach_usage (user_id, session_id)
  values (p_user_id, p_session_id);

  return query select true, v_session_used + 1, v_session_limit, v_burst_used + 1, v_burst_limit, 0;
end;
$$;

revoke all on function public.reserve_v2_coach_request(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.reserve_v2_coach_request(uuid, uuid)
  to service_role;
