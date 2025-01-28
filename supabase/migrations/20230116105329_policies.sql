--
-- Name: products Active products are visible to everyone; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Active products are visible to everyone" ON "public"."products" FOR
SELECT USING (("status" = 'active'));
--
-- Name: user_profiles Only the own user can update it; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users_can_update_own_profile" ON "public"."user_profiles" FOR
UPDATE TO "authenticated" USING ((auth.uid() = "id"))
WITH CHECK ((auth.uid() = "id"));
--
-- Name: user_profiles Only the user can view their information; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_view_own_profile" ON "public"."user_profiles" FOR
SELECT TO "authenticated" USING (("auth"."uid"() = "id"));
--
-- Name: candidates Only the candidates can view their information; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_view_own_information" ON "public"."candidates" FOR
SELECT TO "authenticated" USING (("auth"."uid"() = "id"));
--
-- Name: candidates Only the candidates can update their information; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_update_own_information" ON "public"."candidates" FOR
UPDATE TO "authenticated" USING (("auth"."uid"() = "id"))
WITH CHECK (("auth"."uid"() = "id"));
--
-- Name: tokens Only the candidates can view their own tokens; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_view_own_tokens" ON "public"."tokens" FOR
SELECT TO "authenticated" USING (EXISTS (
    SELECT 1 FROM "public"."candidates" WHERE "candidates"."token_id" = "tokens"."id" AND "candidates"."id" = "auth"."uid"()
));
--
-- Name: tokens Only the candidates can update their own tokens; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_update_own_tokens" ON "public"."tokens" FOR
UPDATE TO "authenticated" USING (EXISTS (
    SELECT 1 FROM "public"."candidates" WHERE "candidates"."token_id" = "tokens"."id" AND "candidates"."id" = "auth"."uid"()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM "public"."candidates" WHERE "candidates"."token_id" = "tokens"."id" AND "candidates"."id" = "auth"."uid"()
));
--
-- Name: interviews Only the candidates can view their own interviews; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_view_own_interviews" ON "public"."interviews" FOR
SELECT TO "authenticated" USING (("auth"."uid"() = "candidate_id"));

