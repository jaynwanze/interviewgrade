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

const applicationFeatures = [
  {
    title: 'Create a Practice',
    description: (
      <p>
        Build an editable Practice with AI, turn a PDF or TXT document into one,
        or start manually with your own questions and rubric.
      </p>
    ),
    href: '/candidate/practices/new',
    actionLabel: 'Create a Practice',
  },
  {
    title: 'Practise with Avery',
    description: (
      <p>
        Open a published Practice, listen to each question, record your answer,
        and move through the session at your own pace.
      </p>
    ),
    href: '/candidate/practices',
    actionLabel: 'View My Practices',
  },
  {
    title: 'Feedback and reports',
    description: (
      <p>
        Answers are evaluated against the Practice rubric. After the session,
        review your score, strengths, improvements, and response-by-response feedback.
      </p>
    ),
    href: '/candidate/interview-history',
    actionLabel: 'Open History',
  },
  {
    title: 'Plan and usage',
    description: (
      <p>
        Free includes 3 AI Practice runs and 3 AI-created Practices each month.
        Pro raises both monthly allowances to 30.
      </p>
    ),
    href: '/candidate/settings/billing',
    actionLabel: 'View Plan & Usage',
  },
];

export function UserNavDropDownMenu({
  avatarUrl,
  userFullname,
  userEmail,
  userId,
  userType,
}: {
  avatarUrl: string;
  userFullname: string;
  userEmail: string;
  userId: string;
  userType: string;
}) {
  void userType;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div
          data-testid="user-nav-avatar"
          data-user-id={userId}
          className="h-[24px] w-[24px] rounded-full border focus:ring-0"
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
            style={{ borderRadius: '50%' }}
          />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 p-2" sideOffset={10}>
        <div className="flex w-full items-center gap-2 p-4">
          <div className="h-[28px] w-[28px] rounded-full border">
            <Image
              src={avatarUrl}
              width={28}
              height={28}
              placeholder="blur"
              blurDataURL={avatarUrl}
              quality={100}
              sizes="100vw"
              alt="User avatar"
              className="h-full w-full object-cover"
              style={{ borderRadius: '50%' }}
            />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {userFullname}
            </span>
            <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
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
            <Link href="/candidate/settings/security" className="flex cursor-pointer">
              <Lock className="mr-2 h-5 w-5" />
              <span>Security settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <OnboardingModal
            featureList={applicationFeatures}
            className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
          >
            <div>
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
