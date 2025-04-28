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
      href: `/employer/${organizationId}/settings`,
      icon: <SquarePen />,
    },
    // {
    //   label: 'Organization Members',
    //   href: `/employer/${organizationId}/settings/members`,
    //   icon: <UserRound />,
    // },
    // {
    //   label: 'Billing',
    //   href: `/employer/${organizationId}/settings/billing`,
    //   icon: <DollarSign />,
    // },
  ];

  return (
    <div className="space-y-6">
      <TabsNavigation tabs={tabs} />
      {children}
    </div>
  );
}
