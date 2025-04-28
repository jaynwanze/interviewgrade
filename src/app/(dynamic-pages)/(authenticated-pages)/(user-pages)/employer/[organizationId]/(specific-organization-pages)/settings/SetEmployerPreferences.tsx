// app/(authenticated-pages)/employer/[orgId]/settings/SetEmployerPreferences.tsx
import { EmployerPreferenceFormClient } from '@/components/Employee/Settings/EmployerPreferencesClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getEmployerCandidatePreferences } from '@/data/user/employee';

export async function SetEmployerPreferences() {
    const prefs = await getEmployerCandidatePreferences(); // may be null

    return (
        <Card className="max-w-sm ">
            <CardHeader className="text-center space-y-2">
                <CardTitle>Candidate preferences</CardTitle>
                <p className="text-sm text-muted-foreground max-w-lg">
                    Set your preferences for candidates. This will help us find the best
                    candidates for you.
                </p>
            </CardHeader>

            <CardContent className=" space-y-4 flex justify-center flex-col items-center">
                {/* hand off to the client form */}
                <EmployerPreferenceFormClient initial={prefs} />
            </CardContent>
        </Card>
    );
}
