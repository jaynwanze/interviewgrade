'use server';
import { createSupabaseUserServerActionClient } from '@/supabase-clients/user/createSupabaseUserServerActionClient';
import type { AuthProvider, SAPayload } from '@/types';
import { toSiteURL } from '@/utils/helpers';
import { UserType } from '@/types/userTypes';
export const signUp = async (
  email: string,
  password: string,
  userType: UserType,
): Promise<SAPayload> => {
  const supabase = createSupabaseUserServerActionClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: toSiteURL('/auth/callback'),
      data: { userType },

      
    },
  });
  if (error) {
    return {
      status: 'error',
      message: error.message,
    };
  }

  return {
    status: 'success',
  };
};

export const signInWithPassword = async (
  email: string,
  password: string,
): Promise<SAPayload> => {
  const supabase = createSupabaseUserServerActionClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.log(error);
    return {
      status: 'error',
      message: error.message,
    };
  }

  return {
    status: 'success',
  };
};

export const signInWithMagicLink = async (
  email: string,
  userType: UserType,
  next?: string,
): Promise<SAPayload> => {
  const supabase = createSupabaseUserServerActionClient();
  const redirectUrl = new URL(toSiteURL('/auth/callback'));
  if (next) {
    redirectUrl.searchParams.set('next', next);
  }
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectUrl.toString(),
      data: { userType },
    },
  });

  if (error) {
    return {
      status: 'error',
      message: error.message,
    };
  }

  return {
    status: 'success',
  };
};

export const signInWithProvider = async (
  provider: AuthProvider,
   // Accept userType as a parameter
  next?: string,
): Promise<
  SAPayload<{
    url: string;
  }>
> => {
  const supabase = createSupabaseUserServerActionClient();
  const redirectToURL = new URL(toSiteURL('/auth/callback'));
  if (next) {
    redirectToURL.searchParams.set('next', next);
  }
  const { error, data } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectToURL.toString(),
      skipBrowserRedirect: true,
    },

  });

  if (error) {
    return { status: 'error', message: error.message };
  }




  

  const providerUrl = data.url;

  return {
    status: 'success',
    data: {
      url: providerUrl,

      
    },
  };
  
};

export const resetPassword = async (email: string): Promise<SAPayload> => {
  const supabase = createSupabaseUserServerActionClient();
  const redirectToURL = new URL(toSiteURL('/auth/callback'));
  redirectToURL.searchParams.set('next', `/update-password`);

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectToURL.toString(),
  });
  if (error) {
    return {
      status: 'error',
      message: error.message,
    };
  }

  return {
    status: 'success',
  };
};
