# InterviewGrade

**InterviewGrade** is an advanced AI-driven mock interview platform designed to simulate real-world interviews and provide candidates with personalized feedback. It also offers tools for employers to streamline their hiring processes using data-driven insights.

## Features

### For Job Seekers:
- **AI-Powered Mock Interviews**: Simulate real-world interviews with AI-generated questions and receive real-time feedback.
- **Tailored Feedback**: Get personalized feedback on key areas such as communication, problem-solving, and technical proficiency.
- **Analytics Dashboard**: Track progress over time and identify areas of improvement.
- **Job Tracker**: Manage your job applications and track your interview progress.

### For Employers:
- **Customized Interview Templates**: Create tailored interview templates to streamline the hiring process.
- **Candidate Analysis**: Evaluate candidate performance with data-driven insights and benchmarking tools.
- **Analytics Dashboard**: Access key metrics on candidate performance to make better hiring decisions.

## Technologies Used
- **Frontend**: Next.js (React) – Modern web framework for server-rendered applications.
- **Backend**: Supabase – Open-source Firebase alternative for authentication, real-time databases, and APIs.
- **AI Integration**: OpenAI – Provides AI-generated interview questions and feedback.
- **Database**: PostgreSQL – Relational database for structured data management.
- **Testing**: Cypress – End-to-end testing framework for ensuring quality.

## Project Structure
The project is organized as follows:

## Getting Started

### Prerequisites
- Node.js >= 14.x
- Supabase account and project setup
- PostgreSQL database

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
   
4. Run the development server:
   ```bash
   pnpm run dev

5. Open the application in your browser:
   ```bash
   http://localhost:3000
