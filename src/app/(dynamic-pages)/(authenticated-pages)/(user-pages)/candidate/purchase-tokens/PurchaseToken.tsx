// pages/purchase-tokens.tsx

import { CreateTokenPurchaseButton } from '@/components/Token/ActionButtons';
import { Card } from '@/components/ui/card';
import { Product } from '@/types';
import { useEffect, useState } from 'react';

const prods: Product[] = [
  {
    id: 'price_1MxyzABCDEF123456', // Stripe Price ID
    product_type: 'token_bundle',
    title: 'Starter Purchase',
    description: 'Get started with 10 tokens to explore our platform.',
    price: 1.0,
    currency: 'eur',
    status: 'active',
    price_unit_amount: 100,
    pricing_type: 'one-time',
    pricing_plan_interval: 'month',
    pricing_plan_interval_count: 1,
    // metadata: {
    //   unit_amount: '999',
    //   currency: 'usd',
    //   type: 'one_time',
    //   amount: '10', // Number of tokens
    // },
    quantity: 10,
    trial_period_days: null,
    metadata: null,
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
              {/* {product.image && (
                                <img
                                    src={product.image}
                                    alt={product.title}
                                    className="w-full h-32 object-contain mb-4"
                                />
                            )} */}
              <h2 className="text-xl font-semibold mb-2">{product.title}</h2>
              <p className="text-gray-300 mb-4">{product.description}</p>
            </div>
            <div>
              <p className="text-lg font-bold mb-2">
                Price: ${product.price} {product.currency.toUpperCase()}
              </p>
              <p className="mb-4">Tokens Included: {product.quantity}</p>
              <CreateTokenPurchaseButton product={product} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
