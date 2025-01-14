'use client';

import { Button } from '@/components/ui/button';
import { NormalizedSubscription, Token } from '@/types';
import { ShoppingCartIcon } from '@heroicons/react/solid';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';

export const Tokens: React.FC = () => {
    const [tokens, setTokens] = useState<Token | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [subscription, setSubscription] =
        useState<NormalizedSubscription | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const router = useRouter();

    const handleClick = () => {
        router.push('/candidate/purchase-tokens');
    };
    const fetchTokens = async () => {
        try {
            //const response = await fetch('/api/tokens');
            //setTokens(data);
        } catch (err) {
            console.error('Error fetching tokens:', err);
            setError('Failed to load tokens');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTokens();
    }, []);

    if (loading) {
        return <div className="text-white">Loading Tokens...</div>;
    }

    if (error) {
        return <div className="text-red-500">Error: {error}</div>;
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center">
                        {/* Token Icon */}
                        {/* <Image
                        src="/token-icon.png"
                        alt="Token Icon"
                        width={24}
                        height={24}
                    /> */}
                        {/* Available Tokens */}
                        <span className="ml-2">Tokens: {tokens?.tokens_available}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80">
                    <DropdownMenuLabel className="font-semibold">
                        Your Tokens
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="px-4 py-2">
                        <p className="text-sm">
                            <span className="font-medium">Available Tokens:</span>{' '}
                            {tokens?.tokens_available}
                        </p>
                        <p className="text-sm">
                            <span className="font-medium">Total Tokens Purchased:</span>{' '}
                            {tokens?.total_tokens_purchased}
                        </p>
                        <p className="text-sm">
                            <span className="font-medium">Total Tokens Used:</span>{' '}
                            {tokens?.total_tokens_used}
                        </p>
                        <p className="text-sm">
                            <span className="font-medium">Last Purchase Date:</span>{' '}
                            {tokens?.last_token_purchase_date
                                ? new Date(tokens.last_token_purchase_date).toLocaleString()
                                : 'N/A'}
                        </p>
                        <hr className="my-2" />
                        <p className="text-sm">
                            <span className="font-medium">Subscription:</span>{' '}
                            {subscription ? subscription.type : 'No Subscription'}
                        </p>
                        {subscription && subscription.type !== 'no-subscription' && (
                            <>
                                <p className="text-sm">
                                    <span className="font-medium">Tier:</span>{' '}
                                    {subscription.product.title}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium">Description:</span>{' '}
                                    {subscription.product.description}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium">Sidenote:</span>{' '}
                                    {subscription.type === 'trialing'
                                        ? subscription.subscription.sidenote
                                        : ''}
                                </p>
                            </>
                        )}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onSelect={handleClick}
                        className="cursor-pointer flex items-center justify-center btn-primary"
                    >
                        <ShoppingCartIcon className="h-5 w-5 mr-2" />
                        Buy More Tokens
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
};
