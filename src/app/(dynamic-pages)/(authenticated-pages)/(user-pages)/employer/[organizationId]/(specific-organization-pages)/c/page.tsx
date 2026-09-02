'use client';;
import { use } from "react";

import { z } from 'zod';
import CandidatesListPage from './CandidatesListPage';

const paramsSchema = z.object({
  organizationId: z.coerce.string(),
});

export default function CandidatesPage(props: { params: Promise<unknown> }) {
  const params = use(props.params);
  const parsedParams = paramsSchema.parse(params);
  const { organizationId } = parsedParams;
  return <CandidatesListPage organizationId={organizationId} />;
}
