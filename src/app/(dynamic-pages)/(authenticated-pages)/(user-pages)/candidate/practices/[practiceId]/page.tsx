import { notFound } from 'next/navigation';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Practice } from '@/modules/practice/practice.schema';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';

import { PracticeEditor } from './PracticeEditor';

type PracticeEditorPageProps = {
  params: {
    practiceId: string;
  };
  searchParams?: {
    saved?: string;
    published?: string;
    created?: string;
    generated?: string;
    error?: string;
  };
};

type PracticeLoadResult =
  | { ready: true; practice: Practice | null }
  | { ready: false; practice: null };

async function loadPractice(practiceId: string): Promise<PracticeLoadResult> {
  await serverGetLoggedInUser();

  try {
    const { createAuthenticatedPracticeService } = await import(
      '@/modules/practice/practice.service'
    );
    const service = await createAuthenticatedPracticeService();
    const practice = await service.getById(practiceId);

    return { ready: true, practice };
  } catch (error) {
    console.error('PracticeEditorPage: v2 practice persistence unavailable', error);
    return { ready: false, practice: null };
  }
}

export default async function PracticeEditorPage({
  params,
  searchParams,
}: PracticeEditorPageProps) {
  const result = await loadPractice(params.practiceId);

  if (!result.ready) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-xl">Practice editor setup pending</CardTitle>
            <CardDescription>
              The v2 practice database is not available in this environment yet.
              Your existing dashboard and mock interviews are unaffected.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!result.practice) {
    notFound();
  }

  const editorKey = result.practice.draft.questions
    .map((question) => question.id)
    .join(':');

  return (
    <div className="space-y-4">
      <EditorNotice searchParams={searchParams} />
      <PracticeEditor key={editorKey} practice={result.practice} />
    </div>
  );
}

function EditorNotice({
  searchParams,
}: {
  searchParams: PracticeEditorPageProps['searchParams'];
}) {
  if (searchParams?.published === '1') {
    return (
      <Notice tone="success">
        Published successfully. That version is now immutable, and a fresh
        editable draft was created for future changes.
      </Notice>
    );
  }

  if (searchParams?.saved === '1') {
    return <Notice tone="success">Draft changes saved.</Notice>;
  }

  if (searchParams?.generated === '1') {
    return (
      <Notice tone="success">
        AI draft created. Review the scenario, questions, rubric weights,
        question mappings, and timings below. Nothing has been published yet.
      </Notice>
    );
  }

  if (searchParams?.created === '1') {
    return (
      <Notice tone="success">
        Practice created. Build out the questions and rubric, preview it, then
        publish when it is ready.
      </Notice>
    );
  }

  switch (searchParams?.error) {
    case 'weights':
      return (
        <Notice tone="warning">
          Rubric weights must total exactly 100% before publishing. You can still
          save the draft while you are adjusting them.
        </Notice>
      );
    case 'mappings':
      return (
        <Notice tone="warning">
          Every question needs at least one scoring criterion, and every rubric
          criterion must be used by at least one question before publishing.
        </Notice>
      );
    case 'invalid':
      return (
        <Notice tone="error">
          Some draft fields are incomplete or outside their allowed ranges. Check
          the questions, timing, rubric, and practice details, then try again.
        </Notice>
      );
    case 'unavailable':
      return (
        <Notice tone="warning">
          The practice could not be saved in this environment. Existing mock
          interview features are unaffected.
        </Notice>
      );
    default:
      return null;
  }
}

function Notice({
  tone,
  children,
}: {
  tone: 'success' | 'warning' | 'error';
  children: React.ReactNode;
}) {
  const classes =
    tone === 'success'
      ? 'border-emerald-500/30 bg-emerald-500/5'
      : tone === 'error'
        ? 'border-destructive/30 bg-destructive/5 text-destructive'
        : 'border-amber-500/30 bg-amber-500/5';

  return (
    <div className={`mx-auto w-full max-w-6xl rounded-lg border px-4 py-3 text-sm ${classes}`}>
      {children}
    </div>
  );
}
