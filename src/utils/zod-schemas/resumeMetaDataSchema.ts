import { z } from 'zod';

export const resumeMetadataSchema = z.object({
    skills: z.array(z.string()),
    experiences: z.array(
        z.object({
            jobTitle: z.string(),
            company: z.string(),
            startDate: z.string().optional(),
            endDate: z.string().nullable().optional(),
        }),
    ),
    education: z.string(),
    certifications: z.array(z.string()).optional(),
    projects: z.array(z.string()).optional(),
});

export type ResumeMetadata = z.infer<typeof resumeMetadataSchema>;
