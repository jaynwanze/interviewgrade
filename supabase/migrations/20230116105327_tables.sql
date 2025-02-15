CREATE TABLE "public"."organization_members" (
  "id" bigint NOT NULL,
  "created_at" timestamp WITH time zone DEFAULT "now"() NOT NULL,
  "member_id" "uuid" NOT NULL,
  "member_role" "public"."organization_member_role" NOT NULL,
  "organization_id" "uuid" NOT NULL
);
ALTER TABLE "public"."organization_members" OWNER TO "postgres";
--
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."organizations" (
  "created_at" timestamp WITH time zone DEFAULT "now"() NOT NULL,
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "title" character varying DEFAULT 'Test Organization'::character varying NOT NULL,
  "created_by" "uuid" NOT NULL
);
ALTER TABLE "public"."organizations" OWNER TO "postgres";

--
-- Name: organization_join_invitations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."organization_join_invitations" (
  "created_at" timestamp WITH time zone DEFAULT "now"() NOT NULL,
  "inviter_user_id" "uuid" NOT NULL,
  "status" "public"."organization_join_invitation_link_status" DEFAULT 'active'::"public"."organization_join_invitation_link_status" NOT NULL,
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL, 
  "invitee_user_email" character varying NOT NULL,
  "organization_id" "uuid" NOT NULL,
  "invitee_organization_role" "public"."organization_member_role" NOT NULL DEFAULT 'member'::organization_member_role,
  "invitee_user_id" "uuid"
);
ALTER TABLE "public"."organization_join_invitations" OWNER TO "postgres";
--
-- Name: organizations_private_info; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."organizations_private_info" (
  "id" "uuid" NOT NULL,
  "billing_address" "json",
  "payment_method" "json"
);

ALTER TABLE "public"."organizations_private_info" OWNER TO "postgres";
--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."user_profiles" (
  "id" "uuid" NOT NULL,
  "full_name" character varying,
  "avatar_url" character varying,
  "user_type" "public"."user_types" DEFAULT 'candidate'::user_types NOT NULL,
  "created_at" timestamp WITH time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."user_profiles" OWNER TO "postgres";

--
-- Name: candidate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."candidates" (
  "id" "uuid" NOT NULL,
  "token_id" "uuid" NOT NULL,
  "subscription_id" "uuid",
  "stripe_customer_id" character varying
  );
ALTER TABLE "public"."candidates" OWNER TO "postgres";

CREATE TABLE "public"."employees" (
  "id" "uuid" NOT NULL,
  "default_organization" "uuid",
  "created_at" timestamp WITH time zone DEFAULT "now"() NOT NULL
);
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."products" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "product_type" "public"."product_type",
  "title" character varying NOT NULL,
  "description" text,
  "price" numeric(10,2) NOT NULL,
  "quantity" bigint,
  "status" "public"."product_status" DEFAULT 'active'::product_status NOT NULL,
  "price_unit_amount" bigint,
  "currency" character varying,
  "pricing_type" "public"."pricing_type",
  "pricing_plan_interval" "public"."pricing_plan_interval_type",
  "pricing_interval_count" bigint,
  "trial_period_days" bigint,
  "img_url" text NOT NULL,
  "metadata" "jsonb"
  );
ALTER TABLE "public"."products" OWNER TO "postgres";

--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."subscriptions" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "product_id" "uuid" NOT NULL,
  "status" "public"."subscription_status",
  "quantity" bigint,
  "cancel_at_period_end" boolean,
  "created" timestamp WITH time zone NOT NULL,
  "current_period_start" timestamp WITH time zone NOT NULL,
  "current_period_end" timestamp WITH time zone NOT NULL,
  "metadata" "json",
  "ended_at" timestamp WITH time zone,
  "cancel_at" timestamp WITH time zone,
  "canceled_at" timestamp WITH time zone,
  "trial_start" timestamp WITH time zone,
  "trial_end" timestamp WITH time zone,
  "organization_id" "uuid"
);
ALTER TABLE "public"."subscriptions" OWNER TO "postgres";
--
-- Name: tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."tokens" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "tokens_available" bigint DEFAULT 5,
  "total_tokens_used" bigint DEFAULT 0,
  "total_tokens_purchased" bigint DEFAULT 0,
  "last_purchase_date" timestamp with time zone
);
ALTER TABLE "public"."tokens" OWNER TO "postgres";

--
-- Name: interviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."interviews" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "candidate_id" "uuid" NOT NULL,
  "template_id" "uuid",
  "interview_template_id" "uuid",
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
-- Name: interview_templates; Type: TABLE; Schema: public; Owner: postgres
--
CREATE TABLE "public"."interview_templates" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "user_id" "uuid",
  "category" "public"."template_category",
  "title" character varying,
  "description" text,
  "duration" character varying,
  "difficulty" "public"."template_difficulty",
  "question_count" integer,
  "is_general" boolean DEFAULT false,
  "is_system_defined" boolean DEFAULT false,
  "created_at" timestamp WITH time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."interview_templates" OWNER TO "postgres";
