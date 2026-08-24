import { notFound } from 'next/navigation';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Practice } from '@/modules/practice/practice.schema';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';

import styles from './editor-layout.module.css';
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
    document?: string;
    error?: string;
  };
};

type PracticeLoadResult =
  | { ready: true; practice: Practice | null }
  | { ready: false; practice: null };

function normalizeEditorDifficulty(
  difficulty: string | null | undefined,
): string | null | undefined {
  if (difficulty === 'Easy') return 'Beginner';
  if (difficulty === 'Hard') return 'Advanced';
  return difficulty;
}

async function loadPractice(practiceId: string): Promise<PracticeLoadResult> {
  await serverGetLoggedInUser();

  try {
    const { createAuthenticatedPracticeService } = await import(
      '@/modules/practice/practice.service'
    );
    const service = await createAuthenticatedPracticeService();
    const practice = await service.getById(practiceId);

    if (!practice) {
      return { ready: true, practice: null };
    }

    return {
      ready: true,
      practice: {
        ...practice,
        draft: {
          ...practice.draft,
          difficulty: normalizeEditorDifficulty(practice.draft.difficulty),
        },
      },
    };
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
            <CardTitle className="text-xl">Practice editor unavailable</CardTitle>
            <CardDescription>
              Refresh to try loading this Practice again.
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
      <div className={styles.shell}>
        <PracticeEditor key={editorKey} practice={result.practice} />
      </div>
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
        Published. This version is now locked for future sessions and a fresh draft
        is ready for your next edit.
      </Notice>
    );
  }

  if (searchParams?.saved === '1') {
    return <Notice tone="success">Draft saved.</Notice>;
  }

  if (searchParams?.generated === '1') {
    return (
      <Notice tone="success">
        AI draft created{searchParams.document === '1' ? ' from your uploaded document' : ''}.
        Review the questions, rubric and timings before publishing.
      </Notice>
    );
  }

  if (searchParams?.created === '1') {
    return (
      <Notice tone="success">
        Practice created. Add your questions and scoring rubric, then publish when
        it is ready.
      </Notice>
    );
  }

  switch (searchParams?.error) {
    case 'weights':
      return (
        <Notice tone="warning">
          Rubric weights must total 100% before publishing. You can still save the
          draft while adjusting them.
        </Notice>
      );
    case 'mappings':
      return (
        <Notice tone="warning">
          Every question needs a scoring criterion and every criterion must be used
          before publishing.
        </Notice>
      );
    case 'invalid':
      return (
        <Notice tone="error">
          Some fields are incomplete or outside their allowed ranges. Review the
          highlighted Practice details and try again.
        </Notice>
      );
    case 'unavailable':
      return (
        <Notice tone="warning">
          This Practice could not be saved. Your current draft remains on screen.
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
