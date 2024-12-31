--
-- Name: product_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."product_type" AS ENUM ('token', 'subscription');
ALTER TYPE "public"."product_type" OWNER TO "postgres";

--
-- Name: interview_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."interview_status" AS ENUM (
  'not_started',
  'in_progress',
  'completed'
);

ALTER TYPE "public"."interview_status" OWNER TO "postgres";

--
-- Name: user_types; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."user_types" AS ENUM (
  'employer',
  'candidate'
);
ALTER TYPE "public"."user_types" OWNER TO "postgres";

--
-- Name: job_application_tracker_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."job_application_tracker_status" AS ENUM (
  'not_started',
  'applied',
  'in_progress',
  'rejected',
  'offered',
  'hired'
);
ALTER TYPE "public"."job_application_tracker_status" OWNER TO "postgres";

--
-- Name: template_difficulty; Type: TYPE; Schema: public; Owner: postgres
--
CREATE TYPE "public"."template_difficulty" AS ENUM (
  'Easy',
  'Medium',
  'Hard'
);
ALTER TYPE "public"."template_difficulty" OWNER TO "postgres";
--
-- Name: template_category; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."template_category" AS ENUM (
  'General Skills-Based',
  'General Job-Based',
  'Accounting',
  'Finance',
  'Admin',
  'Customer Service',
  'IT',
  'HR',
  'Legal',
  'Education',
  'Training',
  'Real Estate',
  'Engineering',
  'Construction',
  'Healthcare',
  'Pharma',
  'Hospitality',
  'Travel',
  'Law Enforcement',
  'Security',
  'Logistics',
  'Marketing',
  'PR',
  'Media',
  'Sales',
  'Retail',
  'Other'
);
ALTER TYPE "public"."template_category" OWNER TO "postgres";
--
-- Name: question_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."question_type" AS ENUM (
  'General',
  'Behavioral',
  'Situational',
  'Role-Specific',
  'Operational'
);
ALTER TYPE "public"."question_type" OWNER TO "postgres";
--
-- Name: product_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."product_status" AS ENUM (
  'active',
  'inactive'
);

ALTER TYPE "public"."product_status" OWNER TO "postgres";

--
-- Name: interview_mode; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."interview_mode" AS ENUM (
  'practice',
  'interview'
);

ALTER TYPE "public"."interview_mode" OWNER TO "postgres";