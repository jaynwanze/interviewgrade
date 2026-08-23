'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updatePasswordAction } from '@/data/user/security';
import { useToastMutation } from '@/hooks/useToastMutation';
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
    <div className="max-w-md space-y-3">
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          {...passwordInput}
        />
      </div>
      <Button
        aria-disabled={isLoading}
        type="button"
        onClick={() => {
          updatePassword();
        }}
        variant="outline"
        size="sm"
      >
        {isLoading ? 'Updating...' : 'Update password'}
      </Button>
    </div>
  );
};
