'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';

import { getPracticeTemplatesByCategoryAndMode } from '@/data/user/templates';
import { PracticeTemplate } from '@/types';
import { INTERVIEW_PRACTICE_MODE } from '@/utils/constants';
export function TemplatePicker({
  onSelect,
  onCancel,
}: {
  onSelect: (tplId: PracticeTemplate) => void;
  onCancel: () => void;
}) {
  const [templates, setTemplates] = useState<PracticeTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPracticeTemplatesByCategoryAndMode(
      INTERVIEW_PRACTICE_MODE,
      'Soft Skills',
    ).then((list) => {
      setTemplates(list);
      setLoading(false);
    });
  }, []);

  return (
    <div className="absolute inset-0 bg-background/80 flex items-center justify-center p-6">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-sm p-4">
        <h3 className="text-lg font-semibold mb-2">Pick a topic</h3>
        {loading ? (
          <Skeleton className="h-24" />
        ) : (
          <ul className="space-y-1 max-h-60 overflow-auto">
            {templates.map((tpl) => (
              <li key={tpl.id}>
                <Button
                  variant="outline"
                  className="w-full text-left"
                  onClick={() => onSelect(tpl)}
                >
                  {tpl.title}
                </Button>
              </li>
            ))}
          </ul>
        )}
        <Button variant="ghost" className="mt-4 w-full" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
