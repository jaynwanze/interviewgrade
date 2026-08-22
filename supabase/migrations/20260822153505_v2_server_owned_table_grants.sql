-- V2 persistence is server-owned. Browser Supabase roles should not receive
-- direct table privileges; application access goes through authorized server
-- actions/services using the Postgres/Drizzle boundary.
revoke all privileges on table
  public.practices,
  public.practice_versions,
  public.practice_questions,
  public.rubric_criteria,
  public.question_rubric_criteria,
  public.sessions,
  public.session_responses,
  public.response_evaluations,
  public.session_evaluations,
  public.legacy_practice_imports
from anon, authenticated;