--
-- Name: interviews Only the candidates can insert their own interviews; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_manage_own_interviews_insert" ON "public"."interviews" FOR
INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "candidate_id"));
--
-- Name: interviews Only the candidates can update their own interviews; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_manage_own_interviews_update" ON "public"."interviews" FOR
UPDATE TO "authenticated" USING (("auth"."uid"() = "candidate_id")) WITH CHECK (("auth"."uid"() = "candidate_id"));
--
-- Name: interviews Only the candidates can delete their own interviews; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_manage_own_interviews_delete" ON "public"."interviews" FOR
DELETE TO "authenticated" USING (("auth"."uid"() = "candidate_id"));
--
-- Name: interview_evaluations Only the candidates can view their own interviews evaluations; Type: POLICY; Schema: public; Owner: supabase_admin
--
CREATE POLICY "candidates_can_view_own_interview_evaluations" ON "public"."interview_evaluations" FOR
SELECT TO "authenticated" USING (
    EXISTS (
        SELECT 1 FROM "public"."interviews" WHERE "interviews"."id" = "interview_evaluations"."interview_id" AND "interviews"."candidate_id" = "auth"."uid"()
    )
);
--
-- Name: interview_evaluations Only the candidates can insert their own interviews evaluations; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_manage_own_interview_evaluations_insert" ON "public"."interview_evaluations" FOR
INSERT TO "authenticated" WITH CHECK (
    EXISTS (
        SELECT 1 FROM "public"."interviews" WHERE "interviews"."id" = "interview_evaluations"."interview_id" AND "interviews"."candidate_id" = "auth"."uid"()
    )
);
--
-- Name: interview_evaluations Only the candidates can update their own interviews evaluations; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_manage_own_interview_evaluations_update" ON "public"."interview_evaluations" FOR
UPDATE TO "authenticated" USING (
    EXISTS (
        SELECT 1 FROM "public"."interviews" WHERE "interviews"."id" = "interview_evaluations"."interview_id" AND "interviews"."candidate_id" = "auth"."uid"()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM "public"."interviews" WHERE "interviews"."id" = "interview_evaluations"."interview_id" AND "interviews"."candidate_id" = "auth"."uid"()
    )
);
--
-- Name: interview_evaluations Only the candidates can delete their own interviews evaluations; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_manage_own_interview_evaluations_delete" ON "public"."interview_evaluations" FOR
DELETE TO "authenticated" USING (
    EXISTS (
        SELECT 1 FROM "public"."interviews" WHERE "interviews"."id" = "interview_evaluations"."interview_id" AND "interviews"."candidate_id" = "auth"."uid"()
    )
);
--
-- Name: interview_questions: Only Candidates can view their own interview questions; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_view_own_interview_questions" ON "public"."interview_questions" FOR
SELECT TO "authenticated" USING (
    EXISTS (
        SELECT 1 FROM "public"."interviews" WHERE "interviews"."id" = "interview_questions"."interview_id" AND "interviews"."candidate_id" = "auth"."uid"()
    )
);
--
-- Name: interview_questions: Only Candidates can insert their own interview questions; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_manage_own_interview_questions_insert" ON "public"."interview_questions" FOR
INSERT TO "authenticated" WITH CHECK (
    EXISTS (
        SELECT 1 FROM "public"."interviews" WHERE "interviews"."id" = "interview_questions"."interview_id" AND "interviews"."candidate_id" = "auth"."uid"()
    )
);
--
-- Name: interview_questions: Only Candidates can update their own interview questions; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_manage_own_interview_questions_update" ON "public"."interview_questions" FOR
UPDATE TO "authenticated" USING (
    EXISTS (
        SELECT 1 FROM "public"."interviews" WHERE "interviews"."id" = "interview_questions"."interview_id" AND "interviews"."candidate_id" = "auth"."uid"()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM "public"."interviews" WHERE "interviews"."id" = "interview_questions"."interview_id" AND "interviews"."candidate_id" = "auth"."uid"()
    )
);
--
-- Name: interview_questions: Only Candidates can delete their own interview questions; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_manage_own_interview_questions_delete" ON "public"."interview_questions" FOR
DELETE TO "authenticated" USING (
    EXISTS (
        SELECT 1 FROM "public"."interviews" WHERE "interviews"."id" = "interview_questions"."interview_id" AND "interviews"."candidate_id" = "auth"."uid"()
    )
);
--
-- Name: interview_answers: Candidates can view their own interview answers; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_view_own_interview_answers" ON "public"."interview_answers" FOR
SELECT TO "authenticated" USING (
    EXISTS (
        SELECT 1 FROM "public"."interview_questions" 
        JOIN "public"."interviews" ON "interviews"."id" = "interview_questions"."interview_id"
        WHERE "interview_questions"."id" = "interview_answers"."interview_question_id"
          AND "interviews"."candidate_id" = "auth"."uid"()
    )
);
--
-- Name: interview_answers: Candidates can insert their own interview answers; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_manage_own_interview_answers_insert" ON "public"."interview_answers" FOR
INSERT TO "authenticated" WITH CHECK (
    EXISTS (
        SELECT 1 FROM "public"."interview_questions" 
        JOIN "public"."interviews" ON "interviews"."id" = "interview_questions"."interview_id"
        WHERE "interview_questions"."id" = "interview_answers"."interview_question_id"
          AND "interviews"."candidate_id" = "auth"."uid"()
    )
);
--
-- Name: interview_answers: Candidates can update their own interview answers; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_manage_own_interview_answers_update" ON "public"."interview_answers" FOR
UPDATE TO "authenticated" USING (
    EXISTS (
        SELECT 1 FROM "public"."interview_questions" 
        JOIN "public"."interviews" ON "interviews"."id" = "interview_questions"."interview_id"
        WHERE "interview_questions"."id" = "interview_answers"."interview_question_id"
          AND "interviews"."candidate_id" = "auth"."uid"()
    )
);

