'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import type { CandidateRow, EmployerCandidatePreferences } from '@/types';

/**
 * Props for the ResumeMatchedCandidatesView component.
 */
interface ResumeMatchedCandidatesViewProps {
  matchedByResume: CandidateRow[];
  skillGapMessage: string;
  selectedKeywords: string[];
  employerPrefs: EmployerCandidatePreferences | null;
}

/**
 * This component shows resume-based matches in a more visually appealing way:
 * 1) Subtle hover effect on each candidate card,
 * 2) Small snippet of the candidate’s resume data,
 * 3) Highlight any matching keywords in their skill list,
 * 4) “View Profile” button for token-based detail viewing.
 */
export function ResumeMatchedCandidatesView({
  matchedByResume,
  skillGapMessage,
  selectedKeywords,
  employerPrefs,
}: ResumeMatchedCandidatesViewProps) {
  const router = useRouter();

  // Function to shorten names, e.g., "John S."
  function getShortName(fullName: string): string {
    if (!fullName) return '';
    const parts = fullName.split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1]?.[0].toUpperCase()}.`;
  }

  // Navigate to the candidate’s detail page (prompting the token usage).
  function handleViewProfile(candidateId: string) {
    router.push(`/candidate/${candidateId}`);
  }

  /**
   * Helper: highlights any selected keywords in a skill string.
   */
  function highlightSkills(skill: string): JSX.Element {
    const lowerSkill = skill.toLowerCase();
    const matchedKeyword = selectedKeywords.find(
      (kw) => lowerSkill === kw.toLowerCase(),
    );
    if (matchedKeyword) {
      // highlight the skill
      return (
        <span className="bg-yellow-200 px-1 rounded-sm text-black">
          {skill}
        </span>
      );
    }
    return <span>{skill}</span>;
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Display skill gap or "no matches" message if any */}
      {skillGapMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-red-400 shadow-lg">
            <CardHeader>
              <CardTitle className="text-red-500">
                Resume Filtered Candidates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-600">{skillGapMessage}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card className="shadow-md border rounded-xl">
          <CardHeader>
            <CardTitle>Resume Matches</CardTitle>
            <CardDescription>
              Matched on:{' '}
              {selectedKeywords.join(', ') || 'No keywords selected'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {matchedByResume.length === 0 ? (
              <p>No resume-based matches found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matchedByResume.map((cand) => {
                  const shortName = getShortName(cand.full_name);
                  const candidateSkills = cand.resume_metadata?.skills || [];
                  const topSkills = candidateSkills.slice(0, 3); // show first 3 as a teaser
                  const role = cand.role || 'No Role Listed';

                  return (
                    <motion.div
                      key={cand.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className="p-3 rounded-lg bg-muted/50 shadow hover:shadow-lg hover:bg-muted transition cursor-pointer"
                    >
                      {/* Row Layout */}
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={cand.avatar_url}
                            alt={cand.full_name}
                          />
                          <AvatarFallback>
                            {cand.full_name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-base">{shortName}</p>
                          <Badge variant="secondary">{role}</Badge>
                        </div>
                      </div>

                      {/* Resume Snippet: Show top 3 skills (highlight any matches) */}
                      {candidateSkills.length > 0 && (
                        <div className="mb-2 text-sm">
                          <p className="font-medium">
                            Skills:
                            <span className="ml-1 space-x-2">
                              {topSkills.map((skill) => (
                                <Badge
                                  key={skill}
                                  variant="outline"
                                  className="mr-1"
                                >
                                  {highlightSkills(skill)}
                                </Badge>
                              ))}
                              {/* If more than 3 skills, show a count */}
                              {candidateSkills.length > 3 && (
                                <Badge variant="outline">
                                  +{candidateSkills.length - 3} more
                                </Badge>
                              )}
                            </span>
                          </p>
                        </div>
                      )}

                      <div className="flex space-y-2 justify-end">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            handleViewProfile(cand.id);
                          }}
                        >
                          View Profile
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
