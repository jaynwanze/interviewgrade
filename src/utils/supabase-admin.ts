import { supabaseAdminClient } from '@/supabase-clients/admin/supabaseAdminClient';
import { stripe } from '@/utils/stripe';
import Stripe from 'stripe';

const updateProductRecord = async (
  product: Stripe.Product,
  price: Stripe.Price,
) => {
  const { error } = await supabaseAdminClient
    .from('products')
    .update({
      stripe_product_id: product.id,
      price_id: price.id,
      status: product.active ? 'active' : 'inactive',
      title: product.name,
      description: product.description ?? undefined,
      currency: price.currency,
      price_unit_amount: price.unit_amount ?? undefined,
      // product_type:
      // pricing_type: price.type,
      pricing_plan_interval: price.recurring?.interval,
      pricing_plan_interval_count: price.recurring?.interval_count,
      trial_period_days: price.recurring?.trial_period_days ?? undefined,
      image_url: product.images?.[0] ?? undefined,
      stripe_metadata: product.metadata,
    })
    .eq('stripe_product_id', product.id)
    .eq('price_id', price.id);
  if (error) throw error;
  console.log(`Product inserted/updated: ${product.id}`);
};

const manageTokenBundlePurchase = async (
  quantity: number,
  stripeCustomer: string,
) => {
  //Get candidate's ID
  console.log(`stripeCustomer: ${stripeCustomer} manageTokenBundlePurchase`);
  const { data: employeeTokenData, error: noEmployeeError } =
    await supabaseAdminClient
      .from('employees')
      .select('token_id')
      .eq('stripe_customer_id', stripeCustomer)
      .single();
  if (noEmployeeError) throw noEmployeeError;
  if (!employeeTokenData) {
    throw new Error('No employee data');
  }

  //Update tokens linked to emp
  const { data: employeeTokens, error: tokenError } = await supabaseAdminClient
    .from('tokens')
    .select('*')
    .eq('id', employeeTokenData.token_id)
    .single();

  if (tokenError) throw tokenError;

  //Update tokens available and total tokens purchased
  const {
    tokens_available: availableTokens,
    total_tokens_purchased: totalPurchasedTokens,
  } = employeeTokens;
  const updatedTokensAvailable = availableTokens + quantity;
  const updatedPurchasedTokens = totalPurchasedTokens + quantity;
  const { token_id: tokenId } = employeeTokenData;

  //Update tokens available and total tokens purchased
  const { error } = await supabaseAdminClient
    .from('tokens')
    .update({
      total_tokens_purchased: updatedPurchasedTokens,
      tokens_available: updatedTokensAvailable,
      last_purchase_date: new Date().toISOString(),
    })
    .eq('id', tokenId);
  if (error) throw error;
  console.log(
    `Token bundle of [${quantity}] purchased for employee with token id:[${tokenId}]`,
  );
};

async function manageSubscriptionStatusChange(
  subscriptionId: string,
  customerId: string,
  isNewSubscription: boolean
) {
  // Get the full subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  // console.log('Stripe subscription status:', subscription.status);

  // Get the candidate_id from the Stripe customer metadata
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) {
    throw new Error('Customer was deleted');
  }

  const candidateId = customer.metadata?.candidateId;

  if (!candidateId) {
    console.error('No candidateId found in customer metadata for customer:', customerId);
    throw new Error('No candidateId found in customer metadata');
  }

  // Handle canceled/deleted subscriptions
  if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    const { error } = await supabaseAdminClient
      .from('subscriptions')
      .update({
        status: subscription.status,
        ended_at: new Date().toISOString(),
      })
      .eq('candidate_id', candidateId);

    if (error) {
      console.error('Error updating canceled subscription:', error);
      throw error;
    }
    console.log(`Subscription canceled for candidate ${candidateId}`);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) {
    throw new Error('No price found in subscription');
  }

  const { data: product, error: productError } = await supabaseAdminClient
    .from('products')
    .select('id')
    .eq('price_id', priceId)
    .single();

  if (productError || !product) {
    console.error('Product not found for price_id:', priceId, productError);
    throw new Error(`Product not found for price_id: ${priceId}`);
  }

  const subscriptionData = {
    candidate_id: candidateId,
    product_id: product.id,
    status: subscription.status,
    quantity: subscription.items.data[0]?.quantity || 1,
    cancel_at_period_end: subscription.cancel_at_period_end,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    created: new Date(subscription.created * 1000).toISOString(),
    ended_at: subscription.ended_at
      ? new Date(subscription.ended_at * 1000).toISOString()
      : null,
    cancel_at: subscription.cancel_at
      ? new Date(subscription.cancel_at * 1000).toISOString()
      : null,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
    trial_start: subscription.trial_start
      ? new Date(subscription.trial_start * 1000).toISOString()
      : null,
    trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    metadata: {
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
    },
  };

  const { data, error } = await supabaseAdminClient
    .from('subscriptions')
    .upsert(subscriptionData, {
      onConflict: 'candidate_id',
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting subscription:', error);
    throw error;
  }
  return data;
}
export { manageTokenBundlePurchase, updateProductRecord, manageSubscriptionStatusChange };

