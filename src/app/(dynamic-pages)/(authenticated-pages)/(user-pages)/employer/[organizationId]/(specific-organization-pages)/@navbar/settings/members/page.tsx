import { cn } from '@/utils/cn';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { z } from 'zod';

const paramsSchema = z.object({
  organizationId: z.string(),
});

export default function OrganizationSettingsNavbar({
  params,
}: {
  params: unknown;
}) {
  const { organizationId } = paramsSchema.parse(params);
  return (
    <div className={cn('hidden', 'relative flex gap-2 items-center ')}>
      <Link
        className="flex gap-1.5 py-1.5 px-3 cursor-pointer items-center group rounded-md transition hover:cursor-pointer bg-background hover:bg-secondary"
        href={`/organization/${organizationId}`}
      >
        <ArrowLeftIcon className="w-4 h-4 text-muted-foreground hover:text-foreground" />
        <span className="text-muted-foreground hover:text-foreground group-hover:text-muted-foreground dark:group-hover:text-foreground text-sm font-normal">
          Home
        </span>
      </Link>
      {/* <p className="text-gray-500 dark:text-slate-400  text-sm font-normal">
        /
      </p>
      <p className="text-gray-500 px-2 dark:text-slate-400  text-sm font-normal">
        Settings
      </p>
      <p className="text-gray-500 dark:text-slate-400  text-sm font-normal">
        /
      </p>
      <p className="text-gray-500 px-2 dark:text-slate-400  text-sm font-normal">
        Members
      </p> */}
    </div>
  );
}
