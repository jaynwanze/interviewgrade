// TipsCard.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

const tips = [
  'Pause briefly before answering to stay composed.',
  'Use the STAR format for structured responses.',
  'Speak clearly and confidently, even in virtual interviews.',
  'Review your past interview analytics to spot trends.',
  'Be concise and avoid rambling — get to the point.',
];

export default function TipsCard() {
  const [tip, setTip] = useState('');

  useEffect(() => {
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    setTip(randomTip);
  }, []);

  return (
    <Card className="bg-blue-100 border-blue-300">
      <CardContent className="py-4">
        <p className="text-sm font-medium">💡 Tip of the Day</p>
        <p className="text-xs text-gray-700 mt-1">{tip}</p>
      </CardContent>
    </Card>
  );
}
