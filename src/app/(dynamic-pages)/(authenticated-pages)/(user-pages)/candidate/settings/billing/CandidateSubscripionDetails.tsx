'use server';
import { PageHeading } from '@/components/PageHeading';
import Overline from '@/components/Text/Overline';
import { T } from '@/components/ui/Typography';
import { H3 } from '@/components/ui/Typography/H3';
import { getActiveProductsByType } from '@/data/user/employee';
import { NormalizedSubscription, Product, UnwrapPromise } from '@/types';
import { cn } from '@/utils/cn';
import { formatNormalizedSubscription } from '@/utils/formatNormalizedSubscription';
import { Check, X } from 'lucide-react';
import {
  CreateSubscriptionButton,
  ManageSubscriptionButton,
} from './ActionButtons';

function getProductsSortedByPrice(
  activeProducts: UnwrapPromise<ReturnType<typeof getActiveProductsByType>>,
) {
  if (!activeProducts) return [];
  const pricesForProduct = activeProducts.map((prod: Product) => {
    const priceString = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: prod.currency ?? undefined,
      minimumFractionDigits: 0,
    }).format((prod?.price_unit_amount || 0) / 100);
    return {
      ...prod,
      priceString,
    };
  });

  return pricesForProduct
    .sort((a, b) => (a?.price_unit_amount ?? 0) - (b?.price_unit_amount ?? 0))
    .filter(Boolean);
}

async function ChoosePricingTable() {
  const activeProducts = await getActiveProductsByType('subscription');
  if (!activeProducts || activeProducts.length === 0) {
    return (
      <T.Subtle className="text-center">
        No active products available at the moment.
      </T.Subtle>
    );
  }

  // supabase cannot sort by foreign table, so we do it here
  const productsSortedByPrice = getProductsSortedByPrice(activeProducts);

  return (
    <div className="max-w-7xl space-y-4">
      <Overline>Pricing table</Overline>
      <H3 className="border-none mt-3 mb-0">Pricing table</H3>
      <div className="space-y-2">
        {/* <PricingModeToggle mode={pricingMode} onChange={setPricingMode} /> */}
        <div className="flex space-x-6 w-full">
          {productsSortedByPrice.map((product: Product) => {
            if (!product.price) {
              return null;
            }
            if (
              product.id === null ||
              product.id === undefined ||
              product.id === undefined ||
              product.price_unit_amount === null ||
              product.price_unit_amount === undefined
            ) {
              return null;
            }
            const priceId = product.price_id;
            return (
              <>
                <div
                  key={priceId}
                  className={cn(
                    'w-full',
                    'flex flex-col justify-between',
                    'mt-3 order-2 shadow-none overflow-hidden rounded-xl',
                    'hover:shadow-xl transition',
                    'sm:w-96 lg:w-full lg:order-1',
                    'border mb-2',
                  )}
                >
                  <div>
                    <div className="mb-6 p-7 pt-6 flex items-center border-b">
                      <div>
                        <T.H4 className="mt-0 mb-4 text-foreground">
                          {' '}
                          {product.title}
                        </T.H4>
                        <span>
                          <T.H1 className="text-foreground" key={priceId}>
                            {' '}
                            {product.price}
                            <span className="text-base tracking-normal text-muted-foreground font-medium">
                              {' '}
                              per {product.pricing_plan_interval}
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
                          {product.price_unit_amount > 0 ? (
                            <Check className="text-green-600 w-6 h-6" />
                          ) : (
                            <X className="text-destructive" />
                          )}
                          <T.P className="leading-6 ml-3">
                            A premium feature
                          </T.P>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="rounded-xl py-1 mb-5 mx-5 mt-4 text-center text-foreground text-xl space-y-2">
                    <>
                      {/* <StartFreeTrialButton
                        organizationId={organizationId}
                        priceId={priceId}
                      /> */}
                      <CreateSubscriptionButton priceId={priceId} />
                    </>
                  </div>
                </div>
              </>
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
  normalizedSubscription?: NormalizedSubscription;
}) {
  if (!normalizedSubscription) {
    return (
      <PageHeading
        title="Subscription"
        subTitle="No subscription data available."
      />
    );
  }

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
          title="Subscription"
          subTitle="This user doesn't have any plan at the moment"
        />
        <ChoosePricingTable />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <T.H3 className="text-gray-900 dark:text-slate-100 ">Subscription</T.H3>
        <T.P className="text-muted-foreground">
          You are currently on the{' '}
          <span className="text-blue-500 dark:text-blue-400">
            {subscriptionDetails.title}{' '}
            <span>{subscriptionDetails.sidenote}</span>
          </span>
          .{' '}
        </T.P>
        <T.Subtle>{subscriptionDetails.description}</T.Subtle>
      </div>
      <ManageSubscriptionButton />
    </div>
  );
}
