import Link from 'next/link';

type SidebarLinkProps = {
  label: string;
  href: string;
  icon: JSX.Element;
};

export function SidebarLink({ label, href, icon }: SidebarLinkProps) {
  return (
    <div
      key={href}
      className="text-muted-foreground hover:cursor-pointer rounded-md hover:bg-secondary group w-full flex items-center"
    >
      <div className="p-2 group-hover:text-muted-foreground">{icon}</div>
      <Link
        className="p-2 w-full text-sm group-hover:text-foreground"
        href={href}
      >
        {label}
      </Link>
    </div>
  );
}
