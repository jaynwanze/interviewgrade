'use server';
import { createSupabaseUserServerActionClient } from '@/supabase-clients/user/createSupabaseUserServerActionClient';
import { createSupabaseUserServerComponentClient } from '@/supabase-clients/user/createSupabaseUserServerComponentClient';
import type {
  CandidateDetailsView,
  CandidateRow,
  EmployerCandidatePreferences,
  Product,
  RecentAttempt,
  SAPayload,
  StripeCheckoutSessionDetails,
  Table,
} from '@/types';
import { toSiteURL } from '@/utils/helpers';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import { stripe } from '@/utils/stripe';
import { AuthUserMetadata } from '@/utils/zod-schemas/authUserMetadata';
import { createOrRetrieveEmployeeCustomer } from '../admin/stripe';
import { refreshSessionAction } from './session';
import { getEmployeeUserProfile } from './user';

export async function unlockCandidateAction(
  candidateId: string,
): Promise<SAPayload<boolean>> {
  const user = await serverGetLoggedInUser();
  if (!user) {
    throw new Error('User not found');
  }
  const employerId = user.id;
  // 1) fetch tokens for employer
  const tokens = await getCurrentEmployeeTokens();
  if (!tokens) {
    throw new Error('No tokens found for employer');
  }
  // 2) if tokens < 1 => throw error
  if (tokens.tokens_available < 1) {
    throw new Error('No tokens available');
  }
  // 3) decrement token
  const updatedTokens = await createSupabaseUserServerActionClient()
    .from('tokens')
    .update({ tokens_available: tokens.tokens_available - 1 })
    .eq('id', tokens.id)
    .single();
  if (!updatedTokens) {
    throw new Error('Error updating tokens');
  }

  // 4) insert into employee_candidate_unlocks
  const { error: unlockError } = await createSupabaseUserServerActionClient()
    .from('employee_candidate_unlocks')
    .insert([
      {
        employee_id: employerId,
        candidate_id: candidateId,
        created_at: new Date().toISOString(),
      },
    ])
    .single();
  if (unlockError) {
    // rollback token
    await createSupabaseUserServerActionClient()
      .from('tokens')
      .update({ tokens_available: tokens.tokens_available })
      .eq('id', tokens.id)
      .single();

    return {
      status: 'error',
      message:
        unlockError.message ||
        'Error unlocking candidate but your tokens have not been deducted. Please try again',
    };
  }

  // 5) return success
  return {
    status: 'success',
    data: true,
  };
}

export async function getCandidates(): Promise<CandidateRow[]> {
  const { data: candidates, error: candidatesError } =
    await createSupabaseUserServerComponentClient()
      .from('candidates')
      .select('*');

  if (candidatesError) {
    throw new Error('Error fetching candidates');
  }

  if (!candidates) {
    return [];
  }

  const candidateIds = candidates?.map((candidate) => candidate.id) || [];
  const { data: userProfiles, error: userErrors } =
    await createSupabaseUserServerComponentClient()
      .from('user_profiles')
      .select('id,full_name, avatar_url,email')
      .in('id', candidateIds);

  if (userErrors) {
    throw new Error('Error fetching  candidates details');
  }

  if (!userProfiles) {
    return [];
  }

  return candidates.map((candidate) => {
    const userProfile = userProfiles.find(
      (profile) => profile.id === candidate.id,
    );

    return {
      ...candidate,
      full_name: userProfile?.full_name ?? '',
      avatar_url: userProfile?.avatar_url ?? '',
      email: userProfile?.email ?? '',
    };
  });
}