--
-- Name: evaluation_criteria; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.evaluation_criteria (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "user_id" "uuid",
  "name" character varying,
  "rubrics" jsonb,
  "description" text,
  "is_system_defined" boolean DEFAULT false,
  "created_at" timestamp WITH time zone DEFAULT "now"() NOT NULL
);
--
-- Name: interview_evaluation_criteria; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interview_evaluation_criteria (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "user_id" "uuid",
  "template_id" "uuid" NOT NULL,
  "name" character varying,
  "rubrics" jsonb,
  "description" text,
  "is_system_defined" boolean DEFAULT false,
  "created_at" timestamp WITH time zone DEFAULT "now"() NOT NULL
);
--
-- Name: template_evaluation_criteria; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.template_evaluation_criteria (
    "template_id" "uuid" NOT NULL,
    "evaluation_criteria_id" "uuid" NOT NULL
);
--
-- Name: interview_template_evaluation_criteria; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interview_template_interview_evaluation_criteria (
    "interview_template_id" "uuid" NOT NULL,
    "interview_evaluation_criteria_id" "uuid" NOT NULL
);
--
-- Name: questions; Type: TABLE; Schema: public; Owner: postgres
--
CREATE TABLE "public"."questions" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "template_id" "uuid" NOT NULL,
  "evaluation_criteria_id" "uuid",
  "type" "public"."question_type",
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
  "text" text,
  "mark" decimal(5,2),
  "feedback" text
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
-- Name: organization_members_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--
ALTER TABLE "public"."organization_members"
ALTER COLUMN "id"
ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."organization_members_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1
  );
--
-- Name: organizations on_organization_created; Type: TRIGGER; Schema: public; Owner: postgres
----
-- Name: organization_join_invitations organization_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY "public"."organization_join_invitations"
ADD CONSTRAINT "organization_invitations_pkey" PRIMARY KEY ("id");
--
-- Name: organization_members organization_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."organization_members"
ADD CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id");
--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."organizations"
ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_profiles"
ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");
--
-- Name: candidate candidate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."candidates"
ADD CONSTRAINT "candidate_pkey" PRIMARY KEY ("id");
--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."employees"
ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");
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
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."subscriptions"
ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");
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
-- Name: templates templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--


ALTER TABLE ONLY "public"."templates"
ADD CONSTRAINT "templates_pkey" PRIMARY KEY ("id");
--
-- Name: interview_templates interview_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interview_templates"
ADD CONSTRAINT "interview_templates_pkey" PRIMARY KEY ("id");
-- Name: interview_template_interview_evaluation_criteria interview_template_evaluation_criteria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interview_template_interview_evaluation_criteria"
ADD CONSTRAINT "interview_template_interview_evaluation_criteria_pkey" PRIMARY KEY ("interview_template_id", "interview_evaluation_criteria_id");
--
-- Name: evaluation_criteria evaluation_criteria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."evaluation_criteria"
ADD CONSTRAINT "evaluation_criteria_pkey" PRIMARY KEY ("id");
--
-- Name: interview_evaluation_criteria interview_evaluation_criteria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interview_evaluation_criteria"
ADD CONSTRAINT "interview_evaluation_criteria_pkey" PRIMARY KEY ("id");
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
-- Name: organizations_private_info organizations_private_info_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."organizations_private_info"
ADD CONSTRAINT "organizations_private_info_pkey" PRIMARY KEY ("id");
--
-- Name: organization_join_invitations organization_join_invitations_invitee_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY "public"."organization_join_invitations"
ADD CONSTRAINT "organization_join_invitations_invitee_user_id_fkey" FOREIGN KEY ("invitee_user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;
--
-- Name: organization_join_invitations organization_join_invitations_inviter_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY "public"."organization_join_invitations"
ADD CONSTRAINT "organization_join_invitations_inviter_user_id_fkey" FOREIGN KEY ("inviter_user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;
--
-- Name: organization_join_invitations organization_join_invitations_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY "public"."organization_join_invitations"
ADD CONSTRAINT "organization_join_invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;
--
-- Name: organization_members organization_members_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."organization_members"
ADD CONSTRAINT "organization_members_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;
--
-- Name: organization_members organization_members_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."organization_members"
ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");
--
-- Name: organizations organizations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."organizations"
ADD CONSTRAINT "organizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id");
--
-- Name: organizations_private_info organizations_private_info_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY "public"."organizations_private_info"
ADD CONSTRAINT "organizations_private_info_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;
--
-- Name: subscriptions subscriptions_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."subscriptions"
ADD CONSTRAINT "subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;

--
-- Name: user_profiles user_profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_profiles"
ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
--
-- Name: employees employee_default_organization_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."employees"
ADD CONSTRAINT "employees_default_organization_fkey" FOREIGN KEY ("default_organization") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;
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
-- Name: candidate candidate_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres 
--

ALTER TABLE ONLY "public"."candidates"
ADD CONSTRAINT "candidate_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE;

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
-- Name: interviews interviews_interview_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interviews"
ADD CONSTRAINT "interviews_interview_template_id_fkey" FOREIGN KEY ("interview_template_id") REFERENCES "interview_templates"("id");
--
-- Name: interview_evaluations interview_evaluations_interview_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interview_evaluations"
ADD CONSTRAINT "interview_evaluations_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "interviews"("id") ON DELETE CASCADE;
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
-- Name: interview_templates interview_templates_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interview_templates"
ADD CONSTRAINT "interview_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id")  ON DELETE CASCADE;
--
-- Name: interview_templates interview_templates_user_id_system_defined_check; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interview_templates"
ADD CONSTRAINT "interview_templates_user_id_system_defined_check" CHECK (
    (is_system_defined = TRUE AND user_id IS NULL)
    OR
    (is_system_defined = FALSE AND user_id IS NOT NULL)
);
--
-- Name: interview_evaluation_criteria interview_evaluation_criteria_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interview_evaluation_criteria"
ADD CONSTRAINT "interview_evaluation_criteria_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id")  ON DELETE CASCADE;
-- Name: interview_template_interview_interview_evaluation_criteria interview_template_interview_evaluation_criteria_interview_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interview_template_interview_evaluation_criteria"
ADD CONSTRAINT "interview_template_interview_evaluation_criteria_interview_template_id_fkey" FOREIGN KEY ("interview_template_id") REFERENCES "interview_templates"("id") ON DELETE CASCADE;
--
-- Name: interview_template_interview_evaluation_criteria interview_template_interview_evaluation_criteria_interview_evaluation_criteria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interview_template_interview_evaluation_criteria"
ADD CONSTRAINT "interview_template_interview_evaluation_criteria_interview_evaluation_criteria_id_fkey" FOREIGN KEY ("interview_evaluation_criteria_id") REFERENCES "interview_evaluation_criteria"("id") ON DELETE CASCADE;
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
ADD CONSTRAINT "products_product_type_check" CHECK ("product_type" = ANY (ARRAY['token_bundle'::product_type , 'subscription'::product_type]));
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
  'Soft Skills'::template_category,
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
-- Name: interview interview_mode_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."interviews"
ADD CONSTRAINT "interview_mode_check" CHECK ("mode" = ANY (ARRAY['practice'::interview_mode, 'interview'::interview_mode]));

