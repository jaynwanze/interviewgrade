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

CREATE TABLE "public"."candidates" (
  "id" "uuid" NOT NULL,
  "token_id" "uuid" NOT NULL
);
ALTER TABLE "public"."candidates" OWNER TO "postgres";

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."products" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "product_type" "public"."product_type",
  "title" character varying,
  "description" text,
  "price" integer,
  "status" "public"."product_status" DEFAULT 'active'::product_status NOT NULL,
  "tokens_bundle" bigint,
  "subscription_duration" character varying
);
ALTER TABLE "public"."products" OWNER TO "postgres";

--
-- Name: tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."tokens" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "tokens_available" bigint DEFAULT 5,
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
  "title" character varying,
  "role" character varying,
  "skill" text,
  "description" text,
  "mode" "public"."interview_mode",
  "difficulty" "public"."template_difficulty",
  "question_count" integer,
  "duration" integer,
  "evaluation_criterias" jsonb,
  "start_time" timestamp with time zone,
  "end_time" timestamp with time zone,
  "status" "public"."interview_status" DEFAULT 'not_started'::interview_status NOT NULL,
  "current_question_index" integer DEFAULT 0,
  "is_general" boolean DEFAULT false,
  "is_system_defined" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "is_template_deleted" boolean DEFAULT false
);
ALTER TABLE "public"."interviews" OWNER TO "postgres";

--
-- Name: interview_evaluations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."interview_evaluations" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "interview_id" "uuid" NOT NULL,
  "overall_grade" decimal(5,2),
  "evaluation_scores" jsonb,
  "strengths" text,
  "areas_for_improvement" text,
  "recommendations" text,
  "question_answer_feedback" jsonb,
  "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."interview_evaluations" OWNER TO "postgres";
--
-- Name: interview_analytics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."interview_analytics" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "candidate_id" "uuid" NOT NULL,
  "template_id" "uuid" NOT NULL,
  "interview_title" character varying,
  "interview_description" text,
  "period_start" date NOT NULL,
  "period_end" date NOT NULL,
  "total_interviews" INTEGER NOT NULL DEFAULT 0,
  "avg_overall_grade" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  "avg_evaluation_criteria_scores" jsonb NOT NULL DEFAULT '{}',
  "strengths_summary" text[] NOT NULL DEFAULT '{}',
  "areas_for_improvement_summary" text[] NOT NULL DEFAULT '{}',
  "recommendations_summary" text[] NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE "public"."interview_analytics" OWNER TO "postgres";
--
-- Name: templates; Type: TABLE; Schema: public; Owner: postgres
--
CREATE TABLE "public"."templates" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "user_id" "uuid",
  "category" "public"."template_category",
  "title" character varying,
  "role" character varying,
  "skill" text,
  "description" text,
  "duration" character varying,
  "difficulty" "public"."template_difficulty",
  "question_count" integer,
  "company" character varying,
  "is_company_specific" boolean DEFAULT false,
  "is_industry_specific" boolean DEFAULT false,
  "is_general" boolean DEFAULT false,
  "is_system_defined" boolean DEFAULT false,
  "created_at" timestamp WITH time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."templates" OWNER TO "postgres";
--
-- Name: evaluation_criteria; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.evaluation_criteria (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "user_id" "uuid",
  "name" character varying,          
  "description" text,
  "is_system_defined" boolean DEFAULT false,
  "created_at" timestamp WITH time zone DEFAULT "now"() NOT NULL
);
--
-- Name: template_evaluation_criteria; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.template_evaluation_criteria (
    "template_id" "uuid" NOT NULL,
    "evaluation_criteria_id" "uuid" NOT NULL,
    "rubrics" jsonb
);
--
-- Name: questions; Type: TABLE; Schema: public; Owner: postgres
--
CREATE TABLE "public"."questions" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "template_id" "uuid" NOT NULL,
  "type" "public"."question_type",
  "evaluation_criteria_id" "uuid",
  "text" text,
  "sample_answer" text DEFAULT 'No sample answer provided'
);

