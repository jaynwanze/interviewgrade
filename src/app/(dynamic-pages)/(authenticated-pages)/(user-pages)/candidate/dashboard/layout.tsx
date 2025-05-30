'use client';

import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1px-6 space-y-6 pb-10 min-h-screen"> {children} </div>
  );
}
