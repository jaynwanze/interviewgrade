'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TabProps } from './types';

export const Tab = ({ label, href, icon }: TabProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  const baseClassNames =
    'flex items-center space-x-2 whitespace-nowrap border-b-2 px-1 py-3.5 text-sm font-medium transition-colors';
  const modifierClasses = isActive
    ? 'border-foreground text-foreground'
    : 'border-transparent text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground';
  const className = `${baseClassNames} ${modifierClasses}`;

  return (
    <Link href={href} className={className}>
      {icon}
      <span>{label}</span>
    </Link>
  );
};
