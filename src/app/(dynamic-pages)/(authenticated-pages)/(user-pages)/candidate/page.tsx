'use client';
import { redirect } from 'next/navigation';

export default function DashboardPage() {
  const intialRedirect = () => {
    return redirect('/candidate/interview-analytics');
  };

  return intialRedirect();
}
