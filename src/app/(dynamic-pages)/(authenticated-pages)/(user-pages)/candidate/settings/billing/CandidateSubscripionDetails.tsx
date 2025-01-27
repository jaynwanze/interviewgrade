'use server';
import { PageHeading } from '@/components/PageHeading';
import { T } from '@/components/ui/Typography';
import { NormalizedSubscription, Product } from '@/types';
import { cn } from '@/utils/cn';
import { formatNormalizedSubscription } from '@/utils/formatNormalizedSubscription';
import { Check, X } from 'lucide-react';
import {
  CreateSubscriptionButton,
  ManageSubscriptionButton,
  StartFreeTrialButton,
} from './ActionButtons';

const activeProducts: Product[] = [
  {
    id: 'price_1MxyzABCDEF123456', // Stripe Price ID
    product_type: 'token_bundle',
    title: 'Starter Pack',
    description: 'Get started with 10 tokens to explore our platform.',
    price: 9.99, // Human-readable price in USD
    currency: 'usd',
    status: 'active',
    // No interval fields for one-time purchases
    trial_period_days: null, // No trial for one-time purchases
    metadata: null,
    quantity: 0,
    price_unit_amount: 0,
    pricing_type: 'recurring',
    pricing_plan_interval: 'month',
    pricing_plan_interval_count: 0,
  },
];


function getProductsSortedByPrice(products: Product[]) {
  return products
    .filter((product) => product.status === 'active')
    .sort((a, b) => a.quantity - b.quantity);
}

async function ChoosePricingTable() {
  //const activeProducts = await getActiveProducts(); // Fetch active products

  const productsSortedByPrice = getProductsSortedByPrice(activeProducts);

  return (
    <div className="max-w-7xl space-y-4">
      <div className="space-y-2">
        <div className="flex space-x-6 w-full">
          {productsSortedByPrice.map((product) => {
            if (!product.quantity) {
              return null;
            }

            const priceId = product.id; // Assuming 'id' is used as Stripe Price ID
            const priceString = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: product.currency,
              minimumFractionDigits: 0,
            }).format(product.price);

            return (
              <div
                key={product.id}
                className={cn(
                  'w-full',
                  'flex flex-col justify-between',
                  'mt-3 shadow-none overflow-hidden rounded-xl hover:shadow-xl transition',
                  'sm:w-96 lg:w-full',
                  'border mb-2',
                )}
              >
                <div>
                  <div className="mb-6 p-7 pt-6 flex items-center border-b">
                    <div>
                      <T.H4 className="mt-0 mb-4 text-foreground">
                        {product.title}
                      </T.H4>
                      <span>
                        <T.H1 className="text-foreground">
                          {priceString}
                          <span className="text-base tracking-normal text-muted-foreground font-medium">
                            {' '}
                            per{' '}
                            {product.pricing_type === 'recurring'
                              ? product.pricing_plan_interval
                              : 'one-time'}
                          </span>
                        </T.H1>
                      </span>
                    </div>
                  </div>

                  <div className="px-5 pl-6 pt-0 mb-8">
                    <ul className="font-medium text-muted-foreground">
                      <li className="grid grid-cols-[24px,1fr] gap-0 text-md items-start mb-2">
                        <Check className="text-green-600 w-6 h-6" />
                        <T.P className="leading-6 ml-3">
                          {product.description}
                        </T.P>
                      </li>
                      <li className="grid grid-cols-[24px,1fr] gap-0 text-md items-start mb-2">
                        <Check className="text-green-600 w-6 h-6" />
                        <T.P className="leading-6 ml-3">A nice feature</T.P>
                      </li>
                      <li className="grid grid-cols-[24px,1fr] gap-0 text-md items-start mb-2">
                        <Check className="text-green-600 w-6 h-6" />
                        <T.P className="leading-6 ml-3">
                          Another nice feature
                        </T.P>
                      </li>
                      <li className="grid grid-cols-[24px,1fr] gap-0 text-md items-start mb-2">
                        {product.quantity > 0 ? (
                          <Check className="text-green-600 w-6 h-6" />
                        ) : (
                          <X className="text-destructive" />
                        )}
                        <T.P className="leading-6 ml-3">A premium feature</T.P>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="rounded-xl py-1 mb-5 mx-5 mt-4 text-center text-foreground text-xl space-y-2">
                  <StartFreeTrialButton
                    organizationId={'candidateId'}
                    priceId={priceId}
                  />
                  <CreateSubscriptionButton
                    organizationId={'candidateId'}
                    priceId={priceId}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export async function CandidateSubscriptionDetails({
  normalizedSubscription,
}: {
  normalizedSubscription: NormalizedSubscription;
}) {
  const subscriptionDetails = formatNormalizedSubscription(
    normalizedSubscription,
  );

  if (
    !subscriptionDetails.title ||
    normalizedSubscription.type === 'no-subscription'
  ) {
    return (
      <>
        <PageHeading
          title="Subscriptions"
          subTitle="This candidate doesn't have any subscription at the moment"
        />
        <ChoosePricingTable />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <T.H3 className="text-gray-900 dark:text-slate-100">Subscription</T.H3>
        <T.P className="text-muted-foreground">
          You are currently on the{' '}
          <span className="text-blue-500 dark:text-blue-400">
            {subscriptionDetails.title}{' '}
            <span>{subscriptionDetails.sidenote}</span>
          </span>
          .
        </T.P>
        <T.Subtle>{subscriptionDetails.description}</T.Subtle>
      </div>
      <ManageSubscriptionButton />
    </div>
  );
}
