import { ProFeatureGateDialog } from '@/components/ProFeatureGateDialog';
import { SubscriptionCardSmall } from '@/components/SubscriptionCardSmall';
import { T } from '@/components/ui/Typography';
import { fetchSlimOrganizations } from '@/data/user/organizations';
import { cn } from '@/utils/cn';
import { CreditCard, DollarSign, FileBox, Home, Settings, UserRound, Building2 } from 'lucide-react';

import { Suspense } from 'react';
import { SidebarLink } from './SidebarLink';
import { OrganizationSwitcher } from './_components/OrganizationSwitcher';
import { DesktopSidebarFallback } from './_components/SidebarFallback';
import { SidebarLogoAndToggle } from './_components/SidebarLogo';

async function OrganizationSidebarInternal({
  organizationId,
}: {
  organizationId: string;
}) {
  const slimOrganizations = await fetchSlimOrganizations();
  return (
    <div
      className={cn(
        'flex flex-col justify-between h-full',
        'lg:px-3 lg:py-4 lg:pt-2.5 ',
      )}
    >
      <div>
        <div className="flex justify-between items-center">
          <SidebarLogoAndToggle />
        </div>
        <div className="flex flex-col gap-6 h-full overflow-y-auto">
          <div>
            <SidebarLink
              label="Home"
              href={`/organization/${organizationId}`}
              icon={<Home className="h-5 w-5" />}
            />
            <SidebarLink
              label="Interviews"
              href={`/organization/${organizationId}/properties`}
              icon={<Building2 className="h-5 w-5" />}
            />
            <SidebarLink
              label="Settings"
              href={`/organization/${organizationId}/settings`}
              icon={<Settings className="h-5 w-5" />}
            />
            <SidebarLink
              label="Members"
              href={`/organization/${organizationId}/settings/members`}
              icon={<UserRound className="h-5 w-5" />}
            />
            <SidebarLink
              label="Billing"
              href={`/organization/${organizationId}/settings/billing`}
              icon={<DollarSign className="h-5 w-5" />}
            />
          </div>
          {/* <TeamsList organizationId={organizationId} /> */}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <Suspense fallback={<T.P>Loading token details...</T.P>}>
          <SubscriptionCardSmall organizationId={organizationId} />
        </Suspense>

        <div className="flex flex-col gap-1">
          <p className="text-sm font-normal text-muted-foreground">
            Select organization
          </p>
          <OrganizationSwitcher
            currentOrganizationId={organizationId}
            slimOrganizations={slimOrganizations}
          />
        </div>
      </div>
    </div>
  );
}

export async function OrganizationSidebar({
  organizationId,
}: {
  organizationId: string;
}) {
  return (
    <Suspense fallback={<DesktopSidebarFallback />}>
      <OrganizationSidebarInternal organizationId={organizationId} />
    </Suspense>
  );
}
