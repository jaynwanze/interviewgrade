--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."user_profiles" (
  "id" "uuid" NOT NULL,
  "full_name" character varying,
  "avatar_url" character varying,
  "user_type" "public"."user_types" DEFAULT 'candidate'::user_types NOT NULL,
  "stripe_customer_id" character varying,
  "created_at" timestamp WITH time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."user_profiles" OWNER TO "postgres";

--
-- Name: candidate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."candidate" (
  "id" "uuid" NOT NULL,
  "user_id" "uuid" NOT NULL,
  "token_id" "uuid" NOT NULL
);
ALTER TABLE "public"."candidate" OWNER TO "postgres";

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."products" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "product_type" "public"."product_type",
  "title" character varying,
  "description" text,
  "price" integer,
  "tokens_bundle" bigint,
  "subscription_duration" character varying
);
ALTER TABLE "public"."products" OWNER TO "postgres";

--
-- Name: tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."tokens" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "tokens_available" bigint,
  "description" text,
  "total_tokens_used" bigint,
  "total_tokens_purchased" bigint,
  "last_purchase_date" timestamp with time zone
);
ALTER TABLE "public"."tokens" OWNER TO "postgres";

--
-- Name: interviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."interviews" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "template_id" "uuid",
  "candidate_id" "uuid" NOT NULL,
  "job_id" "uuid",
  "title" character varying,
  "description" text,
  "start_time" timestamp with time zone,
  "end_time" timestamp with time zone,
  "status" "public"."interview_status" DEFAULT 'not_started'::interview_status NOT NULL,
  created_at timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."interviews" OWNER TO "postgres";

--
-- Name: interview_evaluations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."interview_evaluations" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "interview_id" "uuid" NOT NULL,
  "overall_score" decimal(4,2),
  "communication_score" decimal(4,2),	
  "technical_score" decimal(4,2),
  "soft_skills_score" decimal(4,2),
  "response_time" decimal(5,2),
  "target_overall_score" decimal(4,2),
  "target_communication_score" decimal(4,2),	
  "target_technical_score" decimal(4,2),
  "target_soft_skills_score" decimal(4,2),
  "target_response_time" decimal(5,2)
);
ALTER TABLE "public"."interview_evaluations" OWNER TO "postgres";

--
-- Name: interview_analytics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."interview_analytics" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "interview_id" "uuid" NOT NULL,
  "overall_performance" decimal(4,2),
  "overall_communication_score" decimal(4,2),	
  "overall_technical_score" decimal(4,2),
  "overall_soft_skills_score" decimal(4,2),
  "overall_response_time" decimal(5,2),
  "overall_percentile" decimal(5,2),
  "areas_for_improvement" text,
  "strengths" text,
  "weaknesses" text,
  "recommendations" text
);

ALTER TABLE "public"."interview_analytics" OWNER TO "postgres";

--
-- Name: interview_feedback; Type: TABLE; Schema: public; Owner: postgres
--
CREATE TABLE "public"."interview_feedback" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "interview_id" "uuid" NOT NULL,
  "comments" text,
  "problem_solving_skills" text,
  "technical_proficiency" text,
  "soft_skills" text,
  "clarity_of_response" text,
  "timeliness" text,
  "response_accuracy" text,
  "custom_feedback" text,
  "areas_for_improvement" text,
  "strengths" text,
  "weaknesses" text,
  "recommendations" text
);

ALTER TABLE "public"."interview_feedback" OWNER TO "postgres";

--
-- Name: templates; Type: TABLE; Schema: public; Owner: postgres
--
CREATE TABLE "public"."templates" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "user_id" "uuid" NOT NULL,
  "job_id" "uuid",
  "title" character varying,
  "description" text,
  "industry" character varying,
  "duration" character varying,
  "is_system_defined" boolean DEFAULT false,
  "created_at" timestamp WITH time zone DEFAULT "now"() NOT NULL
  
);

ALTER TABLE "public"."templates" OWNER TO "postgres";

--
-- Name: questions; Type: TABLE; Schema: public; Owner: postgres
--
CREATE TABLE "public"."questions" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "text" text,
  "difficulty" "public"."question_difficulty",
  "category" "public"."question_category"
);

ALTER TABLE "public"."questions" OWNER TO "postgres";

--
-- Name: template_questions; Type: TABLE; Schema: public; Owner: postgres
--
CREATE TABLE "public"."template_questions" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "template_id" "uuid" NOT NULL,
  "question_id" "uuid" NOT NULL,
  "sequence" integer,
);

ALTER TABLE "public"."template_questions" OWNER TO "postgres";

