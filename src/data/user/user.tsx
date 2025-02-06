'use server';
import { PRODUCT_NAME } from '@/constants';
import { createSupabaseUserServerActionClient } from '@/supabase-clients/user/createSupabaseUserServerActionClient';
import { createSupabaseUserServerComponentClient } from '@/supabase-clients/user/createSupabaseUserServerComponentClient';
import type {
  NormalizedSubscription,
  Product,
  SAPayload,
  StripeCheckoutSessionDetails,
  SupabaseFileUploadOptions,
  Table,
} from '@/types';
import { UserType } from '@/types/userTypes';
import { sendEmail } from '@/utils/api-routes/utils';
import { toSiteURL } from '@/utils/helpers';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import { stripe } from '@/utils/stripe';
import type { AuthUserMetadata } from '@/utils/zod-schemas/authUserMetadata';
import { renderAsync } from '@react-email/render';
import slugify from 'slugify';
import urlJoin from 'url-join';
import ConfirmAccountDeletionEmail from '../../../emails/account-deletion-request';
import { createOrRetrieveCandidateCustomer } from '../admin/stripe';
import { refreshSessionAction } from './session';

export async function getIsAppAdmin(): Promise<boolean> {
  const user = await serverGetLoggedInUser();
  if ('user_role' in user) {
    return user.user_role === 'admin';
  }

  return false;
}

export const getUserProfile = async (
  userId: string,
): Promise<Table<'user_profiles'>> => {
  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
};
export const getUserFullName = async (userId: string) => {
  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data.full_name;
};

export const getUserAvatarUrl = async (userId: string) => {
  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('avatar_url')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data.avatar_url;
};

export const uploadPublicUserAvatar = async (
  formData: FormData,
  fileName: string,
  fileOptions?: SupabaseFileUploadOptions | undefined,
): Promise<SAPayload<string>> => {
  'use server';
  const file = formData.get('file');
  if (!file) {
    throw new Error('File is empty');
  }
  const slugifiedFilename = slugify(fileName, {
    lower: true,
    strict: true,
    replacement: '-',
  });
  const supabaseClient = createSupabaseUserServerActionClient();
  const user = await serverGetLoggedInUser();
  const userId = user.id;
  const userImagesPath = `${userId}/images/${slugifiedFilename}`;

  const { data, error } = await supabaseClient.storage
    .from('public-user-assets')
    .upload(userImagesPath, file, fileOptions);

  if (error) {
    return { status: 'error', message: error.message };
  }

  const { path } = data;

  const filePath = path.split(',')[0];
  const supabaseFileUrl = urlJoin(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    '/storage/v1/object/public/public-user-assets',
    filePath,
  );

  return { status: 'success', data: supabaseFileUrl };
};

export const updateUserProfileNameAndAvatar = async (
  {
    fullName,
    avatarUrl,
  }: {
    fullName?: string;
    avatarUrl?: string;
  },
  {
    isOnboardingFlow = false,
  }: {
    isOnboardingFlow?: boolean;
  } = {},
): Promise<SAPayload<Table<'user_profiles'>>> => {
  'use server';
  const supabaseClient = createSupabaseUserServerActionClient();
  const user = await serverGetLoggedInUser();
  const { data, error } = await supabaseClient
    .from('user_profiles')
    .update({
      full_name: fullName,
      avatar_url: avatarUrl,
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    return {
      status: 'error',
      message: error.message,
    };
  }

  if (isOnboardingFlow) {
    const updateUserMetadataPayload: Partial<AuthUserMetadata> = {
      onboardingHasCompletedProfile: true,
    };

    const updateUserMetadataResponse = await supabaseClient.auth.updateUser({
      data: updateUserMetadataPayload,
    });

    if (updateUserMetadataResponse.error) {
      return {
        status: 'error',
        message: updateUserMetadataResponse.error.message,
      };
    }

    const refreshSessionResponse = await refreshSessionAction();
    if (refreshSessionResponse.status === 'error') {
      return refreshSessionResponse;
    }
  }

  return {
    status: 'success',
    data,
  };
};

export const acceptTermsOfService = async (
  accepted: boolean,
): Promise<SAPayload<boolean>> => {
  const supabaseClient = createSupabaseUserServerComponentClient();

  const updateUserMetadataPayload: Partial<AuthUserMetadata> = {
    onboardingHasAcceptedTerms: true,
  };

  const updateUserMetadataResponse = await supabaseClient.auth.updateUser({
    data: updateUserMetadataPayload,
  });

  if (updateUserMetadataResponse.error) {
    return {
      status: 'error',
      message: updateUserMetadataResponse.error.message,
    };
  }

  const refreshSessionResponse = await refreshSessionAction();
  if (refreshSessionResponse.status === 'error') {
    return refreshSessionResponse;
  }

  return {
    status: 'success',
    data: true,
  };
};

export async function requestAccountDeletion(): Promise<
  SAPayload<Table<'account_delete_tokens'>>
> {
  const supabaseClient = createSupabaseUserServerActionClient();
  const user = await serverGetLoggedInUser();
  if (!user.email) {
    return { status: 'error', message: 'User email not found' };
  }
  const { data, error } = await supabaseClient
    .from('account_delete_tokens')
    .upsert({
      user_id: user.id,
    })
    .select('*')
    .single();

  if (error) {
    return { status: 'error', message: error.message };
  }

  const userFullName =
    (await getUserFullName(user.id)) ?? `User ${user.email ?? ''}`;

  const deletionHTML = await renderAsync(
    <ConfirmAccountDeletionEmail
      deletionConfirmationLink={toSiteURL(`/confirm-delete-user/${data.token}`)}
      userName={userFullName}
      appName={PRODUCT_NAME}
    />,
  );

  await sendEmail({
    from: process.env.ADMIN_EMAIL,
    html: deletionHTML,
    subject: `Confirm Account Deletion - ${PRODUCT_NAME}`,
    to: user.email,
  });

  return {
    status: 'success',
    data,
  };
}

export const getUserType = async (userId: string): Promise<UserType> => {
  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('user_type')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('User profile not found');
  }

  return data.user_type;
};

