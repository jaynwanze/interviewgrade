'use client';
import { T } from '@/components/ui/Typography';
import { supabaseUserClientComponentClient } from '@/supabase-clients/user/supabaseUserClientComponentClient';
import { useDidMount } from 'rooks';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function Logout() {
  const router = useRouter();
  useDidMount(async () => {
    await supabaseUserClientComponentClient.auth.signOut();
    router.refresh();
    router.replace('/');
  });

    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
  );
}
