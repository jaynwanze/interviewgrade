'use client';

import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import acmeLightLogo from '@public/logos/acme-logo-dark.png';
import acmeDarkLogo from '@public/logos/acme-logo-light.png';
import { Menu } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export function ExternalNavigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isHome = pathname ? pathname === '/' : false;

  return (
    <header className="sticky inset-x-0 w-full top-0 bg-background  z-50 border-b border-border backdrop-blur">
      <div className="inset-0" onClick={() => setMobileMenuOpen(false)} />
      <nav
        className="flex items-center w-full h-[54px] md:container justify-between px-6 md:px-8"
        aria-label="Global"
      >
        <div className="flex space-x-8">
          <Link href="/" className="font-bold text-xl ">
            <div className="relative flex space-x-2 w-10 h-10 md:w-fit items-center justify-center text-foreground dark:-ml-4 -ml-2">
              <Image
                src={acmeLightLogo}
                width={40}
                height={40}
                alt="logo"
                className="dark:hidden block h-8 w-8"
              />
              <Image
                src={acmeDarkLogo}
                width={40}
                height={40}
                alt="logo"
                className="hidden dark:block h-8 w-8"
              />
              <span className="hidden font-bold lg:inline-block">
                InterviewGrade
              </span>
            </div>
          </Link>
        </div>
        <div className="flex space-x-10 items-center lg:-mr-2">
          <ThemeToggle />
          {isHome && (
            <div className="ml-6 hidden lg:block space-x-2">
              {/* <Link href="/candidate/login">
                <Button variant="default" size="default" className="group">
                  Log In
                  <svg
                    className="ml-2 -mr-1 w-5 h-5 group-hover:translate-x-1 transition"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Button>
              </Link> */}
            </div>
          )}
        </div>
        {/* <Menu
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="hover:cursor-pointer lg:hidden -mr-2"
        /> */}
      </nav>
      {mobileMenuOpen && (
        <ul className="md:hidden w-full shadow-2xl py-2 flex flex-col items-start font-medium pb-2">
          <hr className="w-full h-2" />
          <div className="flex flex-col items-start w-full space-y-4 ">
            <div className="w-full flex justify-center p-4">
              {/* Updated width to match Log In button */}
            </div>
            {/* <Link href="/candidate/login" className="px-4 w-full">
              <Button variant="default" size="default" className="group w-full">
                Log In
                <svg
                  className="ml-2 -mr-1 w-5 h-5 group-hover:translate-x-1 transition"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </Button>
            </Link> */}
          </div>
        </ul>
      )}
    </header>
  );
}
