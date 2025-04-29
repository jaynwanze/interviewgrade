'use client';

import { T } from '@/components/ui/Typography';
import { cn } from '@/utils/cn';
import { usePathname } from 'next/navigation';

export default function InvitationsNavbar() {
  const pathname = usePathname();
  // Render only if the current path matches the settings page
  if (!pathname.includes('/candidate/settings')) {
    return null;
  }
  return (
    <div className={cn('hidden lg:block', 'relative ')}>
      <T.P className="my-0">Account Settings</T.P>
    </div>
  );
}
