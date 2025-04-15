'use client';

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getEmployersInterestedInCandidate } from '@/data/user/candidate';

export default function EmployerInterestsPage() {
  const [employers, setEmployers] = useState<
    { employer_id: string; employer_name: string; logo_url: string }[]
  >([]);

  useEffect(() => {
    const fetchEmployers = async () => {
      const data = await getEmployersInterestedInCandidate();
      setEmployers(data);
    };
    fetchEmployers();
  }, []);

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Employers Interested in You</h1>
      {employers.length === 0 ? (
        <p className="text-muted-foreground">No employers have viewed your profile yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employers.map((employer) => (
            <Card key={employer.employer_id}>
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar>
                  <AvatarImage src={employer.logo_url} />
                  <AvatarFallback>
                    {employer.employer_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <CardTitle>{employer.employer_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This employer has unlocked your profile and might reach out soon.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
