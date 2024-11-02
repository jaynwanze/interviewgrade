import { cn } from '@/utils/cn';
import {
  LucideHistory,
  NotepadText,
  Settings,
  Shield,
  TableProperties,
  BarChart3Icon,
} from 'lucide-react';
import { SidebarLink } from './SidebarLink';
import { SidebarLogoAndToggle } from './_components/SidebarLogo';

export async function UserSidebar() {
  return (
    <div className={cn('flex flex-col  h-full', 'lg:px-3 lg:py-4 lg:pt-2.5 ')}>
      <div className="flex justify-between items-center">
        <SidebarLogoAndToggle />
      </div>
      <div className="">
        <SidebarLink
          label="Mock Interviews"
          href={`/candidate/interviews`}
          icon={<NotepadText className="h-5 w-5" />}
        />
        <SidebarLink
          label="Interview History"
          href="/candidate/interview-history"
          icon={<LucideHistory className="h-5 w-5" />}
        />
        <SidebarLink
          label="Interview Analytics"
          href="/candidate/interview-analytics"
          icon={<BarChart3Icon className="h-5 w-5" />}
        />
        <SidebarLink
          label="Job Tracker"
          href="/candidate/jobtracker"
          icon={<TableProperties className="h-5 w-5" />}
        />
        <SidebarLink
          label="Account Settings"
          href="/candidate/settings"
          icon={<Settings className="h-5 w-5" />}
        />
        <SidebarLink
          label="Security Settings"
          href="/candidate/settings/security"
          icon={<Shield className="h-5 w-5" />}
        />
      </div>
    </div>
  );
}
