import { z } from 'zod';

export const resumeMetadataSchema = z.object({
  skills: z.array(z.string()),
  experiences: z.array(
    z.object({
      jobTitle: z.string(),
      company: z.string(),
      startDate: z.string().nullable().optional(),
      endDate: z.string().nullable().optional(),
      description: z.string().optional().default(''),
    }),
  ),
  education: z.string().optional().default(''),
  certifications: z.array(z.string()).optional().default([]),
  projects: z.array(
    z.object({
      title: z.string(),
      description: z.string().optional().default(''),
      link: z.string().nullable().optional(),
    }),
  ),
});

export type ResumeMetadata = z.infer<typeof resumeMetadataSchema>;
