import { cn } from '@/utils/cn';
import { ReactNode, Suspense } from 'react';
import { PendingInvitationCounter } from './PendingInvitationCounter';
import { SidebarOpen } from './SidebarOpen';
import { UserNav } from './UserNav';

export async function InternalNavbar({ children }: { children: ReactNode }) {
  return (
    <header className="sticky top-0 w-full z-10 dark:bg-neutral-900/15 bg-white/90 backdrop-blur">
      <div
        className={cn(
          'h-full  text-sm font-medium flex gap-2 mx-auto pl-6 pr-6 border-b dark:border-gray-700/50 py-3 w-full justify-between items-center',
        )}
      >
        <SidebarOpen />
        <Suspense>{children}</Suspense>

        <div className="relative w-max flex items-center gap-2">
          <PendingInvitationCounter />
          <div className="w-px h-5 mr-4 ml-2 bg-gray-300 dark:bg-slate-700" />
          <div className="relative w-max flex items-center space-x-3">
            <Suspense>
              <UserNav />
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  );
}
