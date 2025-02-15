'use client';
import { useState } from 'react';

export default function SearchCandidatePage() {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<any[]>([]);

  async function handleSearch() {
    // call your backend or Supabase function
    // e.g. const data = await searchCandidates(keyword);
    // setResults(data);
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Search Candidates</h2>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Search by skill, name, or role..."
          className="border p-2 w-full"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2"
          onClick={handleSearch}
        >
          Search
        </button>
      </div>

      <div>
        {results.length === 0 ? (
          <p>No candidates found.</p>
        ) : (
          <ul className="divide-y">
            {results.map((candidate) => (
              <li key={candidate.id} className="py-2">
                <strong>{candidate.name}</strong>
                <span> - {candidate.topSkills.join(', ')}</span>
                {/* etc. */}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