export const getCandidateUserProfile = async (
  userId: string,
): Promise<Table<'candidates'>> => {
  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) {
    throw error;
  }
  return data;
};

export const getCurrentCandidatesTokens =
  async (): Promise<Table<'tokens'> | null> => {
    const user = await serverGetLoggedInUser();
    if (!user) {
      throw new Error('User not found');
    }
    const candidate = await getCandidateUserProfile(user.id);
    if (!candidate) {
      throw new Error('Candidate not found');
    }
    const { data, error } = await createSupabaseUserServerComponentClient()
      .from('tokens')
      .select('*')
      .eq('id', candidate.token_id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      console.error('No tokens found for candidate:', candidate);
      return null;
    }

    return data;
  };

export const purchaseProduct = async (
  candidateId: string,
  productId: string,
): Promise<SAPayload<boolean>> => {
  const supabase = createSupabaseUserServerActionClient();
  if (!candidateId) {
    return { status: 'error', message: 'User ID not found' };
  }

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (productError || !product) {
    console.error('Error fetching product:', productError);
    return {
      status: 'error',
      message: 'Product not found ' + productError.message,
    };
  }

  const { data: tokenData, error: tokenError } = await supabase
    .from('tokens')
    .select('*')
    .eq('candidate_id', candidateId)
    .single();

  if (tokenError || !tokenData) {
    console.error('Error fetching tokens:', tokenError);
    return {
      status: 'error',
      message: 'Tokens not found ' + tokenError.message,
    };
  }

  const updatedTokensAvailable = tokenData.tokens_available + product.quantity;
  const updatedTotalTokensPurchased =
    (tokenData.total_tokens_purchased || 0) + product.quantity;
  const currentDate = new Date().toISOString();

  // Update tokens
  const { error: updateError } = await supabase
    .from('tokens')
    .update({
      tokens_available: updatedTokensAvailable,
      total_tokens_purchased: updatedTotalTokensPurchased,
      last_purchase_date: currentDate,
    })
    .eq('candidate_id', candidateId);

  if (updateError) {
    return { status: 'error', message: updateError.message };
  }

  return {
    status: 'success',
    data: true,
  };
};

export const getCurrentCandidateSubscription = async (
  candidateId: string,
): Promise<NormalizedSubscription> => {
  const candidate = getCandidateUserProfile(candidateId);
  const candidateSubscriptionId = (await candidate).subscription_id;

  if (!candidateSubscriptionId) {
    return {
      type: 'no-subscription',
    };
  }

  const { data: subscriptionData, error } =
    await createSupabaseUserServerActionClient()
      .from('subscriptions')
      .select('*, products(*)')
      .eq('subscription_id', candidateSubscriptionId)
      .in('status', ['trialing', 'active'])
      .single();

  if (error) {
    console.error('Error fetching subscription:', error);
    throw error;
  }

  if (!subscriptionData) {
    return {
      type: 'no-subscription',
    };
  }

  try {
    const subscription = subscriptionData as Table<'subscriptions'> & {
      products: Product;
    };

    const product = subscription.products;

    if (!product) {
      throw new Error('No product found for the subscription');
    }

    // if (subscription.status === 'trialing') {
    //   if (!subscription.trial_start || !subscription.trial_end) {
    //     throw new Error('No trial start or end found');
    //   }
    //   return {
    //     type: 'trialing',
    //     trialStart: subscription.trial_start,
    //     trialEnd: subscription.trial_end,
    //     product: product,
    //     subscription,
    //   };
    // } else
    if (subscription.status) {
      return {
        type: subscription.status as
          | 'active'
          | 'past_due'
          | 'canceled'
          | 'paused'
          | 'incomplete'
          | 'incomplete_expired'
          | 'unpaid',
        product: product,
        subscription,
      };
    } else {
      return {
        type: 'no-subscription',
      };
    }
  } catch (err) {
    console.error('Error processing subscription:', err);
    return {
      type: 'no-subscription',
    };
  }
};

