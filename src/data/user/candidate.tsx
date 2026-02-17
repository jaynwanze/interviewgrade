'use server';

import { createSupabaseUserServerActionClient } from '@/supabase-clients/user/createSupabaseUserServerActionClient';
import type {
  JobTracker,
  NormalizedSubscription,
  Product,
  SAPayload,
  StripeCheckoutSessionDetails,
  SupabaseFileUploadOptions,
  Table,
} from '@/types';
import { extractResumeMetadataFromUrl } from '@/utils/extractResumeMetadata';
import { toSiteURL } from '@/utils/helpers';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import { stripe } from '@/utils/stripe';
import type { AuthUserMetadata } from '@/utils/zod-schemas/authUserMetadata';
import { User } from '@supabase/supabase-js';
import slugify from 'slugify';
import urlJoin from 'url-join';
import { createOrRetrieveCandidateCustomer } from '../admin/stripe';
import { refreshSessionAction } from './session';
import { getCandidateUserProfile } from './user';
import { TemplateMode } from '@/utils/constants';
import { getSubscriptionLimits, checkFeatureAccess } from '@/utils/checkAccess';
import { supabaseAdminClient } from '@/supabase-clients/admin/supabaseAdminClient';

export async function updateCandidateProfileDetailsAction({
  currentUser,
  city,
  country,
  phone_number,
  role,
  industry,
  linkedin_url,
  resume_url,
}: {
  currentUser: User;
  city?: string;
  country?: string;
  phone_number?: string;
  role?: string;
  industry?: string;
  linkedin_url?: string;
  resume_url?: string;
}) {
  const user = currentUser;
  if (!user) {
    throw new Error('User not found');
  }

  //Background resume extraction
  if (resume_url) {
    startResumeExtractionInBackground(currentUser.id, resume_url);
  }
  const supabase = createSupabaseUserServerActionClient();
  const { data, error } = await supabase
    .from('candidates')
    .update({
      city,
      country,
      phone_number,
      linkedin_url,
      role,
      industry,
      resume_url,
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update candidate: ${error.message}`);
  }

  return data;
}

async function startResumeExtractionInBackground(
  candidateId: string,
  resumeUrl: string,
) {
  extractAndSaveMetadata(candidateId, resumeUrl);
}

async function extractAndSaveMetadata(candidateId: string, resumeUrl: string) {
  try {
    const resume_metadata = await extractResumeMetadataFromUrl(resumeUrl);
    const supabase = createSupabaseUserServerActionClient();
    await supabase
      .from('candidates')
      .update({ resume_metadata })
      .eq('id', candidateId);
  } catch (err) {
    console.error('Resume extraction failed:', err);
  }
}

export async function createCandidatePortalSessionAction(): Promise<string> {
  const user = await serverGetLoggedInUser();
  if (!user) throw Error('Could not get user');
  const { user_metadata } = user;
  if (user_metadata.userType !== 'candidate')
    throw Error('Logged in user is not a candidate');

  const candidate = await getCandidateUserProfile(user.id);
  if (!candidate) throw Error('Could not get candidate profile');

  if (!candidate.stripe_customer_id) {
    throw Error('No Stripe customer ID found for this candidate');
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: candidate.stripe_customer_id,
    return_url: toSiteURL('/candidate/settings/billing'),
  });

  return portalSession.url;
}

// export async function updateCandidateSkillStatsAction({
//     candidateId,
//     newCandidateSkillStats,
//     interviewMode,
// }: {
//     candidateId: string;
//     newCandidateSkillStats: CandidateSkillsStats;
//     interviewMode: InterviewMode;
// }) {
//     const supabase = createSupabaseUserServerActionClient();
//     const insertColumn =
//         interviewMode === InterviewMode.PRACTICE
//             ? 'interview_skill_stats'
//             : 'practice_skill_stats_live';

//     return data;
// }
export async function getMonthlyUsage(
  templateMode: TemplateMode,
): Promise<number> {
  const user = await serverGetLoggedInUser();
  const supabase = createSupabaseUserServerActionClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('interviews')
    .select('*', { count: 'exact', head: true })
    .eq('candidate_id', user.id)
    .eq('mode', templateMode)
    .gte('created_at', startOfMonth.toISOString());

  if (error) {
    console.error('Error getting usage:', error);
    return 0;
  }

  return count || 0;
}

export async function canStartSession(mode: TemplateMode): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  isPro: boolean;
}> {
  const limits = await getSubscriptionLimits();
  const currentUsage = await getMonthlyUsage(mode);

  const limit =
    mode === 'practice'
      ? limits.practiceSessionsPerMonth
      : limits.mockInterviewsPerMonth;

  const isPro = limit === Infinity;
  const remaining = Math.max(0, limit - currentUsage);

  return {
    allowed: remaining > 0 || isPro,
    remaining: isPro ? Infinity : remaining,
    limit: isPro ? Infinity : limit,
    isPro,
  };
}

/**
 * Auto-sync subscription from Stripe if database is out of sync
 */
async function autoSyncSubscriptionFromStripe(
  stripeCustomerId: string,
  candidateId: string,
): Promise<void> {
  try {
    console.log(`Auto-syncing subscription for candidate: ${candidateId}`);

    // Get active subscription from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'all',
      limit: 1,
    });

    // Use admin client directly (it's already instantiated, not a function)
    const adminClient = supabaseAdminClient;

    if (subscriptions.data.length === 0) {
      // No subscription in Stripe - make sure DB is clear
      await adminClient
        .from('subscriptions')
        .delete()
        .eq('candidate_id', candidateId);
      return;
    }

    const stripeSubscription = subscriptions.data[0];

    // Skip if subscription is not active or trialing
    if (!['active', 'trialing'].includes(stripeSubscription.status)) {
      console.log(
        `Subscription status is ${stripeSubscription.status}, skipping sync`,
      );
      return;
    }

    const priceId = stripeSubscription.items.data[0]?.price.id;

    if (!priceId) {
      console.log('No price ID found in Stripe subscription');
      return;
    }

    // Find the product in our database
    const { data: product, error: productError } = await adminClient
      .from('products')
      .select('id')
      .eq('price_id', priceId)
      .single();

    if (productError || !product) {
      console.error('Product not found for price:', priceId, productError);
      return;
    }

    const subscriptionData = {
      candidate_id: candidateId,
      product_id: product.id,
      status: stripeSubscription.status,
      quantity: stripeSubscription.items.data[0]?.quantity || 1,
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      current_period_start: new Date(
        stripeSubscription.current_period_start * 1000,
      ).toISOString(),
      current_period_end: new Date(
        stripeSubscription.current_period_end * 1000,
      ).toISOString(),
      created: new Date(stripeSubscription.created * 1000).toISOString(),
      ended_at: stripeSubscription.ended_at
        ? new Date(stripeSubscription.ended_at * 1000).toISOString()
        : null,
      cancel_at: stripeSubscription.cancel_at
        ? new Date(stripeSubscription.cancel_at * 1000).toISOString()
        : null,
      canceled_at: stripeSubscription.canceled_at
        ? new Date(stripeSubscription.canceled_at * 1000).toISOString()
        : null,
      trial_start: stripeSubscription.trial_start
        ? new Date(stripeSubscription.trial_start * 1000).toISOString()
        : null,
      trial_end: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000).toISOString()
        : null,
      metadata: {
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscription.id,
      },
    };

    const { error: upsertError } = await adminClient
      .from('subscriptions')
      .upsert(subscriptionData, { onConflict: 'candidate_id' });

    if (upsertError) {
      console.error('Error upserting subscription:', upsertError);
    } else {
      console.log('Subscription synced successfully');
    }
  } catch (error) {
    console.error('Auto-sync failed:', error);
    // Don't throw - this is a background operation
  }
}
export const getCurrentCandidateSubscription =
  async (): Promise<NormalizedSubscription> => {
    try {
      const user = await serverGetLoggedInUser();
      const candidate = await getCandidateUserProfile(user.id);

      if (!candidate) {
        return { type: 'no-subscription' };
      }

      const supabase = createSupabaseUserServerActionClient();

      const { data: subscriptionData, error } = await supabase
        .from('subscriptions')
        .select('*, products(*)')
        .eq('candidate_id', candidate.id)
        .in('status', ['trialing', 'active'])
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        // Don't throw, try to continue
      }
      let currentSubscription = subscriptionData;

      // If we have a Stripe customer, verify sync with Stripe
      if (candidate.stripe_customer_id) {
        // Case 1: No subscription in DB but customer exists - try to sync
        if (!subscriptionData) {
          console.log('No subscription in DB, attempting sync...');
          await autoSyncSubscriptionFromStripe(
            candidate.stripe_customer_id,
            candidate.id,
          );

          // Re-fetch after sync
          const { data: syncedData, error: syncError } = await supabase
            .from('subscriptions')
            .select('*, products(*)')
            .eq('candidate_id', candidate.id)
            .in('status', ['trialing', 'active'])
            .maybeSingle();

          if (syncError) {
            console.error('Error fetching synced subscription:', syncError);
          }
          currentSubscription = syncedData;
        }
        // Case 2: Subscription exists - verify it's in sync (but don't block on this)
        else if (subscriptionData.metadata?.stripe_subscription_id) {
          try {
            const stripeSubscription = await stripe.subscriptions.retrieve(
              subscriptionData.metadata.stripe_subscription_id as string,
            );

            // Check if key fields are out of sync
            const isOutOfSync =
              subscriptionData.status !== stripeSubscription.status ||
              subscriptionData.cancel_at_period_end !==
                stripeSubscription.cancel_at_period_end;

            if (isOutOfSync) {
              console.log('Subscription out of sync, auto-syncing...');
              await autoSyncSubscriptionFromStripe(
                candidate.stripe_customer_id,
                candidate.id,
              );

              // Re-fetch after sync
              const { data: syncedData } = await supabase
                .from('subscriptions')
                .select('*, products(*)')
                .eq('candidate_id', candidate.id)
                .in('status', ['trialing', 'active'])
                .maybeSingle();

              currentSubscription = syncedData;
            }
          } catch (stripeError) {
            // If subscription not found in Stripe, it may have been deleted
            if (stripeError?.statusCode === 404) {
              console.log(
                'Subscription not found in Stripe, clearing local data...',
              );
              await autoSyncSubscriptionFromStripe(
                candidate.stripe_customer_id,
                candidate.id,
              );
              currentSubscription = null;
            } else {
              console.error('Error verifying with Stripe:', stripeError);
            }
            // Continue with database data if Stripe check fails
          }
        }
      }

      // No subscription found
      if (!currentSubscription) {
        return { type: 'no-subscription' };
      }

      // Process the subscription data
      const subscription = currentSubscription as Table<'subscriptions'> & {
        products: Product;
      };

      const product = subscription.products;

      if (!product) {
        console.error('No product found for the subscription');
        return { type: 'no-subscription' };
      }

      if (subscription.status) {
        return {
          type: subscription.status as
            | 'active'
            | 'trialing'
            | 'past_due'
            | 'canceled'
            | 'paused'
            | 'incomplete'
            | 'incomplete_expired'
            | 'unpaid',
          product: product,
          subscription,
        };
      }

      return { type: 'no-subscription' };
    } catch (error) {
      console.error('Error in getCurrentCandidateSubscription:', error);
      return { type: 'no-subscription' };
    }
  };

export const updateCandidateDetails = async (
  {
    city,
    country,
    phoneNumber,
    role,
    industry,
    linkedin_url,
    resume_url,
  }: {
    fullName?: string;
    avatarUrl?: string;
    city?: string;
    country?: string;
    phoneNumber?: string;
    role?: string;
    industry?: string;
    linkedin_url?: string;
    resume_url?: string;
  },
  {
    isOnboardingFlow = false,
  }: {
    isOnboardingFlow?: boolean;
  } = {},
): Promise<SAPayload<Table<'candidates'>>> => {
  const supabaseClient = createSupabaseUserServerActionClient();
  const user = await serverGetLoggedInUser();

  const updatedCandidateProfile = await updateCandidateProfileDetailsAction({
    currentUser: user,
    city,
    country,
    phone_number: phoneNumber,
    role,
    industry,
    linkedin_url,
    resume_url,
  });

  if (!updatedCandidateProfile) {
    return {
      status: 'error',
      message: 'Failed to update candidate profile',
    };
  }

  if (isOnboardingFlow) {
    const updateUserMetadataPayload: Partial<AuthUserMetadata> = {
      onboardingHasCompletedCandidateDetails: true,
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
    data: updatedCandidateProfile,
  };
};

export async function markTutorialAsDoneAction() {
  const supabase = createSupabaseUserServerActionClient();
  const user = await serverGetLoggedInUser();
  if (!user) {
    throw new Error('No user found');
  }

  // Update the user’s metadata
  const { error } = await supabase.auth.updateUser({
    data: { onboardingHasDoneTutorial: true },
  });
  if (error) {
    throw new Error(error.message);
  }

  // Refresh session so the user metadata is up-to-date
  const refreshResult = await refreshSessionAction();
  if (refreshResult.status === 'error') {
    throw new Error(refreshResult.message);
  }

  return { status: 'success' as const };
}

export async function uploadPublicCandidateResume(
  formData: FormData,
  fileName: string,
  fileOptions?: SupabaseFileUploadOptions,
): Promise<SAPayload<string>> {
  const file = formData.get('file');
  if (!file) {
    return { status: 'error', message: 'No file provided' };
  }

  const user = await serverGetLoggedInUser();
  if (!user) {
    return { status: 'error', message: 'User not found' };
  }

  const supabase = createSupabaseUserServerActionClient();

  // maybe store in the same 'public-user-assets' bucket or create a 'resumes' bucket
  const slug = slugify(fileName, { lower: true, strict: true });
  const path = `${user.id}/resume/${slug}`; // path in your bucket

  const { data, error } = await supabase.storage
    .from('public-user-assets')
    .upload(path, file, fileOptions);

  if (error) {
    return { status: 'error', message: error.message };
  }

  const supabaseFileUrl = urlJoin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    '/storage/v1/object/public/public-user-assets',
    data.path,
  );

  return {
    status: 'success',
    data: supabaseFileUrl,
  };
}

export async function deletePublicCandidateResume(
  resumeUrl: string,
): Promise<SAPayload> {
  const user = await serverGetLoggedInUser();
  if (!user) {
    return { status: 'error', message: 'User not found' };
  }

  const supabase = createSupabaseUserServerActionClient();

  const path = new URL(resumeUrl).pathname;
  const { error } = await supabase.storage
    .from('public-user-assets')
    .remove([path]);

  if (error) {
    return { status: 'error', message: error.message };
  }

  return { status: 'success' };
}

export async function fetchJobTrackerApplications(): Promise<
  Table<'job_application_tracker'>[]
> {
  const user = await serverGetLoggedInUser();
  const { user_metadata, id } = user;
  if (user_metadata.userType === 'employee') {
    throw new Error('This user is not a candidate');
  }

  const supabase = createSupabaseUserServerActionClient();
  const { data, error } = await supabase
    .from('job_application_tracker')
    .select('*')
    .eq('candidate_id', id);

  if (error) {
    throw new Error(
      `Failed to fetch job tracker applications: ${error.message}`,
    );
  }
  if (!data) {
    return [];
  }

  return data;
}

export async function updateCandidateSummary(
  candidateId: string,
  summary: string,
): Promise<Table<'candidates'>> {
  const supabase = createSupabaseUserServerActionClient();
  const { data, error } = await supabase
    .from('candidates')
    .update({
      summary,
    })
    .eq('id', candidateId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update candidate summary: ${error.message}`);
  }

  if (!data) {
    throw new Error('No data returned from Supabase');
  }

  return data;
}

