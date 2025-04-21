'use client';

import { RHFSelect } from '@/components/RHFSelect';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import {
  availableCountries,
  availableIndustries,
  availableRoles,
  availableSkills,
} from '@/utils/filterOptions';

import { saveEmployerPreferences } from '@/data/user/employee';
import { useSAToastMutation } from '@/hooks/useSAToastMutation';

import { EmployerCandidatePreferences } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const prefsSchema = z.object({
  location: z.string().min(1, 'Location is required'),
  industry: z.string().min(1, 'Industry is required'),
  role: z.string().min(1, 'Role is required'),
  skills: z.string().min(1, 'Skill is required'),
});
type Prefs = z.infer<typeof prefsSchema>;

export function EmployerPreferences({ onSuccess }: { onSuccess: () => void }) {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Prefs>({
    resolver: zodResolver(prefsSchema),
    defaultValues: {
      location: 'All Countries',
      industry: 'All Industries',
      role: 'All Roles',
      skills: 'Problem Solving', // or 'All Skills' if you add that
    },
  });

  /* mutation wrapped with toast */
  const { mutate } = useSAToastMutation(
    async (form: Prefs) => {
      const payload: EmployerCandidatePreferences = {
        location: form.location,
        industry: form.industry,
        job: form.role,
        skills: form.skills,
      };
      return saveEmployerPreferences(payload, { isOnboardingFlow: true });
    },
    {
      successMessage: 'Preferences saved!',
      errorMessage: 'Failed to save preferences',
      onSuccess,
    },
  );

  return (
    <Card className="max-w-lg">
      <form onSubmit={handleSubmit((d) => mutate(d))}>
        <CardHeader>
          <CardTitle>Candidate Preferences</CardTitle>
          <CardDescription>
            Tell us what kind of candidates you’d like to see first.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Country / Remote */}
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

          {/* Role */}
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

          {/* Industry */}
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

          {/* Skill */}
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
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Saving…' : 'Save Preferences'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
