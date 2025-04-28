'use server';
import { EmployerPreferenceFormClient } from '@/components/Employee/Settings/EmployerPreferencesClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getEmployerCandidatePreferences } from '@/data/user/employee';
import { getUserProfile } from '@/data/user/user';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import { EmployerAccountSettings } from './EmployerAccountSettings';

export async function SetEmployerAccountSettings() {
    const prefs = await getEmployerCandidatePreferences();
    const user = await serverGetLoggedInUser();
    if (!user) {
        return <div className="text-red-500">User not found</div>;
    }

    const userProfile = await getUserProfile(user.id);
    if (!userProfile) {
        return <div className="text-red-500">User profile not found</div>;
    }

    return (
        <div className="flex flex-row items-center justify-center gap-4 mx auto">
            <Card className="max-w-sm ">
                <CardHeader className="text-center space-y-2">
                    <CardTitle>User Details</CardTitle>
                    <p className="text-sm text-muted-foreground max-w-lg"></p>
                </CardHeader>

                <CardContent className=" space-y-4 flex justify-center flex-col items-center">
                    {/* hand off to the client form */}
                    <EmployerAccountSettings
                        userProfile={userProfile}
                        userEmail={user.email}
                    />
                </CardContent>
            </Card>

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
        </div>
    );
}
