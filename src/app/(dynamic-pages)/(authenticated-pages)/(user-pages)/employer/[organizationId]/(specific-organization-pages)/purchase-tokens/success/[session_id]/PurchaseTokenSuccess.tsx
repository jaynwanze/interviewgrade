'use client';

import { Button } from '@/components/ui/button';
import { retriveStripeCheckoutSessionPurchaseDetails } from '@/data/user/employee';
import { StripeCheckoutSessionDetails } from '@/types';
import { CheckCircleIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function PurchaseTokensSuccess({
  checkoutSessionId,
}: {
  checkoutSessionId: string;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<StripeCheckoutSessionDetails | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!checkoutSessionId) {
      setIsLoading(false);
      return;
    }

    const fetchCheckoutSession = async () => {
      try {
        const sessionDetails =
          await retriveStripeCheckoutSessionPurchaseDetails(checkoutSessionId);
        setSession(sessionDetails);
      } catch (err) {
        console.error('Error fetching checkout session:', err);
        setError('Failed to load purchase details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCheckoutSession();
  }, [checkoutSessionId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <p className="text-muted-foreground">
          Loading your purchase details...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 mt-10">
        <p>{error}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center text-red-500 mt-10">
        <p>Unable to fetch your purchase session.</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh]  px-4">
      <div className="border shadow-md rounded-2xl p-8 max-w-md w-full text-center">
        <CheckCircleIcon className="text-green-500 mx-auto h-16 w-16 animate-pulse" />
        <h1 className="text-3xl font-semibold mt-4">
          Thank You For Your Purchase!
        </h1>
        <p className="font-medium">Quantity:</p>
        <p className="text-lg font-bold">
          {session?.product?.price
              ? `${(session.product.quantity).toFixed(2)}`
              : 'N/A'}
        </p>

        <div className="my-6 text-sm">
          <p className="font-medium">Amount Paid:</p>
          <p className="text-lg font-bold">
            {session?.product?.price
              ? `€${(session.product.price/100).toFixed(2)}`
              : 'N/A'}
          </p>
        </div>
        <Link href="/employer">
          <Button variant="default" className="w-full">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