export async function addJobTrackerApplication(
  newJob: Partial<JobTracker>,
): Promise<Table<'job_application_tracker'>> {
  const user = await serverGetLoggedInUser();
  const { user_metadata, id } = user;
  if (user_metadata.userType === 'employee') {
    throw new Error('This user is not a candidate');
  }

  const supabase = createSupabaseUserServerActionClient();

  const { data, error } = await supabase
    .from('job_application_tracker')
    .insert({
      ...newJob,
      candidate_id: id,
      job_title: newJob.job_title || '',
      status: newJob.status || 'not_started',
      company: newJob.company || '',
      deadline: newJob.deadline || '',
      created_at: newJob.created_at || new Date().toISOString(),
    })
    .eq('candidate_id', id)
    .select();

  if (error) {
    throw new Error(`Failed to add job application: ${error.message}`);
  }

  return data[0];
}
// ...existing code...

export async function getEmployersInterestedInCandidate() {
  const user = await serverGetLoggedInUser();
  const candidateId = user.id;

  const { data, error } = await createSupabaseUserServerActionClient()
    .from('employee_candidate_unlocks')
    .select(
      `
      employee_id,
      employees (
        id,
        default_organization,
        user_profiles (
          full_name,
          avatar_url
        ),
        organizations!employees_default_organization_fkey (
          title
        )
      )
    `,
    )
    .eq('candidate_id', candidateId);

  if (error) {
    console.error('Error fetching employer interests:', error.message);
    throw new Error('Unable to fetch interested employers');
  }

  return (
    data?.map((entry) => {
      // Handle employees as array or single object
      const employee = Array.isArray(entry.employees)
        ? entry.employees[0]
        : entry.employees;

      // Handle array or single object for user_profiles
      const userProfile = Array.isArray(employee?.user_profiles)
        ? employee.user_profiles[0]
        : employee?.user_profiles;

      // Handle array or single object for organizations
      const organization = Array.isArray(employee?.organizations)
        ? employee.organizations[0]
        : employee?.organizations;

      return {
        employer_id: entry.employee_id,
        employer_name: userProfile?.full_name ?? 'Unknown',
        logo_url: userProfile?.avatar_url ?? '',
        organization_title: organization?.title ?? 'Unknown Org',
      };
    }) ?? []
  );
}