CREATE POLICY "candidates_can_manage_own_interview_answers_delete" ON "public"."interview_answers" FOR
DELETE TO "authenticated" USING (
    EXISTS (
        SELECT 1 FROM "public"."interview_questions"
        JOIN "public"."interviews" ON "interviews"."id" = "interview_questions"."interview_id"
        WHERE "interview_questions"."id" = "interview_answers"."interview_question_id"
          AND "interviews"."candidate_id" = "auth"."uid"()
    )
);
--
-- Name: questions Only users can view system defined and their own questions; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_view_system_defined_and_own_questions" ON "public"."questions" FOR
SELECT TO "authenticated" USING (
    EXISTS (
        SELECT 1 FROM "public"."templates"
        WHERE "templates"."id" = "questions"."template_id"
          AND ("templates"."user_id" = "auth"."uid"() OR "templates"."is_system_defined" = TRUE)
    )
);
--
-- Name: questions Only users can insert their own questions; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_manage_own_questions_insert" ON "public"."questions" FOR
INSERT TO "authenticated" WITH CHECK (
    EXISTS (
        SELECT 1 FROM "public"."templates"
        WHERE "templates"."id" = "questions"."template_id"
          AND ("templates"."user_id" = "auth"."uid"() AND "templates"."is_system_defined" = FALSE)
    )
);
--
-- Name: questions Only users can update their own questions; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_manage_own_questions_update" ON "public"."questions" FOR
UPDATE TO "authenticated" USING (
    EXISTS (
        SELECT 1 FROM "public"."templates"
        WHERE "templates"."id" = "questions"."template_id"
          AND ("templates"."user_id" = "auth"."uid"() AND "templates"."is_system_defined" = FALSE)
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM "public"."templates"
        WHERE "templates"."id" = "questions"."template_id"
          AND ("templates"."user_id" = "auth"."uid"() AND "templates"."is_system_defined" = FALSE)
    )
);
--
-- Name: questions Only users can delete their own questions; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_manage_own_questions_delete" ON "public"."questions" FOR
DELETE TO "authenticated" USING (
    EXISTS (
        SELECT 1 FROM "public"."templates"
        WHERE "templates"."id" = "questions"."template_id"
          AND ("templates"."user_id" = "auth"."uid"() AND "templates"."is_system_defined" = FALSE)
    )
);
--
-- Name: template_evaluation_criteria Only users can view system defined and their own template evaluation criteria; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_view_system_defined_and_own_template_evaluation_criteria" ON "public"."template_evaluation_criteria" FOR
SELECT TO "authenticated" USING (
    EXISTS (
        SELECT 1 FROM "public"."templates"
        WHERE "templates"."id" = "template_evaluation_criteria"."template_id"
          AND ("templates"."user_id" = "auth"."uid"() OR "templates"."is_system_defined" = TRUE)
    )
);
--
-- Name: template_evaluation_criteria Only users can insert their own template evaluation criteria; Type: POLICY; Schema: public; Owner: supabase_admin
--  