// const createOrRetrieveCustomer = async ({
//   email,
//   organizationId,
//   organizationTitle,
// }: {
//   email?: string;
//   organizationId: string;
//   organizationTitle?: string;
// }) => {
//   const { data, error } = await supabaseAdminClient
//     .from('customers')
//     .select('stripe_customer_id')
//     .eq('organization_id', organizationId)
//     .single();
//   if (error || !data?.stripe_customer_id) {
//     // No customer record found, let's create one.
//     const customerData: {
//       metadata: { supabaseOrganizationId: string };
//       email?: string;
//       description?: string;
//     } = {
//       metadata: {
//         supabaseOrganizationId: organizationId,
//       },
//     };
//     if (email) customerData.email = email;
//     if (organizationTitle) customerData.description = organizationTitle;
//     const customer = await stripe.customers.create(customerData);
//     // Now insert the customer ID into our Supabase mapping table.
//     const { error: supabaseError } = await supabaseAdminClient
//       .from('customers')
//       .insert([
//         { organization_id: organizationId, stripe_customer_id: customer.id },
//       ]);
//     if (supabaseError) throw supabaseError;
//     console.log(`New customer created and inserted for ${organizationId}.`);
//     return customer.id;
//   }
//   return data.stripe_customer_id;
// };

// /**
//  * Copies the billing details from the payment method to the customer object.
//  */
// const copyBillingDetailsToCustomer = async (
//   organizationId: string,
//   payment_method: Stripe.PaymentMethod,
// ) => {
//   //Todo: check this assertion
//   const customer = payment_method.customer as string;
//   const {
//     name: _name,
//     phone: _phone,
//     address: _address,
//   } = payment_method.billing_details;
//   const name = _name ?? undefined;
//   const phone = _phone ?? undefined;
//   const address = _address ?? undefined;

//   const addressParam: Stripe.AddressParam = {
//     country: address?.country ?? undefined,
//     line1: address?.line1 ?? undefined,
//     line2: address?.line2 ?? undefined,
//     postal_code: address?.postal_code ?? undefined,
//     state: address?.state ?? undefined,
//     city: address?.city ?? undefined,
//   };
//   await stripe.customers.update(customer, {
//     name,
//     phone,
//     address: addressParam,
//   });
//   const { error } = await supabaseAdminClient
//     .from('organizations_private_info')
//     .update({
//       billing_address: { ...address },
//       payment_method: { ...payment_method[payment_method.type] },
//     })
//     .eq('id', organizationId);
//   if (error) throw error;
// };

// const manageSubscriptionStatusChange = async (
//   subscriptionId: string,
//   customerId: string,
//   createAction = false,
// ) => {
//   // Get organizations's UUID from mapping table.
//   const { data: customerData, error: noCustomerError } =
// export const manageTokenBundlePurchase = async (
//   quantity: number,
//   stripeCustomer: string,
// ) => {
//   //Get candidate's ID
//   console.log(`stripeCustomer: ${stripeCustomer} manageTokenBundlePurchase`);
//   const { data: employeeTokenData, error: noEmployeeError } =
//     await supabaseAdminClient
//       .from('employees')
//       .select('token_id')
//       .eq('stripe_customer_id', stripeCustomer)
//       .single();
//   if (noEmployeeError) throw noEmployeeError;
//   if (!employeeTokenData) {
//     throw new Error('No employee data');
//   }

//   //Update tokens linked to emp
//   const { data: employeeTokens, error: tokenError } = await supabaseAdminClient
//     .from('tokens')
//     .select('*')
//     .eq('id', employeeTokenData.token_id)
//     .single();

//   if (tokenError) throw tokenError;

//   //Update tokens available and total tokens purchased
//   const {
//     tokens_available: availableTokens,
//     total_tokens_purchased: totalPurchasedTokens,
//   } = employeeTokens;
//   const updatedTokensAvailable = availableTokens + quantity;
//   const updatedPurchasedTokens = totalPurchasedTokens + quantity;
//   const { token_id: tokenId } = employeeTokenData;

//   //Update tokens available and total tokens purchased
//   const { error } = await supabaseAdminClient
//     .from('tokens')
//     .update({
//       total_tokens_purchased: updatedPurchasedTokens,
//       tokens_available: updatedTokensAvailable,
//       last_purchase_date: new Date().toISOString(),
//     })
//     .eq('id', tokenId);
//   if (error) throw error;
//   console.log(
//     `Updated tokens for employee with token ID: ${tokenId}, added ${quantity} tokens.`,
//   );
// };
// const upsertProductRecord = async (product: Stripe.Product) => {
//   const { error } = await supabaseAdminClient.from('products').upsert([
//     {
//       id: product.id,
//       active: product.active,
//       name: product.name,
//       description: product.description ?? undefined,
//       image: product.images?.[0] ?? null,
//       metadata: product.metadata,
//     },
//   ]);
//   if (error) throw error;
//   console.log(`Product inserted/updated: ${product.id}`);
// };

