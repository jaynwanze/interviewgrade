-- Indexes for user_profiles
CREATE INDEX idx_user_profiles_id ON "public"."user_profiles" ("id");

-- Indexes for candidate
CREATE INDEX idx_candidates_id ON "public"."candidates" ("id");

-- Indexes for tokens
CREATE INDEX idx_tokens_id ON "public"."tokens" ("id");

-- Indexes for interviews
CREATE INDEX idx_interviews_id ON "public"."interviews" ("id");
CREATE INDEX idx_interviews_candidate_id ON "public"."interviews" ("candidate_id");
CREATE INDEX idx_interviews_template_id ON "public"."interviews" ("template_id");
CREATE INDEX idx_interviews_interview_template_id ON "public"."interviews" ("interview_template_id");

-- Indexes for templates
CREATE INDEX idx_templates_id ON "public"."templates" ("id");
CREATE INDEX idx_templates_user_id ON "public"."templates" ("user_id");
CREATE INDEX idx_templates_is_company_specific ON "public"."templates" ("is_company_specific");
CREATE INDEX idx_templates_is_industry_specific ON "public"."templates" ("is_industry_specific");
CREATE INDEX idx_templates_is_general ON "public"."templates" ("is_general");
CREATE INDEX idx_templates_is_system_defined ON "public"."templates" ("is_system_defined");

-- Indexes for interview_template
CREATE INDEX idx_interview_templates_id ON "public"."interview_templates" ("id");

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

-- Indexes for interview_evaluation_criteria
CREATE INDEX idx_interview_evaluation_criteria_id ON "public"."interview_evaluation_criteria" ("id");
CREATE INDEX idx_interview_evaluation_criteria_user_id ON "public"."interview_evaluation_criteria" ("user_id");
CREATE INDEX idx_interview_evaluation_criteria_template_id ON "public"."interview_evaluation_criteria" ("template_id");

-- Indexes for interview_template_interview_evaluation_criteria
CREATE INDEX idx_interview_temp_interview_eval_criteria_template_id ON "public"."interview_template_interview_evaluation_criteria" ("interview_template_id");
CREATE INDEX idx_interview_temp_interview_eval_criteria_interview_evaluation_criteria_id ON "public"."interview_template_interview_evaluation_criteria" ("interview_evaluation_criteria_id");

-- Indexes for template_evaluation_criteria
CREATE INDEX idx_template_evaluation_criteria_template_id ON "public"."template_evaluation_criteria" ("template_id");
CREATE INDEX idx_template_evaluation_criteria_evaluation_criteria_id ON "public"."template_evaluation_criteria" ("evaluation_criteria_id");

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

-- Indexes for organizations_members
CREATE INDEX idx_organizations_members_id ON "public"."organization_members" ("id");
CREATE INDEX idx_organizations_members_organization_id ON "public"."organization_members" ("organization_id");

-- Indexes for organizations
CREATE INDEX idx_organizations_id ON "public"."organizations" ("id");
-- CREATE INDEX idx_organizations_made_by ON "public"."organizations" ("made_by");

-- Indexes for organization_join_invitations
CREATE INDEX idx_organization_join_invitations_id ON "public"."organization_join_invitations" ("id");
CREATE INDEX idx_organization_join_invitations_organization_id ON "public"."organization_join_invitations" ("organization_id");
CREATE INDEX idx_organization_join_invitations_inviter_user_id_user_id ON "public"."organization_join_invitations" ("inviter_user_id");
CREATE INDEX idx_organization_join_invitations_invitee_user_id_inviter_user_id ON "public"."organization_join_invitations" ("invitee_user_id");

-- Indexes for organizations_private_info
CREATE INDEX idx_organizations_private_info_id ON "public"."organizations_private_info" ("id");

-- Indexes for subscription
CREATE INDEX idx_subscriptions_id ON "public"."subscriptions" ("id");
CREATE INDEX idx_subscriptions_organization_id ON "public"."subscriptions" ("organization_id");

-- Indexes for employees
CREATE INDEX idx_employees_id ON "public"."employees" ("id");
CREATE INDEX idx_employees_default_organization_id ON "public"."employees" ("default_organization");
CREATE INDEX idx_employees_token_id ON "public"."employees" ("token_id");

CREATE INDEX idx_employee_candidate_unlocks_employee_id ON public.employee_candidate_unlocks (employee_id);
CREATE INDEX idx_employee_candidate_unlocks_candidate_id ON public.employee_candidate_unlocks (candidate_id);
CREATE INDEX idx_employee_candidate_unlocks_candidate_id_employee_id ON public.employee_candidate_unlocks (candidate_id, employee_id);