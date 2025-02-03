'use client';
import { retriveStripeCheckoutSessionPurchaseDetails } from '@/data/user/user';
import { StripeCheckoutSessionDetails } from '@/types';
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
  //Latest checkout session details
  console.log(checkoutSessionId);
  useEffect(() => {
    if (!checkoutSessionId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
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
    return <div className="text-center">Loading...</div>;
  }
  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  if (!session) {
    return (
      <div className="text-center text-red-500">
        Error: Unable to fetch purchase details
      </div>
    );
  }

  return (
    <>
      {session && (
        <div className="text-center">
          <h1 className="text-4xl font-bold">Purchase Successful!</h1>
          <p className="text-lg">
            Thank you for your purchase. {session?.customer_details?.name}
          </p>
        </div>
      )}
    </>
  );
}
