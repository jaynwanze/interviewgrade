'use client';
import { ReactNode } from 'react';

export default async function Layout({
  children,
  navbar,
}: {
  children: ReactNode;
  navbar: ReactNode;
}) {
  return <div className="flex-1px-6 space-y-6 pb-8"> {children} </div>;
}
