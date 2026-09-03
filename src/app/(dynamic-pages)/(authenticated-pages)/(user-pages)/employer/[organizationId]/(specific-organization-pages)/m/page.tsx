'use client';;
import { use } from "react";

import { z } from 'zod';
import MessagesPage from './MessagesPage';

const paramsSchema = z.object({
  conversationId: z.coerce.string(),
});

export default function MessagesRoutePage(props: { params: Promise<unknown> }) {
  const params = use(props.params);
  const parsedParams = paramsSchema.parse(params);
  const { conversationId } = parsedParams;
  return <MessagesPage conversationId={conversationId} />;
}
