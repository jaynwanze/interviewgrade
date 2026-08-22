-- Keep the legacy profile bridge working for OAuth users that do not carry
-- InterviewGrade's old candidate/employer userType metadata.
--
-- V2 treats Creator/Participant as contextual behavior rather than permanent
-- account roles. Until the remaining legacy candidate wrappers/billing code are
-- removed, new non-employer auth users use the candidate compatibility profile.

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  user_type_value public.user_types;
  new_token_id uuid;
begin
  -- Preserve explicit legacy employer accounts. Candidate, missing, or unknown
  -- metadata defaults to the V2-compatible candidate shell.
  user_type_value := case
    when new.raw_user_meta_data->>'userType' = 'employer'
      then 'employer'::public.user_types
    else 'candidate'::public.user_types
  end;

  insert into public.user_profiles (id, user_type)
  values (new.id, user_type_value);

  if user_type_value = 'candidate' then
    insert into public.candidates (id)
    values (new.id);
  end if;

  if user_type_value = 'employer' then
    insert into public.tokens (
      id,
      tokens_available,
      total_tokens_used,
      total_tokens_purchased,
      last_purchase_date
    )
    values (extensions.uuid_generate_v4(), 5, 0, 0, now())
    returning id into new_token_id;

    insert into public.employees (id, token_id)
    values (new.id, new_token_id);
  end if;

  return new;
end;
$$;
