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
  signInWithPassword,
  signInWithProvider,
} from '@/data/auth/auth';
import { useSAToastMutation } from '@/hooks/useSAToastMutation';
import { supabaseUserClientComponentClient } from '@/supabase-clients/user/supabaseUserClientComponentClient';
import type { AuthProvider } from '@/types';
import { UserType } from '@/types/userTypes';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export function Login({
  next,
  nextActionType,
  userType,
}: {
  next?: string;
  nextActionType?: string;
  userType: UserType;
}) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const hasRedirectedRef = useRef(false);

  const router = useRouter();

  const redirectToDashboard = useCallback(() => {
    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;

    router.refresh();
    router.replace(next || '/candidate/dashboard');
  }, [next, router]);

  const magicLinkMutation = useSAToastMutation(
    async (email: string) => {
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
      onSuccess: () => {
        setSuccessMessage('A magic link has been sent to your email!');
      },
      successMessage: 'A magic link has been sent to your email!',
    },
  );

  const passwordMutation = useSAToastMutation(
    async ({ email, password }: { email: string; password: string }) => {
      return await signInWithPassword(email, password);
    },
    {
      onSuccess: redirectToDashboard,
      loadingMessage: 'Logging in...',
      errorMessage(error) {
        try {
          if (error instanceof Error) {
            return String(error.message);
          }
          return `Sign in account failed ${String(error)}`;
        } catch (_err) {
          console.warn(_err);
          return 'Sign in account failed';
        }
      },
      successMessage: 'Logged in!',
    },
  );

  const providerMutation = useSAToastMutation(
    async (provider: AuthProvider) => {
      return signInWithProvider(provider, next);
    },
    {
      loadingMessage: 'Opening Google...',
      successMessage: 'Redirecting...',
      errorMessage: 'Failed to login with Google',
      onSuccess: (payload) => {
        window.location.href = payload.data.url;
      },
    },
  );

  const { data: isLoggedIn } = useQuery(
    ['isLoggedInHome'],
    async () => {
      const response = await supabaseUserClientComponentClient.auth.getUser();
      return Boolean(response.data.user?.id);
    },
    {
      initialData: false,
      refetchOnMount: true,
      refetchInterval: false,
      refetchOnWindowFocus: true,
      refetchIntervalInBackground: false,
      cacheTime: 0,
      staleTime: 0,
    },
  );

  useEffect(() => {
    if (isLoggedIn) {
      redirectToDashboard();
    }
  }, [isLoggedIn, redirectToDashboard]);

  return (
    <div
      data-success={successMessage}
      className="mx-auto min-h-[470px] w-full max-w-lg overflow-auto px-3 text-left data-[success]:flex data-[success]:h-full data-[success]:items-center data-[success]:justify-center sm:px-0"
    >
      {successMessage ? (
        <ConfirmationPendingCard
          type={'login'}
          heading={`Confirmation Link Sent`}
          message={successMessage}
          resetSuccessMessage={setSuccessMessage}
        />
      ) : (
        <div className="space-y-5 rounded-lg bg-background p-4 shadow dark:border sm:space-y-6 sm:p-6">
          <header className="space-y-1 text-center">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to create Practices and track your progress.
            </p>
          </header>

          <div className="space-y-4">
            <RenderProviders
              providers={['google']}
              isLoading={providerMutation.isLoading}
              onProviderLoginRequested={providerMutation.mutate}
            />
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span className="whitespace-nowrap">or continue with email</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </div>

          <Tabs defaultValue="password" className="w-full md:min-w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="magic-link">Magic Link</TabsTrigger>
            </TabsList>
            <TabsContent value="password">
              <Card className="border-none shadow-none">
                <CardHeader className="px-0 py-5 sm:py-6">
                  <CardTitle>Login to InterviewGrade</CardTitle>
                  <CardDescription>
                    Login with the account you used to signup.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 p-0">
                  <EmailAndPassword
                    isLoading={passwordMutation.isLoading}
                    signUpUrl="/c/sign-up"
                    loginUrl="/c/login"
                    onSubmit={(data) => {
                      passwordMutation.mutate(data);
                    }}
                    view="sign-in"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="magic-link">
              <Card className="border-none shadow-none">
                <CardHeader className="px-0 py-5 sm:py-6">
                  <CardTitle>Login to InterviewGrade</CardTitle>
                  <CardDescription>
                    Login with a magic link sent to your email.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 p-0">
                  <Email
                    onSubmit={(email) => magicLinkMutation.mutate(email)}
                    isLoading={magicLinkMutation.isLoading}
                    view="sign-in"
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
