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
-- Name: candidate Only the candidates can view their information; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_view_own_information" ON "public"."candidate" FOR
SELECT TO "authenticated" USING (("auth"."uid"() = "id"));
--
-- Name: candidate Only the candidates can update their information; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_update_own_information" ON "public"."candidate" FOR
UPDATE TO "authenticated" USING (("auth"."uid"() = "id"))
WITH CHECK (("auth"."uid"() = "id"));
--
-- Name: tokens Only the candidates can view their own tokens; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_view_own_tokens" ON "public"."tokens" FOR
SELECT TO "authenticated" USING (EXISTS (
    SELECT 1 FROM "public"."candidate" WHERE "candidate"."token_id" = "tokens"."id" AND "candidate"."id" = "auth"."uid"()
));
--
-- Name: tokens Only the candidates can update their own tokens; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_update_own_tokens" ON "public"."tokens" FOR
UPDATE TO "authenticated" USING (EXISTS (
    SELECT 1 FROM "public"."candidate" WHERE "candidate"."token_id" = "tokens"."id" AND "candidate"."id" = "auth"."uid"()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM "public"."candidate" WHERE "candidate"."token_id" = "tokens"."id" AND "candidate"."id" = "auth"."uid"()
));
--
-- Name: interviews Only the candidates can view their own interviews; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_view_own_interviews" ON "public"."interviews" FOR
SELECT TO "authenticated" USING (("auth"."uid"() = "candidate_id"));
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
-- Name: interview_analytics Only the candidates can view their own interviews analytics; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_view_own_interview_analytics" ON "public"."interview_analytics" FOR
SELECT TO "authenticated" USING (
    EXISTS (
        SELECT 1 FROM "public"."interviews" WHERE "interviews"."id" = "interview_analytics"."interview_id" AND "interviews"."candidate_id" = "auth"."uid"()
    )
);
--
-- Name: interview_feedback Only the candidates can view their own interviews feedback; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_view_own_interview_feedback" ON "public"."interview_feedback" FOR
SELECT TO "authenticated" USING (
    EXISTS (
        SELECT 1 FROM "public"."interviews" WHERE "interviews"."id" = "interview_feedback"."interview_id" AND "interviews"."candidate_id" = "auth"."uid"()
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
-- Name: templates Only users can view system defined templates their own templates; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_view_system_defined_and_own_templates" ON "public"."templates" FOR
SELECT TO "authenticated" USING (
    is_system_defined = TRUE AND "user_id" IS NULL
    OR
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
);
--
-- Name: templates Only users can insert, update and delete their own templates; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_manage_own_templates" ON "public"."templates" FOR
INSERT, UPDATE, DELETE TO "authenticated" USING (
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
)
WITH CHECK (
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
);
--
-- Name: template_questions: Candidates can views ystem defined and their own interview questions; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_view_predefined_and_own_template_questions" ON "public"."template_questions" FOR
SELECT TO "authenticated" USING (
    EXISTS (
        SELECT 1 FROM "public"."templates" t
        WHERE t.id = "public"."template_questions".template_id
          AND (t.is_system_defined = TRUE OR t."user_id" = "auth"."uid"())
    )
);
--
-- Name: template_questions: Users can view insert,update and delete own template questions; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_manage_own_template_questions" ON "public"."template_questions" FOR
INSERT, UPDATE, DELETE TO "authenticated" USING EXISTS (
        SELECT 1 FROM "public"."templates" t
        WHERE t.id = "public"."template_questions".template_id
          AND t.is_system_defined = FALSE
          AND t."user_id" = "auth"."uid"()
    )
WITH CHECK (
    EXISTS (
        SELECT 1 FROM "public"."templates" t
        WHERE t.id = "public"."template_questions".template_id
          AND t.is_system_defined = FALSE
          AND t."user_id" = "auth"."uid"()
    )
);
--
-- Name: questions: Users can view theirsystem defined and  own questions; Type: POLICY; Schema: public; Owner: supabase_admin
--
CREATE POLICY "users_can_view_system_defined_and_own_questions" ON "public"."questions" FOR
SELECT TO "authenticated" USING (
    is_system_defined = TRUE
    OR
    "user_id" = "auth"."uid"()
);

--
-- Name: questions: Users can insert, update and delete their own questions; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_manage_own_questions" ON "public"."questions" FOR
INSERT, UPDATE, DELETE TO "authenticated" USING (
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
)
WITH CHECK (
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
);

--
-- Name: jobs: Users can view system-defined and own jobs; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_view_system_defined_and_own_jobs" ON "public"."jobs" FOR
SELECT TO "authenticated" USING (
    is_system_defined = TRUE AND "user_id" IS NULL
    OR
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
);
--
-- Name: jobs: Users can insert, update and delete their own jobs; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_manage_own_jobs" ON "public"."jobs" FOR
INSERT, UPDATE, DELETE TO "authenticated" USING (
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
)
WITH CHECK (
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
);

--
-- Name: skills: User can view system-defined and own skills; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_view_system_defined_and_own_skills" ON "public"."skills" FOR
SELECT TO "authenticated" USING (
    is_system_defined = TRUE AND "user_id" IS NULL
    OR
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
);
--
-- Name: skills: Users can insert update and delete own skills; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_manage_own_skills" ON "public"."skills" FOR
INSERT, UPDATE, DELETE TO "authenticated" USING (
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
)
WITH CHECK (
    is_system_defined = FALSE AND "user_id" = "auth"."uid"()
);

--
-- Name: job_skills: Users can view system-defined and own job_skills; Type: POLICY; Schema: public; Owner: supabase_admin
--
CREATE POLICY "users_can_view_system_defined_and_own_job_skills" ON "public"."job_skills" FOR
SELECT TO "authenticated" USING (
    EXISTS (
        SELECT 1 FROM "public"."jobs"
        WHERE "jobs"."id" = "job_skills"."job_id"
          AND "jobs"."is_system_defined" = TRUE
          AND "jobs"."user_id" IS NULL
    )
    OR
    EXISTS (
        SELECT 1 FROM "public"."skills"
        WHERE "skills"."id" = "job_skills"."skill_id"
          AND "skills"."is_system_defined" = TRUE
          AND "skills"."user_id" IS NULL
    )
    OR
    EXISTS (
        SELECT 1 FROM "public"."jobs"
        WHERE "jobs"."id" = "job_skills"."job_id"
          AND "jobs"."is_system_defined" = FALSE
          AND "jobs"."user_id" = "auth"."uid"()
    )
    OR
    EXISTS (
        SELECT 1 FROM "public"."skills"
        WHERE "skills"."id" = "job_skills"."skill_id"
          AND "skills"."is_system_defined" = FALSE
          AND "skills"."user_id" = "auth"."uid"()
    )
);
--
-- Name: job_skills: Users can insert, update or delete own job_skills; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "users_can_manage_own_job_skills" ON "public"."job_skills" FOR
INSERT, UPDATE, DELETE TO "authenticated" USING (
    EXISTS (
        SELECT 1 FROM "public"."jobs"
        WHERE "jobs"."id" = "job_skills"."job_id"
          AND "jobs"."is_system_defined" = FALSE
          AND "jobs"."user_id" = "auth"."uid"()
    )
    OR
    EXISTS (
        SELECT 1 FROM "public"."skills"
        WHERE "skills"."id" = "job_skills"."skill_id"
          AND "skills"."is_system_defined" = FALSE
          AND "skills"."user_id" = "auth"."uid"()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM "public"."jobs"
        WHERE "jobs"."id" = "job_skills"."job_id"
          AND "jobs"."is_system_defined" = FALSE
          AND "jobs"."user_id" = "auth"."uid"()
    )
    OR
    EXISTS (
        SELECT 1 FROM "public"."skills"
        WHERE "skills"."id" = "job_skills"."skill_id"
          AND "skills"."is_system_defined" = FALSE
          AND "skills"."user_id" = "auth"."uid"()
    )
);
--
-- Name: job_application_tracker Only the candidates can view their own job application; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_view_own_job_applications" ON "public"."job_application_tracker" FOR
SELECT TO "authenticated" USING (("auth"."uid"() = "candidate_id"));
--
-- Name: job_application_tracker Only candidates can insert, update and delete their own job application; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "candidates_can_manage_own_job_applications" ON "public"."job_application_tracker" FOR
INSERT, UPDATE, DELETE TO "authenticated" USING (
    "auth"."uid"() = "candidate_id"
  ) 
  WITH CHECK (
    "auth"."uid"() = "candidate_id"
  );


--
-- Name: user_profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;
--
-- Name: candidate; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."candidate" ENABLE ROW LEVEL SECURITY;
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
-- Name: interview_analytics; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."interview_analytics" ENABLE ROW LEVEL SECURITY;
--
-- Name: interview_feedback; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."interview_feedback" ENABLE ROW LEVEL SECURITY;
--
-- Name: templates; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."templates" ENABLE ROW LEVEL SECURITY;
--
-- Name: questions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;
--
-- Name: template_questions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."template_questions" ENABLE ROW LEVEL SECURITY;
--
-- Name: interview_questions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."interview_questions" ENABLE ROW LEVEL SECURITY;
--
-- Name: interview_answers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."interview_answers" ENABLE ROW LEVEL SECURITY;
--
-- Name: jobs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."jobs" ENABLE ROW LEVEL SECURITY;
--
-- Name: skills; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."skills" ENABLE ROW LEVEL SECURITY;
--
-- Name: job_skills; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."job_skills" ENABLE ROW LEVEL SECURITY;
--
-- Name: job_application_tracker; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."job_application_tracker" ENABLE ROW LEVEL SECURITY;


--
-- Name: SCHEMA "public"; Type: ACL; Schema: -; Owner: postgres
