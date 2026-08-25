import { KeyRound, ShieldCheck } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import { UpdateEmail } from './UpdateEmail';
import { UpdatePassword } from './UpdatePassword';

function providerLabel(provider: string) {
  switch (provider) {
    case 'google':
      return 'Google';
    case 'email':
      return 'Email & password';
    default:
      return provider.charAt(0).toUpperCase() + provider.slice(1);
  }
}

export default async function SecuritySettings() {
  const user = await serverGetLoggedInUser();
  const providerMetadata = user.app_metadata?.providers;
  const providers = Array.isArray(providerMetadata)
    ? providerMetadata.filter(
        (provider): provider is string => typeof provider === 'string',
      )
    : typeof user.app_metadata?.provider === 'string'
      ? [user.app_metadata.provider]
      : [];

  // Older Supabase accounts may not expose a providers array even though they
  // use password auth. Preserve the existing password control in that case.
  const supportsPassword = providers.length === 0 || providers.includes('email');
  const visibleProviders = providers.length > 0 ? providers : ['email'];

  return (
    <div className="w-full max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-muted p-2.5">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <CardTitle>Sign-in security</CardTitle>
              <CardDescription>
                Review how you sign in and keep your account email up to date.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="text-sm font-medium">Sign-in methods</div>
            <div className="flex flex-wrap gap-2">
              {visibleProviders.map((provider) => (
                <span
                  key={provider}
                  className="rounded-full border bg-muted/30 px-3 py-1 text-xs font-medium"
                >
                  {providerLabel(provider)}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t pt-6">
            <UpdateEmail initialEmail={user.email} />
            <p className="mt-2 max-w-md text-xs leading-5 text-muted-foreground">
              Changing your email may require confirmation before the new address
              becomes active.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-muted p-2.5">
              <KeyRound className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <CardTitle>Password</CardTitle>
              <CardDescription>
                {supportsPassword
                  ? 'Set a new password for email sign-in.'
                  : 'Your current sign-in provider manages authentication for this account.'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {supportsPassword ? (
            <UpdatePassword />
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              No InterviewGrade password is currently required for your connected
              sign-in method.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
