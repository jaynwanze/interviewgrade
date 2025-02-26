'use client';

import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="flex-1px-6 min-h-screen space-y-6 pb-8"> {children} </div>
    </div>
  );
}
