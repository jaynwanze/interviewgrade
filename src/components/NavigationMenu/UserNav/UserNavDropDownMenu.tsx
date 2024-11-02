'use client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HelpCircle, Lock, LogOut, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { OnboardingModal } from './OnboardingModal';

// TODO: Add valid pics
const applicationFeatures = [
  {
    title: 'Mock Interviews',
    description: (
      <p>
        Conduct realistic, AI-powered mock interviews that simulate real-world
        scenarios. Get personalized questions and responses to help users
        prepare for job interviews effectively. Each mock interview session is
        tailored to improve skills and confidence.
      </p>
    ),
    image: '',
  },
  {
    title: 'Interview History',
    description: (
      <p>
        Track and revisit all past interview sessions in one place. Interview
        history allows users to review previous responses, identify areas for
        improvement, and measure progress over time, helping them better prepare
        for future interviews.
      </p>
    ),
    image: '',
  },
  {
    title: 'Interview Analytics',
    description: (
      <p>
        Gain insights into performance with detailed analytics on interview
        sessions. View metrics like accuracy, response time, and communication
        skills to understand strengths and areas needing improvement, enabling a
        data-driven approach to interview preparation.
      </p>
    ),
    image: '',
  },
  {
    title: 'Interview Feedback',
    description: (
      <p>
        Receive comprehensive feedback after each interview session. Feedback
        includes AI-generated suggestions and benchmarks to help users refine
        their answers and presentation skills, ensuring they’re ready for the
        real interview experience.
      </p>
    ),
    image: '',
  },
  {
    title: 'Job Tracker',
    description: (
      <p>
        Keep track of job applications with the integrated job tracker. Users
        can log job applications, manage interview stages, and monitor their
        progress across different opportunities, making it easier to stay
        organized in the job search process.
      </p>
    ),
    image: '',
  },
];

export function UserNavDropDownMenu({
  avatarUrl,
  userFullname,
  userEmail,
  userId,
}: {
  avatarUrl: string;
  userFullname: string;
  userEmail: string;
  userId: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div
          data-testid="user-nav-avatar"
          data-user-id={userId}
          className="h-[24px] w-[24px] border rounded-full"
        >
          <Image
            src={avatarUrl}
            width={24}
            height={24}
            blurDataURL={avatarUrl}
            quality={100}
            sizes="100vw"
            alt="User avatar"
            className="h-full w-full"
            style={{
              borderRadius: '50%',
            }}
          />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 p-2" sideOffset={10}>
        <div className="w-full p-4 flex gap-2 items-center">
          <div className="h-[28px] w-[28px]  rounded-full border">
            <Image
              src={avatarUrl}
              width={28}
              height={28}
              placeholder="blur"
              blurDataURL={avatarUrl}
              quality={100}
              sizes="100vw"
              alt="User avatar"
              className="h-full w-full"
              objectFit="cover"
              style={{
                borderRadius: '50%',
              }}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium truncate text-foreground">
              {userFullname}
            </span>
            <span className="text-xs truncate text-muted-foreground">
              {userEmail}
            </span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/candidate/settings" className="flex cursor-pointer">
              <User className="mr-2 h-5 w-5" />
              <span>Account settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href="/candidate/settings/security"
              className="flex cursor-pointer"
            >
              <Lock className="mr-2 h-5 w-5" />
              <span>Security Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <OnboardingModal
            featureList={applicationFeatures}
            className="cursor-pointer flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
          >
            <div data-testid="">
              <HelpCircle className="mr-2 h-5 w-5" />
              <span>Help</span>
            </div>
          </OnboardingModal>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/logout" prefetch={false} className="flex cursor-pointer">
            <LogOut className="mr-2 h-5 w-5" />
            <span>Log out</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