ALTER TABLE "public"."questions" OWNER TO "postgres";
--
-- Name: interview_questions; Type: TABLE; Schema: public; Owner: postgres
--
CREATE TABLE "public"."interview_questions" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "interview_id" "uuid" NOT NULL,
  "type" "public"."question_type",
  "evaluation_criteria" jsonb,
  "text" text,
  "sample_answer" text DEFAULT 'No sample answer provided'
);

ALTER TABLE "public"."interview_questions" OWNER TO "postgres";

--
-- Name: interview_answers; Type: TABLE; Schema: public; Owner: postgres
--
CREATE TABLE "public"."interview_answers" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "interview_question_id" "uuid" NOT NULL,
  "text" text
);
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

ALTER TABLE ONLY "public"."candidates"
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
-- Name: templates templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres


ALTER TABLE ONLY "public"."templates"
ADD CONSTRAINT "templates_pkey" PRIMARY KEY ("id");
--
-- Name: evaluation_criteria evaluation_criteria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."evaluation_criteria"
ADD CONSTRAINT "evaluation_criteria_pkey" PRIMARY KEY ("id");
--
-- Name: template_evaluation_criteria template_evaluation_criteria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."template_evaluation_criteria"
ADD CONSTRAINT "template_evaluation_criteria_pkey" PRIMARY KEY ("template_id", "evaluation_criteria_id");
--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."questions"
ADD CONSTRAINT "questions_pkey" PRIMARY KEY ("id");
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
-- Name: candidate candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."candidates"
ADD CONSTRAINT "candidate_id_fkey" FOREIGN KEY ("id") REFERENCES "user_profiles"("id") ON DELETE CASCADE;
--
-- Name: candidate candidate_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."candidates"
ADD CONSTRAINT "candidate_token_id_fkey" FOREIGN KEY ("token_id") REFERENCES "tokens"("id") ON DELETE CASCADE;

--
-- Name: interviews interviews_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interviews"
ADD CONSTRAINT "interviews_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id");
--
-- Name: interviews interviews_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interviews"
ADD CONSTRAINT "interviews_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE;
--
-- Name: interview_evaluations interview_evaluations_interview_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interview_evaluations"
ADD CONSTRAINT "interview_evaluations_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "interviews"("id") ON DELETE CASCADE;
--
-- Name: interview_analytics interview_analytics_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interview_analytics"
ADD CONSTRAINT "interview_analytics_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id");
--
-- Name: interview_analytics interview_analytics_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interview_analytics"
ADD CONSTRAINT "interview_analytics_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE;
--
-- Name: templates templates_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."templates"
ADD CONSTRAINT "templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id")  ON DELETE CASCADE;
--
-- Name: templates templates_user_id_system_defined_check; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."templates"
ADD CONSTRAINT "templates_user_id_system_defined_check" CHECK (
    (is_system_defined = TRUE AND user_id IS NULL)
    OR
    (is_system_defined = FALSE AND user_id IS NOT NULL)
);
--
-- Name: evaluation_criteria evaluation_criteria_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."evaluation_criteria"
ADD CONSTRAINT "evaluation_criteria_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id")  ON DELETE CASCADE;
--
-- Name: evaluation_criteria evaluation_criteria_user_id_system_defined_check; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."evaluation_criteria"
ADD CONSTRAINT "evaluation_criteria_user_id_system_defined_check" CHECK (
    (is_system_defined = TRUE AND user_id IS NULL)
    OR
    (is_system_defined = FALSE AND user_id IS NOT NULL)
);

