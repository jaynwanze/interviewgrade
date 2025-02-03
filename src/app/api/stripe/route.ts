import { errors } from '@/utils/errors';
import { stripe } from '@/utils/stripe';
import { manageTokenBundlePurchase } from '@/utils/supabase-admin';
import { NextApiRequest, NextApiResponse } from 'next';
import { Readable } from 'node:stream';
import Stripe from 'stripe';

// Utility to convert Readable stream to Buffer
async function buffer(readable: Readable) {
  const chunks: Array<Buffer> = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Define relevant Stripe events
const relevantEvents = new Set([
  'product.created',
  'product.updated',
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

/**
 * Webhook handler which receives Stripe events and updates the database.
 * Events handled are product.created, product.updated,
 * checkout.session.completed, customer.subscription.created, customer.subscription.updated, customer.subscription.deleted.
 *
 * IMPORTANT! Ensure the webhook secret is set in environment variables
 * and the webhook is configured in the Stripe dashboard.
 */
export async function POST(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    try {
      if (!sig || !webhookSecret) {
        throw new Error('Missing Stripe signature or webhook secret.');
      }
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (error: unknown) {
      errors.add(error);
      if (error instanceof Error) {
        return res.status(400).send(`Webhook error: ${error.message}`);
      }

      return res.status(400).send(`Webhook Error: ${String(error)}`);
    }

    if (relevantEvents.has(event.type)) {
      try {
        switch (event.type) {
          case 'product.created':
          case 'product.updated':
            // await upsertProductRecord(event.data.object as Stripe.Product);
            break;

          case 'customer.subscription.created':
          case 'customer.subscription.updated':
          case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            // await manageSubscriptionStatusChange(
            //   subscription.id,
            //   subscription.customer as string,
            //   event.type === 'customer.subscription.created',
            // );
            break;
          }

          case 'checkout.session.completed': {
            const checkoutSession = event.data
              .object as Stripe.Checkout.Session;
            if (checkoutSession.mode === 'subscription') {
              const subscriptionId = checkoutSession.subscription;
              //   await manageSubscriptionStatusChange(
              //     subscriptionId as string,
              //     checkoutSession.customer as string,
              //     true,
              //   );
            } else if (
              checkoutSession.mode === 'payment' &&
              checkoutSession.line_items?.data[0].price?.metadata
                .product_type === 'token_bundle'
            ) {
              const productQuantity =
                checkoutSession.line_items.data[0].quantity;
              await manageTokenBundlePurchase(
                productQuantity as number,
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
        return res
          .status(400)
          .send('Webhook error: "Webhook handler failed. View logs."');
      }
    }

    res.json({ received: true });
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
