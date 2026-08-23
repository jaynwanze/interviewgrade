create table if not exists public.public_session_start_usage (
  id uuid primary key default extensions.uuid_generate_v4(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists public_session_start_usage_practice_created_at_idx
  on public.public_session_start_usage (practice_id, created_at desc);

alter table public.public_session_start_usage enable row level security;
revoke all privileges on table public.public_session_start_usage from anon, authenticated;
grant all privileges on table public.public_session_start_usage to service_role;

create or replace function public.reserve_v2_public_session_start(p_practice_id uuid)
returns table (
  allowed boolean,
  used integer,
  start_limit integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_limit constant integer := 30;
  v_used integer;
  v_oldest timestamptz;
  v_retry integer := 0;
begin
  -- Serialize starts for one Practice so a burst of concurrent requests cannot
  -- all observe the same remaining capacity.
  perform 1
  from public.practices p
  where p.id = p_practice_id
  for update;

  if not found then
    raise exception 'Practice % was not found for public-session rate limiting.', p_practice_id;
  end if;

  select count(*)::integer, min(pssu.created_at)
    into v_used, v_oldest
  from public.public_session_start_usage pssu
  where pssu.practice_id = p_practice_id
    and pssu.created_at > now() - interval '1 hour';

  if v_used >= v_limit then
    if v_oldest is not null then
      v_retry := greatest(
        1,
        ceil(extract(epoch from ((v_oldest + interval '1 hour') - now())))::integer
      );
    end if;

    return query select false, v_used, v_limit, v_retry;
    return;
  end if;

  insert into public.public_session_start_usage (practice_id)
  values (p_practice_id);

  v_used := v_used + 1;
  return query select true, v_used, v_limit, 0;
end;
$$;

revoke all on function public.reserve_v2_public_session_start(uuid) from public, anon, authenticated;
grant execute on function public.reserve_v2_public_session_start(uuid) to service_role;