--
-- Name: template_evaluation_criteria template_evaluation_criteria_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."template_evaluation_criteria"
ADD CONSTRAINT "template_evaluation_criteria_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE;
--
-- Name: template_evaluation_criteria template_evaluation_criteria_evaluation_criteria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."template_evaluation_criteria"
ADD CONSTRAINT "template_evaluation_criteria_evaluation_criteria_id_fkey" FOREIGN KEY ("evaluation_criteria_id") REFERENCES "evaluation_criteria"("id") ON DELETE CASCADE;
--
--
-- Name: questions questions_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."questions"
ADD CONSTRAINT "questions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE;
--
-- Name: questions questions_evaluation_criteria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."questions"
ADD CONSTRAINT "questions_evaluation_criteria_id_fkey" FOREIGN KEY ("evaluation_criteria_id") REFERENCES "evaluation_criteria"("id") ON DELETE SET NULL;
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
-- Name: job_application_tracker job_application_tracker_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."job_application_tracker"
ADD CONSTRAINT "job_application_tracker_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE;
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
-- Name: templates templates_difficulty_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."templates"
ADD CONSTRAINT "templates_difficulty_check" CHECK ("difficulty" = ANY (ARRAY['Easy'::template_difficulty, 'Medium'::template_difficulty, 'Hard'::template_difficulty]));
--
-- Name: questions questions_type_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."questions"
ADD CONSTRAINT "questions_type_check" CHECK ("type" = ANY (ARRAY['General'::question_type, 'Behavioral'::question_type, 'Situational'::question_type, 'Role-Specific'::question_type, 'Operational'::question_type]));
--
-- Name: interview_questions interview_questions_type_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interview_questions"
ADD CONSTRAINT "interview_questions_type_check" CHECK ("type" = ANY (ARRAY['General'::question_type, 'Behavioral'::question_type, 'Situational'::question_type, 'Role-Specific'::question_type, 'Operational'::question_type]));
--
-- Name: templates templates_category_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."templates"
ADD CONSTRAINT "templates_category_check" CHECK ("category" = ANY (ARRAY[
  'General Skills-Based'::template_category, 
  'General Job-Based'::template_category, 
  'Accounting'::template_category, 
  'Finance'::template_category, 
  'Admin'::template_category, 
  'Customer Service'::template_category, 
  'IT'::template_category, 
  'HR'::template_category, 
  'Legal'::template_category, 
  'Education'::template_category, 
  'Training'::template_category, 
  'Real Estate'::template_category, 
  'Engineering'::template_category, 
  'Construction'::template_category, 
  'Healthcare'::template_category, 
  'Pharma'::template_category, 
  'Hospitality'::template_category, 
  'Travel'::template_category, 
  'Law Enforcement'::template_category, 
  'Security'::template_category, 
  'Logistics'::template_category, 
  'Marketing'::template_category, 
  'PR'::template_category, 
  'Media'::template_category, 
  'Sales'::template_category, 
  'Retail'::template_category,
  'Other'::template_category
]));
--
-- Name: job_application_tracker job_application_tracker_status_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."job_application_tracker"
ADD CONSTRAINT "job_application_tracker_status_check" CHECK ("status" = ANY (ARRAY['not_started'::job_application_tracker_status, 'applied'::job_application_tracker_status, 'in_progress'::job_application_tracker_status, 'rejected'::job_application_tracker_status, 'offered'::job_application_tracker_status, 'hired'::job_application_tracker_status]));

--
-- Name: products products_status_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."products"
ADD CONSTRAINT "products_status_check" CHECK ("status" = ANY (ARRAY['active'::product_status, 'inactive'::product_status]));

--
-- Name: template template_mode_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interview"
ADD CONSTRAINT "interview_mode_check" CHECK ("mode" = ANY (ARRAY['practice'::template_mode, 'interview'::template_mode]));

--
-- Name: interview_analytics interview_analytics_period_start_end_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interview_analytics"
ADD CONSTRAINT "interview_analytics_period_start_end_check" CHECK ("period_start" <= "period_end");

--
-- Name: interview_analytics interview_analytics_avg_overall_grade_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interview_analytics"
ADD CONSTRAINT "interview_analytics_avg_overall_grade_check" CHECK ("avg_overall_grade" >= 0 AND "avg_overall_grade" <= 100);