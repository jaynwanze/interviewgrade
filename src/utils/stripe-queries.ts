import { Stripe } from 'stripe';

export async function isCustomerInFreeTrial(
  stripe: Stripe,
  customerId: string,
): Promise<boolean> {
  const customer = await stripe.customers.retrieve(customerId);
  const subscription = await stripe.subscriptions.list({
    customer: customer.id,
    status: 'trialing',
  });

  return subscription.data.length > 0;
}

export async function hasCustomerSubscription(
  stripe: Stripe,
  customerId: string,
): Promise<boolean> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
  });

  return subscriptions.data.length > 0;
}

export async function daysLeftInTrial(
  stripe: Stripe,
  customerId: string,
): Promise<number | null> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'trialing',
  });

  if (subscriptions.data.length === 0) {
    return null;
  }

  const trialEnd = subscriptions.data[0].trial_end;
  const currentTime = Math.floor(Date.now() / 1000);

  return trialEnd
    ? Math.max(Math.ceil((trialEnd - currentTime) / 86400), 0)
    : null;
}

export async function startFreeTrial(
  stripe: Stripe,
  customerId: string,
  planId: string,
  trialDays: number,
): Promise<Stripe.Subscription | null> {
  if (!trialDays || trialDays <= 0) {
    return null;
  }

  const trialEnd = Math.floor(Date.now() / 1000) + trialDays * 86400;

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ plan: planId }],
    trial_end: trialEnd,
  });

  return subscription;
}