export async function createCustomerCandidatePortalLinkAction(
  candidateId: string,
) {
  const candidate = await getCandidateUserProfile(candidateId);
  if (!candidate) throw Error('Could not get candidate profile');
  if (!candidate.stripe_customer_id) {
    throw Error('No stripe customer id found');
  }
  const { url } = await stripe.billingPortal.sessions.create({
    customer: candidate.stripe_customer_id,
    return_url: toSiteURL(`/candidate`),
  });

  return url;
}

export const getActiveProductsByType = async (
  productType: string,
): Promise<Product[]> => {
  const { data, error } = await createSupabaseUserServerComponentClient()
    .from('products')
    .select('*')
    .eq('product_type', productType)
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching active products:', error);
    throw error;
  }

  return data || [];
};

export async function createCandidateCheckoutSessionAction({
  product,
  isTrial = false,
  isTokenBundlePurchase = false,
}: {
  product: Product;
  isTrial?: boolean;
  isTokenBundlePurchase?: boolean;
}) {
  const TRIAL_DAYS = 14;
  const user = await serverGetLoggedInUser();
  if (!user) throw Error('Could not get user');
  const candidate = await getCandidateUserProfile(user.id);
  if (user.id !== candidate.id)
    throw Error('Logged in user is not the candidate');
  if (!user.email) throw Error('User email not found');

  const customer = await createOrRetrieveCandidateCustomer({
    candidate_id: candidate.id,
    email: user.email || '',
  });
  if (!customer) throw Error('Could not get customer');
  if (isTokenBundlePurchase) {
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      customer,
      expand: ['line_items'],
      metadata: {
        product_type: product.product_type,
        quantity: product.quantity,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: product.currency,
            product_data: {
              name: product.title,
              description: product.description,
              metadata: {
                product_type: product.product_type,
              },
            },
            unit_amount: product.price_unit_amount,
          },
        },
      ],
      mode: 'payment',
      allow_promotion_codes: true,
      payment_intent_data: {
        setup_future_usage: 'off_session',
        metadata: {},
      },
      success_url: toSiteURL(
        `/candidate/purchase-tokens/success/{CHECKOUT_SESSION_ID}`,
      ),
      cancel_url: toSiteURL(`/candidate/purchase-tokens`),
    });

    return stripeSession.id;
    // } else if (isTrial) {
    //   const stripeSession = await stripe.checkout.sessions.create({
    //     payment_method_types: ['card'],
    //     billing_address_collection: 'required',
    //     customer,
    //     line_items: [
    //       {
    //         price: priceId,
    //         quantity: 1,
    //       },
    //     ],
    //     mode: 'subscription',
    //     allow_promotion_codes: true,
    //     subscription_data: {
    //       trial_period_days: TRIAL_DAYS,
    //       trial_settings: {
    //         end_behavior: {
    //           missing_payment_method: 'cancel',
    //         },
    //       },
    //       metadata: {},
    //     },
    //     success_url: toSiteURL(
    //       `/organization/${organizationId}/settings/billing`,
    //     ),
    //     cancel_url: toSiteURL(`/organization/${organizationId}/settings/billing`),
    //   });

    //   return stripeSession.id;
  } else {
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      customer,
      line_items: [
        {
          //price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      subscription_data: {
        trial_from_plan: true,
        metadata: {},
      },
      success_url: toSiteURL(
        `/candidate/purchase-tokens/success?client=${customer}`,
      ),
      cancel_url: toSiteURL(`/candidate/purchase-tokens`),
    });

    return stripeSession.id;
  }
}

export const retriveStripeCheckoutSessionPurchaseDetails = async (
  checkoutSessionId: string,
): Promise<StripeCheckoutSessionDetails> => {
  const session = await stripe.checkout.sessions.retrieve(checkoutSessionId);
  if (!session) {
    throw new Error('No session found');
  }

  const customerDetails = session.customer_details;
  if (!customerDetails) {
    throw new Error('No customer details found');
  }

  // if (!session.line_items) {
  //   throw new Error('No line items found');
  // }
  // const product = session.line_items[0];
  // if (!product) {
  //   throw new Error('No product found');
  // }

  return {
    customer_details: {
      name: customerDetails?.name || '',
    },
    // product: {
    //   name: product.custom.name,
    //   price: product.amount_total / 100,
    //   quantity: product.quantity,
    // },
  };
};
