begin;

-- InterviewGrade v2 core schema.
--
-- During the strangler migration we intentionally reuse the existing
-- public.organizations and public.user_profiles tables for tenancy/identity.
-- New product concepts live in the v2 practice/session model below and do not
-- depend on legacy candidate/interview-template tables.

create table public.practices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  title text not null,
  description text,
  status text not null default 'draft',
  share_slug text unique,
  current_draft_version_id uuid,
  current_published_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint practices_title_not_blank check (length(btrim(title)) > 0),
  constraint practices_status_check check (status in ('draft', 'published', 'archived'))
);

create table public.practice_versions (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  version integer not null,
  state text not null,
  title text not null,
  description text not null,
  scenario text not null,
  instructions text,
  difficulty text,
  estimated_duration_minutes integer,
  generation_metadata jsonb,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  constraint practice_versions_version_positive check (version > 0),
  constraint practice_versions_state_check check (state in ('draft', 'published')),
  constraint practice_versions_title_not_blank check (length(btrim(title)) > 0),
  constraint practice_versions_description_not_blank check (length(btrim(description)) > 0),
  constraint practice_versions_scenario_not_blank check (length(btrim(scenario)) > 0),
  constraint practice_versions_duration_positive check (
    estimated_duration_minutes is null or estimated_duration_minutes > 0
  ),
  constraint practice_versions_publish_state_check check (
    (state = 'draft' and published_at is null)
    or (state = 'published' and published_at is not null)
  ),
  constraint practice_versions_practice_version_unique unique (practice_id, version),
  constraint practice_versions_practice_id_id_unique unique (practice_id, id)
);

-- Composite FKs guarantee that a practice cannot point at another practice's
-- draft/published version. Current pointers must be cleared before explicitly
-- deleting a pointed-to version.
alter table public.practices
  add constraint practices_current_draft_version_fk
  foreign key (id, current_draft_version_id)
  references public.practice_versions(practice_id, id)
  deferrable initially deferred;

alter table public.practices
  add constraint practices_current_published_version_fk
  foreign key (id, current_published_version_id)
  references public.practice_versions(practice_id, id)
  deferrable initially deferred;

create table public.practice_questions (
  id uuid primary key default gen_random_uuid(),
  practice_version_id uuid not null references public.practice_versions(id) on delete cascade,
  position integer not null,
  prompt text not null,
  guidance text,
  sample_answer text,
  preparation_seconds integer,
  max_response_seconds integer,
  created_at timestamptz not null default now(),
  constraint practice_questions_position_nonnegative check (position >= 0),
  constraint practice_questions_prompt_not_blank check (length(btrim(prompt)) > 0),
  constraint practice_questions_preparation_nonnegative check (
    preparation_seconds is null or preparation_seconds >= 0
  ),
  constraint practice_questions_response_positive check (
    max_response_seconds is null or max_response_seconds > 0
  ),
  constraint practice_questions_version_position_unique unique (practice_version_id, position)
);

create table public.rubric_criteria (
  id uuid primary key default gen_random_uuid(),
  practice_version_id uuid not null references public.practice_versions(id) on delete cascade,
  name text not null,
  description text not null,
  weight numeric(5,2) not null,
  position integer not null,
  rubric_levels jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint rubric_criteria_name_not_blank check (length(btrim(name)) > 0),
  constraint rubric_criteria_description_not_blank check (length(btrim(description)) > 0),
  constraint rubric_criteria_weight_range check (weight > 0 and weight <= 100),
  constraint rubric_criteria_position_nonnegative check (position >= 0),
  constraint rubric_criteria_version_position_unique unique (practice_version_id, position)
);

create table public.question_rubric_criteria (
  question_id uuid not null references public.practice_questions(id) on delete cascade,
  rubric_criterion_id uuid not null references public.rubric_criteria(id) on delete cascade,
  primary key (question_id, rubric_criterion_id)
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete restrict,
  practice_version_id uuid not null,
  participant_user_id uuid references public.user_profiles(id) on delete set null,
  participant_name text,
  participant_email text,
  status text not null default 'created',
  current_question_position integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sessions_practice_version_fk
    foreign key (practice_id, practice_version_id)
    references public.practice_versions(practice_id, id)
    on delete restrict,
  constraint sessions_status_check check (
    status in ('created', 'in_progress', 'completed', 'abandoned')
  ),
  constraint sessions_question_position_nonnegative check (current_question_position >= 0),
  constraint sessions_completion_state_check check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed')
  )
);

