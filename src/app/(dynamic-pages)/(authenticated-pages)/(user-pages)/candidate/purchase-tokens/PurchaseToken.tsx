import { CreateTokenPurchaseButton } from '@/components/Token/ActionButtons';
import { Card } from '@/components/ui/card';
import { getActiveProductsByType } from '@/data/user/user';
import { Product } from '@/types';
import { useEffect, useState } from 'react';

export default function PurchaseTokens() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'usd':
        return '$';
      case 'eur':
        return '€';
      case 'gbp':
        return '£';
      default:
        return '';
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const activeProducts = await getActiveProductsByType('token_bundle');
        setProducts(activeProducts);
        setProducts(activeProducts);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

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
                Price: {getCurrencySymbol(product.currency.toLowerCase())}
                {product.price}
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
