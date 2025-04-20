'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { CandidateDetailsView } from '@/types';
import { FileText } from 'lucide-react';
import { useState } from 'react';

interface ResumeHighlightsProps {
  candidate: CandidateDetailsView;
}

/**
 * Displays the candidate's resume metadata in an Accordion (experiences, projects, certifications, etc.)
 * If `candidate.isUnlocked === false`, we show partial or hidden info to entice unlocking.
 */
export function ResumeHighlights({ candidate }: ResumeHighlightsProps) {
  const resumeData = candidate.resume_metadata;
  if (!resumeData) return null; // No resume metadata to show

  const [openResumeDialog, setOpenResumeDialog] = useState(false);

  return (
    <Card>
      <CardHeader className="flex justify-between">
        <div className="space-y-2">
          <CardTitle>Resume Highlights</CardTitle>
          {!candidate.isUnlocked ? (
            <CardDescription>
              Some details hidden. Unlock to see all.
            </CardDescription>
          ) : (
            <CardDescription>
              Resume details provided by the candidate.
            </CardDescription>
          )}
        </div>

        {/* If candidate has a resume_url, show button on top right */}
        {candidate.resume_url && candidate.isUnlocked && (
          <Dialog open={openResumeDialog} onOpenChange={setOpenResumeDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-28 mt-5">
                <FileText className="mr-1 h-4 w-4 items-end" />
                View CV
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Candidate’s Resume</DialogTitle>
                <DialogDescription>
                  The CV the candidate provided
                </DialogDescription>
              </DialogHeader>
              <div className="w-full h-[500px] mt-4 overflow-auto bg-muted">
                <iframe
                  src={candidate.resume_url}
                  title="Candidate Resume"
                  className="w-full h-full"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>

      <CardContent>
        <Accordion type="single" collapsible>
          {/* Example: Experience, Projects, etc. */}
          {/* Experience Section */}
          {resumeData.experiences && resumeData.experiences.length > 0 && (
            <AccordionItem value="experience">
              <AccordionTrigger>Experience</AccordionTrigger>
              <AccordionContent>
                {candidate.isUnlocked ? (
                  resumeData.experiences.map((exp, idx) => (
                    <div key={idx} className="p-2 border rounded-md mb-2">
                      <p className="font-bold text-sm">
                        {exp.jobTitle} @ {exp.company}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {exp.startDate || 'N/A'} – {exp.endDate || 'Present'}
                      </p>
                      {exp.description && (
                        <p className="text-sm mt-1">{exp.description}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {resumeData.experiences.length} experiences hidden — unlock
                    to view.
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Skills Section */}
          {resumeData.skills && resumeData.skills.length > 0 && (
            <AccordionItem value="skills">
              <AccordionTrigger>Skills</AccordionTrigger>
              <AccordionContent>
                {candidate.isUnlocked ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {resumeData.skills.map((skill, idx) => (
                      <Badge variant="outline" key={idx}>
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {resumeData.skills.length} skills hidden — unlock to view.
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Projects Section */}
          {resumeData.projects && resumeData.projects.length > 0 && (
            <AccordionItem value="projects">
              <AccordionTrigger>Projects</AccordionTrigger>
              <AccordionContent>
                {candidate.isUnlocked ? (
                  resumeData.projects.map((proj, idx) => (
                    <div key={idx} className="p-2 border rounded-md mb-2">
                      <p className="font-bold text-sm">{proj.title}</p>
                      {proj.link && (
                        <a
                          href={proj.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 underline text-xs"
                        >
                          Link
                        </a>
                      )}
                      {proj.description && (
                        <p className="text-sm">{proj.description}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {resumeData.projects.length} projects hidden — unlock to
                    view.
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* ========== CERTIFICATIONS ========== */}
          {!!resumeData.certifications &&
            resumeData.certifications.length > 0 && (
              <AccordionItem value="certifications">
                <AccordionTrigger>Certifications</AccordionTrigger>
                <AccordionContent>
                  {candidate.isUnlocked ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {resumeData.certifications.map((cert, idx) => (
                        <Badge variant="outline" key={idx}>
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {resumeData.certifications.length} certifications hidden —
                      unlock to view.
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            )}

          {/* ========== EDUCATION ========== */}
          {resumeData.education && (
            <AccordionItem value="education">
              <AccordionTrigger>Education</AccordionTrigger>
              <AccordionContent>
                {candidate.isUnlocked ? (
                  <p className="text-sm mt-2">{resumeData.education}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Education hidden — unlock to view.
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CardContent>
    </Card>
  );
}