create table public.session_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  question_id uuid not null references public.practice_questions(id) on delete restrict,
  question_position integer not null,
  transcript text not null,
  audio_object_path text,
  duration_seconds integer,
  attempt_number integer not null default 1,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint session_responses_question_position_nonnegative check (question_position >= 0),
  constraint session_responses_transcript_not_blank check (length(btrim(transcript)) > 0),
  constraint session_responses_duration_nonnegative check (
    duration_seconds is null or duration_seconds >= 0
  ),
  constraint session_responses_attempt_positive check (attempt_number > 0),
  constraint session_responses_attempt_unique unique (session_id, question_id, attempt_number)
);

create table public.response_evaluations (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.session_responses(id) on delete cascade,
  overall_score numeric(5,2) not null,
  criterion_scores jsonb not null default '[]'::jsonb,
  summary text,
  strengths jsonb not null default '[]'::jsonb,
  improvements jsonb not null default '[]'::jsonb,
  recommendation text not null,
  schema_version text not null,
  model_metadata jsonb not null,
  created_at timestamptz not null default now(),
  constraint response_evaluations_score_range check (overall_score >= 0 and overall_score <= 100),
  constraint response_evaluations_schema_version_not_blank check (length(btrim(schema_version)) > 0),
  constraint response_evaluations_response_schema_unique unique (response_id, schema_version)
);

create table public.session_evaluations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  overall_score numeric(5,2) not null,
  criterion_scores jsonb not null default '[]'::jsonb,
  summary text,
  strengths jsonb not null default '[]'::jsonb,
  improvements jsonb not null default '[]'::jsonb,
  recommendation text not null,
  schema_version text not null,
  model_metadata jsonb not null,
  created_at timestamptz not null default now(),
  constraint session_evaluations_score_range check (overall_score >= 0 and overall_score <= 100),
  constraint session_evaluations_schema_version_not_blank check (length(btrim(schema_version)) > 0),
  constraint session_evaluations_session_schema_unique unique (session_id, schema_version)
);

create index practices_organization_id_idx on public.practices (organization_id);
create index practices_created_by_idx on public.practices (created_by);
create index practice_versions_practice_id_idx on public.practice_versions (practice_id);
create index practice_questions_version_id_idx on public.practice_questions (practice_version_id);
create index rubric_criteria_version_id_idx on public.rubric_criteria (practice_version_id);
create index question_rubric_criteria_criterion_id_idx on public.question_rubric_criteria (rubric_criterion_id);
create index sessions_practice_id_idx on public.sessions (practice_id);
create index sessions_practice_version_id_idx on public.sessions (practice_version_id);
create index sessions_participant_user_id_idx on public.sessions (participant_user_id);
create index sessions_created_at_idx on public.sessions (created_at desc);
create index session_responses_session_id_idx on public.session_responses (session_id);
create index session_responses_question_id_idx on public.session_responses (question_id);
create index response_evaluations_response_id_idx on public.response_evaluations (response_id);
create index session_evaluations_session_id_idx on public.session_evaluations (session_id);

-- Core v2 tables are server-owned. No browser RLS policies are added in this
-- migration; authenticated/anon Supabase clients should not access them
-- directly. Server-side persistence will use explicit authorization.
alter table public.practices enable row level security;
alter table public.practice_versions enable row level security;
alter table public.practice_questions enable row level security;
alter table public.rubric_criteria enable row level security;
alter table public.question_rubric_criteria enable row level security;
alter table public.sessions enable row level security;
alter table public.session_responses enable row level security;
alter table public.response_evaluations enable row level security;
alter table public.session_evaluations enable row level security;

comment on table public.practices is 'InterviewGrade v2 stable practice identity and authoring container.';
comment on table public.practice_versions is 'Immutable-on-publish versioned practice content.';
comment on table public.sessions is 'InterviewGrade v2 participant practice sessions.';
comment on table public.session_responses is 'Version-traceable participant responses, including retries.';

commit;
