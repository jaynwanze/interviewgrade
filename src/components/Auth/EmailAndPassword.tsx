import { Label } from '@/components/ui/label';
import { classNames } from '@/utils/classNames';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';



export const EmailAndPassword = ({
  onSubmit,
  view,
  isLoading,
  signUpUrl,
  loginUrl,
}: {
  onSubmit: (data: { email: string; password: string }) => void;
  view: 'sign-in' | 'sign-up';
  isLoading: boolean;
  signUpUrl: string;
  loginUrl: string;
}) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          email,
          password,
        });
      }}
      data-testid="password-form"
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="email" className="text-muted-foreground">
            Email address
          </Label>
          <div className="mt-1">
            <Input
              id={`${view}-email`}
              name="email"
              type="email"
              disabled={isLoading}
              value={email}
              placeholder="placeholder@email.com"
              onChange={(event) => setEmail(event.target.value)}
              data-strategy="email-password"
              autoComplete={'email'}
              required
              className="block "
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="password" className="text-muted-foreground">
            Password
          </Label>
          <div className="mt-1">
            <Input
              id={`${view}-password`}
              name="password"
              type="password"
              disabled={isLoading}
              value={password}
              placeholder="Type your password"
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={
                view === 'sign-in' ? 'current-password' : 'new-password'
              }
              required
              className="block"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          {view === 'sign-in' ? (
            <div className="text-sm">
              <Link
                href={signUpUrl}
                className="font-medium text-muted-foreground hover:text-foreground"
              >
                Sign up instead?
              </Link>
            </div>
          ) : (
            <div className="text-sm">
              <Link
                href={loginUrl}
                className="font-medium text-muted-foreground hover:text-foreground"
              >
                Login instead?
              </Link>
            </div>
          )}

          {view === 'sign-in' ? (
            <div className="text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-muted-foreground"
              >
                Forgot your password?
              </Link>
            </div>
          ) : null}
        </div>
        <div>
          {isLoading ? (
            <Button
              disabled
              type="submit"
              variant={'default'}
              className={classNames(
                'flex w-full justify-center rounded-lg border border-transparent py-3 text-foreground px-4 text-sm font-medium  shadow-sm',
              )}
            >
              Loading...
            </Button>
          ) : (
            <Button
              type="submit"
              variant={'default'}
              className={classNames(
                'flex w-full justify-center rounded-lg border border-transparent py-2  px-4 text-sm font-medium  shadow-sm',
              )}
            >
              {view === 'sign-in' ? 'Login' : 'Sign up'}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};