export async function getRecentAttempts(
  candidateId: string,
): Promise<RecentAttempt[]> {
  if (!candidateId) {
    throw new Error('Candidate ID is required to fetch recent attempts');
  }

  const { data: interviews, error: interviewsError } =
    await createSupabaseUserServerComponentClient()
      .from('interviews')
      .select('*');

  if (interviewsError) {
    console.error('Error fetching recent attempts:', interviewsError.message);
    throw new Error('Error fetching recent attempts');
  }

  if (!interviews || interviews.length === 0) {
    console.warn('No recent attempts found for candidateId:', candidateId);
    return [];
  }

  console.log('Fetched interviews:', interviews);

  const interviewIds = interviews.map((interview) => interview.id);

  const { data: evals, error: evalErrors } =
    await createSupabaseUserServerComponentClient()
      .from('interview_evaluations')
      .select('*')
      .in('interview_id', interviewIds);

  if (evalErrors) {
    console.error(
      'Error fetching recent attempts evaluations:',
      evalErrors.message,
    );
    throw new Error('Error fetching recent attempts evaluations');
  }

  if (!evals || evals.length === 0) {
    console.warn('No evaluations found for interviewIds:', interviewIds);
    return [];
  }

  console.log('Fetched evaluations:', evals);

  return interviews.map((interview) => {
    const evaluation = evals.find((ev) => ev.interview_id === interview.id);

    return {
      interview_id: interview.id,
      interview_mode: interview.mode,
      date: interview.end_time,
      skillFocus: interview.title, // replace with actual value
      score: evaluation?.overall_grade ?? 0,
    } as RecentAttempt;
  });
}
export async function getCandidateById(
  candidateId: string,
): Promise<CandidateDetailsView | null> {
  const { data: candidate, error: candidateError } =
    await createSupabaseUserServerComponentClient()
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .single();

  if (candidateError) {
    throw new Error('Error fetching candidate');
  }

  if (!candidate) {
    return null;
  }

  const { data: userProfile, error: userError } =
    await createSupabaseUserServerComponentClient()
      .from('user_profiles')
      .select('id,full_name, avatar_url,email')
      .eq('id', candidateId)
      .single();

  if (userError) {
    throw new Error('Error fetching candidate details');
  }

  if (!userProfile) {
    return null;
  }

  const recentAttempts = await getRecentAttempts(candidateId);

  const user = await serverGetLoggedInUser();
  if (!user) {
    throw new Error('User not found');
  }
  const employerId = user.id;
  const isUnlocked = await checkIsCandidateUnlocked(candidateId, employerId);
  if (!isUnlocked) {
    candidate.resume_url = '';
    userProfile.email = '';
  }

  return {
    ...candidate,
    full_name: userProfile.full_name ?? '',
    avatar_url: userProfile.avatar_url ?? '',
    email: userProfile.email ?? '',
    recentAttempts,
    isUnlocked,
  };
}

export async function checkIsCandidateUnlocked(
  candidateId: string,
  employerId: string,
): Promise<boolean> {
  const { data, error } = await createSupabaseUserServerComponentClient()
    .from('employee_candidate_unlocks')
    .select('*')
    .eq('candidate_id', candidateId)
    .eq('employee_id', employerId)
    .maybeSingle();

  if (error) {
    console.error('Error checking if candidate is unlocked:', error.message);
    throw new Error('Error checking if candidate is unlocked');
  }

  if (!data) {
    return false;
  }

  return !!data;
}

// export async function fetchEmployerPreferences(): Promise<
//   EmployerCandidatePreferences | null
// > {
//   const { data, error } = await createSupabaseUserServerComponentClient()
//     .from('employees')
//     .select('candidate_preferences');

//   if (error) {
//     console.error('Error fetching employer preferences:', error);
//     return null;
//   }

//   if (!data || data.length === 0) {
//     return null;
//   }

//   const preferences = data[0].candidate_preferences as EmployerCandidatePreferences;
//   return preferences;
// }

export const getCurrentEmployeeTokens =
  async (): Promise<Table<'tokens'> | null> => {
    const user = await serverGetLoggedInUser();
    if (!user) {
      throw new Error('User not found');
    }
    const employee = await getEmployeeUserProfile(user.id);
    if (!employee) {
      throw new Error('Employee not found');
    }
    const { data, error } = await createSupabaseUserServerComponentClient()
      .from('tokens')
      .select('*')
      .eq('id', employee.token_id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      console.error('No tokens found for employee:', employee);
      return null;
    }

    return data;
  };

// export const getCurrentCandidateSubscription = async (
//   candidateId: string,
// ): Promise<NormalizedSubscription> => {
//   const candidate = getCandidateUserProfile(candidateId);
//   const candidateSubscriptionId = (await candidate).subscription_id;

//   if (!candidateSubscriptionId) {
//     return {
//       type: 'no-subscription',
//     };
//   }

//   const { data: subscriptionData, error } =
//     await createSupabaseUserServerActionClient()
//       .from('subscriptions')
//       .select('*, products(*)')
//       .eq('subscription_id', candidateSubscriptionId)
//       .in('status', ['trialing', 'active'])
//       .single();

//   if (error) {
//     console.error('Error fetching subscription:', error);
//     throw error;
//   }

//   if (!subscriptionData) {
//     return {
//       type: 'no-subscription',
//     };
//   }

//   try {
//     const subscription = subscriptionData as Table<'subscriptions'> & {
//       products: Product;
//     };

//     const product = subscription.products;

