import { supabaseAdminClient } from '@/supabase-clients/admin/supabaseAdminClient';

export const manageTokenBundlePurchase = async (
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

// const manageSubscriptionStatusChange = async (
//   subscriptionId: string,
//   customerId: string,
//   createAction = false,
// ) => {
//   // Get organizations's UUID from mapping table.
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

//   const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
//     expand: ['default_payment_method'],
//   });
// Upsert the latest status of the subscription object.
/* eslint-disable prettier/prettier */
//   const subscriptionData: Database['public']['Tables']['subscriptions']['Insert'] =
//     {
//       id: subscription.id,
//       organization_id: organizationId,
//       metadata: subscription.metadata,
//       status: subscription.status,
//       price_id: subscription.items.data[0].price.id,
//       //TODO check quantity on subscription
//       quantity: subscription.items.data[0].quantity,
//       cancel_at_period_end: subscription.cancel_at_period_end,
//       cancel_at: subscription.cancel_at
//         ? toDateTime(subscription.cancel_at).toISOString()
//         : null,
//       canceled_at: subscription.canceled_at
//         ? toDateTime(subscription.canceled_at).toISOString()
//         : null,
//       current_period_start: toDateTime(
//         subscription.current_period_start,
//       ).toISOString(),
//       current_period_end: toDateTime(
//         subscription.current_period_end,
//       ).toISOString(),
//       created: toDateTime(subscription.created).toISOString(),
//       ended_at: subscription.ended_at
//         ? toDateTime(subscription.ended_at).toISOString()
//         : null,
//       trial_start: subscription.trial_start
//         ? toDateTime(subscription.trial_start).toISOString()
//         : null,
//       trial_end: subscription.trial_end
//         ? toDateTime(subscription.trial_end).toISOString()
//         : null,
//     };
//   /* eslint-enable prettier/prettier */

//   const { error } = await supabaseAdminClient
//     .from('subscriptions')
//     .upsert([subscriptionData]);
//   if (error) throw error;
//   console.log(
//     `Inserted/updated subscription [${subscription.id}] for organization [${organizationId}]`,
//   );

//   // For a new subscription copy the billing details to the customer object.
//   // NOTE: This is a costly operation and should happen at the very end.
//   if (subscription.default_payment_method && organizationId)
//     await copyBillingDetailsToCustomer(
//       organizationId,
//       subscription.default_payment_method as Stripe.PaymentMethod,
//     );
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
