'use client';

import logo from '@public/logos/InterviewGrade.png';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';

export function ExternalNavigation() {
  const pathname = usePathname();
  const isHome = pathname ? pathname === '/' : false;

  return (
    <header className="sticky inset-x-0 top-0 z-50 w-full border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <nav
        className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6"
        aria-label="Global"
      >
        <Link href="/" className="flex items-center gap-2 text-foreground">
          <Image src={logo} width={36} height={36} alt="InterviewGrade" className="h-8 w-8" />
          <span className="text-base font-semibold tracking-tight sm:text-lg">
            InterviewGrade
          </span>
        </Link>

        {isHome && (
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/c/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/c/sign-up">Start free</Link>
            </Button>
          </div>
        )}
      </nav>
    </header>
  );
}
