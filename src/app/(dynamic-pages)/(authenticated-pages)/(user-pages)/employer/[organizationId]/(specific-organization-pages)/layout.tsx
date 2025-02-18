import { ApplicationLayoutShell } from '@/components/ApplicationLayoutShell/ApplicationLayoutShell';
import { InternalNavbar } from '@/components/NavigationMenu/InternalNavbar';
import { Tokens } from '@/components/Tokens';
import { Settings } from 'lucide-react';
import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { z } from 'zod';
import { OrganizationSidebar } from '../../../../(application-pages)/_sidebar/OrganizationSidebar';

const paramsSchema = z.object({
  organizationId: z.string(),
});

export default async function Layout({
  children,
  params,
  navbar,
}: {
  children: ReactNode;
  params: unknown;
  navbar: ReactNode;
}) {
  const { organizationId } = paramsSchema.parse(params);
  return (
    <ApplicationLayoutShell
      sidebar={<OrganizationSidebar organizationId={organizationId} />}
    >
      <div>
        <InternalNavbar>
          <div className="hidden lg:flex w-full justify-between items-center">
            <Suspense>{navbar}</Suspense>
            <div className="flex items-center gap-1">
              <Link
                className="flex cursor-pointer items-center group rounded-md transition hover:cursor-pointer hover:text-foreground"
                href={`/employer/${organizationId}/settings`}
              >
                <Settings className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
              </Link>
              <span className="flex gap-1.5 py-1.5 px-1 cursor-pointer items-center group rounded-md transition hover:cursor-pointer hover:text-foreground">
                <Tokens />
              </span>
            </div>
          </div>
        </InternalNavbar>
        <div className="relative flex-1 h-auto mt-6 w-full overflow-auto min-h-screen">
          <div className="px-6 space-y-6 pb-8">{children}</div>
        </div>
      </div>
    </ApplicationLayoutShell>
  );
}