// const upsertPriceRecord = async (price: Stripe.Price) => {
//   const { error } = await supabaseAdminClient.from('prices').upsert([
//     {
//       id: price.id,
//       product_id: typeof price.product === 'string' ? price.product : '',
//       active: price.active,
//       currency: price.currency,
//       description: price.nickname ?? undefined,
//       type: price.type,
//       unit_amount: price.unit_amount ?? undefined,
//       interval: price.recurring?.interval,
//       interval_count: price.recurring?.interval_count,
//       trial_period_days: price.recurring?.trial_period_days,
//       metadata: price.metadata,
//     },
//   ]);
//   if (error) throw error;
//   console.log(`Price inserted/updated: ${price.id}`);
// };

// const createOrRetrieveCustomer = async ({
//   email,
//   organizationId,
//   organizationTitle,
// }: {
//   email?: string;
//   organizationId: string;
//   organizationTitle?: string;
// }) => {
//   const { data, error } = await supabaseAdminClient
//     .from('customers')
//     .select('stripe_customer_id')
//     .eq('organization_id', organizationId)
//     .single();
//   if (error || !data?.stripe_customer_id) {
//     // No customer record found, let's create one.
//     const customerData: {
//       metadata: { supabaseOrganizationId: string };
//       email?: string;
//       description?: string;
//     } = {
//       metadata: {
//         supabaseOrganizationId: organizationId,
//       },
//     };
//     if (email) customerData.email = email;
//     if (organizationTitle) customerData.description = organizationTitle;
//     const customer = await stripe.customers.create(customerData);
//     // Now insert the customer ID into our Supabase mapping table.
//     const { error: supabaseError } = await supabaseAdminClient
//       .from('customers')
//       .insert([
//         { organization_id: organizationId, stripe_customer_id: customer.id },
//       ]);
//     if (supabaseError) throw supabaseError;
//     console.log(`New customer created and inserted for ${organizationId}.`);
//     return customer.id;
//   }
//   return data.stripe_customer_id;
// };

// /**
//  * Copies the billing details from the payment method to the customer object.
//  */
// const copyBillingDetailsToCustomer = async (
//   organizationId: string,
//   payment_method: Stripe.PaymentMethod,
// ) => {
//   //Todo: check this assertion
//   const customer = payment_method.customer as string;
//   const {
//     name: _name,
//     phone: _phone,
//     address: _address,
//   } = payment_method.billing_details;
//   const name = _name ?? undefined;
//   const phone = _phone ?? undefined;
//   const address = _address ?? undefined;

//   const addressParam: Stripe.AddressParam = {
//     country: address?.country ?? undefined,
//     line1: address?.line1 ?? undefined,
//     line2: address?.line2 ?? undefined,
//     postal_code: address?.postal_code ?? undefined,
//     state: address?.state ?? undefined,
//     city: address?.city ?? undefined,
//   };
//   await stripe.customers.update(customer, {
//     name,
//     phone,
//     address: addressParam,
//   });
//   const { error } = await supabaseAdminClient
//     .from('organizations_private_info')
//     .update({
//       billing_address: { ...address },
//       payment_method: { ...payment_method[payment_method.type] },
//     })
//     .eq('id', organizationId);
//   if (error) throw error;
// };

// export const updatePaymentMethod = async (
//   paymentMethodId: string,
//   customerId: string,
// ) => {
//   const { data: customerData, error: noCustomerError } =
//     await supabaseAdminClient
//       .from('customers')
//       .select('*')
//       .eq('stripe_customer_id', customerId)
//       .single();

//   if (noCustomerError) throw noCustomerError;

//   if (!customerData) {
//     throw new Error('No customer data');
//   }

//   const { organization_id: organizationId } = customerData;

//   const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
//   const billingAddress = paymentMethod.billing_details;
//   const { name: _name, phone: _phone, address: _address } = billingAddress;
//   const address = _address ?? undefined;
//   const name = _name ?? undefined;
//   const phone = _phone ?? undefined;
//   const addressParam: Stripe.AddressParam = {
//     country: address?.country ?? undefined,
//     line1: address?.line1 ?? undefined,
//     line2: address?.line2 ?? undefined,
//     postal_code: address?.postal_code ?? undefined,
//     state: address?.state ?? undefined,
//     city: address?.city ?? undefined,
//   };
//   await stripe.customers.update(customerId, {
//     name,
//     phone,
//     address: addressParam,
//   });
//   await stripe.customers.update(customerId, {
//     name,
//     phone,
//     address: addressParam,
//   });

//   const { error } = await supabaseAdminClient
//     .from('organizations_private_info')
//     .update({
//       billing_address: { ...address },
//       payment_method: {
//         ...paymentMethod[paymentMethod.type],
//       },
//     })
//     .eq('id', organizationId);
//   if (error) throw error;
// };

// export {
//   upsertProductRecord,
//   upsertPriceRecord,
//   createOrRetrieveCustomer,
//   manageSubscriptionStatusChange,
// };
