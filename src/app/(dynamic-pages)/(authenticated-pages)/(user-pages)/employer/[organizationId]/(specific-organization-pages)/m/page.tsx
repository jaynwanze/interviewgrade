'use client';

import { z } from 'zod';
import MessagesPage from './MessagesPage';

const paramsSchema = z.object({
  conversationId: z.coerce.string(),
});

export default function MessagesRoutePage({ params }: { params: unknown }) {
  const parsedParams = paramsSchema.parse(params);
  const { conversationId } = parsedParams;
  return <MessagesPage conversationId={'1'} />;
}
