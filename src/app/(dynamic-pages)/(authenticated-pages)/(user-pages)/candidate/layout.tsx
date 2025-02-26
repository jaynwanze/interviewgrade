import { ApplicationLayoutShell } from '@/components/ApplicationLayoutShell';
import { InternalNavbar } from '@/components/NavigationMenu/InternalNavbar';
import { ReactNode, Suspense } from 'react';
import { UserSidebar } from '../../(application-pages)/_sidebar/UserSidebar';

export default async function Layout({
  children,
  navbar,
}: {
  children: ReactNode;
  navbar: ReactNode;
}) {
  return (
    // look at using client shell insetad of server shell
    <ApplicationLayoutShell sidebar={<UserSidebar />}>
      <div>
        <InternalNavbar>
          <Suspense>{navbar}</Suspense>
        </InternalNavbar>
        <Suspense>
          <div className="relative flex-1 h-auto min-h-screen mt-6 w-full overflow-auto">
            <div className="px-6 space-y-6 min-h-screen pb-10">{children}</div>
          </div>
        </Suspense>
      </div>
    </ApplicationLayoutShell>
  );
}
