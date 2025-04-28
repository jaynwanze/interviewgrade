'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updatePasswordAction } from '@/data/user/security';
import { useToastMutation } from '@/hooks/useToastMutation';
import { classNames } from '@/utils/classNames';
import { useInput } from 'rooks';

export const UpdatePassword = () => {
  const passwordInput = useInput('');
  const { mutate: updatePassword, isLoading } = useToastMutation(
    async () => {
      await updatePasswordAction(passwordInput.value);
    },
    {
      loadingMessage: 'Updating password...',
      successMessage: 'Password updated!',
      errorMessage: 'Failed to update password',
    },
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-muted-foreground">
          Password
        </Label>
        <div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="password"
            required
            {...passwordInput}
            className="block"
          />
        </div>
        <Button
          aria-disabled={isLoading}
          type="button"
          onClick={() => {
            updatePassword();
          }}
          variant={'default'}
          className={classNames('flex w-full justify-center')}
        >
          {isLoading ? 'Updating...' : 'Update Password'}
        </Button>
      </div>
    </div>
  );
};
