'use client';

import { ConfirmDeleteAccountDialog } from '@/components/Settings/ConfirmDeleteAccountDialog';
import { UpdateAvatarAndNameBody } from '@/components/UpdateAvatarAndName';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  updateUserProfileNameAndAvatar,
  uploadPublicUserAvatar,
} from '@/data/user/user';
import { useSAToastMutation } from '@/hooks/useSAToastMutation';
import type { Table } from '@/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CandidateAccountSettings({
  userProfile,
  userEmail,
}: {
  userProfile: Table<'user_profiles'>;
  userEmail: string | undefined;
}) {
  const router = useRouter();
  const { mutate, isLoading } = useSAToastMutation(
    async ({
      fullName,
      avatarUrl,
    }: {
      fullName: string;
      avatarUrl?: string;
    }) => {
      return await updateUserProfileNameAndAvatar({
        fullName,
        avatarUrl,
      });
    },
    {
      loadingMessage: 'Updating profile...',
      errorMessage(error) {
        try {
          if (error instanceof Error) {
            return String(error.message);
          }
          return `Failed to update profile ${String(error)}`;
        } catch (_err) {
          console.warn(_err);
          return 'Failed to update profile';
        }
      },
      successMessage: 'Profile updated!',
    },
  );

  const [isNewAvatarImageLoading, setIsNewAvatarImageLoading] =
    useState<boolean>(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    userProfile.avatar_url ?? undefined,
  );

  const { mutate: upload, isLoading: isUploading } = useSAToastMutation(
    async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return await uploadPublicUserAvatar(formData, file.name, {
        upsert: true,
      });
    },
    {
      loadingMessage: 'Uploading avatar...',
      errorMessage(error) {
        try {
          if (error instanceof Error) {
            return String(error.message);
          }
          return `Failed to upload avatar ${String(error)}`;
        } catch (_err) {
          console.warn(_err);
          return 'Failed to upload avatar';
        }
      },
      successMessage: 'Avatar uploaded!',
      onSuccess: (response) => {
        if (response.status === 'success' && response.data) {
          router.refresh();
          setAvatarUrl(response.data);
          setIsNewAvatarImageLoading(true);
        }
      },
      onError: (error) => {
        console.log(String(error));
      },
    },
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Update the name and avatar shown across InterviewGrade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xl">
            <UpdateAvatarAndNameBody
              onSubmit={(fullName: string) => {
                mutate({
                  fullName,
                  avatarUrl,
                });
              }}
              onFileUpload={(file: File) => {
                upload(file);
              }}
              userId={userProfile.id}
              userEmail={userEmail}
              isNewAvatarImageLoading={isNewAvatarImageLoading}
              setIsNewAvatarImageLoading={setIsNewAvatarImageLoading}
              isUploading={isUploading}
              isLoading={isLoading ?? isUploading}
              profileAvatarUrl={avatarUrl ?? undefined}
              profileFullname={userProfile.full_name ?? undefined}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base">Delete account</CardTitle>
          <CardDescription>
            Permanently delete your InterviewGrade account and associated data. This
            cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConfirmDeleteAccountDialog />
        </CardContent>
      </Card>
    </div>
  );
}
