import { cn } from '@/lib/utils';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import logo from 'public/logos/InterviewGrade.png';
import { ReactNode } from 'react';
import { buttonVariants } from '../ui/button';

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Authentication forms built using the components.',
};

function SidebarContent({ userType }: { userType: 'candidate' | 'employer' }) {
  return (
    <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
      <div className="absolute inset-0" />
      {userType === 'candidate' ? (
        <Image
          src="/mockups/office.jpeg"
          alt="User Authentication"
          layout="fill"
          objectFit="cover"
          quality={100}
        />
      ) : (
        <Image
          src="/mockups/employer_auth.jpg"
          alt="User Authentication"
          layout="fill"
          objectFit="cover"
          quality={100}
        />
      )}
      <div className="relative z-20 flex items-center text-lg font-medium">
        <Image
          width={36}
          src={logo}
          alt="InterviewGrade Logo"
          className="mr-1"
        />{' '}
        InterviewGrade
      </div>
    </div>
  );
}

export function AuthLayout({
  children,
  link,
  text,
  userType,
}: {
  children: ReactNode;
  link: string;
  text: string;
  userType: 'candidate' | 'employer';
}) {
  return (
    <div className="container relative flex h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <SidebarContent userType={userType} />
      <div className="flex-grow lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6">
          <Link
            href={link}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'absolute right-4 top-4 z-30 rounded-full bg-background/80 px-4 shadow-sm backdrop-blur md:right-8 md:top-8',
            )}
          >
            {text}
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
