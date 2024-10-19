import { ReactNode } from 'react';
import { z } from 'zod';

export default function Layout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="flex-1px-6 space-y-6 pb-8"> {children} </div>;
}
