import { T } from '@/components/ui/Typography';
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
    <div className={cn('hidden lg:block', 'relative ')}>
      <T.P className="my-0">
        <Link href={`/organization/${organizationId}`}>
          <span className="space-x-2 flex items-center">
            <ArrowLeftIcon />
            <span>Home</span>
          </span>
        </Link>
      </T.P>
    </div>
  );
}
