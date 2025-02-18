import { CreateTokenPurchaseButton } from '@/components/Token/ActionButtons';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getActiveProductsByType } from '@/data/user/employee';
import { Product } from '@/types';
import Image from 'next/image';
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
    <div className="min-h-screen">
      <h1 className="text-2xl font-bold text-center mb-4">Purchase Tokens</h1>
      <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
        Choose a token bundle to make a one time payment.
      </p>
      <Separator className="my-4" />
      <div className="mt-10 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card
            key={product.id}
            className="rounded-lg p-6 flex flex-col justify-between"
          >
            <div>
              <div className="w-full h-32 object-contain mb-4 flex justify-center">
                <Image
                  src={product.img_url}
                  alt="Token Icon"
                  width={150}
                  height={60}
                  quality={100}
                  sizes="100vw"
                  style={{
                    borderRadius: '50%',
                  }}
                />
              </div>
              <h2 className="text-xl font-semibold mb-2">{product.title}</h2>
              <p className="text-gray-500  dark:text-gray-400 mb-2">
                {product.description}
              </p>
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
