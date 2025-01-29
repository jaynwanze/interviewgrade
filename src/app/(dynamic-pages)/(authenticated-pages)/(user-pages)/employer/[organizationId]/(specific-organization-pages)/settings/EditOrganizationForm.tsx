'use client';
import { Button } from '@/components/Button';
import { T } from '@/components/ui/Typography';
import { Input } from '@/components/ui/input';
// import { updateOrganizationTitle } from '@/data/user/organizations';
import { useToastMutation } from '@/hooks/useToastMutation';
import { classNames } from '@/utils/classNames';
import { useState, useTransition } from 'react';

export function EditOrganizationForm({
  initialTitle,
  organizationId,
}: {
  initialTitle: string;
  organizationId: string;
}) {
  const [pending, startTransition] = useTransition();
  const { mutate, isLoading } = useToastMutation(
    async (organizationTitle: string) => {
      // return await updateOrganizationTitle(organizationId, organizationTitle);
      return 'TO:DO';
    },
    {
      loadingMessage: 'Updating organization title...',
      successMessage: 'Organization title updated!',
      errorMessage: 'Failed to update organization title',
    },
  );
  console.log({ pending, isLoading });

  const [organizationTitle, setOrganizationTitle] =
    useState<string>(initialTitle);
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <T.H4>Edit Organization Title</T.H4>
        <T.P className="text-muted-foreground">
          This is the title that will be displayed on the organization page.
        </T.P>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(() => {
            mutate(organizationTitle);
          });
        }}
        className="space-y-4 max-w-md"
      >
        <Input
          value={organizationTitle}
          type="text"
          name="organization-title"
          id="organization-title"
          onChange={(e) => {
            setOrganizationTitle(e.target.value);
          }}
          className="block "
        />
        <div className="inline-block">
          <Button
            disabled={isLoading}
            type="submit"
            id="update-organization-title-button"
            className={classNames(
              'flex w-full justify-center rounded-lg border border-transparent py-3 px-4 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2',
              'bg-secondary text-foreground hover:bg-secondary/80',
            )}
          >
            {isLoading ? 'Updating...' : 'Update'}
          </Button>
        </div>
      </form>
    </div>
  );
}
