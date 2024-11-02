'use client';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  const intialRedirect = () => {
    router.push('/candidate/interviews');
  };

  return intialRedirect();
}
