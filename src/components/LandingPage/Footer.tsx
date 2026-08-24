import logo from '@public/logos/InterviewGrade.png';
import Image from 'next/image';
import Link from 'next/link';

import { footerItems, footerSocialItems } from './footer-items';

export function Footer() {
  return (
    <footer className="border-t border-border/70 bg-secondary/30 text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2">
              <Image src={logo} alt="InterviewGrade" className="h-8 w-8" />
              <span className="text-lg font-semibold">InterviewGrade</span>
            </Link>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              AI-powered interview Practice with structured feedback and reports.
              Dublin, Ireland.
            </p>
          </div>

          <div className="flex flex-wrap gap-10 sm:gap-14">
            {footerItems.map((item) => (
              <div key={item.title}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {item.title}
                </h3>
                <ul className="mt-4 space-y-3 text-sm">
                  {item.items.map((link) => (
                    <li key={link.name}>
                      <Link href={link.url} className="text-muted-foreground transition-colors hover:text-foreground">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-5 border-t border-border/70 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 InterviewGrade Limited. All rights reserved.</p>
          <div className="flex items-center gap-5">
            {footerSocialItems.map((item) => (
              <Link
                key={item.name}
                href={item.url}
                aria-label={item.name}
                className="transition-colors hover:text-foreground"
              >
                <item.icon />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
