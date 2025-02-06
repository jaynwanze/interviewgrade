// app/api/stripe-webhook/route.ts
import { errors } from '@/utils/errors';
import { stripe } from '@/utils/stripe';
import { manageTokenBundlePurchase } from '@/utils/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Define the set of Stripe event types that you care about.
const relevantEvents = new Set([
  'product.created',
  'product.updated',
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

export async function POST(req: NextRequest) {
  try {
    // Read the raw body from the request.
    const rawBody = await req.text();

    // Get the Stripe signature from headers.
    const sig = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      return NextResponse.json(
        { message: 'Missing Stripe signature or webhook secret.' },
        { status: 400 },
      );
    }

    let event: Stripe.Event;

    // 2. Verify Stripe signature
    try {
      if (!sig || !webhookSecret) {
        return NextResponse.json(
          { message: 'Missing Stripe signature or webhook secret.' },
          { status: 400 },
        );
      }

      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      // If signature verification fails, you’ll see the “No signatures found…” error
      return NextResponse.json(
        { error: `Webhook error: ${err.message}` },
        { status: 400 },
      );
    }

    // Process only the events we care about.
    if (relevantEvents.has(event.type)) {
      try {
        switch (event.type) {
          case 'product.created':
          case 'product.updated':
            // TODO: upsert the product record in your database
            // Example:
            // await upsertProductRecord(event.data.object as Stripe.Product);
            break;

          case 'customer.subscription.created':
          case 'customer.subscription.updated':
          case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            // TODO: update the subscription status in your database
            // Example:
            // await manageSubscriptionStatusChange(subscription.id, subscription.customer as string, event.type === 'customer.subscription.created');
            break;
          }

          case 'checkout.session.completed': {
            const checkoutSession = event.data
              .object as Stripe.Checkout.Session;
            const productType = checkoutSession.metadata?.product_type;
            const quantity = parseInt(
              checkoutSession.metadata?.quantity ?? '0',
              10,
            );
            if (checkoutSession.mode === 'subscription') {
              const subscriptionId = checkoutSession.subscription;
              // TODO: update subscription status if needed
              // Example:
              // await manageSubscriptionStatusChange(subscriptionId as string, checkoutSession.customer as string, true);
            } else if (productType === 'token_bundle') {
              // handle awarding tokens
              await manageTokenBundlePurchase(
                quantity,
                checkoutSession.customer as string,
              );
            }
            break;
          }

          default:
            throw new Error('Unhandled relevant event!');
        }
      } catch (error) {
        errors.add(error);
        return NextResponse.json(
          { message: 'Webhook handler failed. View logs.' },
          { status: 400 },
        );
      }
    }

    // Return a 200 response to acknowledge receipt of the event.
    return NextResponse.json({ received: true });
  } catch (error) {
    errors.add(error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
