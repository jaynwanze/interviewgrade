// https://github.com/vercel/next.js/issues/58272
import { T } from '@/components/ui/Typography';
import { Badge } from '@/components/ui/badge';
import { getOrganizationTitle } from '@/data/user/organizations';
import { UsersRound } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { z } from 'zod';

const paramsSchema = z.object({
  organizationId: z.string(),
});

export async function generateMetadata({ params }: { params: unknown }) {
  const parsedParams = paramsSchema.parse(params);
  const { organizationId } = parsedParams;
  const organizationTitle = await getOrganizationTitle(organizationId);

  return {
    title: `${organizationTitle} | Organization | InterviewGrade`,
    description: 'Organization title',
  };
}

async function Title({ organizationId }: { organizationId: string }) {
  const title = await getOrganizationTitle(organizationId);
  // className="gap-2 ring-0 bg-purple-50 rounded-full dark:bg-slate-800 text-purple-600 font-medium dark:text-slate-400"

  return (
    <div className="flex items-center gap-2">
      <UsersRound className="w-4 h-4" />
      <T.P>{title}</T.P>
      <Badge variant="outline" className="hidden lg:inline-flex">
        Organization
      </Badge>
    </div>
  );
}

export default async function OrganizationNavbar({
  params,
}: {
  params: unknown;
}) {
  const { organizationId } = paramsSchema.parse(params);
  return (
    <div className="flex items-center">
      <Link href={`/organization/${organizationId}`}>
        <span className="space-x-2 flex items-center">
          <Suspense fallback={<span>Loading...</span>}>
            <Title organizationId={organizationId} />
          </Suspense>
        </span>
      </Link>
    </div>
  );
}
