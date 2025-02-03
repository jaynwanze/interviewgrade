'use client';

import { Button } from '@/components/ui/button';
import { createCandidateCheckoutSessionAction } from '@/data/user/user';
import { useToastMutation } from '@/hooks/useToastMutation';
import { Product } from '@/types';
import { getStripe } from '@/utils/stripe-client';
import { ShoppingCartIcon } from '@heroicons/react/solid';

export function CreateTokenPurchaseButton({ product }: { product: Product }) {
    const { mutate, isLoading } = useToastMutation(
        async () => {
            return await createCandidateCheckoutSessionAction({
                product: product,
                isTrial: false,
                isTokenBundlePurchase: true,
            });
        },
        {
            loadingMessage: 'Please wait...',
            errorMessage: 'Failed to purchase tokens',
            successMessage: 'Redirecting...',
            onSuccess: async (sessionId) => {
                const stripe = await getStripe();
                if (sessionId) {
                    stripe?.redirectToCheckout({ sessionId });
                } else {
                    console.error('Session ID is undefined');
                }
            },
        },
    );

    return (
        <Button
            variant="default"
            className="w-full flex items-center justify-center"
            onClick={() => {
                mutate();
            }}
        >
            {isLoading ? (
                'Loading...'
            ) : (
                <>
                    <ShoppingCartIcon className="h-5 w-5 mr-2" />
                    Purchase
                </>
            )}
        </Button>
    );
}
