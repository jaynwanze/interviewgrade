'use server';

import { T } from '@/components/ui/Typography';
import { Button } from '@/components/ui/button';
import { getDefaultOrganization } from '@/data/user/organizations';
import { Check } from 'lucide-react';
import { SetDefaultOrganizationButton } from './SetDefaultOrganizationButton';

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <T.H3 className="text-foreground">Default Organization</T.H3>
        <T.Subtle className="text-sm text-muted-foreground max-w-lg">
          If you have multiple organizations, you can set a default
          organization, which will be the organization that you are first taken
          to when you log in.
        </T.Subtle>
      </div>
      {children}
    </div>
  );
}

export async function SetDefaultOrganizationPreference({
  organizationId,
}: {
  organizationId: string;
}) {
  const defaultOrganizationId = await getDefaultOrganization();

  const isDefaultOrganization = defaultOrganizationId === organizationId;
  if (isDefaultOrganization) {
    return (
      <Wrapper>
        <Button className="space-x-2 pointer-events-none select-none">
          <Check className="w-4 h-4 mr-2" />
          <span>This is your default organization</span>
        </Button>
      </Wrapper>
    );
  } else {
    return (
      <Wrapper>
        <SetDefaultOrganizationButton organizationId={organizationId} />
      </Wrapper>
    );
  }
}
