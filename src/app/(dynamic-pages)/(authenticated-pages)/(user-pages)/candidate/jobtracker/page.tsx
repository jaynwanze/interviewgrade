"use client";

import { useState } from "react";
import { CalendarIcon, Link2, PlusCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface JobEntry {
  id: string;
  title: string;
  company: string;
  status: "Applied" | "Interviewing" | "Offer" | "Rejected";
  link: string;
  appliedDate: string;
}

export default function JobTrackerPage() {
  // Local state to hold job tracker entries
  const [jobs, setJobs] = useState<JobEntry[]>([
    // Example initial data
    {
      id: "1",
      title: "Frontend Developer",
      company: "Acme Corp",
      status: "Applied",
      link: "https://example.com/job/1",
      appliedDate: new Date().toLocaleDateString(),
    },
    {
      id: "2",
      title: "UI/UX Designer",
      company: "Design Studio",
      status: "Interviewing",
      link: "https://example.com/job/2",
      appliedDate: new Date().toLocaleDateString(),
    },
  ]);

  // Form state for new job entry
  const [newJob, setNewJob] = useState<Partial<JobEntry>>({});
  const [open, setOpen] = useState(false);

  const addJob = () => {
    if (newJob.title && newJob.company && newJob.status && newJob.link) {
      const job: JobEntry = {
        id: (jobs.length + 1).toString(),
        title: newJob.title,
        company: newJob.company,
        status: newJob.status as JobEntry["status"],
        link: newJob.link,
        appliedDate: new Date().toLocaleDateString(),
      };
      setJobs((prev) => [...prev, job]);
      setNewJob({});
      setOpen(false);
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
                    value={newJob.title || ""}
                    onChange={(e) =>
                      setNewJob({ ...newJob, title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    placeholder="Acme Corp"
                    value={newJob.company || ""}
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
                    value={newJob.link || ""}
                    onChange={(e) =>
                      setNewJob({ ...newJob, link: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    className="border rounded px-2 py-1"
                    value={newJob.status || ""}
                    onChange={(e) =>
                      setNewJob({ ...newJob, status: e.target.value })
                    }
                  >
                    <option value="">Select status</option>
                    <option value="Applied">Applied</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Offer">Offer</option>
                    <option value="Rejected">Rejected</option>
                  </select>
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
                    {job.title}
                  </TableCell>
                  <TableCell className="px-4 py-2">{job.company}</TableCell>
                  <TableCell className="px-4 py-2">
                    <Badge
                      variant={
                        job.status === "Offer"
                          ? "secondary"
                          : job.status === "Interviewing"
                          ? "success"
                          : job.status === "Applied"
                          ? "info"
                          : "destructive"
                      }
                    >
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-2">{job.appliedDate}</TableCell>
                  <TableCell className="px-4 py-2">
                    <a
                      href={job.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      <Link2 className="h-4 w-4" /> View
                    </a>
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
