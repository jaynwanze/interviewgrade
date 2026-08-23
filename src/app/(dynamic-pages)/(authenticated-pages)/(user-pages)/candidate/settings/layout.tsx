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
        label: 'Account Settings',
        href: `/candidate/settings`,
        icon: <User />,
      },
      {
        label: 'Security',
        href: `/candidate/settings/security`,
        icon: <Lock />,
      },
      {
        label: 'Plan & Usage',
        href: `/candidate/settings/billing`,
        icon: <CreditCard />,
      },
    ];
  }, []);

  return (
    <div className="min-h-screen space-y-6">
      <PageHeading
        title="User Settings"
        subTitle="Manage your account, security, plan and monthly usage."
      />
      <TabsNavigation tabs={tabs} />
      {children}
    </div>
  );
}
