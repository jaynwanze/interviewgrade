import { cn } from '@/utils/cn';
import {
  BarChart3Icon,
  LucideHistory,
  NotepadText,
  Settings,
  Shield,
  TableProperties,
} from 'lucide-react';
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
          label="Mock Interviews"
          href={`/candidate/interviews/library`}
          icon={<NotepadText className="h-5 w-5" />}
        />
        <SidebarLink
          label="Interview History"
          href="/candidate/interview-history"
          icon={<LucideHistory className="h-5 w-5" />}
        />
        <SidebarLink
          label="Interview Analytics"
          href="/candidate/dashboard"
          icon={<BarChart3Icon className="h-5 w-5" />}
        />
        <SidebarLink
          label="Job Tracker"
          href="/candidate/jobtracker"
          icon={<TableProperties className="h-5 w-5" />}
        />
        {/* <SidebarLink
          label="Skill Development"
          href="/candidate/skill-development"
          icon={<Shield className="h-5 w-5" />}
        /> */}
        <SidebarLink
          label="Account Settings"
          href="/candidate/settings"
          icon={<Settings className="h-5 w-5" />}
        />
      </div>
      {/* <div className="flex flex-col gap-1">
        <p className="text-sm font-normal text-muted-foreground">
          Subscription Details
        </p>
        <Suspense fallback={<T.P>Loading Subscription Details details...</T.P>}>
          <SubscriptionCardSmall organizationId={'organizationId'} />
        </Suspense>{' '}
      </div> */}
    </div>
  );
}
