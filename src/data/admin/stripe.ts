import { supabaseAdminClient } from '@/supabase-clients/admin/supabaseAdminClient';
import { stripe } from '@/utils/stripe';

// export const createOrRetrieveCustomer = async ({
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

export const createOrRetrieveEmployeeCustomer = async ({
  employee_id: employeeId,
  email,
}: {
  employee_id: string;
  email?: string;
}) => {
  const { data, error } = await supabaseAdminClient
    .from('employees')
    .select('stripe_customer_id')
    .eq('id', employeeId)
    .single();
  if (error || !data?.stripe_customer_id) {
    // No customer record found, let's create one.
    const customerData: {
      metadata: { employee_id: string };
      email?: string;
    } = {
      metadata: {
        employee_id: employeeId,
      },
    };
    if (email) customerData.email = email;
    const customer = await stripe.customers.create(customerData);
    // Now insert the customer ID into our Supabase mapping table.
    const { error: supabaseError } = await supabaseAdminClient
      .from('employees')
      .update({ stripe_customer_id: customer.id })
      .eq('id', employeeId);
    if (supabaseError) throw supabaseError;
    console.log(`New stripe customer created and inserted for ${employeeId}.`);
    return customer.id;
  }
  return data.stripe_customer_id;
};
