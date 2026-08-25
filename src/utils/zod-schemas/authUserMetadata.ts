import { z } from 'zod';

export const authUserMetadataSchema = z
  .object({
    onboardingHasAcceptedTerms: z.boolean().default(false),
    onboardingHasCompletedProfile: z.boolean().default(false),
    onboardingHasCompletedCandidateDetails: z.boolean().default(false),
    onboardingHasCreatedOrganization: z.boolean().default(false),
    onboardingHasSetEmployerPrefs: z.boolean().default(false),
    onboardingVersion: z.number().optional(),
    onboardingV2Complete: z.boolean().optional(),
    onboardingV2FirstAction: z.enum(['practice', 'create']).optional(),
    practiceTargetRole: z.string().max(120).optional(),
    practiceExperienceLevel: z
      .enum(['intern', 'graduate', 'mid', 'senior'])
      .optional(),
    practiceInterviewFocus: z
      .enum([
        'behavioral',
        'technical',
        'role-specific',
        'system-design',
        'mixed',
      ])
      .optional(),
  })
  .passthrough();

export type AuthUserMetadata = z.infer<typeof authUserMetadataSchema>;
