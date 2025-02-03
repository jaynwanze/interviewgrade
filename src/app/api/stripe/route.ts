// app/api/stripe-webhook/route.ts
import { errors } from '@/utils/errors';
import { stripe } from '@/utils/stripe';
import { manageTokenBundlePurchase } from '@/utils/supabase-admin';
import { NextResponse, NextRequest } from 'next/server';
import { Readable } from 'node:stream';
import Stripe from 'stripe';

// Utility to convert a Readable stream to a Buffer
async function buffer(readable: Readable) {
  const chunks: Array<Buffer> = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

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
    // In Next.js 13, req.body is a ReadableStream.
    const rawBody = await buffer(req.body as unknown as Readable);

    // Get the Stripe signature from headers.
    const sig = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      return NextResponse.json(
        { message: 'Missing Stripe signature or webhook secret.' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      // Verify the event by constructing it using the Stripe SDK.
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (error) {
      errors.add(error);
      return NextResponse.json(
        { message: `Webhook error: ${error.message}` },
        { status: 400 }
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
            const checkoutSession = event.data.object as Stripe.Checkout.Session;
            if (checkoutSession.mode === 'subscription') {
              const subscriptionId = checkoutSession.subscription;
              // TODO: update subscription status if needed
              // Example:
              // await manageSubscriptionStatusChange(subscriptionId as string, checkoutSession.customer as string, true);
            } else if (
              checkoutSession.mode === 'payment' &&
              checkoutSession.line_items?.data[0].price?.metadata.product_type === 'token_bundle'
            ) {
              const productQuantity = checkoutSession.line_items.data[0].quantity;
              await manageTokenBundlePurchase(
                productQuantity as number,
                checkoutSession.customer as string
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
          { status: 400 }
        );
      }
    }

    // Return a 200 response to acknowledge receipt of the event.
    return NextResponse.json({ received: true });
  } catch (error) {
    errors.add(error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
