import { TabsNavigation } from '@/components/TabsNavigation';
import { DollarSign, SquarePen, UserRound, Lock } from 'lucide-react';
import { z } from 'zod';

const paramsSchema = z.object({
  organizationId: z.string(),
});

export default async function OrganizationSettingsLayout(
  props: {
    children: React.ReactNode;
    params: Promise<unknown>;
  }
) {
  const params = await props.params;

  const {
    children
  } = props;

  const { organizationId } = paramsSchema.parse(params);
  const tabs = [
    {
      label: 'General',
      href: `/employer/${organizationId}/settings`,
      icon: <SquarePen />,
    },
    {
      label: 'Security',
      href: `/employer/${organizationId}/settings/security`,
      icon: <Lock />,
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
