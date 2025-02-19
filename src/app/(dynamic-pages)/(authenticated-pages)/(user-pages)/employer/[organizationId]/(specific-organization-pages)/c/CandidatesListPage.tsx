'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CandidateRow } from '@/types';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const mockCandidates: CandidateRow[] = [
  {
    id: 'c1',
    city: 'New York',
    country: 'United States',
    phone_number: '(555) 123-4567',
    summary: 'Enthusiastic engineer with strong communication skills.',
    role: 'Software Engineer',
    industry: 'Tech',
    interview_skill_stats: [
      { id: '1', skill: 'Problem Solving', avg_score: 92, previous_avg: 90 },
      { id: '2', skill: 'Communication', avg_score: 88, previous_avg: 85 },
      { id: '3', skill: 'Teamwork', avg_score: 90, previous_avg: 88 },
    ],
    practice_skill_stats: [
      { id: 'p1', skill: 'Problem Solving', avg_score: 89, previous_avg: 87 },
    ],
    created_at: '2024-04-29T10:00:00Z',
    full_name: 'Alice Anderson',
    avatar_url:
      'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp',
    email: 'jonjfjegji',
  },
  {
    id: 'c2',
    city: 'San Francisco',
    country: 'United States',
    phone_number: '(555) 555-1234',
    summary: 'Full-stack developer with a focus on back-end optimization.',
    role: 'Full-Stack Developer',
    industry: 'Tech',
    interview_skill_stats: [
      { id: '4', skill: 'Problem Solving', avg_score: 85, previous_avg: 82 },
      { id: '5', skill: 'Communication', avg_score: 80, previous_avg: 78 },
    ],
    practice_skill_stats: [
      { id: 'p2', skill: 'Problem Solving', avg_score: 83, previous_avg: 80 },
      { id: 'p3', skill: 'Communication', avg_score: 81, previous_avg: 76 },
    ],
    created_at: '2024-04-20T09:30:00Z',
    full_name: 'Bob Brown',
    avatar_url:
      'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp',
    email: 'jonjfjegji',
  },
  {
    id: 'c3',
    city: 'Toronto',
    country: 'Canada',
    phone_number: '(416) 999-0000',
    summary: 'Skilled data analyst passionate about Decision Making & stats.',
    role: 'Data Analyst',
    industry: 'Finance',
    interview_skill_stats: [
      { id: '6', skill: 'Decision Making', avg_score: 88, previous_avg: 85 },
      {
        id: '7',
        skill: 'Analytical Thinking',
        avg_score: 90,
        previous_avg: 88,
      },
    ],
    practice_skill_stats: [],
    created_at: '2024-04-22T14:15:00Z',
    full_name: 'Charlie Davis',
    avatar_url:
      'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp',
    email: 'jonjfjegji',
  },
  {
    id: 'c4',
    city: 'Remote',
    country: 'Remote',
    phone_number: '(555) 999-9999',
    summary: 'Problem solver with a knack for creative solutions.',
    role: 'Product Manager',
    industry: 'Tech',
    interview_skill_stats: [
      { id: '8', skill: 'Problem Solving', avg_score: 90, previous_avg: 85 },
      { id: '9', skill: 'Leadership', avg_score: 87, previous_avg: 86 },
    ],
    practice_skill_stats: [
      { id: 'p4', skill: 'Leadership', avg_score: 88, previous_avg: 84 },
    ],
    created_at: '2024-04-25T11:45:00Z',
    full_name: 'Diana Evans',
    avatar_url:
      'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp',
    email: 'jonjfjegji',
  },
  {
    id: 'c5',
    city: 'Dublin',
    country: 'Ireland',
    phone_number: '+353 12 345 6789',
    summary: 'Focused on continuous improvement and quick learning.',
    role: 'Software Engineer',
    industry: 'Tech',
    interview_skill_stats: [
      { id: '10', skill: 'Adaptability', avg_score: 92, previous_avg: 90 },
      { id: '11', skill: 'Communication', avg_score: 84, previous_avg: 80 },
    ],
    practice_skill_stats: [
      { id: 'p5', skill: 'Adaptability', avg_score: 88, previous_avg: 85 },
    ],
    created_at: '2024-04-27T07:00:00Z',
    full_name: 'Erin Green',
    avatar_url:
      'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp',
    email: 'jonjfjegji',
  },
];

export default function CandidatesListPage({
  organizationId,
}: {
  organizationId: string;
}) {
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateRow[]>(
    [],
  );
  const router = useRouter();

  useEffect(() => {
    // In a real app, fetch candidates from your API or DB
    setCandidates(mockCandidates);
  }, []);

  useEffect(() => {
    const filtered = candidates.filter(
      (candidate) =>
        candidate.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.role.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    setFilteredCandidates(filtered);
  }, [searchQuery, candidates]);

  function handleViewCandidate(candidateId: string) {
    router.push(`/employer/${organizationId}/c/${candidateId}`);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header and Search */}
      <div className="flex items-center space-x-4 mb-4">
        <button
          onClick={() => window.history.back()}
          className="rounded-md hover:bg-gray-200 dark:hover:bg-gray-800"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <Input
          placeholder="Search candidates, industry, job title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-lg"
        />
      </div>

      {/* Candidate Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Candidate Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Overall Average Score</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Top Skill</TableHead>
                <TableHead>Tokens Cost</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCandidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage
                          src={candidate.avatar_url}
                          alt={candidate.full_name}
                        />
                        <AvatarFallback>
                          {candidate.full_name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {candidate.full_name}
                    </div>
                  </TableCell>
                  <TableCell>{candidate.role}</TableCell>
                  <TableCell>Skill%</TableCell>
                  <TableCell>
                    {candidate.city}, {candidate.country}
                  </TableCell>
                  <TableCell>{candidate.industry}</TableCell>
                  <TableCell></TableCell>
                  <TableCell>
                    <Badge className="bg-purple-500 text-white">
                      Maybe Calculate cost based off rank or skill?
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewCandidate(candidate.id)}
                    >
                      Message
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
