'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CandidateDetailsPage({
  params,
}: {
  params: { candidateId: string };
}) {
  const [candidate, setCandidate] = useState<any>(null);
  const [tokensLeft, setTokensLeft] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    // fetch candidate details
    // fetch employer tokens
    // setCandidate(...) setTokensLeft(...)
  }, [params.candidateId]);

  async function handleUnlock() {
    if (tokensLeft <= 0) {
      setError('You do not have enough tokens. Please purchase more.');
      return;
    }
    // Call API to "spend" token
    // e.g. spendEmployerToken(candidate.id)
    // upon success: show full details
  }

  if (!candidate) return <div>Loading candidate...</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold">{candidate.name}</h2>
      <p>Top Skills: {candidate.topSkills.join(', ')}</p>

      {candidate.unlocked ? (
        <div>
          <p>Email: {candidate.email}</p>
          <p>Phone: {candidate.phoneNumber}</p>
        </div>
      ) : (
        <div className="border p-4 my-2">
          <p>You must spend a token to unlock full contact details.</p>
          <button
            onClick={handleUnlock}
            className="bg-blue-500 text-white px-4 py-2"
          >
            Unlock Candidate
          </button>
          {error && <p className="text-red-500">{error}</p>}
        </div>
      )}
    </div>
  );
}
