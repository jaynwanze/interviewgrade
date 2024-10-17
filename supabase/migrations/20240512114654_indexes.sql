-- Indexes for user_profiles
CREATE INDEX idx_user_profiles_id ON "public"."user_profiles" ("id");

-- Indexes for candidate
CREATE INDEX idx_candidate_id ON "public"."candidate" ("id");
CREATE INDEX idx_candidate_token_id ON "public"."candidate" ("token_id");

-- Indexes for tokens
CREATE INDEX idx_tokens_id ON "public"."tokens" ("id");

-- Indexes for interviews
CREATE INDEX idx_interviews_candidate_id ON "public"."interviews" ("candidate_id");
CREATE INDEX idx_interviews_template_id ON "public"."interviews" ("template_id");

-- Indexes for templates
CREATE INDEX idx_templates_user_id ON "public"."templates" ("user_id");
CREATE INDEX idx_templates_is_company_specific ON "public"."templates" ("is_company_specific");
CREATE INDEX idx_templates_is_industry_specific ON "public"."templates" ("is_industry_specific");
CREATE INDEX idx_templates_is_general ON "public"."templates" ("is_general");
CREATE INDEX idx_templates_is_system_defined ON "public"."templates" ("is_system_defined");

-- Indexes for questions
CREATE INDEX idx_questions_template_id ON "public"."questions" ("template_id");
CREATE INDEX idx_questions_is_system_defined ON "public"."questions" ("is_system_defined");

-- Indexes for interview_evaluations
CREATE INDEX idx_interview_evaluations_interview_id ON "public"."interview_evaluations" ("interview_id");

-- Indexes for interview_feedback
CREATE INDEX idx_interview_feedback_interview_id ON "public"."interview_feedback" ("interview_id");

-- Indexes for interview_analytics
CREATE INDEX idx_interview_analytics_interview_id ON "public"."interview_analytics" ("interview_id");

-- Indexes for interview_questions
CREATE INDEX idx_interview_questions_interview_id ON "public"."interview_questions" ("interview_id");

-- Indexes for interview_answers
CREATE INDEX idx_interview_answers_interview_question_id ON "public"."interview_answers" ("interview_question_id");

-- Indexes for job_application_tracker
CREATE INDEX idx_job_application_tracker_candidate_id ON "public"."job_application_tracker" ("candidate_id");

-- Index on account_delete_tokens
CREATE INDEX idx_account_delete_tokens_user_id ON public.account_delete_tokens("user_id");