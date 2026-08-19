begin;

-- Transitional bridge for the strangler cutover of built-in Practice templates.
-- The source catalog remains in legacy public.templates / public.questions for
-- now, while every runtime session moves onto PracticeVersion/Session v2.
create table public.legacy_practice_imports (
  participant_user_id uuid not null references public.user_profiles(id) on delete cascade,
  legacy_template_id text not null,
  practice_id uuid not null references public.practices(id) on delete cascade,
  imported_at timestamptz not null default now(),
  primary key (participant_user_id, legacy_template_id),
  constraint legacy_practice_imports_participant_practice_unique
    unique (participant_user_id, practice_id),
  constraint legacy_practice_imports_template_not_blank
    check (length(btrim(legacy_template_id)) > 0)
);

create index legacy_practice_imports_practice_id_idx
  on public.legacy_practice_imports (practice_id);

-- The bridge is server-owned just like the other v2 persistence tables.
alter table public.legacy_practice_imports enable row level security;

comment on table public.legacy_practice_imports is
  'Temporary mapping from legacy built-in Practice templates to candidate-scoped v2 Practice containers during cutover.';

commit;
