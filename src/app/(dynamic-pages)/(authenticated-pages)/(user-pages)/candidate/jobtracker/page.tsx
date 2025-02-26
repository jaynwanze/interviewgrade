'use client';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  addJobTrackerApplication,
  fetchJobTrackerApplications,
} from '@/data/user/candidate';
import { JobTracker } from '@/types';
import { Link2, PlusCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function JobTrackerPage() {
  // Local state to hold job tracker entries
  const [jobs, setJobs] = useState<JobTracker[]>([]);

  // Form state for new job entry
  const [newJob, setNewJob] = useState<Partial<JobTracker>>({});
  const [open, setOpen] = useState(false);

  // Fetch job applications from the database
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await fetchJobTrackerApplications();
        setJobs(data);
      } catch (error) {
        console.error('Error fetching job applications:', error);
      }
    };

    fetchJobs();
  }, []);

  // Add a new job to the database
  const addJob = async () => {
    if (newJob.job_title && newJob.company && newJob.status) {
      try {
        const addedJob = await addJobTrackerApplication(newJob);
        setJobs((prev) => [...prev, addedJob]);
        setNewJob({});
        setOpen(false);
      } catch (error) {
        console.error('Error adding job:', error);
      }
    }
  };

  const jobStatusColor = (status: JobTracker['status']) => {
    switch (status) {
      case 'not_started':
        return 'gray';
      case 'applied':
        return 'blue';
      case 'in_progress':
        return 'yellow';
      case 'rejected':
        return 'red';
      case 'offered':
        return 'green';
      case 'hired':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getJobStatus = (status: JobTracker['status']) => {
    switch (status) {
      case 'not_started':
        return 'Not Started';
      case 'applied':
        return 'Applied';
      case 'in_progress':
        return 'In Progress';
      case 'rejected':
        return 'Rejected';
      case 'offered':
        return 'Offered';
      case 'hired':
        return 'Hired';
      default:
        return 'Not Started';
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div>
            <CardTitle>Job Tracker</CardTitle>
            <CardDescription>
              Track your job applications and stay organized.
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="mt-4 md:mt-0">
                <PlusCircle className="mr-2 h-5 w-5" /> Add Job
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Job</DialogTitle>
                <DialogDescription>
                  Enter the job details below.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-1">
                  <Label htmlFor="job-title">Job Title</Label>
                  <Input
                    id="job-title"
                    placeholder="Frontend Developer"
                    value={newJob.job_title || ''}
                    onChange={(e) =>
                      setNewJob({ ...newJob, job_title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    placeholder="Acme Corp"
                    value={newJob.company || ''}
                    onChange={(e) =>
                      setNewJob({ ...newJob, company: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="link">Job Link</Label>
                  <Input
                    id="link"
                    placeholder="https://example.com/job/..."
                    value={newJob.link || ''}
                    onChange={(e) =>
                      setNewJob({ ...newJob, link: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newJob.status || ''}
                    onValueChange={(value) =>
                      setNewJob({
                        ...newJob,
                        status: value as JobTracker['status'],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="offered">Offered</SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addJob}>Add</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-2">Job Title</TableHead>
                <TableHead className="px-4 py-2">Company</TableHead>
                <TableHead className="px-4 py-2">Status</TableHead>
                <TableHead className="px-4 py-2">Applied Date</TableHead>
                <TableHead className="px-4 py-2">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="px-4 py-2 font-medium">
                    {job.job_title}
                  </TableCell>
                  <TableCell className="px-4 py-2">{job.company}</TableCell>
                  <TableCell className="px-4 py-2">
                    <Badge
                      className={`bg-${jobStatusColor(job.status)}-100 hover:bg-gray-100 text-${jobStatusColor(job.status)}-800`}
                      variant={'default'}
                    >
                      {getJobStatus(job.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {new Date(job.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {job.link && (
                      <a
                        href={job.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <Link2 className="h-4 w-4" /> View
                      </a>
                    )}
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
