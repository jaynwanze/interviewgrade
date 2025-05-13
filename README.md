<div align="center">

<img src="public/logos/InterviewGrade.png" height="120" alt="InterviewGrade logo" />

# InterviewGrade
**AI-powered mock interviews & data-driven hiring – built with Next 14, Supabase & GPT-4o**

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)  👉
<br>

</div>

---

# InterviewGrade

**InterviewGrade** is an advanced AI-driven mock interview platform designed to simulate real-world interviews and provide candidates with personalized feedback. It also offers tools for employers to streamline their hiring processes using data-driven insights.

## ✨ What does it do?
- **Candidates** run real-time practice or mock interviews, get instant AI feedback and long-term skill analytics.  
- **Employers** filter talent by verified soft-skill scores, unlock detailed reports with pay-as-you-go tokens.  
- All grading is handled by **GPT-4o + DistilRoBERTa sentiment**, streamed back to the UI in seconds.

## Features

### For Job Seekers:
- **AI-Powered Mock Interviews**: Simulate real-world interviews with AI-generated questions and receive real-time feedback.
- **Tailored Feedback**: Get personalized feedback on key areas such as communication, problem-solving, and technical proficiency.
- **Analytics Dashboard**: Track progress over time and identify areas of improvement.
- **Employer Interests**: Candidates receive notifications when an employer unlocks there profile.
  
### For Employers:
- **Access to talented Candidate pool**: Fine-grained search / filter on scores & resume
- **Analytics Dashboard**: Automated matchmaking candidate performance/resume based off candidate preferences to make better hiring decisions.
- **Deeper Camdidate analytics**: Employers can view deeper analytics about a desired candidate and pay one token(1 euro) to reach out to them.
- **Stripe Integration**: Recruiters can purchase different token bundles which will be used to unlock candidates of their choice.


## 🏗️ Tech stack

| Layer | Main tech | Why |
| ----- | --------- | --- |
| **Frontend** | Next 14 (App Router) · React 18 · Tailwind CSS · shadcn/ui | Edge streaming, typed RSC & Client Components |
| **Backend** | Next API Routes & Server Actions · Node 20 | Runs inside Vercel serverless / edge |
| **Database** | Supabase (Postgres + RLS) | SQL + JSONB, auth & storage bundled |
| **AI** | OpenAI GPT-4o, Whisper • Hugging Face DistilRoBERTa | Grading, feedback & sentiment |
| **Payments** | Stripe Checkout + webhooks | PCI-compliant token bundles |
| **DevOps** | Vercel, Docker (local Supabase) | Push-to-deploy, zero infra mgmt |
| **Tooling** | TypeScript • Zod • ESLint / Prettier • GitHub Actions | End-to-end type safety & CI |

---

## Project Structure
The project is organized as follows:

---

## 🚀 Getting started (local)

> Prereqs: **Node ≥ 20**, **pnpm** (or npm), **Docker Desktop**.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jaynwanze/interviewgrade.git
   cd interviewgrade
   
2. Install Dependecies
   ```bash
   pnpm install

3. Set up your environment variables: Create a .env.local file and add your Supabase credentials and other environment variables:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=…
   OPENAI_API_KEY=…
   STRIPE_SECRET_KEY=…
   STRIPE_WEBHOOK_SECRET=…
   
4. Download and start docker engine:
   Start Docker Desktop - Ensuring docker engine is running

5. Run the local db in docker env:
   ```bash
   pnpm supabase start
   
6. Run the development server:
   ```bash
   pnpm run dev

7. Open the application in your browser:
   ```bash
   http://localhost:3000

