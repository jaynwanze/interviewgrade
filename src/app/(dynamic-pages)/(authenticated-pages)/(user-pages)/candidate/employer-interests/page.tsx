'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getEmployersInterestedInCandidate } from '@/data/user/candidate';
import { PersonIcon } from '@radix-ui/react-icons';
import { Building2, CalendarIcon, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';


//mock employers data
const mockEmployers = [
  {
    employer_id: '1',
    employer_name: 'John Burt',
    logo_url: 'https://example.com/logo1.png',
    organization_title: 'Tech Corp',
    created_at: '2023-10-01T12:00:00Z',
  },
];

export default function EmployerInterestsPage() {
  const [employers, setEmployers] = useState<
    {
      employer_id: string;
      employer_name: string;
      organization_title?: string;
      logo_url?: string;
      created_at?: string;
    }[]
  >([]);

  useEffect(() => {
    const fetchEmployers = async () => {
      const data = await getEmployersInterestedInCandidate();
      setEmployers((data));
    };
    fetchEmployers();
  }, []);

  return (
    <div className="p-6 max-w-3/4 mx-auto space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight text-center">
        Recruiters Interested in You
      </h1>
      <p className="text-muted-foreground text-md text-center mb-2">
        These employers have unlocked your profile and may reach out to you soon.
      </p>
      <Separator className="my-5" />
      <div className="flex items-center justify-between mt-3">
        {employers.length === 0 ? (
          <p className="text-muted-foreground text-lg mt-6">
            No employers have viewed your profile yet.
          </p>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {employers.map((employer) => (
              <Card
                key={employer.employer_id}
                className="transition-transform duration-200 hover:shadow-lg hover:scale-[1.01] inte"
              >
                <CardHeader className="flex items-center space-x-4 text-center">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={employer.logo_url} />
                    <AvatarFallback>
                      {(employer.employer_name ?? 'Unknown')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <CardTitle className="text-lg font-semibold">
                      <Building2 className="h-4 w-4 inline-block mr-1" />
                      {employer.organization_title ?? 'Unknown Organization'}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <PersonIcon className="h-4 w-4" />
                      {employer.employer_name ?? 'Unknown Organization'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <p>This recruiter has unlocked your profile and might reach out soon.</p>
                  </div>
                  {employer.created_at && (
                    <div className="flex items-center gap-2 text-xs">
                      <CalendarIcon className="h-4 w-4" />
                      <span>
                        Unlocked on {new Date(employer.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

          </div>
        )}
      </div>
    </div>
  );
}
