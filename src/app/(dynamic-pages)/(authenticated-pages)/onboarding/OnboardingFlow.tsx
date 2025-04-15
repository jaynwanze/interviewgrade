'use client';
import { EmployerPreferences } from '@/app/(dynamic-pages)/(authenticated-pages)/onboarding/EmployerPreferences';
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
import {
  updateCandidateDetails,
  uploadPublicCandidateResume,
} from '@/data/user/candidate';
import { createOrganization } from '@/data/user/organizations';
// import { createOrganization } from '@/data/user/organizations';
import {
  acceptTermsOfService,
  updateUserProfileNameAndAvatar,
  uploadPublicUserAvatar,
} from '@/data/user/user';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useSAToastMutation } from '@/hooks/useSAToastMutation';
import type { Table } from '@/types';
import { UserType } from '@/types/userTypes';
import { getUserAvatarUrl } from '@/utils/helpers';
import type { AuthUserMetadata } from '@/utils/zod-schemas/authUserMetadata';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { UserPlus as AddUserIcon, FileText, Trash } from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { TutorialPracticeStep } from './TutorialPracticeStep';
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
    </>
  );
}
const candidateDetailsSchema = z.object({
  phone_number: z.string().min(1, 'Phone is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  role: z.string().min(1, 'Role is required'),
  industry: z.string().min(1, 'Industry is required'),
  linkedin_url: z.string().optional(),
  resume_url: z.any().optional(),
});

type CandidateDetailsSchema = z.infer<typeof candidateDetailsSchema>;

export function CandidateDetailsForm({ onSuccess }: { onSuccess: () => void }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<CandidateDetailsSchema>({
    resolver: zodResolver(candidateDetailsSchema),
    defaultValues: {
      phone_number: '',
      city: '',
      country: '',
      role: '',
      industry: '',
      linkedin_url: '',
      resume_url: '',
    },
  });

  const watchedFile = watch('resume_url');
  const [uploading, setUploading] = useState(false);
  const [resumePreview, setResumePreview] = useState<string | null>(null);
  const [uploadedResumeUrl, setUploadedResumeUrl] = useState<string | null>(
    null,
  );

  const { mutate: uploadResume } = useSAToastMutation(
    async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      return uploadPublicCandidateResume(formData, file.name);
    },
    {
      onMutate: () => {
        setUploading(true);
      },
      successMessage: 'Resume uploaded!',
      errorMessage: 'Failed to upload resume',
      onSuccess: (result) => {
        setUploading(false);

        if (result.status === 'success') {
          setUploadedResumeUrl(result.data);
          setResumePreview(result.data);
        }
      },
    },
  );

  const { mutate: saveCandidateDetails, isLoading: isSaving } = useSAToastMutation(
    async (formData: CandidateDetailsSchema) => {
      // We pass the final resume URL if we have one
      return updateCandidateDetails(
        {
          ...formData,
          resume_url: uploadedResumeUrl ?? undefined,
        },
        { isOnboardingFlow: true },
      );
    },
    {
      successMessage: 'Candidate details saved!',
      errorMessage: 'Failed to update details',
      onSuccess: () => {
        onSuccess();
      },
    },
  );

  function handleResumeFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      uploadResume(file);
    }
  }
  
  function handleRemoveResume() {
    setUploadedResumeUrl(null);
    setResumePreview(null);
    setValue('resume_url', '');
  }

  function onSubmit(formData: CandidateDetailsSchema) {
    saveCandidateDetails(formData);
  }

  return (
    <Card className="max-w-xl">
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle>Candidate Details</CardTitle>
          <CardDescription>
            Employers will see this info on your profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* City & Country */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="e.g. New York"
                {...register('city')}
              />
              {errors.city && (
                <p className="text-xs text-red-600">{errors.city.message}</p>
              )}
            </div>
            <div className="flex-1">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                placeholder="e.g. United States"
                {...register('country')}
              />
              {errors.country && (
                <p className="text-xs text-red-600">{errors.country.message}</p>
              )}
            </div>
          </div>

          {/* Phone & Role */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                placeholder="(555) 123-4567"
                {...register('phone_number')}
              />
              {errors.phone_number && (
                <p className="text-xs text-red-600">
                  {errors.phone_number.message}
                </p>
              )}
            </div>
            <div className="flex-1">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                placeholder="e.g. Software Engineer"
                {...register('role')}
              />
              {errors.role && (
                <p className="text-xs text-red-600">{errors.role.message}</p>
              )}
            </div>
          </div>

          {/* Industry & Summary */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="e.g. Tech"
                {...register('industry')}
              />
              {errors.industry && (
                <p className="text-xs text-red-600">
                  {errors.industry.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex-1">
            <Label htmlFor="linkedin-url">Linkedin</Label>
            <Input
              id="linkedin-url"
              placeholder="Linkedin URL"
              {...register('linkedin_url')}
            />
            {errors.linkedin_url && (
              <p className="text-xs text-red-600">
                {errors.linkedin_url.message}
              </p>
            )}
          </div>

          {/* Resume Upload Section */}
          <div className="mt-2">
            <Label htmlFor="resumeFile">Resume (PDF)</Label>
            <Input
              id="resumeFile"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleResumeFileChange}
            />
            {uploading && <p className="text-sm text-gray-600">Uploading...</p>}
          </div>

          {/* Resume Preview & Confirmation */}
          {resumePreview && (
            <div className="mt-4">
              <Label>Resume Preview</Label>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    View Resume
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Preview Resume</DialogTitle>
                  </DialogHeader>
                  <iframe
                    src={resumePreview}
                    title="Resume Preview"
                    className="w-full h-[400px] border rounded-md"
                  />
                </DialogContent>
              </Dialog>

              <Button
                variant="destructive"
                size="sm"
                className="mt-2"
                onClick={handleRemoveResume}
              >
                <Trash className="mr-2 h-4 w-4" />
                Remove Resume
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={!isValid || uploading}>
            {uploading ? 'Uploading...' : 'Save'}
          </Button>
        </CardFooter>
      </form>
    </Card>
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
  | 'CANDIDATE_DETAILS'
  | 'CANDIDATE_TUTORIAL_QUESTION'
  | 'ORGANIZATION'
  | 'EMPLOYER_PREFS'
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
    onboardingHasCompletedCandidateDetails,
    onboardingHasCreatedOrganization,
    onboardingHasSetEmployerPrefs,
  } = onboardingStatus;

  if (!onboardingHasAcceptedTerms && flowStates.includes('TERMS')) {
    return 'TERMS';
  }

  if (!onboardingHasCompletedProfile && flowStates.includes('PROFILE')) {
    return 'PROFILE';
  }
  if (
    !onboardingHasCompletedCandidateDetails &&
    flowStates.includes('CANDIDATE_DETAILS')
  ) {
    return 'CANDIDATE_DETAILS';
  }
  if (
    !onboardingStatus.onboardingHasDoneTutorial &&
    flowStates.includes('CANDIDATE_TUTORIAL_QUESTION')
  ) {
    return 'CANDIDATE_TUTORIAL_QUESTION';
  }
  if (
    !onboardingHasCreatedOrganization &&
    flowStates.includes('ORGANIZATION')
  ) {
    return 'ORGANIZATION';
  }
  if (!onboardingHasSetEmployerPrefs && flowStates.includes('EMPLOYER_PREFS')) {
    return 'EMPLOYER_PREFS';
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
    onboardingHasCompletedCandidateDetails,
    onboardingHasCreatedOrganization,
    onboardingHasSetEmployerPrefs,
  } = onboardingStatus;
  const flowStates: FLOW_STATE[] = [];
  if (!onboardingHasAcceptedTerms) {
    flowStates.push('TERMS');
  }
  if (!onboardingHasCompletedProfile) {
    flowStates.push('PROFILE');
  }
  if (!onboardingHasCompletedCandidateDetails && userType === 'candidate') {
    flowStates.push('CANDIDATE_DETAILS');
  }
  if (!onboardingStatus.onboardingHasDoneTutorial && userType === 'candidate') {
    flowStates.push('CANDIDATE_TUTORIAL_QUESTION');
  }
  if (!onboardingHasCreatedOrganization && userType === 'employer') {
    flowStates.push('ORGANIZATION');
  }
  if (!onboardingHasSetEmployerPrefs && userType === 'employer') {
    flowStates.push('EMPLOYER_PREFS');
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
        router.replace('/candidate');
      } else {
        router.replace('/employer');
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
      {currentStep === 'CANDIDATE_DETAILS' && (
        <CandidateDetailsForm onSuccess={nextStep} />
      )}
      {currentStep === 'CANDIDATE_TUTORIAL_QUESTION' && (
        <TutorialPracticeStep />
      )}
      {currentStep === 'ORGANIZATION' && (
        <OrganizationCreation onSuccess={nextStep} />
      )}
      {/* NEW STEP */}
      {currentStep === 'EMPLOYER_PREFS' && (
        <EmployerPreferences onSuccess={nextStep} />
      )}
    </>
  );
}
