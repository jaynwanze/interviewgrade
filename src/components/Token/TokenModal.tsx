'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ShoppingCartIcon } from '@heroicons/react/solid';
import { useRouter } from 'next/navigation';
import React from 'react';

// Define the structure of a token bundle
type TokenBundle = {
  id: string;
  tokens: number;
  price: number; // in USD cents (e.g., 499 for $4.99)
  description: string;
};

// Sample token bundles
const tokenBundles: TokenBundle[] = [
  { id: 'bundle_10', tokens: 10, price: 499, description: 'Get 10 tokens' },
  { id: 'bundle_50', tokens: 50, price: 1999, description: 'Get 50 tokens' },
  { id: 'bundle_100', tokens: 100, price: 3499, description: 'Get 100 tokens' },
];

interface TokenPurchaseModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
}

const TokenPurchaseModal: React.FC<TokenPurchaseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();

  // Function to handle the purchase process
  const handlePurchase = async (bundle: TokenBundle) => {
    try {
      const response = await fetch('/api/create-token-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bundleId: bundle.id }),
      });

      const data = await response.json();

      if (data.url) {
        // Redirect the user to Stripe Checkout
        window.location.href = data.url;
      } else {
        alert('Failed to create checkout session.');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTrigger asChild>
        <Button className="flex items-center">
          <ShoppingCartIcon className="h-5 w-5 mr-2" />
          Buy Tokens
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Purchase Tokens</DialogTitle>
          <DialogDescription>
            Select a token bundle to purchase.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          {tokenBundles.map((bundle) => (
            <div
              key={bundle.id}
              className="flex justify-between items-center p-4 border rounded-lg"
            >
              <div>
                <p className="text-lg font-semibold">{bundle.tokens} Tokens</p>
                <p className="text-sm text-muted-foreground">
                  {bundle.description}
                </p>
              </div>
              <div>
                <p className="text-lg font-semibold">
                  ${(bundle.price / 100).toFixed(2)}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePurchase(bundle)}
                >
                  Buy
                </Button>
              </div>
            </div>
          ))}
        </div>
        <DialogClose asChild>
          <Button variant="ghost" className="mt-4 w-full">
            Close
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default TokenPurchaseModal;
