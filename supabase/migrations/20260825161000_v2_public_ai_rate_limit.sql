create table if not exists public.ai_request_rate_limits (
  rate_key text not null,
  operation text not null,
  window_started_at timestamptz not null default now(),
  used integer not null default 0 check (used >= 0),
  primary key (rate_key, operation)
);

alter table public.ai_request_rate_limits enable row level security;
revoke all on table public.ai_request_rate_limits from anon, authenticated;

create or replace function public.reserve_v2_ai_request(
  p_rate_key text,
  p_operation text
)
returns table (
  allowed boolean,
  used integer,
  request_limit integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_limit integer;
  v_window_seconds integer := 3600;
  v_row public.ai_request_rate_limits%rowtype;
begin
  if p_rate_key is null or length(p_rate_key) < 16 or length(p_rate_key) > 128 then
    raise exception 'invalid rate key';
  end if;

  v_limit := case p_operation
    when 'tts' then 60
    when 'transcribe' then 20
    else null
  end;

  if v_limit is null then
    raise exception 'unsupported AI operation';
  end if;

  insert into public.ai_request_rate_limits as limits (
    rate_key,
    operation,
    window_started_at,
    used
  )
  values (p_rate_key, p_operation, v_now, 1)
  on conflict (rate_key, operation) do update
  set
    window_started_at = case
      when limits.window_started_at <= v_now - make_interval(secs => v_window_seconds)
        then v_now
      else limits.window_started_at
    end,
    used = case
      when limits.window_started_at <= v_now - make_interval(secs => v_window_seconds)
        then 1
      else limits.used + 1
    end
  returning * into v_row;

  allowed := v_row.used <= v_limit;
  used := v_row.used;
  request_limit := v_limit;
  retry_after_seconds := case
    when allowed then 0
    else greatest(
      1,
      ceil(extract(epoch from (v_row.window_started_at + make_interval(secs => v_window_seconds) - v_now)))::integer
    )
  end;

  return next;
end;
$$;

revoke all on function public.reserve_v2_ai_request(text, text) from public, anon, authenticated;