CREATE POLICY "users_can_manage_own_template_evaluation_criteria_insert" ON "public"."template_evaluation_criteria" FOR
INSERT TO "authenticated" WITH CHECK (
    EXISTS (
        SELECT 1 FROM "public"."templates"
        WHERE "templates"."id" = "template_evaluation_criteria"."template_id"
          AND ("templates"."user_id" = "auth"."uid"() AND "templates"."is_system_defined" = FALSE
          AND (("templates"."role" IS NOT NULL AND "templates"."skill" IS NULL) OR ("templates"."role" IS NULL AND "templates"."skill" IS NOT NULL)))
    )
);
--
-- Name: template_evaluation_criteria Only users can update their own template evaluation criteria; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_manage_own_template_evaluation_criteria_update" ON "public"."template_evaluation_criteria" FOR
UPDATE TO "authenticated" USING (
    EXISTS (
        SELECT 1 FROM "public"."templates"
        WHERE "templates"."id" = "template_evaluation_criteria"."template_id"
          AND ("templates"."user_id" = "auth"."uid"() AND "templates"."is_system_defined" = FALSE)
    )
);
--
-- Name: template_evaluation_criteria Only users can delete their own template evaluation criteria; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_manage_own_template_evaluation_criteria_delete" ON "public"."template_evaluation_criteria" FOR
DELETE TO "authenticated" USING (
    EXISTS (
        SELECT 1 FROM "public"."templates"
        WHERE "templates"."id" = "template_evaluation_criteria"."template_id"
          AND ("templates"."user_id" = "auth"."uid"() AND "templates"."is_system_defined" = FALSE)
    )
);
--
-- Name: interview_template_interview_evaluation_criteria Only users can view system defined and their own interview template evaluation criteria; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_view_system_defined_and_own_interview_temp_interview_eval_criteria" ON "public"."interview_template_interview_evaluation_criteria" FOR
SELECT TO "authenticated" USING (
    EXISTS (
        SELECT 1 FROM "public"."interview_templates"
        WHERE "interview_templates"."id" = "interview_template_interview_evaluation_criteria"."interview_template_id"
          AND ("interview_templates"."user_id" = "auth"."uid"() OR "interview_templates"."is_system_defined" = TRUE)
    )
);
--
-- Name: interview_template_interview_evaluation_criteria Only users can insert their own interview template interview evaluation criteria; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_manage_own_interview_temp_interview_eval_criteria_insert" ON "public"."interview_template_interview_evaluation_criteria" FOR
INSERT TO "authenticated" WITH CHECK (
    EXISTS (
        SELECT 1 FROM "public"."interview_templates"
        WHERE "interview_templates"."id" = "interview_template_interview_evaluation_criteria"."interview_template_id"
          AND ("interview_templates"."user_id" = "auth"."uid"() AND "interview_templates"."is_system_defined" = FALSE)
    )
);
--
-- Name: interview_template_interview_evaluation_criteria Only users can update their own interview template interview evaluation criteria; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_manage_own_interview_temp_interview_eval_criteria_update" ON "public"."interview_template_interview_evaluation_criteria" FOR
UPDATE TO "authenticated" USING (
    EXISTS (
        SELECT 1 FROM "public"."interview_templates"
        WHERE "interview_templates"."id" = "interview_template_interview_evaluation_criteria"."interview_template_id"
          AND ("interview_templates"."user_id" = "auth"."uid"() AND "interview_templates"."is_system_defined" = FALSE)
    )
);
--
-- Name: interview_template_interview_evaluation_criteria Only users can delete their own interview template interview evaluation criteria; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_manage_own_interview_temp_interview_eval_criteria_delete" ON "public"."interview_template_interview_evaluation_criteria" FOR
DELETE TO "authenticated" USING (
    EXISTS (
        SELECT 1 FROM "public"."interview_templates"
        WHERE "interview_templates"."id" = "interview_template_interview_evaluation_criteria"."interview_template_id"
          AND ("interview_templates"."user_id" = "auth"."uid"() AND "interview_templates"."is_system_defined" = FALSE)
    )
);
--
-- Name: templates Only users can view system defined templates their own templates; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_view_system_defined_and_own_templates" ON "public"."templates" FOR
SELECT TO "authenticated" USING (
    is_system_defined = TRUE AND "user_id" IS NULL
    OR
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
);
--
-- Name: templates Only users can insert their own templates; Type: POLICY; Schema: public; Owner: supabase_admin
--
CREATE POLICY "users_can_manage_own_templates_insert" ON "public"."templates" FOR
INSERT
TO "authenticated"
WITH CHECK (
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
);
--
-- Name: templates Only users can update their own templates; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_manage_own_templates_update" ON "public"."templates" FOR
UPDATE
TO "authenticated"
USING (
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
)
WITH CHECK (
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
);
--
-- Name: templates Only users can delete their own templates; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_manage_own_templates_delete" ON "public"."templates" FOR
DELETE
TO "authenticated"
USING (
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
);
--
-- Name: interview_templates Only users can view system defined and their own interview templates; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_view_system_defined_and_own_interview_templates" ON "public"."interview_templates" FOR
SELECT TO "authenticated" USING (
    is_system_defined = TRUE AND "user_id" IS NULL
    OR
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
);
--
-- Name: interview_templates Only users can insert their own interview templates; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_manage_own_interview_templates_insert" ON "public"."interview_templates" FOR
INSERT
TO "authenticated"
WITH CHECK (
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
);
--
-- Name: interview_templates Only users can update their own interview templates; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_manage_own_interview_templates_update" ON "public"."interview_templates" FOR
UPDATE
TO "authenticated"
USING (
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
)
WITH CHECK (
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
);
--
-- Name: interview_templates Only users can delete their own interview templates; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_manage_own_interview_templates_delete" ON "public"."interview_templates" FOR
DELETE
TO "authenticated"
USING (
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
);
--
-- Name: interview_template_template Only users can view system defined and their own interview template template; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_view_system_defined_and_own_interview_template_template" ON "public"."interview_template_template" FOR
SELECT TO "authenticated" USING (
    EXISTS (
        SELECT 1 FROM "public"."interview_templates"
        WHERE "interview_templates"."id" = "interview_template_template"."interview_template_id"
          AND ("interview_templates"."user_id" = "auth"."uid"() OR "interview_templates"."is_system_defined" = TRUE)
    )
);
--
-- Name: interview_template_template Only users can insert their own interview template template; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_manage_own_interview_template_template_insert" ON "public"."interview_template_template" FOR
INSERT TO "authenticated" WITH CHECK (
    EXISTS (
        SELECT 1 FROM "public"."interview_templates"
        WHERE "interview_templates"."id" = "interview_template_template"."interview_template_id"
          AND ("interview_templates"."user_id" = "auth"."uid"() AND "interview_templates"."is_system_defined" = FALSE)
    )
);
--
-- Name: interview_template_template Only users can update their own interview template template; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_manage_own_interview_template_template_update" ON "public"."interview_template_template" FOR
UPDATE TO "authenticated" USING (
    EXISTS (
        SELECT 1 FROM "public"."interview_templates"
        WHERE "interview_templates"."id" = "interview_template_template"."interview_template_id"
          AND ("interview_templates"."user_id" = "auth"."uid"() AND "interview_templates"."is_system_defined" = FALSE)
    )
);
--
-- Name: interview_template_template Only users can delete their own interview template template; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_manage_own_interview_template_template_delete" ON "public"."interview_template_template" FOR
DELETE TO "authenticated" USING (
    EXISTS (
        SELECT 1 FROM "public"."interview_templates"
        WHERE "interview_templates"."id" = "interview_template_template"."interview_template_id"
          AND ("interview_templates"."user_id" = "auth"."uid"() AND "interview_templates"."is_system_defined" = FALSE)
    )
);
--
-- Name interview_evaluation_criteria Only users can view system defined and their own interview evaluation criteria; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_view_system_defined_and_own_interview_evaluation_criteria" ON "public"."interview_evaluation_criteria" FOR
SELECT TO "authenticated" USING (
    EXISTS (
          is_system_defined = TRUE AND "user_id" IS NULL
    OR
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
    
    )
);
--
-- Name interview_evaluation_criteria Only users can insert their own interview evaluation criteria; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_manage_own_interview_evaluation_criteria_insert" ON "public"."interview_evaluation_criteria" FOR
INSERT TO "authenticated" WITH CHECK (
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
);
--
-- Name interview_evaluation_criteria Only users can update their own interview evaluation criteria; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_manage_own_interview_evaluation_criteria_update" ON "public"."interview_evaluation_criteria" FOR
UPDATE TO "authenticated" USING (
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
)
WITH CHECK (
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
);
--
-- Name interview_evaluation_criteria Only users can delete their own interview evaluation criteria; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_manage_own_interview_evaluation_criteria_delete" ON "public"."interview_evaluation_criteria" FOR
DELETE TO "authenticated" USING (
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
);
--
-- Name: evaluation_criteria Only users can view system defined and their own evaluation criteria; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_view_system_defined_and_own_evaluation_criteria" ON "public"."evaluation_criteria" FOR
SELECT TO "authenticated" USING (
    is_system_defined = TRUE AND "user_id" IS NULL
    OR
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
);
--
-- Name: evaluation_criteria Only users can insert their own evaluation criteria; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_manage_own_evaluation_criteria_insert" ON "public"."evaluation_criteria" FOR
INSERT
TO "authenticated"
WITH CHECK (
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
);
--
-- Name: evaluation_criteria Only users can update their own template evaluation criteria; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_manage_own_evaluation_criteria_update" ON "public"."evaluation_criteria" FOR
UPDATE
TO "authenticated"
USING (
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
)
WITH CHECK (
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
);
--
-- Name: evaluation_criteria Only users can delete their own template evaluation criteria; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_manage_own_evaluation_criteria_delete" ON "public"."evaluation_criteria" FOR
DELETE
TO "authenticated"
USING (
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
);
--
-- Name candidates_can_view_own_job_applications: Only candidates can view their own job applications; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_view_own_job_applications" ON "public"."job_application_tracker" FOR
SELECT TO "authenticated" USING (("auth"."uid"() = "candidate_id"));
--
-- Name: job_application_tracker Only candidates can insert their own job application; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_manage_own_job_applications_insert" ON "public"."job_application_tracker" FOR
INSERT
TO "authenticated"
WITH CHECK (
    "auth"."uid"() = "candidate_id"
);
--
-- Name: job_application_tracker Only candidates can update their own job application; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_manage_own_job_applications_update" ON "public"."job_application_tracker" FOR
UPDATE
TO "authenticated"
USING (
    "auth"."uid"() = "candidate_id"
)
WITH CHECK (
    "auth"."uid"() = "candidate_id"
);
--
-- Name: job_application_tracker Only candidates can delete their own job application; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_manage_own_job_applications_delete" ON "public"."job_application_tracker" FOR
DELETE
TO "authenticated"
USING (
    "auth"."uid"() = "candidate_id"
);


--
-- Name: user_profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;
--
-- Name: candidates; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."candidates" ENABLE ROW LEVEL SECURITY;
--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;
--
-- Name: tokens; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."tokens" ENABLE ROW LEVEL SECURITY;
--
-- Name: interviews; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."interviews" ENABLE ROW LEVEL SECURITY;
--
-- Name: interview_evaluations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."interview_evaluations" ENABLE ROW LEVEL SECURITY;
--
-- Name: evalutation_criteria; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."evaluation_criteria" ENABLE ROW LEVEL SECURITY;
--
-- Name: template_evaluation_criteria; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."template_evaluation_criteria" ENABLE ROW LEVEL SECURITY;
--
-- Name: templates; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."templates" ENABLE ROW LEVEL SECURITY;
--
-- Name: questions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;
--
-- Name: interview_questions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."interview_questions" ENABLE ROW LEVEL SECURITY;
--
-- Name: interview_answers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."interview_answers" ENABLE ROW LEVEL SECURITY;
--
-- Name: job_application_tracker; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."job_application_tracker" ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA "public"; Type: ACL; Schema: -; Owner: postgres
