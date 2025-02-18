'use client';

import { useEffect, useState } from 'react';
import { z } from 'zod';
import PurchaseTokenSuccess from './PurchaseTokenSuccess';
const paramsSchema = z.object({
  session_id: z.string().nonempty(),
});

export default function PurchaseTokenSuccessPage({
  params,
}: {
  params: { session_id: string };
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutSessionId, setCheckoutSessionId] = useState<string>('');

  useEffect(() => {
    setIsLoading(true);
    try {
      const parsedParams = paramsSchema.parse(params);
      setCheckoutSessionId(parsedParams.session_id);
    } catch (error) {
      console.error('Invalid parameters:', error);
      setError('Invalid parameters');
    } finally {
      setIsLoading(false);
    }
  }, [params]);
  if (isLoading) {
    return <div className="text-center text-white">Loading...</div>;
  }
  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }
  return <PurchaseTokenSuccess checkoutSessionId={checkoutSessionId} />;
}
