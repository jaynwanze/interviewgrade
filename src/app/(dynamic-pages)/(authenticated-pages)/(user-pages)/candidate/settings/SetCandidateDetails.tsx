// app/(user-pages)/candidate/settings/SetCandidateDetails.tsx
import { CandidateDetailsFormClient } from '@/components/Candidate/Settings/CandidateDetailsForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCandidateUserProfile, getUserProfile } from '@/data/user/user';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import { CandidateAccountSettings } from './AccountSettings';

export async function SetCandidateAccountDetails() {
    /* fetch current user + their candidate record */
    const user = await serverGetLoggedInUser();
    if (!user) {
        return <p className="text-sm"> User not found</p>;
    }
    const userProfile = await getUserProfile(user.id);
    const cand = await getCandidateUserProfile(user.id);

    return (
        <div className="flex flex-row items-center justify-center gap-4 mx auto">
            <Card className="max-w-sm ">
                <CardHeader className="text-center space-y-2">
                    <CardTitle>User Details</CardTitle>
                    <p className="text-sm text-muted-foreground max-w-lg"></p>
                </CardHeader>

                <CardContent className=" space-y-4 flex justify-center flex-col items-center">
                    <CandidateAccountSettings
                        userProfile={userProfile}
                        userEmail={user.email}
                    />
                </CardContent>
            </Card>

            <Card className="max-md ">
                <CardHeader className="text-center space-y-2">
                    <CardTitle>Candidate preferences</CardTitle>
                    <p className="text-sm text-muted-foreground max-w-lg">
                        Set your preferences for candidates. This will help us find the best
                        candidates for you.
                    </p>
                </CardHeader>
                <CardContent>
                    <CandidateDetailsFormClient initial={cand} />
                </CardContent>
            </Card>
        </div>
    );
}
