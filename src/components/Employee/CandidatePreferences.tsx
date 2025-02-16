// CandidatePreferences.tsx (example)
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

type CandidatePreferencesForm = {
  location: string;
  industry: string;
  skills: string;
};

export function CandidatePreferences({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const [formValues, setFormValues] = useState<CandidatePreferencesForm>({
    location: '',
    industry: '',
    skills: '',
  });
  const [submitting, setSubmitting] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setFormValues((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    // In real code, you'd call a "saveEmployerCandidatePrefsAction" or similar.
    // For now, just mock it:
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Maybe update "onboardingHasSetCandidatePrefs = true" in the user's metadata
    // Once done:
    setSubmitting(false);
    onSuccess();
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
