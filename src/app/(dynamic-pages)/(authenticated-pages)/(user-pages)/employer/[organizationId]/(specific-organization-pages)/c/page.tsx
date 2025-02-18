'use client';

import { z } from 'zod';
import CandidatesListPage from './CandidatesListPage';

const paramsSchema = z.object({
    organizationId: z.coerce.string(),
});

export default function CandidatesPage({ params }: { params: unknown }) {
    const parsedParams = paramsSchema.parse(params);
    const { organizationId } = parsedParams;
    return <CandidatesListPage organizationId={organizationId} />;
};