--
-- Name: interview_questions; Type: TABLE; Schema: public; Owner: postgres
--
CREATE TABLE "public"."interview_questions" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "interview_id" "uuid" NOT NULL,
  "text" text,
  "difficulty" "public"."question_difficulty",
  "category" "public"."question_category"
);

ALTER TABLE "public"."interview_questions" OWNER TO "postgres";

--
-- Name: interview_answers; Type: TABLE; Schema: public; Owner: postgres
--
CREATE TABLE "public"."interview_answers" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "interview_question_id" "uuid" NOT NULL,
  "text" text,
  "response_time" decimal(5,2),
  "score" decimal(5,2),
  "accuracy" decimal(5,2),
  "clarity" decimal(5,2)
);

--
-- Name: jobs; Type: TABLE; Schema: public; Owner: postgres
--
CREATE TABLE "public"."jobs" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "title" character varying,
  "description" text,
  "industry" character varying,
  "location" character varying,
  "salary" bigint,
  "job_type" character varying,
  "is_system_defined" boolean DEFAULT false,
  "created_at" timestamp WITH time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."jobs" OWNER TO "postgres";

--
-- Name: skills; Type: TABLE; Schema: public; Owner: postgres
--
CREATE TABLE "public"."skills" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "name" character varying,
  "description" text,
  "category" "public"."skill_category",
  "is_system_defined" boolean DEFAULT false,
  "created_at" timestamp WITH time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."skills" OWNER TO "postgres";

--
-- Name: job_skills; Type: TABLE; Schema: public; Owner: postgres
--
CREATE TABLE "public"."job_skills" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "job_id" "uuid" NOT NULL,
  "skill_id" "uuid" NOT NULL,
);

ALTER TABLE "public"."job_skills" OWNER TO "postgres";

--
-- Name: job_application_tracker; Type: TABLE; Schema: public; Owner: postgres
--
CREATE TABLE "public"."job_application_tracker" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "candidate_id" "uuid" NOT NULL,
  "job_title" character varying,
  "status" "public"."job_application_tracker_status" DEFAULT 'not_started'::job_application_tracker_status NOT NULL,
  "company" character varying,
  "industry" character varying,
  "location" character varying,
  "job_type" character varying,
  "created_at" timestamp WITH time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."job_application_tracker" OWNER TO "postgres";

--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_profiles"
ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");
--
-- Name: user_profiles user_profiles_stripe_customer_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_profiles"
ADD CONSTRAINT "user_profiles_stripe_customer_id_key" UNIQUE ("stripe_customer_id");
--
-- Name: candidate candidate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."candidate"
ADD CONSTRAINT "candidate_pkey" PRIMARY KEY ("id");
--
-- Name: products product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."products"
ADD CONSTRAINT "product_pkey" PRIMARY KEY ("id");
--
-- Name: tokens tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tokens"
ADD CONSTRAINT "tokens_pkey" PRIMARY KEY ("id");
--
-- Name: interviews interviews_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY "public"."interviews"
ADD CONSTRAINT "interviews_pkey" PRIMARY KEY ("id");
--
-- Name: interview_evaluations interview_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interview_evaluations"
ADD CONSTRAINT "interview_evaluations_pkey" PRIMARY KEY ("id");
--
-- Name: interview_analytics interview_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interview_analytics"
ADD CONSTRAINT "interview_analytics_pkey" PRIMARY KEY ("id");

--
-- Name: interview_feedback interview_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interview_feedback"
ADD CONSTRAINT "interview_feedback_pkey" PRIMARY KEY ("id");
--
-- Name: templates templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."templates"
ADD CONSTRAINT "templates_pkey" PRIMARY KEY ("id");

--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."questions"
ADD CONSTRAINT "questions_pkey" PRIMARY KEY ("id");
--
-- Name: template_questions template_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."template_questions"
ADD CONSTRAINT "template_questions_pkey" PRIMARY KEY ("id");
--
-- Name: interview_questions interview_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interview_questions"
ADD CONSTRAINT "interview_questions_pkey" PRIMARY KEY ("id");
--
-- Name: interview_answers interview_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interview_answers"
ADD CONSTRAINT "interview_answers_pkey" PRIMARY KEY ("id");
--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."jobs"
ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");
--
-- Name: skills skills_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."skills"
ADD CONSTRAINT "skills_pkey" PRIMARY KEY ("id");
--
-- Name: job_skills job_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."job_skills"
ADD CONSTRAINT "job_skills_pkey" PRIMARY KEY ("id");
--
-- Name: job_application_tracker job_application_tracker_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."job_application_tracker"
ADD CONSTRAINT "job_application_tracker_pkey" PRIMARY KEY ("id");

