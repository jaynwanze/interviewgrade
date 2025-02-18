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
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Candidate = {
  id: string;
  name: string;
  jobTitle: string;
  skill: string;
  location: string;
  industry: string;
  avatarUrl?: string;
  overallScore: number;
  tokensCost: number;
};

const mockCandidates: Candidate[] = [
  {
    id: 'c1',
    name: 'Alice Anderson',
    jobTitle: 'Marketing Specialist',
    skill: 'Communication',
    location: 'United States',
    industry: 'Marketing',
    overallScore: 90,
    tokensCost: 5,
  },
  {
    id: 'c2',
    name: 'Bob Brown',
    jobTitle: 'Financial Analyst',
    skill: 'Problem Solving',
    location: 'Canada',
    industry: 'Finance',
    overallScore: 82,
    tokensCost: 4,
  },
  {
    id: 'c3',
    name: 'Charlie Davis',
    jobTitle: 'Software Engineer',
    skill: 'Decision Making',
    location: 'Remote',
    industry: 'Technology',
    overallScore: 93,
    tokensCost: 6,
  },
];

export default function CandidatesListPage({
  organizationId,
}: {
  organizationId: string;
}) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const router = useRouter();

  useEffect(() => {
    // In a real app, fetch candidates from your API or DB
    setCandidates(mockCandidates);
  }, []);

  useEffect(() => {
    const filtered = candidates.filter((candidate) =>
      candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
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
                <TableHead>Overall Score</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Primary Skill</TableHead>
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
                        {candidate.avatarUrl ? (
                          <AvatarImage
                            src={candidate.avatarUrl}
                            alt={candidate.name}
                          />
                        ) : (
                          <AvatarFallback>
                            {candidate.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      {candidate.name}
                    </div>
                  </TableCell>
                  <TableCell>{candidate.jobTitle}</TableCell>
                  <TableCell>{candidate.overallScore}%</TableCell>
                  <TableCell>{candidate.location}</TableCell>
                  <TableCell>{candidate.industry}</TableCell>
                  <TableCell>{candidate.skill}</TableCell>
                  <TableCell>
                    <Badge className="bg-purple-500 text-white">
                      {candidate.tokensCost}
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
