'use client';

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
import { saveEmployerPreferences } from '@/data/user/employee';
import { useSAToastMutation } from '@/hooks/useSAToastMutation';
import { useState } from 'react';

type CandidatePreferencesForm = {
  location: string;
  industry: string;
  skills: string;
};

export function EmployerPreferences({ onSuccess }: { onSuccess: () => void }) {
  const [formValues, setFormValues] = useState<CandidatePreferencesForm>({
    location: '',
    industry: '',
    skills: '',
  });
  const [submitting, setSubmitting] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setFormValues((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }
  const { mutate } = useSAToastMutation(
    async (preferences: CandidatePreferencesForm) =>
      await saveEmployerPreferences(preferences, { isOnboardingFlow: true }),
    {
      successMessage: 'Preferences saved!',
      errorMessage: 'Failed to save employer preferences',
      onSuccess: () => {
        onSuccess();
      },
    },
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    mutate(formValues);
    setSubmitting(false);
  }

  return (
    <Card className="max-w-md">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Candidate Preferences</CardTitle>
          <CardDescription>
            Tell us what type of candidate you’re looking for.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="location">Preferred Location</Label>
            <Input
              id="location"
              name="location"
              placeholder="e.g. United States, Remote"
              value={formValues.location}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              name="industry"
              placeholder="e.g. Tech, Finance, etc."
              value={formValues.industry}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="skills">Key Skills</Label>
            <Input
              id="skills"
              name="skills"
              placeholder="e.g. Problem Solving, Communication"
              value={formValues.skills}
              onChange={handleChange}
            />
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Preferences'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
