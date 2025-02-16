// app/employer/page.tsx
'use client';
import { useEffect, useState } from 'react';
// import your data fetchers, etc.
// Example mock
const mockCandidates = [
  { id: 'c1', name: 'Alice', location: 'United States', skill: 'Communication', score: 95 },
  { id: 'c2', name: 'Bob', location: 'United States', skill: 'Problem Solving', score: 92 },
  { id: 'c3', name: 'Charlie', location: 'Canada', skill: 'Decision Making', score: 88 },
  { id: 'c4', name: 'Diana', location: 'Remote', skill: 'Problem Solving', score: 90 },
  // ...
];

export default function EmployerDashboard() {
  // const [stats, setStats] = useState<any>(null);
  // Mock stats
  const stats = {
    tokensLeft: 10,
    activeSearches: 2,
    newCandidatesThisWeek: 5,
  };
  const [employerPrefs, setEmployerPrefs] = useState<any>(null); 
  const [topCandidates, setTopCandidates] = useState<any[]>([]);
  const [topProspect, setTopProspect] = useState<any>(null);

  useEffect(() => {
    // e.g., fetch overall stats about your interviews or tokens left
    // setStats(...) with the result
   // 1) fetch the employer’s candidate preferences (location, industry, skills)
    // For now, mock:
    const prefs = { location: 'United States', skills: 'Problem Solving' };
    setEmployerPrefs(prefs);

    // 2) filter the mockCandidates or call an API with these prefs
    const matched = mockCandidates
      .filter((cand) => 
        (cand.location.includes(prefs.location) ||
         prefs.location === 'Remote') &&
        cand.skill.includes(prefs.skills)
      )
      .sort((a, b) => b.score - a.score) // sort by descending score
      .slice(0, 3); // top 3

    setTopCandidates(matched);

    // 3) find the top candidate
    const top = matched[0];
    setTopProspect(top);
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Employer Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 shadow bg-white">
          <p className="text-sm text-gray-500">Your Tokens</p>
          <h2 className="text-lg font-semibold">{stats.tokensLeft}</h2>
        </div>
        <div className="p-4 shadow bg-white">
          <p className="text-sm text-gray-500">Active Searches</p>
          <h2 className="text-lg font-semibold">{stats.activeSearches}</h2>
        </div>
        <div className="p-4 shadow bg-white">
          <p className="text-sm text-gray-500">New Candidates (this week)</p>
          <h2 className="text-lg font-semibold">
            {stats.newCandidatesThisWeek}
          </h2>
        </div>
      </div>
      {employerPrefs ? (
        <p className="text-sm text-gray-600">
          Showing top matches for location <strong>{employerPrefs.location}</strong> and skill{' '}
          <strong>{employerPrefs.skills}</strong>.
        </p>
      ) : (
        <p>Loading your preferences...</p>
      )}

      <div className="bg-white p-4 shadow">
        <h2 className="text-lg font-semibold mb-2">Top Candidates</h2>
        <ul className="divide-y">
          {topCandidates.map((cand) => (
            <li key={cand.id} className="py-2">
              <strong>{cand.name}</strong> – Score {cand.score} / 100
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white p-4 shadow">
        <h2 className="text-lg font-semibold mb-2">Top Prospect</h2>
        <ul className="divide-y">
          <li className="py-2">
            <strong>{topProspect?.name}</strong> – Score {topProspect?.score} / 100
          </li>
        </ul>
      </div>
    </div>
  );
}