--
-- Name: subscriptions subscriptions_status_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."subscriptions"
ADD CONSTRAINT "subscriptions_status_check" CHECK ("status" = ANY (ARRAY[
  'trialing'::subscription_status,
  'active'::subscription_status,
  'canceled'::subscription_status,
  'incomplete'::subscription_status,
  'incomplete_expired'::subscription_status,
  'past_due'::subscription_status,
  'unpaid'::subscription_status,
  'paused'::subscription_status
]));
--
-- Name: products pricing_type_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."products"
ADD CONSTRAINT "pricing_type_check" CHECK ("pricing_type" = ANY (ARRAY['one_time'::pricing_type, 'recurring'::pricing_type]));
--
-- Name: products pricing_plan_interval_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."products"
ADD CONSTRAINT "pricing_plan_interval_check" CHECK ("pricing_plan_interval" = ANY (ARRAY['day'::pricing_plan_interval_type, 'week'::pricing_plan_interval_type, 'month'::pricing_plan_interval_type, 'year'::pricing_plan_interval_type]));

--
--
-- Name: tokens tokens_tokens_available_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tokens"
ADD CONSTRAINT "tokens_tokens_available_check" CHECK ("tokens_available" >= 0);

--
-- Name: tokens tokens_total_tokens_used_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tokens"
ADD CONSTRAINT "tokens_total_tokens_used_check" CHECK ("total_tokens_used" >= 0);

--
-- Name: tokens tokens_total_tokens_purchased_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tokens"
ADD CONSTRAINT "tokens_total_tokens_purchased_check" CHECK ("total_tokens_purchased" >= 0);

--
-- Name products products_price_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."products"
ADD CONSTRAINT "products_price_check" CHECK ("price" >= 0);

--
-- Name: products products_price_unit_amount_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."products"
ADD CONSTRAINT "products_price_unit_amount_check" CHECK ("price_unit_amount" >= 0);
--
-- Name: products products_pricing_interval_count_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."products"
ADD CONSTRAINT "products_pricing_interval_count_check" CHECK ("pricing_interval_count" >= 0);

--
-- Name: products products_trial_period_days_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."products"
ADD CONSTRAINT "products_trial_period_days_check" CHECK ("trial_period_days" >= 0);

--
-- Name: subscriptions subscriptions_quantity_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."subscriptions"
ADD CONSTRAINT "subscriptions_quantity_check" CHECK ("quantity" >= 0);