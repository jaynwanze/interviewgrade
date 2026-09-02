'use client';;
import { use } from "react";

import { z } from 'zod';
import PurchaseTokens from './PurchaseToken';
const paramsSchema = z.object({
  organizationId: z.coerce.string(),
});

export default function PurchaseTokenPage(props: { params: Promise<unknown> }) {
  const params = use(props.params);
  const parsedParams = paramsSchema.parse(params);
  const { organizationId } = parsedParams;
  return <PurchaseTokens organizationId={organizationId} />;
}
