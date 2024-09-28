'use client';
import ConfirmationPendingCard from '@/components/Auth/ConfirmationPendingCard';
import { Email } from '@/components/Auth/Email';
import { EmailAndPassword } from '@/components/Auth/EmailAndPassword';
import { RenderProviders } from '@/components/Auth/RenderProviders';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  signInWithMagicLink,
  signInWithProvider,
  signUp,
} from '@/data/auth/auth';
import { useSAToastMutation } from '@/hooks/useSAToastMutation';
import type { AuthProvider } from '@/types';
import { UserType } from '@/types/userTypes';
import { useState } from 'react';

export function SignUp({
  next,
  nextActionType,
  userType,
}: {
  next?: string;
  nextActionType?: string;
  userType: UserType;
}) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendData, setResendData] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const resendMutation = useSAToastMutation(
    async () => {
      if (!resendData) {
        throw new Error('No resend data');
      }
      return await signUp(resendData.email, resendData.password, userType);
    },
    {
      onSuccess: () => {
        setSuccessMessage('A confirmation link has been sent to your email!');
      },
      loadingMessage: 'Resending confirmation link...',
      errorMessage: 'Failed to resend confirmation link',
      successMessage: 'Confirmation link sent!',
    },
  );

  const magicLinkMutation = useSAToastMutation(
    async (email: string) => {
      // since we can't use the onSuccess callback here to redirect from here
      // we pass on the `next` to the signInWithMagicLink function
      // the user gets redirected from their email message
      return await signInWithMagicLink(email, userType, next);
    },
    {
      loadingMessage: 'Sending magic link...',
      errorMessage(error) {
        try {
          if (error instanceof Error) {
            return String(error.message);
          }
          return `Send magic link failed ${String(error)}`;
        } catch (_err) {
          console.warn(_err);
          return 'Send magic link failed ';
        }
      },
      successMessage: 'A magic link has been sent to your email!',
      onSuccess: () => {
        setSuccessMessage('A magic link has been sent to your email!');
      },
    },
  );
  const passwordMutation = useSAToastMutation(
    async ({ email, password }: { email: string; password: string }) => {
      setResendData({ email, password });
      return await signUp(email, password, userType);
    },
    {
      onSuccess: () => {
        setSuccessMessage('A confirmation link has been sent to your email!');
      },
      loadingMessage: 'Creating account...',
      errorMessage(error) {
        try {
          if (error instanceof Error) {
            return String(error.message);
          }
          return `Create account failed ${String(error)}`;
        } catch (_err) {
          console.warn(_err);
          return 'Create account failed ';
        }
      },
      successMessage: 'Account created!',
    },
  );
  const providerMutation = useSAToastMutation(
    async (provider: AuthProvider) => {
      // since we can't use the onSuccess callback here to redirect from here
      // we pass on the `next` to the signInWithProvider function
      // the user gets redirected from the provider redirect callback
      return signInWithProvider(provider, next);
    },
    {
      loadingMessage: 'Requesting login...',
      successMessage: 'Redirecting...',
      errorMessage: 'Failed to login',
      onSuccess: (payload) => {
        window.location.href = payload.data.url;
      },
    },
  );

  return (
    <div
      data-success={successMessage}
      className="container data-[success]:flex items-center data-[success]:justify-center text-left max-w-lg mx-auto overflow-auto data-[success]:h-full min-h-[470px]"
    >
      {successMessage ? (
        <ConfirmationPendingCard
          type={'sign-up'}
          heading={`Confirmation Link Sent`}
          message={successMessage}
          resetSuccessMessage={setSuccessMessage}
          resendEmail={() => {
            resendMutation.mutate();
          }}
        />
      ) : (
        <div className="space-y-8 bg-background p-6 rounded-lg shadow dark:border">
          <Tabs defaultValue="password" className="md:min-w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="magic-link">Magic Link</TabsTrigger>
            </TabsList>

            <TabsContent value="password">
              <Card className="border-none shadow-none">
                <CardHeader className="py-6 px-0">
                  <CardTitle>Register to InterviewGrade</CardTitle>
                  <CardDescription>
                    Create an account with your email and password
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 p-0">
                  <EmailAndPassword
                    isLoading={passwordMutation.isLoading}
                    signUpUrl="/employer/sign-up"
                    loginUrl="/employer/login"
                    onSubmit={(data) => {
                      passwordMutation.mutate(data);
                    }}
                    view="sign-up"
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="magic-link">
              <Card className="border-none shadow-none">
                <CardHeader className="py-6 px-0">
                  <CardTitle>Register to InterviewGrade</CardTitle>
                  <CardDescription>
                    Create an account with magic link we will send to your email
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 p-0">
                  <Email
                    onSubmit={(email) => magicLinkMutation.mutate(email)}
                    isLoading={magicLinkMutation.isLoading}
                    view="sign-up"
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="social-login">
              <Card className="border-none shadow-none">
                <CardHeader className="py-6 px-0">
                  <CardTitle>Register to NextBase</CardTitle>
                  <CardDescription>
                    Register with your social account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 p-0">
                  <RenderProviders
                    providers={['google']}
                    isLoading={providerMutation.isLoading}
                    onProviderLoginRequested={providerMutation.mutate}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
