'use client';

import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';

export default function Layout({
  children,
  navbar,
}: {
  children: ReactNode;
  navbar: ReactNode;
}) {
  return (
    // move navbar elsehere
    <div>
      <nav className="p-4 flex justify-between">
        <div>
          <Button variant="secondary">
            <a className="font-semibold">Create Custom Interview</a>
          </Button>
        </div>
        <div className="justify-items-stretch">
          <Button variant="secondary">
            <a className="font-semibold">All Interviews</a>
          </Button>
        </div>
      </nav>
      <div className="flex-1px-6 space-y-6 pb-8"> {children} </div>
    </div>
  );
}
