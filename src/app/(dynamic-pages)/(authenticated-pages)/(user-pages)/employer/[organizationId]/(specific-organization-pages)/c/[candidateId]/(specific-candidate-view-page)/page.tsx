'use client';

import { z } from 'zod';
import CandidateDetailsPage from './CandidateDetailsPage';

const paramsSchema = z.object({
  organizationId: z.coerce.string(),
  candidateId: z.coerce.string(),
});

export default function SpecificCandidatePage({ params }: { params: unknown }) {
  const parsedParams = paramsSchema.parse(params);
  const { candidateId } = parsedParams;
  return <CandidateDetailsPage params={{ candidateId }} />;
}
