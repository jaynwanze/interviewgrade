'use server';
import { PRODUCT_NAME } from '@/constants';
import { createSupabaseUserServerActionClient } from '@/supabase-clients/user/createSupabaseUserServerActionClient';
import { createSupabaseUserServerComponentClient } from '@/supabase-clients/user/createSupabaseUserServerComponentClient';
import type { SAPayload, SupabaseFileUploadOptions, Table } from '@/types';
import { UserType } from '@/types/userTypes';
import { sendEmail } from '@/utils/api-routes/utils';
import { toSiteURL } from '@/utils/helpers';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import type { AuthUserMetadata } from '@/utils/zod-schemas/authUserMetadata';
import { renderAsync } from '@react-email/render';
import slugify from 'slugify';
import urlJoin from 'url-join';
import ConfirmAccountDeletionEmail from '../../../emails/account-deletion-request';
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
    city,
    country,
    phoneNumber,
    summary,
    role,
    industry,
  }: {
    fullName?: string;
    avatarUrl?: string;
    city?: string;
    country?: string;
    phoneNumber?: string;
    summary?: string;
    role?: string;
    industry?: string;
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
  // if (isOnboardingFlow && user.user_metadata.userType === 'candidate') {
  //   const updatedCandidateProfile = await updateCandidateProfileDetailsAction({
  //     currentUser: user,
  //     city,
  //     country,
  //     phone_number: phoneNumber,
  //     summary,
  //     role,
  //     industry,
  //   });

  //   if (!updatedCandidateProfile) {
  //     return {
  //       status: 'error',
  //       message: 'Failed to update candidate profile',
  //     };
  //   }
  // }

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
  if (!userId) {
    throw new Error('User ID is required');
  }

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

export const getEmployeeUserProfile = async (
  userId: string,
): Promise<Table<'employees'>> => {
  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) {
    throw error;
  }
  return data;
};
