import { redirect } from 'next/navigation';

async function RedirectToDefaultCandidateDashboard() {
  return redirect(`/candidate`);
}

export default async function DashboardPage() {
  return <RedirectToDefaultCandidateDashboard />;
}
