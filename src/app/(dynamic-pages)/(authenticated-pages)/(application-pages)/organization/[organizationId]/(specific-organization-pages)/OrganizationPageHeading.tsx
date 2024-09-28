import { PageHeading } from '@/components/PageHeading';
import { getOrganizationTitle } from '@/data/user/organizations';

export async function OrganizationPageHeading({
  organizationId,
}: {
  organizationId: string;
}) {
  const organizationTitle = await getOrganizationTitle(organizationId);
  console.log('organization title');
  return (
    <PageHeading
      title={organizationTitle}
      titleHref={`/organization/${organizationId}`}
    />
  );
}
