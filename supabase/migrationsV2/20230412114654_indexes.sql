-- Indexes for user_profiles
CREATE INDEX idx_user_profiles_id ON "public"."user_profiles" ("id");
CREATE INDEX idx_user_profiles_role ON "public"."user_profiles" ("role");

-- Indexes for candidate
CREATE INDEX idx_candidate_id ON "public"."candidate" ("id");
CREATE INDEX idx_candidate_token_id ON "public"."candidate" ("token_id");

-- Indexes for tokens
CREATE INDEX idx_tokens_id ON "public"."tokens" ("id");

-- Indexes for interviews
CREATE INDEX idx_interviews_candidate_id ON "public"."interviews" ("candidate_id");
CREATE INDEX idx_interviews_template_id ON "public"."interviews" ("template_id");
CREATE INDEX idx_interviews_job_id ON "public"."interviews" ("job_id");

-- Indexes for templates
CREATE INDEX idx_templates_user_id ON "public"."templates" ("user_id");
CREATE INDEX idx_templates_is_system_defined ON "public"."templates" ("is_system_defined");

-- Indexes for questions
CREATE INDEX idx_questions_user_id ON "public"."questions" ("user_id");
CREATE INDEX idx_questions_is_system_defined ON "public"."questions" ("is_system_defined");

-- Indexes for jobs
CREATE INDEX idx_jobs_user_id ON "public"."jobs" ("user_id");
CREATE INDEX idx_jobs_is_system_defined ON "public"."jobs" ("is_system_defined");

-- Indexes for skills
CREATE INDEX idx_skills_user_id ON "public"."skills" ("user_id");
CREATE INDEX idx_skills_is_system_defined ON "public"."skills" ("is_system_defined");

-- Indexes for job_skills
CREATE INDEX idx_job_skills_job_id ON "public"."job_skills" ("job_id");
CREATE INDEX idx_job_skills_skill_id ON "public"."job_skills" ("skill_id");

-- Indexes for template_questions
CREATE INDEX idx_template_questions_template_id ON "public"."template_questions" ("template_id");
CREATE INDEX idx_template_questions_question_id ON "public"."template_questions" ("question_id");

-- Indexes for interview_questions
CREATE INDEX idx_interview_questions_interview_id ON "public"."interview_questions" ("interview_id");

-- Indexes for interview_answers
CREATE INDEX idx_interview_answers_interview_question_id ON "public"."interview_answers" ("interview_question_id");

-- Indexes for job_application_tracker
CREATE INDEX idx_job_application_tracker_candidate_id ON "public"."job_application_tracker" ("candidate_id");

-- Index on account_delete_tokens(user_id)
CREATE INDEX idx_account_delete_tokens_user_id ON public.account_delete_tokens(user_id);-