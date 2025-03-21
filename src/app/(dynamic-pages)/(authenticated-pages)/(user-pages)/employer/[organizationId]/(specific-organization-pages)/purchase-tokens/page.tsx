'use client';

import { z } from 'zod';
import PurchaseTokens from './PurchaseToken';
const paramsSchema = z.object({
  organizationId: z.coerce.string(),
});


export default function PurchaseTokenPage( { params }: { params: unknown; }) {
  const parsedParams = paramsSchema.parse(params);
  const { organizationId } = parsedParams;
  return <PurchaseTokens organizationId= {organizationId} />;
}