//     if (!product) {
//       throw new Error('No product found for the subscription');
//     }

//     // if (subscription.status === 'trialing') {
//     //   if (!subscription.trial_start || !subscription.trial_end) {
//     //     throw new Error('No trial start or end found');
//     //   }
//     //   return {
//     //     type: 'trialing',
//     //     trialStart: subscription.trial_start,
//     //     trialEnd: subscription.trial_end,
//     //     product: product,
//     //     subscription,
//     //   };
//     // } else
//     if (subscription.status) {
//       return {
//         type: subscription.status as
//           | 'active'
//           | 'past_due'
//           | 'canceled'
//           | 'paused'
//           | 'incomplete'
//           | 'incomplete_expired'
//           | 'unpaid',
//         product: product,
//         subscription,
//       };
//     } else {
//       return {
//         type: 'no-subscription',
//       };
//     }
//   } catch (err) {
//     console.error('Error processing subscription:', err);
//     return {
//       type: 'no-subscription',
//     };
//   }
// };

export async function createCustomerEmployeePortalLinkAction(
  candidateId: string,
) {
  const employee = await getEmployeeUserProfile(candidateId);
  if (!employee) throw Error('Could not get candidate profile');
  if (!employee.stripe_customer_id) {
    throw Error('No stripe customer id found');
  }
  const { url } = await stripe.billingPortal.sessions.create({
    customer: employee.stripe_customer_id,
    return_url: toSiteURL(`/employee`),
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
    .eq('status', 'active')
    .order('price_unit_amount', { ascending: true });

  if (error) {
    console.error('Error fetching active products:', error);
    throw error;
  }

  return data || [];
};

export async function createEmployeeSessionAction({
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
  const employee = await getEmployeeUserProfile(user.id);
  if (user.id !== employee.id)
    throw Error('Logged in user is not the employee');
  if (!user.email) throw Error('User email not found');

  const customer = await createOrRetrieveEmployeeCustomer({
    employee_id: employee.id,
    email: user.email || '',
  });
  if (!customer) throw Error('Could not get customer');
  if (isTokenBundlePurchase) {
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      customer,
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
    //       `/employer/${organizationId}/settings/billing`,
    //     ),
    //     cancel_url: toSiteURL(`/employer/${organizationId}/settings/billing`),
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

export const saveEmployerPreferences = async (
  {
    location,
    industry,
    skills,
  }: {
    location: string;
    industry: string;
    skills: string;
  },
  {
    isOnboardingFlow = false,
  }: {
    isOnboardingFlow?: boolean;
  } = {},
): Promise<SAPayload<Table<'employees'>>> => {
  'use server';
  const supabaseClient = createSupabaseUserServerActionClient();
  const user = await serverGetLoggedInUser();

  if (!user) {
    return {
      status: 'error',
      message: 'User not found',
    };
  }
  let updatedEmployer: Table<'employees'> | null = null;
  const candidatePreferences: EmployerCandidatePreferences = {
    location,
    industry,
    skills,
  };
  try {
    const { data, error } = await supabaseClient
      .from('employees')
      .update({ candidate_preferences: candidatePreferences })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return {
        status: 'error',
        message: error.message,
      };
    }

    if (!data) {
      return {
        status: 'error',
        message: 'No employer found',
      };
    }

    updatedEmployer = data;
  } catch (error) {
    return {
      status: 'error',
      message: error.message,
    };
  }

  if (!updatedEmployer) {
    return {
      status: 'error',
      message: 'Failed to update employer profile',
    };
  }

  if (isOnboardingFlow) {
    const updateUserMetadataPayload: Partial<AuthUserMetadata> = {
      onboardingHasSetEmployerPrefs: true,
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
    data: updatedEmployer,
  };
};

export const getEmployerCandidatePreferences =
  async (): Promise<EmployerCandidatePreferences | null> => {
    const supabase = createSupabaseUserServerComponentClient();

    const user = await serverGetLoggedInUser();
    if (!user) {
      throw new Error('User not found');
    }

    const { user_metadata, id } = user;

    if (user_metadata.userType !== 'employer') {
      throw new Error('User is not an employer');
    }

    const employerId = id;

    const { data, error } = await supabase
      .from('employees')
      .select('candidate_preferences')
      .eq('id', employerId)
      .maybeSingle();

    if (error) {
      throw new Error('Error fetching employer preferences');
    }

    if (!data) {
      console.warn('No employer candidate preferences found for:', employerId);
      return null;
    }

    return data.candidate_preferences;
  };
