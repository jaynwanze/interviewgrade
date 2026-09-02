'use client';;
import { use } from "react";

import { z } from 'zod';
import CandidateDetailsPage from './CandidateDetailsPage';

const paramsSchema = z.object({
  organizationId: z.coerce.string(),
  candidateId: z.coerce.string(),
});

export default function SpecificCandidatePage(props: { params: Promise<unknown> }) {
  const params = use(props.params);
  const parsedParams = paramsSchema.parse(params);
  const { candidateId } = parsedParams;
  return <CandidateDetailsPage candidateId={candidateId} />;
}
