import { cn } from '@/lib/utils';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ReactNode } from 'react';
import { buttonVariants } from '../ui/button';

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Authentication forms built using the components.',
};

//<Link href="/examples/authentication"
//    className={cn(buttonVariants({ variant: "ghost" }),
//        "absolute right-4 top-4 md:right-8 md:top-8")} >
//    Create a Employer or Candidate account
//                </Link>

function AuthImages() {
  return (
    <div className="md:hidden">
      <Image
        src="/mockups/office.jpeg" // Path to your image in the public directory
        alt="User Authentication"
        width={1280} // Set appropriate width
        height={843} // Set appropriate height
        // Show on medium screens and up
      />
    </div>
  );
}

function SidebarContent() {
  return (
    <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
      <div className="absolute inset-0  " />
      <Image
        src="/mockups/office.jpeg" // Path to your image in the public directory
        alt="User Authentication"
        layout="fill" // Fill the parent container
        objectFit="cover" // Cover the entire area
        quality={100} // Optional: set image quality
      />
      <div className="relative z-20 flex items-center text-lg font-medium">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2 h-6 w-6"
        >
          <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
        </svg>{' '}
        InterviewGrade
      </div>
      <div className="relative z-20 mt-auto">
        <div className="relative">
          <div className="absolute inset-0 bg-white bg-opacity-5 backdrop-blur-md rounded-lg"></div>
          <blockquote className="relative space-y-2 p-4">
            <p className="text-lg">
              {' '}
              “Empowering candidates to excel in their interviews through
              personalized feedback and data-driven insights. At Interview
              Grade, we strive to transform the interview preparation experience
              by providing tailored resources and actionable strategies, helping
              you unlock your full potential and achieve your career goals”{' '}
            </p>
          </blockquote>
        </div>
      </div>
    </div>
  );
}

export function AuthLayout({
  children,
  link,
  text,
}: {
  children: ReactNode;
  link: string;
  text: string;
}) {
  return (
    <>
      <div className=" container relative flex flex-col items-center justify-center h-screen md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <SidebarContent />
        <div className="lg:p-8 flex-grow">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 ">
            <Link
              href={link}
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'md:absolute md:right-8 md:top-8 block right-4 top-4',
              )}
            >
              {text}
            </Link>

            {children}
            <p className="px-8 text-center text-sm text-muted-foreground">
              By clicking continue, you agree to our{' '}
              <Link
                href="/terms"
                className="underline underline-offset-4 hover:text-primary"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-primary"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
