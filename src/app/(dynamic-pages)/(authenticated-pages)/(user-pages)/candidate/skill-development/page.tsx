'use client';

import { useState } from 'react';
import { CalendarIcon, PlusCircle, Award, Info } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

interface TargetSetting {
  id: string;
  skill: string;
  targetScore: number; // desired performance score (0-100)
  currentScore?: number; // candidate's self-assessed current score
  deadline?: string;
  targetRole?: string;
}

interface TrainingCourse {
  id: string;
  title: string;
  description: string;
  recommendedScore: number;
  duration: string;
  provider: string;
  resourceType: 'video' | 'article' | 'exercise';
}

export default function CareerDevelopmentDashboard() {
  // Targets
  const [targets, setTargets] = useState<TargetSetting[]>([
    {
      id: '1',
      skill: 'Communication',
      targetScore: 85,
      currentScore: 70,
      deadline: '2024-06-30',
      targetRole: 'Team Lead',
    },
    {
      id: '2',
      skill: 'Leadership',
      targetScore: 90,
      currentScore: 75,
      deadline: '2024-09-15',
      targetRole: 'Manager',
    },
  ]);

  // Recommendations (could be filtered based on targets in a real app)
  const [trainingCourses] = useState<TrainingCourse[]>([
    {
      id: 'c1',
      title: 'Advanced Communication Skills',
      description:
        'Enhance your public speaking with interactive exercises and expert feedback.',
      recommendedScore: 80,
      duration: '6 weeks',
      provider: 'Coursera',
      resourceType: 'video',
    },
    {
      id: 'c2',
      title: 'Leadership Fundamentals',
      description:
        'Develop leadership qualities through case studies and team-building exercises.',
      recommendedScore: 85,
      duration: '8 weeks',
      provider: 'LinkedIn Learning',
      resourceType: 'article',
    },
  ]);

  // New target modal state
  const [newTarget, setNewTarget] = useState<Partial<TargetSetting>>({});
  const [openTargetDialog, setOpenTargetDialog] = useState(false);

  // Course details modal state
  const [openCourseDialog, setOpenCourseDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourse | null>(
    null,
  );

  const addTarget = () => {
    if (newTarget.skill && newTarget.targetScore) {
      const target: TargetSetting = {
        id: (targets.length + 1).toString(),
        skill: newTarget.skill,
        targetScore: newTarget.targetScore,
        currentScore: newTarget.currentScore || 0,
        deadline: newTarget.deadline,
        targetRole: newTarget.targetRole || '',
      };
      setTargets((prev) => [...prev, target]);
      setNewTarget({});
      setOpenTargetDialog(false);
    }
  };

  const viewCourseDetails = (course: TrainingCourse) => {
    setSelectedCourse(course);
    setOpenCourseDialog(true);
  };

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-8">
      {/* Dashboard Header */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-center justify-between">
          <CardTitle>Career Development Dashboard</CardTitle>
          <Button variant="outline" onClick={() => setOpenTargetDialog(true)}>
            <PlusCircle className="mr-2 h-5 w-5" /> Set New Target
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            Track your skill targets, view personalized resource
            recommendations, and monitor your progress.
          </p>
        </CardContent>
      </Card>

      {/* Targets & Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Your Targets</CardTitle>
          <CardDescription>
            Compare your current level with your target and deadlines.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-2">Skill</TableHead>
                <TableHead className="px-4 py-2">
                  Current / Target Score
                </TableHead>
                <TableHead className="px-4 py-2">Deadline</TableHead>
                <TableHead className="px-4 py-2">Target Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {targets.map((target) => (
                <TableRow key={target.id}>
                  <TableCell className="px-4 py-2">{target.skill}</TableCell>
                  <TableCell className="px-4 py-2">
                    <div className="flex flex-col">
                      <span>
                        {target.currentScore || 0} / {target.targetScore}
                      </span>
                      <Progress
                        value={target.currentScore || 0}
                        max={target.targetScore}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {target.deadline || 'N/A'}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {target.targetRole || 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Resource Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Resources</CardTitle>
          <CardDescription>
            Based on your targets, consider the following resources.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-2">Title</TableHead>
                <TableHead className="px-4 py-2">Duration</TableHead>
                <TableHead className="px-4 py-2">Provider</TableHead>
                <TableHead className="px-4 py-2">Recommended Score</TableHead>
                <TableHead className="px-4 py-2">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trainingCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="px-4 py-2 font-medium">
                    {course.title}
                  </TableCell>
                  <TableCell className="px-4 py-2">{course.duration}</TableCell>
                  <TableCell className="px-4 py-2">{course.provider}</TableCell>
                  <TableCell className="px-4 py-2">
                    {course.recommendedScore}/100
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewCourseDetails(course)}
                    >
                      <Info className="h-4 w-4 mr-1" /> Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Target Modal */}
      <Dialog open={openTargetDialog} onOpenChange={setOpenTargetDialog}>
        <DialogTrigger asChild>
          <Button className="hidden" />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Set New Target</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="skill">Skill</Label>
              <Input
                id="skill"
                placeholder="e.g. Communication"
                value={newTarget.skill || ''}
                onChange={(e) =>
                  setNewTarget({ ...newTarget, skill: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="targetScore">Target Score (0-100)</Label>
              <Input
                id="targetScore"
                type="number"
                placeholder="e.g. 85"
                value={newTarget.targetScore?.toString() || ''}
                onChange={(e) =>
                  setNewTarget({
                    ...newTarget,
                    targetScore: parseInt(e.target.value, 10) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="currentScore">Current Score (Optional)</Label>
              <Input
                id="currentScore"
                type="number"
                placeholder="e.g. 70"
                value={newTarget.currentScore?.toString() || ''}
                onChange={(e) =>
                  setNewTarget({
                    ...newTarget,
                    currentScore: parseInt(e.target.value, 10) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="deadline">Deadline (Optional)</Label>
              <Input
                id="deadline"
                type="date"
                value={newTarget.deadline || ''}
                onChange={(e) =>
                  setNewTarget({ ...newTarget, deadline: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="targetRole">Target Role (Optional)</Label>
              <Input
                id="targetRole"
                placeholder="e.g. Team Lead"
                value={newTarget.targetRole || ''}
                onChange={(e) =>
                  setNewTarget({ ...newTarget, targetRole: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpenTargetDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={addTarget}>Save Target</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Course Details Modal */}
      <Dialog open={openCourseDialog} onOpenChange={setOpenCourseDialog}>
        <DialogTrigger asChild>
          <Button className="hidden" />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedCourse?.title || 'Course Details'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <p className="text-sm text-gray-600">
              {selectedCourse?.description || 'No description available.'}
            </p>
            <p className="text-sm">
              <strong>Duration:</strong> {selectedCourse?.duration}
            </p>
            <p className="text-sm">
              <strong>Provider:</strong> {selectedCourse?.provider}
            </p>
            <p className="text-sm">
              <strong>Recommended Score:</strong>{' '}
              {selectedCourse?.recommendedScore}/100
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
