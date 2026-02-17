'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  createCustomMockInterview,
  createInterviewFromJobDescription,
  type CustomInterviewInput,
} from '@/data/user/custom-interview-builder';
import { Plus, Trash2, Wand2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import type { Database } from '@/lib/database.types';

// Array of valid categories from your database enum
const templateCategories: TemplateCategory[] = [
  'Soft Skills',
  'IT',
  'General Job-Based',
  'Finance',
  'Sales',
  'Marketing',
  'Healthcare',
  'Education',
  'Other',
];

interface Question {
  text: string;
  type: QuestionType;
  sampleAnswer?: string;
}

interface EvaluationCriteria {
  name: string;
  description: string;
  questions: Question[];
}

export function CreateCustomInterviewDialog({
  trigger,
}: {
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'custom'>('quick');

  // Quick create state (from job description)
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [company, setCompany] = useState('');

  // Custom create state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [role, setRole] = useState('');
  const [category, setCategory] = useState<Category>('Soft Skills');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [evaluationCriteria, setEvaluationCriteria] = useState<
    EvaluationCriteria[]
  >([
    {
      name: '',
      description: '',
      questions: [{ text: '', type: 'Behavioral' }],
    },
  ]);

  const resetForm = () => {
    setJobTitle('');
    setJobDescription('');
    setCompany('');
    setTitle('');
    setDescription('');
    setRole('');
    setCategory('Soft Skills');
    setDifficulty('Medium');
    setEvaluationCriteria([
      {
        name: '',
        description: '',
        questions: [{ text: '', type: 'Behavioral' }],
      },
    ]);
  };

  const handleQuickCreate = async () => {
    if (!jobTitle.trim() || !jobDescription.trim()) {
      toast.error('Please fill in the job title and description');
      return;
    }

    setLoading(true);
    try {
      const result = await createInterviewFromJobDescription(
        jobTitle,
        jobDescription,
        company || undefined
      );

      if (result.status === 'success') {
        toast.success('Interview template created successfully!');
        setOpen(false);
        resetForm();
        router.refresh();
      } else {
        toast.error(result.message || 'Failed to create interview');
      }
    } catch (error) {
      toast.error('An error occurred while creating the interview');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomCreate = async () => {
    // Validate inputs
    if (!title.trim() || !role.trim()) {
      toast.error('Please fill in the title and role');
      return;
    }

    const validCriteria = evaluationCriteria.filter(
      (c) =>
        c.name.trim() &&
        c.description.trim() &&
        c.questions.some((q) => q.text.trim())
    );

    if (validCriteria.length === 0) {
      toast.error(
        'Please add at least one evaluation criteria with a question'
      );
      return;
    }

    setLoading(true);
    try {
      const input: CustomInterviewInput = {
        title,
        description: description || `Custom interview for ${role}`,
        role,
        category,
        difficulty,
        evaluationCriteria: validCriteria.map((c) => ({
          name: c.name,
          description: c.description,
          questions: c.questions
            .filter((q) => q.text.trim())
            .map((q) => ({
              text: q.text,
              type: q.type,
              sampleAnswer: q.sampleAnswer,
            })),
        })),
      };

      const result = await createCustomMockInterview(input);

      if (result.status === 'success') {
        toast.success('Interview template created successfully!');
        setOpen(false);
        resetForm();
        router.refresh();
      } else {
        toast.error(result.message || 'Failed to create interview');
      }
    } catch (error) {
      toast.error('An error occurred while creating the interview');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addCriteria = () => {
    setEvaluationCriteria([
      ...evaluationCriteria,
      {
        name: '',
        description: '',
        questions: [{ text: '', type: 'Behavioral' }],
      },
    ]);
  };

  const removeCriteria = (index: number) => {
    if (evaluationCriteria.length > 1) {
      setEvaluationCriteria(evaluationCriteria.filter((_, i) => i !== index));
    }
  };

  const updateCriteria = (
    index: number,
    field: keyof EvaluationCriteria,
    value: string | Question[]
  ) => {
    const updated = [...evaluationCriteria];
    updated[index] = { ...updated[index], [field]: value };
    setEvaluationCriteria(updated);
  };

  const addQuestion = (criteriaIndex: number) => {
    const updated = [...evaluationCriteria];
    updated[criteriaIndex].questions.push({ text: '', type: 'Behavioral' });
    setEvaluationCriteria(updated);
  };

  const removeQuestion = (criteriaIndex: number, questionIndex: number) => {
    const updated = [...evaluationCriteria];
    if (updated[criteriaIndex].questions.length > 1) {
      updated[criteriaIndex].questions = updated[
        criteriaIndex
      ].questions.filter((_, i) => i !== questionIndex);
      setEvaluationCriteria(updated);
    }
  };

  const updateQuestion = (
    criteriaIndex: number,
    questionIndex: number,
    field: keyof Question,
    value: string
  ) => {
    const updated = [...evaluationCriteria];
    updated[criteriaIndex].questions[questionIndex] = {
      ...updated[criteriaIndex].questions[questionIndex],
      [field]: value,
    };
    setEvaluationCriteria(updated);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Custom Interview
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Interview</DialogTitle>
          <DialogDescription>
            Create a personalized mock interview with custom evaluation criteria
            and questions.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'quick' | 'custom')}
        >
          <TabsList className="grid w-full grid-cols-1">
            {/* <TabsTrigger value="quick">
              <Wand2 className="mr-2 h-4 w-4" />
              Quick Create
            </TabsTrigger> */}
            <TabsTrigger value="custom">Custom Build</TabsTrigger>
          </TabsList>

          {/* Quick Create Tab */}
          <TabsContent value="quick" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title *</Label>
              <Input
                id="jobTitle"
                placeholder="e.g., Senior Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company (Optional)</Label>
              <Input
                id="company"
                placeholder="e.g., Google"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobDescription">
                Job Description * (paste from job posting)
              </Label>
              <Textarea
                id="jobDescription"
                placeholder="Paste the job description here. We'll analyze it to generate relevant interview questions..."
                rows={8}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                We&apos;ll analyze the job description to automatically generate
                relevant evaluation criteria and interview questions.
              </p>
            </div>
          </TabsContent>

          {/* Custom Build Tab */}
          <TabsContent value="custom" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Interview Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Product Manager Interview"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Input
                  id="role"
                  placeholder="e.g., Product Manager"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the interview..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as Category)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templateCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select
                  value={difficulty}
                  onValueChange={(v) => setDifficulty(v as Difficulty)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Evaluation Criteria Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Evaluation Criteria
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addCriteria}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Criteria
                </Button>
              </div>

              {evaluationCriteria.map((criteria, criteriaIndex) => (
                <div
                  key={criteriaIndex}
                  className="border rounded-lg p-4 space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Criteria Name *</Label>
                          <Input
                            placeholder="e.g., Communication Skills"
                            value={criteria.name}
                            onChange={(e) =>
                              updateCriteria(
                                criteriaIndex,
                                'name',
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description *</Label>
                          <Input
                            placeholder="What this criteria evaluates..."
                            value={criteria.description}
                            onChange={(e) =>
                              updateCriteria(
                                criteriaIndex,
                                'description',
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>

                      {/* Questions for this criteria */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Questions</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addQuestion(criteriaIndex)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Question
                          </Button>
                        </div>

                        {criteria.questions.map((question, questionIndex) => (
                          <div
                            key={questionIndex}
                            className="flex items-start gap-2 bg-muted/50 rounded p-2"
                          >
                            <div className="flex-1 space-y-2">
                              <Input
                                placeholder="Question text..."
                                value={question.text}
                                onChange={(e) =>
                                  updateQuestion(
                                    criteriaIndex,
                                    questionIndex,
                                    'text',
                                    e.target.value
                                  )
                                }
                              />
                              <Select
                                value={question.type}
                                onValueChange={(v) =>
                                  updateQuestion(
                                    criteriaIndex,
                                    questionIndex,
                                    'type',
                                    v
                                  )
                                }
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Behavioral">
                                    Behavioral
                                  </SelectItem>
                                  <SelectItem value="Technical">
                                    Technical
                                  </SelectItem>
                                  <SelectItem value="Role-Specific">
                                    Role-Specific
                                  </SelectItem>
                                  <SelectItem value="Situational">
                                    Situational
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {criteria.questions.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  removeQuestion(criteriaIndex, questionIndex)
                                }
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {evaluationCriteria.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCriteria(criteriaIndex)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={activeTab === 'quick' ? handleQuickCreate : handleCustomCreate}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Interview'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