--
-- Name: user_profiles user_profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_profiles"
ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
--
-- Name: candidate candidate_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."candidate"
ADD CONSTRAINT "candidate_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE;
--
-- Name: candidate candidate_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."candidate"
ADD CONSTRAINT "candidate_token_id_fkey" FOREIGN KEY ("token_id") REFERENCES "tokens"("id") ON DELETE CASCADE;

--
-- Name: interviews interviews_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interviews"
ADD CONSTRAINT "interviews_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE SET NULL;
--
-- Name: interviews interviews_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interviews"
ADD CONSTRAINT "interviews_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidate"("id") ON DELETE CASCADE;
--
-- Name: interviews interviews_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interviews"
ADD CONSTRAINT "interviews_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE SET NULL;

--
-- Name: interview_evaluations interview_evaluations_interview_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interview_evaluations"
ADD CONSTRAINT "interview_evaluations_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "interviews"("id") ON DELETE CASCADE;
--
-- Name: interview_analytics interview_analytics_interview_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interview_analytics"
ADD CONSTRAINT "interview_analytics_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "interviews"("id") ON DELETE CASCADE;
--
-- Name: interview_feedback interview_feedback_interview_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interview_feedback"
ADD CONSTRAINT "interview_feedback_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "interviews"("id") ON DELETE CASCADE;
--
-- Name: templates templates_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."templates"
ADD CONSTRAINT "templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id")  ON DELETE CASCADE;
--
-- Name: templates templates_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."templates"
ADD CONSTRAINT "templates_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id")  ON DELETE SET NULL;
--
-- Name: template_questions template_questions_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE ONLY "public"."template_questions"
ADD CONSTRAINT "template_questions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id")  ON DELETE CASCADE;
--
-- Name: template_questions template_questions_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."template_questions"
ADD CONSTRAINT "template_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id")  ON DELETE CASCADE;
--
-- Name: interview_questions interview_questions_interview_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interview_questions"
ADD CONSTRAINT "interview_questions_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "interviews"("id")  ON DELETE CASCADE;
--
-- Name: interview_answers interview_answers_interview_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interview_answers"
ADD CONSTRAINT "interview_answers_interview_question_id_fkey" FOREIGN KEY ("interview_question_id") REFERENCES "interview_questions"("id")  ON DELETE CASCADE;
--
-- Name: job_skills job_skills_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."job_skills"
ADD CONSTRAINT "job_skills_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE;
--
-- Name: job_skills job_skills_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."job_skills"
ADD CONSTRAINT "job_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id")  ON DELETE CASCADE;
--
-- Name: job_application_tracker job_application_tracker_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."job_application_tracker"
ADD CONSTRAINT "job_application_tracker_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidate"("id") ON DELETE CASCADE;
--
-- Name: user_profiles user_profiles_user_type_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_profiles"
ADD CONSTRAINT "user_profiles_user_type_check" CHECK ("user_type" = ANY (ARRAY['candidate'::user_types, 'employer'::user_types]));
--
-- Name: products products_product_type_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."products"
ADD CONSTRAINT "products_product_type_check" CHECK ("product_type" = ANY (ARRAY['token'::product_type, 'subscription'::product_type]));
--
-- Name: interviews interviews_status_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interviews"
ADD CONSTRAINT "interviews_status_check" CHECK ("status" = ANY (ARRAY['not_started'::interview_status, 'in_progress'::interview_status, 'completed'::interview_status]));
--
-- Name: questions questions_type_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."questions"
ADD CONSTRAINT "questions_difficulty_check" CHECK ("difficulty" = ANY (ARRAY['easy'::question_difficulty, 'medium'::question_difficulty, 'hard'::question_difficulty]));
--
-- Name: questions questions_category_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."questions"
ADD CONSTRAINT "questions_category_check" CHECK ("category" = ANY (ARRAY['general'::question_category,'problem_solving'::question_category, 'technical'::question_category, 'soft_skills'::question_category, 'behavioural'::question_category]));
--
--Name skills skills_category_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."skills"
ADD CONSTRAINT "skills_category_check" CHECK ("category" = ANY (ARRAY['general'::skill_category,'problem_solving'::skill_category, 'technical'::skill_category, 'soft_skills'::skill_category, 'behavioural'::skill_category]));

--
-- Name: job_application_tracker job_application_tracker_status_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."job_application_tracker"
ADD CONSTRAINT "job_application_tracker_status_check" CHECK ("status" = ANY (ARRAY['not_started'::job_application_tracker_status, 'applied'::job_application_tracker_status, 'in_progress'::job_application_tracker_status, 'rejected'::job_application_tracker_status, 'offered'::job_application_tracker_status, 'hired'::job_application_tracker_status]));