export async function updateJobTrackerApplication(
  updatedJob: Partial<JobTracker>,
): Promise<Table<'job_application_tracker'>> {
  const user = await serverGetLoggedInUser();
  const { user_metadata, id } = user;
  if (user_metadata.userType === 'employee') {
    throw new Error('This user is not a candidate');
  }

  if (!updatedJob.id) {
    throw new Error('No job ID provided');
  }

  const supabase = createSupabaseUserServerActionClient();

  const { data, error } = await supabase
    .from('job_application_tracker')
    .update({
      ...updatedJob,
      deadline: updatedJob.deadline || '',
    })
    .eq('id', updatedJob.id)
    .eq('candidate_id', id)
    .select();

  if (error) {
    throw new Error(`Failed to update job application: ${error.message}`);
  }

  return data[0];
}

export async function deleteJobTrackerApplication(
  jobTrackerId: string,
): Promise<void> {
  const user = await serverGetLoggedInUser();
  const { user_metadata, id } = user;
  if (user_metadata.userType === 'employee') {
    throw new Error('This user is not a candidate');
  }

  const supabase = createSupabaseUserServerActionClient();

  const { error } = await supabase
    .from('job_application_tracker')
    .delete()
    .eq('id', jobTrackerId)
    .eq('candidate_id', id);

  if (error) {
    throw new Error(`Failed to delete job application: ${error.message}`);
  }
}

