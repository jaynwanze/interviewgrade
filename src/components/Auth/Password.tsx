'use client';
import { T } from '@/components/ui/Typography';
import { Label } from '@/components/ui/label';
import { classNames } from '@/utils/classNames';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export const Password = ({
  onSubmit,
  isLoading,
  successMessage,
  label = 'Password',
  buttonLabel = 'Update',
}: {
  onSubmit: (password: string) => void;
  isLoading: boolean;
  successMessage?: string;
  label?: string;
  buttonLabel?: string;
}) => {
  const [password, setPassword] = useState<string>('');

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(password);
      }}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-muted-foreground">
            {label}
          </Label>
          <div>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              disabled={isLoading}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="email"
              required
              className="block"
            />
          </div>
        </div>
        <div>
          <Button
            disabled={isLoading}
            type="submit"
            variant={'default'}
            className={classNames(
              'flex w-full justify-center rounded-lg border border-transparent py-2 text-foreground px-4 text-sm font-medium  shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2',
            )}
          >
            {isLoading ? 'Loading...' : buttonLabel}
          </Button>
        </div>
        <div>
          {successMessage ? (
            <T.P className="text-sm text-foreground text-center">
              {successMessage}
            </T.P>
          ) : null}
        </div>
      </div>
    </form>
  );
};
