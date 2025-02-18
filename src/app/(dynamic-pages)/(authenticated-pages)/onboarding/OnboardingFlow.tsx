'use client';
import { CandidatePreferences } from '@/components/Employee/CandidatePreferences';
import { T } from '@/components/ui/Typography';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { createOrganization } from '@/data/user/organizations';
// import { createOrganization } from '@/data/user/organizations';
import {
  acceptTermsOfService,
  updateUserProfileNameAndAvatar,
  uploadPublicUserAvatar,
} from '@/data/user/user';

import { useSAToastMutation } from '@/hooks/useSAToastMutation';
import type { Table } from '@/types';
import { UserType } from '@/types/userTypes';
import { getUserAvatarUrl } from '@/utils/helpers';
import type { AuthUserMetadata } from '@/utils/zod-schemas/authUserMetadata';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { UserPlus as AddUserIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
const TermsDetailDialog = dynamic(
  () => import('./TermsDetailDialog').then((mod) => mod.TermsDetailDialog),
  {
    ssr: false,
    loading: () => <Skeleton className="w-12 h-4" />,
  },
);

const MotionImage = motion(Image);

type TermsAcceptanceProps = {
  onSuccess: () => void;
};

function TermsAcceptance({ onSuccess }: TermsAcceptanceProps) {
  const { mutate: acceptTerms, isLoading } = useSAToastMutation(
    async () => {
      return acceptTermsOfService(true);
    },
    {
      successMessage: 'Terms accepted!',
      errorMessage: 'Failed to accept terms',
      onSuccess,
    },
  );

  return (
    <Card className="max-w-[400px]" data-testid="view-terms-onboarding">
      <CardHeader>
        <CardTitle>🎉 Welcome Aboard!</CardTitle>
        <CardDescription>
          Before diving into InterviewGrade, please take a moment to go through
          our updated Terms of Service.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className=" space-y-2">
          <T.Small>
            These terms and conditions govern the use of InterviewGrade's
            products and services. They're designed to ensure a smooth and
            secure experience for you.
          </T.Small>

          <T.Subtle>
            Last updated : <strong>24th April 2024</strong>
          </T.Subtle>
        </div>
      </CardContent>
      <CardFooter>
        <TermsDetailDialog isLoading={isLoading} onConfirm={acceptTerms} />
      </CardFooter>
    </Card>
  );
}

type ProfileUpdateProps = {
  userProfile: Table<'user_profiles'>;
  onSuccess: () => void;
  userEmail: string | undefined;
  userType: UserType;
};

export function ProfileUpdate({
  userProfile,
  onSuccess,
  userType,
  userEmail,
}: ProfileUpdateProps) {
  const [fullName, setFullName] = useState(userProfile.full_name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(
    userProfile.avatar_url ?? undefined,
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasImageLoaded, setHasImageLoaded] = useState(false);

  const avatarUrlWithFallback = getUserAvatarUrl({
    profileAvatarUrl: avatarUrl ?? userProfile.avatar_url,
    email: userEmail,
  });

  const { mutate: updateProfile, isLoading: isUpdatingProfile } =
    useSAToastMutation(
      async () => {
        return await updateUserProfileNameAndAvatar(
          { fullName, avatarUrl },
          {
            isOnboardingFlow: true,
          },
        );
      },
      {
        successMessage: 'Profile updated!',
        errorMessage: 'Failed to update profile',
        onSuccess,
      },
    );

  const { mutate: uploadAvatar } = useSAToastMutation(
    async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const newAvatarUrl = await uploadPublicUserAvatar(formData, file.name, {
        upsert: true,
      });

      return newAvatarUrl;
    },
    {
      onMutate: () => {
        setIsUploading(true);
      },
      successMessage: 'Avatar uploaded!',
      errorMessage: 'Error uploading avatar',
      onSuccess: (response) => {
        setIsUploading(false);
        if (response.status === 'success') {
          setAvatarUrl(response.data);
        }
      },
    },
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAvatar(file);
    }
  };

  return (
    <>
      {userType === 'candidate' && (
        <span className="text-muted-foreground">
          Candidate profile creation
        </span>
      )}
      (
      <Card className="w-full max-w-[400px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateProfile();
          }}
          data-testid={'create-new-profile'}
        >
          <CardHeader>
            <div className="space-y-0">
              <div className="p-3 w-fit bg-muted mb-2 rounded-lg">
                <AddUserIcon className=" w-6 h-6" />
              </div>
              <div className="p-1">
                <CardTitle>Create new profile</CardTitle>
                <CardDescription>Please fill in your details.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Avatar</Label>
                <div className="mt-1 sm:col-span-2 sm:mt-0">
                  <div className="flex items-center space-x-2">
                    <MotionImage
                      animate={{
                        opacity: hasImageLoaded ? 1 : 0.8,
                      }}
                      transition={
                        hasImageLoaded
                          ? undefined
                          : {
                            duration: 0.5,
                            repeat: Number.POSITIVE_INFINITY,
                            repeatType: 'reverse',
                          }
                      }
                      onLoad={() => {
                        setHasImageLoaded(true);
                      }}
                      onLoadStart={() => {
                        setHasImageLoaded(false);
                      }}
                      placeholder="blur"
                      blurDataURL="data:image/png;base64,iVBORw0KGg0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
                      loading="eager"
                      width={24}
                      height={24}
                      className="h-12 w-12 rounded-full"
                      src={avatarUrlWithFallback}
                      alt="avatarUrl"
                    />
                    <input
                      disabled={isUploading}
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      type="file"
                      id="file-input"
                      hidden
                      accept="image/*"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        fileInputRef.current?.click();
                      }}
                      disabled={isUploading}
                    >
                      {isUploading ? 'Please wait...' : 'Change'}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Name</Label>
                <Input
                  disabled={isUpdatingProfile ?? isUploading}
                  id="name"
                  name="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name"
                  type="text"
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isUpdatingProfile || isUploading}>
              {isUpdatingProfile ? 'Saving...' : 'Save Profile'}
            </Button>
          </CardFooter>
        </form>
      </Card>
      )
    </>
  );
}

