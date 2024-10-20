import { redirect } from 'next/navigation';

async function RedirectToDefaultInterviewsPage() {
  return redirect(`/candidate/interviews/library`);
}

export default async function DashboardPage() {
  return <RedirectToDefaultInterviewsPage />;
}
