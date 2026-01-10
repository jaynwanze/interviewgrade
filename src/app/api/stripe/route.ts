// app/api/stripe-webhook/route.ts
import { errors } from '@/utils/errors';
import { stripe } from '@/utils/stripe';
import { manageTokenBundlePurchase, manageSubscriptionStatusChange } from '@/utils/supabase-admin';
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

    // Verify Stripe signature
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return NextResponse.json(
        { error: `Webhook error: ${message}` },
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
            break;

          case 'customer.subscription.created':
          case 'customer.subscription.updated':
          case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            await manageSubscriptionStatusChange(
              subscription.id,
              subscription.customer as string,
              event.type === 'customer.subscription.created'
            );
            break;
          }

          case 'checkout.session.completed': {
            const checkoutSession = event.data.object as Stripe.Checkout.Session;
            const productType = checkoutSession.metadata?.product_type;
            const quantity = parseInt(
              checkoutSession.metadata?.quantity ?? '0',
              10,
            );
            console.log('Checkout session completed:', checkoutSession.id);
            console.log('Product type:', productType);
            console.log('Mode:', checkoutSession.mode);

            if (checkoutSession.mode === 'subscription') {
              const subscriptionId = checkoutSession.subscription as string;
              const customerId = checkoutSession.customer as string;

              // Handle subscription creation
              await manageSubscriptionStatusChange(
                subscriptionId,
                customerId,
                true // isNewSubscription
              );
            } else if (checkoutSession.mode === 'payment') {
              if (productType === 'token_bundle') {
                console.log('Token bundle purchase detected');
                await manageTokenBundlePurchase(
                  quantity,
                  checkoutSession.customer as string,
                );
              }
            }
            break;
          }

          default:
            console.log('Unhandled event type:', event.type);
        }
      } catch (error) {
        console.error('Webhook handler error:', error);
        errors.add(error);
        return NextResponse.json(
          { message: 'Webhook handler failed. View logs.' },
          { status: 400 },
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    errors.add(error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}