type OrganizationCreationProps = {
  onSuccess: () => void;
};

const createOrganizationSchema = z.object({
  organizationTitle: z.string().min(1),
});

type CreateOrganizationSchema = z.infer<typeof createOrganizationSchema>;

export function OrganizationCreation({ onSuccess }: OrganizationCreationProps) {
  const { mutate: createOrg, isLoading: isCreatingOrg } = useSAToastMutation(
    async (organizationTitle: string) => {
      const orgId = await createOrganization(organizationTitle, {
        isOnboardingFlow: true,
      });
      return { status: 'success', data: { status: 'success', data: orgId } };
    },
    {
      successMessage: 'Organization created!',
      errorMessage: 'Failed to create organization',
      onSuccess,
    },
  );

  const onSubmit = (data: CreateOrganizationSchema) => {
    createOrg(data.organizationTitle);
  };

  const { register, formState, handleSubmit } =
    useForm<CreateOrganizationSchema>({
      resolver: zodResolver(createOrganizationSchema),
      defaultValues: {
        organizationTitle: '',
      },
    });

  return (
    <Card>
      <form
        onSubmit={handleSubmit(onSubmit)}
        data-testid={'create-new-organization'}
      >
        <CardHeader>
          <CardTitle>Create Organization</CardTitle>
          <CardDescription>
            Please provide a name for your first organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="organizationTitle">Organization Name</Label>
            <Input
              id="organizationTitle"
              {...register('organizationTitle')}
              required
              placeholder="Organization Name"
              disabled={isCreatingOrg}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isCreatingOrg || !formState.isValid}>
            {isCreatingOrg ? 'Creating...' : 'Create Organization'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

type FLOW_STATE =
  | 'TERMS'
  | 'PROFILE'
  | 'ORGANIZATION'
  | 'CANDIDATE_PREFS'
  | 'COMPLETE';

type UserOnboardingFlowProps = {
  userProfile: Table<'user_profiles'>;
  onboardingStatus: AuthUserMetadata;
  userEmail: string | undefined;
  userType: UserType;
};

function getInitialFlowState(
  flowStates: FLOW_STATE[],
  onboardingStatus: AuthUserMetadata,
): FLOW_STATE {
  const {
    onboardingHasAcceptedTerms,
    onboardingHasCompletedProfile,
    onboardingHasCreatedOrganization,
    onboardingHasSetCandidatePrefs,
  } = onboardingStatus;

  if (!onboardingHasAcceptedTerms && flowStates.includes('TERMS')) {
    return 'TERMS';
  }

  if (!onboardingHasCompletedProfile && flowStates.includes('PROFILE')) {
    return 'PROFILE';
  }

  if (
    !onboardingHasCreatedOrganization &&
    flowStates.includes('ORGANIZATION')
  ) {
    return 'ORGANIZATION';
  }
  if (
    !onboardingHasSetCandidatePrefs &&
    flowStates.includes('CANDIDATE_PREFS')
  ) {
    return 'CANDIDATE_PREFS';
  }
  return 'COMPLETE';
}

function getAllFlowStates(
  onboardingStatus: AuthUserMetadata,
  userType: UserType,
): FLOW_STATE[] {
  const {
    onboardingHasAcceptedTerms,
    onboardingHasCompletedProfile,
    onboardingHasCreatedOrganization,
    onboardingHasSetCandidatePrefs,
  } = onboardingStatus;
  const flowStates: FLOW_STATE[] = [];
  if (!onboardingHasAcceptedTerms) {
    flowStates.push('TERMS');
  }
  if (!onboardingHasCompletedProfile) {
    flowStates.push('PROFILE');
  }
  if (!onboardingHasCreatedOrganization && userType === 'employer') {
    flowStates.push('ORGANIZATION');
  }
  if (!onboardingHasSetCandidatePrefs && userType === 'employer') {
    flowStates.push('CANDIDATE_PREFS');
  }
  flowStates.push('COMPLETE');
  return flowStates;
}

export function UserOnboardingFlow({
  userProfile,
  onboardingStatus,
  userEmail,
  userType,
}: UserOnboardingFlowProps) {
  const flowStates = useMemo(
    () => getAllFlowStates(onboardingStatus, userType),
    [onboardingStatus, userType],
  );
  const initialStep = useMemo(
    () => getInitialFlowState(flowStates, onboardingStatus),
    [flowStates, onboardingStatus],
  );
  const [currentStep, setCurrentStep] = useState<FLOW_STATE>(initialStep);
  const nextStep = useCallback(() => {
    const currentIndex = flowStates.indexOf(currentStep);
    if (currentIndex < flowStates.length - 1) {
      setCurrentStep(flowStates[currentIndex + 1]);
    }
  }, [currentStep, flowStates]);

  const router = useRouter();

  useEffect(() => {
    if (currentStep === 'COMPLETE') {
      // Redirect based on user type
      if (userType === 'candidate') {
        router.replace('/dashboard/candidate');
      } else {
        router.replace('/dashboard/employer');
      }
    }
  }, [currentStep, userType, router]);

  return (
    <>
      {currentStep === 'TERMS' && <TermsAcceptance onSuccess={nextStep} />}
      {currentStep === 'PROFILE' && (
        <ProfileUpdate
          userEmail={userEmail}
          userProfile={userProfile}
          userType={userType}
          onSuccess={nextStep}
        />
      )}
      {currentStep === 'ORGANIZATION' && (
        <OrganizationCreation onSuccess={nextStep} />
      )}
      {/* NEW STEP */}
      {currentStep === 'CANDIDATE_PREFS' && (
        <CandidatePreferences onSuccess={nextStep} />
      )}
    </>
  );
}
