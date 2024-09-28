import { cn } from '@/utils/cn';
import { Home, Mail, Settings, Shield } from 'lucide-react';
import { SidebarLink } from './SidebarLink';
import { SidebarLogoAndToggle } from './_components/SidebarLogo';

export async function UserSidebar() {
  return (
    <div
      className={cn(
        'flex flex-col  h-full',
        'lg:px-3 lg:py-4 lg:pt-2.5 ',
      )}
    >
      <div className="flex justify-between items-center">
        <SidebarLogoAndToggle />
      </div>
      <div className="">
        <SidebarLink
          label="Home"
          href="/dashboard"
          icon={<Home className="h-5 w-5" />}
        />
        <SidebarLink
          label="Account Settings"
          href="/settings"
          icon={<Settings className="h-5 w-5" />}
        />
        <SidebarLink
          label="Security Settings"
          href="/settings/security"
          icon={<Shield className="h-5 w-5" />}
        />
        <SidebarLink
          label="Invitations"
          href="/invitations"
          icon={<Mail className="h-5 w-5" />}
        />
      </div>
    </div>
  );
}
