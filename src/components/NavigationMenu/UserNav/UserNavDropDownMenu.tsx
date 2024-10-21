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

const onboardingFeatures = [
  {
    title: 'Organisations, Teams and Invitations',
    description: (
      <p>
        Organisations, team members and team invitations is built-in. This means
        that your next SAAS project will allow your customers to manage
        organisations right off the bat. InterviewGrade comes with Supabase
        configured with all the necessary tables to manage members of an
        organization. Every organization also has it's own Stripe plan.
      </p>
    ),
    image: '/assets/login-asset-dashboard.png',
  },
  {
    title: 'User Authentication built in',
    description: (
      <p>
        Start building your app with InterviewGrade and you'll get a
        full-featured authentication system, out of the box. More than 15
        authentication providers such as Google, GitHub, Twitter, Facebook,
        Apple, Discord etc are supported.
      </p>
    ),
    image: '/assets/onboardingFeatures/authentication.png',
  },
  {
    title: 'Admin Panel',
    description: (
      <p>
        Admin Panel is built in. This means that you can manage a secret area
        within your app where you can manage users and organizations, etc.
      </p>
    ),
    image: '/assets/onboardingFeatures/adminPanel.png',
  },
  {
    title: 'Next.js 13, Supabase and Typescript',
    description: (
      <p>
        You get all of the latest features and performance improvements that
        come with Next.js 13. These include the new Image component, built-in
        TypeScript support, the new app folder, layouts, server components and
        more! Your frontend will automatically update types and keep the project
        in sync when you update Supabase tables.
      </p>
    ),
    image: '/assets/onboardingFeatures/nextjs-type-supa.png',
  },
  {
    title: 'Incredible performance with layouts, server components',
    description: (
      <p>
        InterviewGrade offers world-class features such as app folder, layouts,
        server components, and server-side rendering to optimize data fetching
        and provide the best user experience. Layouts such as authenticated
        layout, external page layout, login layout, application admin layout
        authenticated, external, login, and admin are pre-configured.
      </p>
    ),
    image: '/assets/onboardingFeatures/layout.png',
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
            <Link href="/settings" className="flex cursor-pointer">
              <User className="mr-2 h-5 w-5" />
              <span>Account settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings/security" className="flex cursor-pointer">
              <Lock className="mr-2 h-5 w-5" />
              <span>Security Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <OnboardingModal
            featureList={onboardingFeatures}
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
