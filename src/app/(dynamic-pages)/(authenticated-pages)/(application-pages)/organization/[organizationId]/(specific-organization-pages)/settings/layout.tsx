import { TabsNavigation } from '@/components/TabsNavigation';
import { DollarSign, SquarePen, UserRound } from 'lucide-react';
import { z } from 'zod';

const paramsSchema = z.object({
  organizationId: z.string(),
});

export default function OrganizationSettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: unknown;
}) {
  const { organizationId } = paramsSchema.parse(params);
  const tabs = [
    {
      label: 'General',
      href: `/organization/${organizationId}/settings`,
      icon: <SquarePen />,
    },
    {
      label: 'Organization Members',
      href: `/organization/${organizationId}/settings/members`,
      icon: <UserRound />,
    },
    {
      label: 'Billing',
      href: `/organization/${organizationId}/settings/billing`,
      icon: <DollarSign />,
    },
  ];

  return (
    <div className="space-y-6">
      <TabsNavigation tabs={tabs} />
      {children}
    </div>
  );
}
