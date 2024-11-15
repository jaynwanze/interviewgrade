-- Indexes for user_profiles
CREATE INDEX idx_user_profiles_id ON "public"."user_profiles" ("id");

-- Indexes for candidate
CREATE INDEX idx_candidates_id ON "public"."candidates" ("id");
CREATE INDEX idx_candidates_token_id ON "public"."candidates" ("token_id");

-- Indexes for tokens
CREATE INDEX idx_tokens_id ON "public"."tokens" ("id");

-- Indexes for interviews
CREATE INDEX idx_interviews_id ON "public"."interviews" ("id");
CREATE INDEX idx_interviews_candidate_id ON "public"."interviews" ("candidate_id");
CREATE INDEX idx_interviews_template_id ON "public"."interviews" ("template_id");

-- Indexes for templates
CREATE INDEX idx_templates_id ON "public"."templates" ("id");
CREATE INDEX idx_templates_user_id ON "public"."templates" ("user_id");
CREATE INDEX idx_templates_is_company_specific ON "public"."templates" ("is_company_specific");
CREATE INDEX idx_templates_is_industry_specific ON "public"."templates" ("is_industry_specific");
CREATE INDEX idx_templates_is_general ON "public"."templates" ("is_general");
CREATE INDEX idx_templates_is_system_defined ON "public"."templates" ("is_system_defined");

-- Indexes for questions
CREATE INDEX idx_questions_id ON "public"."questions" ("id");
CREATE INDEX idx_questions_template_id ON "public"."questions" ("template_id");
CREATE INDEX idx_questions_evaluation_criteria_id ON "public"."questions" ("evaluation_criteria_id");

-- Indexes for interview_evaluations
CREATE INDEX idx_interview_evaluations_id ON "public"."interview_evaluations" ("id");
CREATE INDEX idx_interview_evaluations_interview_id ON "public"."interview_evaluations" ("interview_id");

-- Indexes for evaluation_criteria
CREATE INDEX idx_evaluation_criteria_id ON "public"."evaluation_criteria" ("id");
CREATE INDEX idx_evaluation_criteria_is_system_defined ON "public"."evaluation_criteria" ("is_system_defined");

-- Indexes for template_evaluation_criteria
CREATE INDEX idx_template_evaluation_criteria_template_id ON "public"."template_evaluation_criteria" ("template_id");
CREATE INDEX idx_template_evaluation_criteria_evaluation_criteria_id ON "public"."template_evaluation_criteria" ("evaluation_criteria_id");

-- Indexes for interview_analytics
CREATE INDEX idx_interview_analytics_id ON "public"."interview_analytics" ("id");
CREATE INDEX idx_interview_analytics_template_id ON "public"."interview_analytics" ("template_id");
CREATE INDEX idx_interview_analytics_candidate_id ON "public"."interview_analytics" ("candidate_id");
CREATE INDEX idx_interview_analytics_period_start ON "public"."interview_analytics"("period_start");
CREATE INDEX idx_interview_analytics_end ON "public"."interview_analytics"("period_end");

-- Indexes for interview_questions
CREATE INDEX idx_interview_questions_id ON "public"."interview_questions" ("id");
CREATE INDEX idx_interview_questions_interview_id ON "public"."interview_questions" ("interview_id");

-- Indexes for interview_answers
CREATE INDEX idx_interview_answers_id ON "public"."interview_answers" ("id");
CREATE INDEX idx_interview_answers_interview_question_id ON "public"."interview_answers" ("interview_question_id");

-- Indexes for job_application_tracker
CREATE INDEX idx_job_application_tracker_id ON "public"."job_application_tracker" ("id");
CREATE INDEX idx_job_application_tracker_candidate_id ON "public"."job_application_tracker" ("candidate_id");

-- Index on account_delete_tokens
CREATE INDEX idx_account_delete_tokens_user_id ON public.account_delete_tokens("user_id");