'use client';
import { PageHeading } from '@/components/PageHeading';
import { TabsNavigation } from '@/components/TabsNavigation';
import { CreditCard, Lock, User } from 'lucide-react';
import { useMemo } from 'react';

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
        label: 'Billing',
        href: `/candidate/settings/billing`,
        icon: <CreditCard />,
      },
    ];
  }, []);

  return (
    <div className="space-y-6">
      <PageHeading
        title="User Settings"
        subTitle="Manage your account, security and billing settings here."
      />
      <TabsNavigation tabs={tabs} />
      {children}
    </div>
  );
}
