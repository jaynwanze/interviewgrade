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
    unit_amount: 999, // Price in cents ($9.99)
    type: 'one_time', // 'one_time' for one-time purchases
    // No interval fields for one-time purchases
    trial_period_days: null, // No trial for one-time purchases
    metadata: {
      unit_amount: '999', // Stored as string in metadata
      currency: 'usd',
      type: 'one_time',
      amount: '10', // Number of tokens
    },
    amount: 10, // Number of tokens included in the bundle
    image: 'https://example.com/images/starter-pack.png', // Optional product image URL
  },
  {
    id: 'price_1MxyzABCDEF789012', // Stripe Price ID
    product_type: 'token_bundle',
    title: 'Pro Subscription',
    description: 'Unlock 100 tokens per month with our Pro plan.',
    price: 49.99, // Human-readable price in USD
    currency: 'usd',
    status: 'active',
    unit_amount: 4999, // Price in cents ($49.99)
    type: 'recurring', // 'recurring' for subscription-based products
    interval: 'month', // Billing interval
    interval_count: 1, // Number of intervals between billing cycles
    trial_period_days: 14, // 14-day free trial
    metadata: {
      unit_amount: '4999',
      currency: 'usd',
      type: 'recurring',
      interval: 'month',
      interval_count: '1',
      trial_period_days: '14',
      amount: '100', // Number of tokens
    },
    amount: 100, // Number of tokens included per billing cycle
    image: 'https://example.com/images/pro-subscription.png', // Optional product image URL
  },
  {
    id: 'price_1MxyzABCDEF345678', // Stripe Price ID
    product_type: 'token_bundle',
    title: 'Enterprise Plan',
    description: 'Unlimited tokens and premium support for your organization.',
    price: 199.99, // Human-readable price in USD
    currency: 'usd',
    status: 'active',
    unit_amount: 19999, // Price in cents ($199.99)
    type: 'recurring', // 'recurring' for subscription-based products
    interval: 'year', // Billing interval
    interval_count: 1, // Number of intervals between billing cycles
    trial_period_days: 30, // 30-day free trial
    metadata: {
      unit_amount: '19999',
      currency: 'usd',
      type: 'recurring',
      interval: 'year',
      interval_count: '1',
      trial_period_days: '30',
      amount: 'Unlimited', // Number of tokens
    },
    amount: Infinity, // Representing unlimited tokens
    image: 'https://example.com/images/enterprise-plan.png', // Optional product image URL
  },
];


function getProductsSortedByPrice(products: Product[]) {
  return products
    .filter((product) => product.status === 'active')
    .sort((a, b) => a.unit_amount - b.unit_amount);
}

async function ChoosePricingTable() {
  //const activeProducts = await getActiveProducts(); // Fetch active products

  const productsSortedByPrice = getProductsSortedByPrice(activeProducts);

  return (
    <div className="max-w-7xl space-y-4">
      <div className="space-y-2">
        <div className="flex space-x-6 w-full">
          {productsSortedByPrice.map((product) => {
            if (!product.unit_amount) {
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
                            {product.type === 'recurring'
                              ? product.interval
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
                        {product.unit_amount > 0 ? (
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
                    organizationId={candidateId}
                    priceId={priceId}
                  />
                  <CreateSubscriptionButton
                    organizationId={candidateId}
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
