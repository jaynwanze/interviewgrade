'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const mockCandidates = [
  {
    id: 'c1',
    name: 'Alice Anderson',
    topSkills: ['Communication', 'Teamwork'],
    unlocked: false,
    email: 'alice@example.com',
  },
  {
    id: 'c2',
    name: 'Bob Brown',
    topSkills: ['Problem Solving', 'Adaptability'],
    unlocked: true,
    email: 'bob@example.com',
  },
  {
    id: 'c3',
    name: 'Charlie Davis',
    topSkills: ['Decision Making', 'Conflict Resolution'],
    unlocked: false,
    email: 'charlie@example.com',
  },
];

export default function CandidateDetailsPage({
  params,
}: {
  params: { candidateId: string };
}) {
  const [candidates, setCandidates] = useState(mockCandidates);
  const candidate = candidates.find((c) => c.id === params.candidateId);
  const [tokensLeft, setTokensLeft] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    // fetch candidate details
    // fetch employer tokens
    // setCandidate(...) setTokensLeft(...)
  }, [params.candidateId]);

  // async function handleUnlock() {
  //   if (tokensLeft <= 0) {
  //     setError('You do not have enough tokens. Please purchase more.');
  //     return;
  //   }
  //   // Call API to "spend" token
  //   // e.g. spendEmployerToken(candidate.id)
  //   // upon success: show full details
  // }
  if (!candidate) return <div>Candidate not found.</div>;

  function handleUnlock() {
    // In a real app, you'd call a server action / API to spend a token
    // Then update the local state:
    if (!candidate) return;
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id === candidate.id) {
          return { ...c, unlocked: true };
        }
        return c;
      }),
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{candidate.name}</h2>
      <p className="text-sm text-gray-500">
        Top Skills: {candidate.topSkills.join(', ')}
      </p>
      {!candidate.unlocked ? (
        <div className="p-4 bg-white shadow space-y-2">
          <p>Contact details locked. Spend 1 token to unlock?</p>
          <button
            onClick={handleUnlock}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Unlock Candidate
          </button>
        </div>
      ) : (
        <div className="p-4 bg-white shadow space-y-2">
          <p className="font-medium">Email: {candidate.email}</p>
          <p>Other contact info or details...</p>
        </div>
      )}
    </div>
  );
}