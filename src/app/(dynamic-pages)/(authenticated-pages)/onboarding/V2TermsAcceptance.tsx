'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { acceptTermsOfService } from '@/data/user/user';
import { useSAToastMutation } from '@/hooks/useSAToastMutation';
import { TermsDetailDialog } from './TermsDetailDialog';

export function V2TermsAcceptance({ onSuccess }: { onSuccess: () => void }) {
  const { mutate: acceptTerms, isLoading } = useSAToastMutation(
    async () => acceptTermsOfService(true),
    {
      successMessage: 'Terms accepted!',
      errorMessage: 'Failed to accept terms',
      onSuccess,
    },
  );

  return (
    <Card className="w-full max-w-md border-primary/15 shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome to InterviewGrade</CardTitle>
        <CardDescription className="leading-6">
          Before you continue, review and accept the Terms of Service.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">
          InterviewGrade uses your responses to generate Practice feedback and
          coaching reports. Your Practice targets are private preferences used to
          tailor your experience.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 sm:flex-row">
        <TermsDetailDialog
          isLoading={isLoading}
          onConfirm={acceptTerms}
          userType="candidate"
        />
        <Button
          type="button"
          variant="ghost"
          disabled={isLoading}
          onClick={() => acceptTerms()}
        >
          Accept and continue
        </Button>
      </CardFooter>
    </Card>
  );
}
