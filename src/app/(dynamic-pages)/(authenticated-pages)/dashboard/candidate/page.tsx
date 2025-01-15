import { redirect } from 'next/navigation';

async function RedirectToDefaultCandidateDashboard() {
  return redirect(`/candidate/interviews/library`);
}

export default async function DashboardPage() {
  return <RedirectToDefaultCandidateDashboard />;
}
