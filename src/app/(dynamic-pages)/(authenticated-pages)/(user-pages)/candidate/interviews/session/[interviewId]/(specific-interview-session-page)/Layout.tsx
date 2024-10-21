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
    <div className="relative flex-1 h-auto mt-6 w-full overflow-auto">
      <nav className="p-4 flex justify-between"></nav>
      <div className="flex-1px-6 space-y-6 pb-8"> {children} </div>
    </div>
  );
}
