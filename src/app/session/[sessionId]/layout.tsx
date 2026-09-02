import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { serverGetOptionalLoggedInUser } from '@/utils/server/serverGetOptionalLoggedInUser';

import './interaction-polish.css';
import './mobile-session-polish.css';
import './desktop-session-glass.css';
import './feedback-checkpoint.css';

export default async function SessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await serverGetOptionalLoggedInUser();
  const destination = user ? '/candidate/dashboard' : '/';
  const label = user ? 'Back to dashboard' : 'Back to InterviewGrade';

  return (
    <div className="session-interaction-shell min-h-screen bg-background">
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 print:hidden">
        <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center px-4 sm:px-6">
          <Button asChild variant="ghost" size="sm" className="-ml-2 gap-2">
            <Link href={destination}>
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}
