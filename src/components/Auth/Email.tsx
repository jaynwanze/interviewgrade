'use client';
import { T } from '@/components/ui/Typography';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '../ui/button';

export const Email = ({
  onSubmit,
  view,
  isLoading,
  successMessage,
  label = 'Email address',
  defaultValue,
}: {
  onSubmit: (email: string) => void;
  view: 'sign-in' | 'sign-up' | 'update-email' | 'forgot-password';
  isLoading: boolean;
  successMessage?: string | null | undefined;
  label?: string;
  defaultValue?: string;
}) => {
  const [email, setEmail] = useState<string>(defaultValue ?? '');

  const buttonLabelText = useMemo(() => {
    switch (view) {
      case 'sign-in':
        return 'Login with Magic Link';
      case 'sign-up':
        return 'Sign up with Magic Link';
      case 'update-email':
        return 'Update Email';
      case 'forgot-password':
        return 'Reset password';
    }
  }, [view]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(email);
      }}
      data-testid="magic-link-form"
    >
      <div className="space-y-2">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-muted-foreground">
            {label}
          </Label>
          <div>
            <Input
              id={`${view}-email`}
              name="email"
              type="email"
              value={email}
              disabled={isLoading}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete={'email'}
              placeholder="placeholder@email.com"
              required
              className="block"
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          {view === 'forgot-password' ? (
            <div className="text-sm">
              <Link
                href="/e/login"
                className="font-medium text-muted-foreground hover:underline hover:text-foreground"
              >
                Log in instead?
              </Link>
            </div>
          ) : null}
        </div>
        <div>
          <Button className="w-full" type="submit">
            {buttonLabelText}
          </Button>
        </div>
        <div>
          {successMessage ? (
            <T.P className="text-foreground text-center">{successMessage}</T.P>
          ) : null}
        </div>
      </div>
    </form>
  );
};
