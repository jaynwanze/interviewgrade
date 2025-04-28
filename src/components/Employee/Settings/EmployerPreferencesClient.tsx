'use client';

import { RHFSelect } from '@/components/RHFSelect';
import { Button } from '@/components/ui/button';
import { saveEmployerPreferences } from '@/data/user/employee';
import { useSAToastMutation } from '@/hooks/useSAToastMutation';
import {
  availableCountries,
  availableIndustries,
  availableRoles,
  availableSkills,
} from '@/utils/filterOptions';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Separator } from '@/components/ui/separator';
import type { EmployerCandidatePreferences } from '@/types';

const schema = z.object({
  location: z.string().min(1),
  industry: z.string().min(1),
  role: z.string().min(1),
  skills: z.string().min(1),
});
type FormValues = z.infer<typeof schema>;

export function EmployerPreferenceFormClient({
  initial,
}: {
  initial: EmployerCandidatePreferences | null;
}) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      location: initial?.location ?? 'All Countries',
      industry: initial?.industry ?? 'All Industries',
      role: initial?.job ?? 'All Roles',
      skills: initial?.skills ?? 'Problem Solving',
    },
  });

  const { mutate } = useSAToastMutation(
    async (data: FormValues) =>
      saveEmployerPreferences(
        {
          location: data.location,
          industry: data.industry,
          job: data.role,
          skills: data.skills,
        },
        { isOnboardingFlow: false },
      ),
    {
      successMessage: 'Preferences updated!',
      errorMessage: 'Could not save preferences',
    },
  );

  return (
    <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
      <RHFSelect
        control={control}
        name="location"
        label="Location"
        placeholder="All Countries…"
        options={availableCountries}
      />
      {errors.location && (
        <p className="text-xs text-red-600">{errors.location.message}</p>
      )}

      <RHFSelect
        control={control}
        name="role"
        label="Role"
        placeholder="All Roles…"
        options={availableRoles}
      />
      {errors.role && (
        <p className="text-xs text-red-600">{errors.role.message}</p>
      )}

      <RHFSelect
        control={control}
        name="industry"
        label="Industry"
        placeholder="All Industries…"
        options={availableIndustries}
      />
      {errors.industry && (
        <p className="text-xs text-red-600">{errors.industry.message}</p>
      )}

      <RHFSelect
        control={control}
        name="skills"
        label="Skill"
        placeholder="Select Skill…"
        options={availableSkills}
      />
      {errors.skills && (
        <p className="text-xs text-red-600">{errors.skills.message}</p>
      )}
      <Separator className="w-full" />
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Saving…' : 'Save Preferences'}
      </Button>
    </form>
  );
}
