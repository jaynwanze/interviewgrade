'use client';

import { useTokens } from '@/hooks/useTokens';
import { NormalizedSubscription } from '@/types';
import { ShoppingCartIcon } from '@heroicons/react/solid';
import tokenImg from '@public/images/one_token.svg';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export const Tokens: React.FC = () => {
  const router = useRouter();

  // Use hooks to fetch the user's tokens
  const { data: tokens, isLoading, isError } = useTokens();

  const handleClick = () => {
    router.push('/employer/purchase-tokens');
  };

  if (isLoading) {
    return (
      <div className="text-sm text-gray-600 flex items-center">
        Loading tokens...
      </div>
    );
  }

  if (isError || !tokens) {
    return (
      <div className="text-sm text-red-500 flex items-center">
        Error fetching tokens.
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className="flex items-center gap-2 px-2 rounded-lg cursor-pointer border border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 transition-all"
          data-testid="user-token"
          data-user-id={tokens?.id}
        >
          <span className="font-semibold text-lg">
            {tokens.tokens_available}
          </span>
          <Image
            src={tokenImg}
            alt="Token Icon"
            width={30}
            height={30}
            quality={100}
          />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 p-4 shadow-lg border border-gray-200 dark:border-gray-700 rounded-md">
        <DropdownMenuLabel className="text-lg font-bold">
          Your Token Balance
        </DropdownMenuLabel>
        <Separator className="my-2" />
        <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          <p>
            <span className="font-semibold">Available Tokens:</span>{' '}
            {tokens.tokens_available}
          </p>
          <p>
            <span className="font-semibold">Total Purchased:</span>{' '}
            {tokens.total_tokens_purchased}
          </p>
          <p>
            <span className="font-semibold">Total Used:</span>{' '}
            {tokens.total_tokens_used}
          </p>
          <p>
            <span className="font-semibold">Last Purchase:</span>{' '}
            {tokens.last_token_purchase_date
              ? new Date(tokens.last_token_purchase_date).toLocaleDateString()
              : 'N/A'}
          </p>
        </div>
        <Separator className="my-2" />
        <DropdownMenuItem
          onSelect={handleClick}
          className="cursor-pointer flex items-center justify-center px-3 py-2 bg-primary dark:bg-secondary text-white rounded-lg hover:bg-primary/80 dark:hover:bg-secondary/80 transition-all"
        >
          <ShoppingCartIcon className="h-5 w-5 mr-2" />
          Buy More Tokens
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
