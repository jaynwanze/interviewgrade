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
        style={{ objectFit: 'cover' }}
      // Show on medium screens and up
      />
    </div>
  );
}

function SidebarContent({ userType }: { userType: 'candidate' | 'employer' }) {
  return (
    <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
      <div className="absolute inset-0  " />
      {userType === 'candidate' ? (
        <Image
          src="/mockups/office.jpeg" // Path to your image in the public directory
          alt="User Authentication"
          layout="fill" // Fill the parent container
          objectFit="cover" // Cover the entire area
          quality={100} // Optional: set image quality
        />
      ) : (
        <Image
          src="/mockups/employer_auth.jpg" // Path to your image in the public directory
          alt="User Authentication"
          layout="fill" // Fill the parent container
          objectFit="cover" // Cover the entire area
          quality={100} // Optional: set image quality
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
      <div className="relative z-20 mt-auto">
        <div className="relative">
          <div className="absolute inset-0 bg-white bg-opacity-5 backdrop-blur-md rounded-lg"></div>
          <blockquote className="relative space-y-2 p-4">
            {userType === 'candidate' ? (
              <p className="text-lg">
                {' '}
                “Empowering candidates to excel in their interviews through
                personalized feedback and data-driven insights. At Interview
                Grade, we strive to transform the interview preparation
                experience by providing tailored resources and actionable
                strategies, helping you unlock your full potential and achieve
                your career goals”{' '}
              </p>
            ) : (
              <p className="text-lg">
                {' '}
                “Revolutionizing the hiring process for employers by providing
                access to pool of talented candidates with data-driven insights.
                Interview Grade is committed to helping you make informed hiring
                decisions, ensuring you find the perfect fit for your team and
                organization.”{' '}
              </p>
            )}
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
  userType,
}: {
  children: ReactNode;
  link: string;
  text: string;
  userType: 'candidate' | 'employer';
}) {
  return (
    <>
      <div className=" container relative flex flex-col items-center justify-center h-screen md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <SidebarContent userType={userType} />
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
            {/* <p className="px-8 text-center text-sm text-muted-foreground">
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
            </p> */}
          </div>
        </div>
      </div>
    </>
  );
}
