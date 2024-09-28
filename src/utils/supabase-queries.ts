import { AppSupabaseClient } from '@/types';
import { User } from '@supabase/supabase-js';
import { errors } from './errors';
import { toSiteURL } from './helpers';

export const getActiveProductsWithPrices = async (
  supabase: AppSupabaseClient,
) => {
  const { data, error } = await supabase
    .from('products')
    .select('*, prices(*)')
    .eq('active', true)
    .eq('prices.active', true)
    .order('unit_amount', { foreignTable: 'prices' });

  if (error) {
    errors.add(error.message);
    throw error;
  }

  return data || [];
};

export const updateUserName = async (
  supabase: AppSupabaseClient,
  user: User,
  name: string,
) => {
  await supabase
    .from('user_profiles')
    .update({
      full_name: name,
    })
    .eq('id', user.id);
};

export const getOrganizationById = async (
  supabase: AppSupabaseClient,
  organizationId: string,
) => {
  const { data, error } = await supabase
    .from('organizations')
    // query team_members and team_invitations in one go
    .select('*')
    .eq('id', organizationId)
    .single();

  if (error) {
    errors.add(error.message);
    throw error;
  }

  return data;
};

export const createOrganization = async (
  supabase: AppSupabaseClient,
  user: User,
  name: string,
) => {
  const { data, error } = await supabase
    .from('organizations')
    .insert({
      title: name,
      created_by: user.id,
    })
    .select('*')
    .single();

  if (error) {
    errors.add(error.message);
    throw error;
  }

  return data;
};

export const getTeamMembersInOrganization = async (
  supabase: AppSupabaseClient,
  organizationId: string,
) => {
  const { data, error } = await supabase
    .from('organization_members')
    .select('*, user_profiles(*)')
    .eq('organization_id', organizationId);

  if (error) {
    errors.add(error.message);
    throw error;
  }

  return data || [];
};

export const getPendingTeamInvitationsInOrganization = async (
  supabase: AppSupabaseClient,
  organizationId: string,
) => {
  const { data, error } = await supabase
    .from('organization_join_invitations')
    .select(
      '*, inviter:user_profiles!inviter_user_id(*), invitee:user_profiles!invitee_user_id(*)',
    )
    .eq('organization_id', organizationId)
    .eq('status', 'active');

  if (error) {
    errors.add(error.message);
    throw error;
  }

  return data || [];
};

export const getOrganizationSubscription = async (
  supabase: AppSupabaseClient,
  organizationId: string,
) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, prices(*, products(*))')
    .eq('organization_id', organizationId)
    .in('status', ['trialing', 'active'])
    .single();

  if (error) {
    errors.add(error.message);
    throw error;
  }

  return data;
};

export const getUserOrganizationRole = async (
  supabase: AppSupabaseClient,
  userId: string,
  organizationId: string,
) => {
  const { data, error } = await supabase
    .from('organization_members')
    .select('member_id, member_role')
    .eq('member_id', userId)
    .eq('organization_id', organizationId)
    .single();

  if (error) {
    errors.add(error.message);
    throw error;
  }

  return data;
};

/* ==================== */
/* AUTH */
/* ==================== */

export const signInWithMagicLink = async (
  supabase: AppSupabaseClient,
  email: string,
  next?: string,
) => {
  const redirectUrl = new URL(toSiteURL('/auth/callback'));
  if (next) {
    redirectUrl.searchParams.set('next', next);
  }
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectUrl.toString(),
    },
  });

  if (error) {
    errors.add(error.message);
    throw error;
  }
};

export const signInWithPassword = async (
  supabase: AppSupabaseClient,
  email: string,
  password: string,
) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    errors.add(error.message);
    throw error;
  }
};

export const resetPassword = async (
  supabase: AppSupabaseClient,
  email: string,
) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: toSiteURL('/update-password'),
  });

  if (error) {
    errors.add(error.message);
    throw error;
  }
};

export const updatePassword = async (
  supabase: AppSupabaseClient,
  password: string,
) => {
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    errors.add(error.message);
    throw error;
  }
};
