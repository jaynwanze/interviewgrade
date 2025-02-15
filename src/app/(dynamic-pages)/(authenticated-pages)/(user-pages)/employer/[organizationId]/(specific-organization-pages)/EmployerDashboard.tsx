// app/employer/page.tsx
'use client';
import { useEffect, useState } from 'react';
// import your data fetchers, etc.

export default function EmployerDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // e.g., fetch overall stats about your interviews or tokens left
    // setStats(...) with the result
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Employer Dashboard</h1>
      {stats ? (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 shadow bg-white">
            Your Tokens: {stats.tokensLeft}
          </div>
          <div className="p-4 shadow bg-white">
            Active Searches: {stats.activeSearches}
          </div>
          <div className="p-4 shadow bg-white">
            New Candidates: {stats.newCandidatesThisWeek}
          </div>
        </div>
      ) : (
        <p>Loading dashboard...</p>
      )}
    </div>
  );
}
