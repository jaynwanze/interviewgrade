import { SubscriptionCardSmall } from '@/components/SubscriptionCardSmall';
import { T } from '@/components/ui/Typography';
import { cn } from '@/utils/cn';
import {
  BarChart3Icon,
  ListChecks,
  LucideHistory,
  Settings,
} from 'lucide-react';
import { Suspense } from 'react';
import { SidebarLink } from './SidebarLink';
import { SidebarLogoAndToggle } from './_components/SidebarLogo';

export async function UserSidebar() {
  return (
    <div
      className={cn(
        'flex flex-col justify-between h-full',
        'lg:px-3 lg:py-4 lg:pt-2.',
      )}
    >
      <div>
        <div className="flex justify-between items-center">
          <SidebarLogoAndToggle userType="candidate" />
        </div>
        <SidebarLink
          label="Dashboard"
          href="/candidate/dashboard"
          icon={<BarChart3Icon className="h-5 w-5" />}
        />
        <SidebarLink
          label="My Practices"
          href="/candidate/practices"
          icon={<ListChecks className="h-5 w-5" />}
        />
        <SidebarLink
          label="History"
          href="/candidate/interview-history"
          icon={<LucideHistory className="h-5 w-5" />}
        />
        <SidebarLink
          label="Account Settings"
          href="/candidate/settings"
          icon={<Settings className="h-5 w-5" />}
        />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-normal text-muted-foreground">
          Subscription Details
        </p>
        <Suspense fallback={<T.P>Loading Subscription Details details...</T.P>}>
          <SubscriptionCardSmall />
        </Suspense>{' '}
      </div>
    </div>
  );
}
