'use client';

import { CreditCard, Lock, User } from 'lucide-react';
import { useMemo } from 'react';

import { PageHeading } from '@/components/PageHeading';
import { TabsNavigation } from '@/components/TabsNavigation';

export default function UserSettingsClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tabs = useMemo(() => {
    return [
      {
        label: 'Account',
        href: `/candidate/settings`,
        icon: <User className="h-4 w-4" />,
      },
      {
        label: 'Security',
        href: `/candidate/settings/security`,
        icon: <Lock className="h-4 w-4" />,
      },
      {
        label: 'Plan & Usage',
        href: `/candidate/settings/billing`,
        icon: <CreditCard className="h-4 w-4" />,
      },
    ];
  }, []);

  return (
    <div className="min-h-screen space-y-5 sm:space-y-6">
      <PageHeading
        title="Settings"
        subTitle="Manage your profile, sign-in security, plan and monthly usage."
      />
      <TabsNavigation tabs={tabs} />
      {children}
    </div>
  );
}
