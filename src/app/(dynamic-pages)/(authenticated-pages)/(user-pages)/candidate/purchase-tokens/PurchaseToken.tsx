// pages/purchase-tokens.tsx

import { CreateTokenPurchaseButton } from '@/components/Token/ActionButtons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Product } from '@/types';
import { ShoppingCartIcon } from '@heroicons/react/solid';
import { useEffect, useState } from 'react';

const prods: Product[] = [
    {
        id: 'price_1MxyzABCDEF123456', // Stripe Price ID
        product_type: 'token_bundle',
        title: 'Starter Purchase',
        description: 'Get started with 10 tokens to explore our platform.',
        price: 9.99,
        currency: 'usd',
        status: 'active',
        price_unit_amount: 999,
        type: 'one_time',
        interval: null,
        interval_count: null,
        trial_period_days: null,
        metadata: {
            unit_amount: '999',
            currency: 'usd',
            type: 'one_time',
            amount: '10', // Number of tokens
        },
        quantity: 10, // Number of tokens included in the bundle
        image: 'https://example.com/images/starter-pack.png', // Optional product image URL
    },
    {
        id: 'price_1MxyzABCDEF789012', // Stripe Price ID
        product_type: 'token_bundle',
        title: 'Pro Purchase',
        description: 'Become a Pro and unlock 100 tokens.',
        price: 49.99, // Human-readable price in USD
        currency: 'usd',
        status: 'active',
        price_unit_amount: 4999, // Price in cents ($49.99)
        type: 'one_time', // 'recurring' for subscription-based products
        interval: null, // Not applicable for one-time purchases
        interval_count: null, // Not applicable for one-time purchases
        trial_period_days: null, // No trial for one-time purchases
        metadata: {
            unit_amount: '4999',
            currency: 'usd',
            type: 'recurring',
            interval: 'month',
            interval_count: '1',
            trial_period_days: '14',
            amount: '100', // Number of tokens per billing cycle
        },
        quantity: 100, // Number of tokens included per billing cycle
        image: 'https://example.com/images/pro-subscription.png', // Optional product image URL
    },
    {
        id: 'price_1MxyzABCDEF345678', // Stripe Price ID
        product_type: 'token_bundle',
        title: 'Mega Purchase',
        description: 'Purchases a mega amount of tokens.',
        price: 199.99, // Human-readable price in USD
        currency: 'usd',
        status: 'active',
        price_unit_amount: 19999, // Price in cents ($199.99)
        type: 'recurring', // 'recurring' for subscription-based products
        interval: null, // Not applicable for one-time purchases
        interval_count: null, // Not applicable for one-time purchases
        trial_period_days: null, // No trial for one-time purchases
        metadata: {
            unit_amount: '19999',
            currency: 'usd',
            type: 'recurring',
            interval: 'year',
            interval_count: '1',
            trial_period_days: '30',
            amount: 'Unlimited', // Represents unlimited tokens
        },
        quantity: 100000, // Use null or a special value to denote unlimited tokens
        image: 'https://example.com/images/enterprise-plan.png', // Optional product image URL
    },
];

export default function PurchaseTokens() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // const activeProducts = await getActiveProducts();
                // setProducts(activeProducts);
                setProducts(prods);
            } catch (err) {
                console.error('Error fetching products:', err);
                setError('Failed to load products');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const handlePurchase = async (productId: string) => {
        try {
            // Assuming you have user context or authentication
            //   const response = await fetch('/api/create-token-checkout-session', {
            //     method: 'POST',
            //     headers: {
            //       'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify({ priceId: productId }),
            //   });
            //   const data = await response.json();
            //   if (data.url) {
            //     const stripe = await getStripe();
            //     stripe?.redirectToCheckout({ sessionId: data.sessionId });
            //   } else {
            //     throw new Error('No URL returned from server.');
            //   }
        } catch (err) {
            console.error('Error during purchase:', err);
            alert('Failed to initiate purchase. Please try again.');
        }
    };

    if (loading) {
        return <div className="text-center text-white">Loading Products...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500">Error: {error}</div>;
    }

    return (
        <div className="min-h-screen py-10">
            <h1 className="text-3xl font-bold text-center mb-4">Purchase Tokens</h1>
            <p className="text-center text-gray-300 mb-8">
                Choose a token bundle to make a one time payment.
            </p>
            <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                    <Card
                        key={product.id}
                        className="rounded-lg p-6 flex flex-col justify-between"
                    >
                        <div>
                            {product.image && (
                                <img
                                    src={product.image}
                                    alt={product.title}
                                    className="w-full h-32 object-contain mb-4"
                                />
                            )}
                            <h2 className="text-xl font-semibold mb-2">{product.title}</h2>
                            <p className="text-gray-300 mb-4">{product.description}</p>
                        </div>
                        <div>
                            <p className="text-lg font-bold mb-2">
                                Price: ${product.price} {product.currency.toUpperCase()}
                            </p>
                            <p className="mb-4">Tokens Included: {product.quantity}</p>
                            <CreateTokenPurchaseButton
                                product={product}
                            />
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
