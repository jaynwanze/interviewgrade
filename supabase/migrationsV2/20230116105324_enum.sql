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
-- Name: question_difficulty; Type: TYPE; Schema: public; Owner: postgres
--
CREATE TYPE "public"."question_difficulty" AS ENUM (
  'easy',
  'medium',
  'hard'
);
ALTER TYPE "public"."question_difficulty" OWNER TO "postgres";

--
-- Name: question_category; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."question_category" AS ENUM (
  'general',
  'problem_solving',
  'technical',
  'soft_skills',
  'behavioural'
);
ALTER TYPE "public"."question_category" OWNER TO "postgres";

--
-- Name: question_category; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."skill_category" AS ENUM (
  'general',
  'problem_solving',
  'technical',
  'soft_skills',
  'behavioural'
);
ALTER TYPE "public"."skill_category" OWNER TO "postgres";