// For subscriptions only for now
export async function createCandidateSessionAction({
  priceId,
  // isTrial = false,
}: {
  priceId: string;
  // isTrial?: boolean;
}) {
  const TRIAL_DAYS = 14;
  const user = await serverGetLoggedInUser();
  if (!user) throw Error('Could not get user');
  const { user_metadata } = user;
  if (user_metadata.userType !== 'candidate')
    throw Error('Logged in user is not a candidate');
  if (!user.email) throw Error('User email not found');

  const customer = await createOrRetrieveCandidateCustomer({
    candidate_id: user.id,
    email: user.email || '',
  });
  if (!customer) throw Error('Could not get customer');

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

  const stripeSession = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    billing_address_collection: 'required',
    customer,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    allow_promotion_codes: true,
    subscription_data: {
      trial_from_plan: true,
      metadata: {},
    },
    success_url: toSiteURL(`/candidate/settings/billing`),
    cancel_url: toSiteURL(`/candidate/settings/billing`),
  });

  return stripeSession.id;
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

  if (!session.metadata) {
    throw new Error('No metadata found');
  }
  if (!session.amount_total) {
    throw new Error('No amount total found');
  }
  if (!session.metadata.product_type) {
    throw new Error('No product name found');
  }
  if (!session.metadata.quantity) {
    throw new Error('No quantity found');
  }

  return {
    customer_details: {
      name: customerDetails?.name || '',
    },
    product: {
      type: session.metadata?.product_type || '',
      price: session.amount_total || 0,
      quantity: Number(session.metadata?.quantity) || 0,
    },
  };
};
