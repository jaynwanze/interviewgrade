'use client';

import { InviteOrganizationMemberDialog } from '@/app/(dynamic-pages)/(authenticated-pages)/(user-pages)/employer/[organizationId]/(specific-organization-pages)/settings/members/InviteOrganizationMemberDialog';
import { createInvitationHandler } from '@/data/user/invitation';
import { useSAToastMutation } from '@/hooks/useSAToastMutation';
import type { Enum } from '@/types';

export function InviteUser({ organizationId }: { organizationId: string }) {
  const { mutate, isLoading } = useSAToastMutation(
    async ({
      email,
      role,
    }: {
      email: string;
      role: Enum<'organization_member_role'>;
    }) => {
      return await createInvitationHandler({
        email,
        organizationId,
        role,
      });
    },
    {
      loadingMessage: 'Inviting user...',
      errorMessage(error) {
        try {
          if (error instanceof Error) {
            return String(error.message);
          }
          return `Failed to invite user ${String(error)}`;
        } catch (_err) {
          console.warn(_err);
          return 'Failed to invite user';
        }
      },
      successMessage: 'User invited!',
    },
  );

  return (
    <>
      <InviteOrganizationMemberDialog
        onInvite={(email, role) => {
          mutate({
            email,
            role,
          });
        }}
        isLoading={isLoading}
      />
    </>
  );
}
