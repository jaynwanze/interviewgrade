-- Security hardening: several legacy tables still had broad PostgREST grants
-- while row-level security was disabled. Existing policies on the interview/
-- employee tables were therefore not being enforced.

alter table public.employees enable row level security;
alter table public.interview_templates enable row level security;
alter table public.interview_evaluation_criteria enable row level security;
alter table public.interview_template_interview_evaluation_criteria enable row level security;

-- The legacy employer unlock surface is retired in V2. Keep this table
-- server/service-role only by enabling RLS without adding browser policies.
alter table public.employee_candidate_unlocks enable row level security;
