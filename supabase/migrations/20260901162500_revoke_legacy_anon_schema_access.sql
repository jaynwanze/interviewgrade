-- Remove redundant anonymous SELECT grants from legacy private data.
--
-- These tables all have RLS enabled and no policy permitting anon reads, so
-- anonymous callers cannot currently read rows. The leftover table grants
-- nevertheless expose their schemas through Postgres GraphQL. Keep products
-- unchanged because active pricing products are intentionally public.

revoke select on table
  public.account_delete_tokens,
  public.candidates,
  public.employee_candidate_unlocks,
  public.employees,
  public.evaluation_criteria,
  public.interview_answers,
  public.interview_evaluation_criteria,
  public.interview_evaluations,
  public.interview_questions,
  public.interview_template_interview_evaluation_criteria,
  public.interview_templates,
  public.interviews,
  public.organizations_private_info,
  public.questions,
  public.subscriptions,
  public.template_evaluation_criteria,
  public.templates,
  public.tokens
from anon;
