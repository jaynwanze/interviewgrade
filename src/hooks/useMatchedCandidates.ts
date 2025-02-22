// hooks/useMatchedCandidates.ts

import { useEffect, useState } from "react";
import type { CandidateRow } from "@/types";

// Example shape of "employerPrefs"
type EmployerPrefs = {
  location: string;
  skill: string;
};

// This returns all the derived data for either 'interview' or 'practice'
export function useMatchedCandidates(
  candidates: CandidateRow[],
  prefs: EmployerPrefs,
  mode: "interview" | "practice"
) {
  const [matched, setMatched] = useState<CandidateRow[]>([]);
  const [topThree, setTopThree] = useState<CandidateRow[]>([]);
  const [topProspect, setTopProspect] = useState<CandidateRow | null>(null);
  const [skillGapMessage, setSkillGapMessage] = useState("");
  const [percentiles, setPercentiles] = useState<{ [id: string]: number }>({});

  // Helper to compute average interview/practice skill
  function getAvg(cand: CandidateRow) {
    const stats =
      mode === "interview"
        ? cand.interview_skill_stats
        : cand.practice_skill_stats;
    if (!stats || stats.length === 0) return 0;
    const sum = stats.reduce((acc, s) => acc + s.avg_score, 0);
    return sum / stats.length;
  }

  // Check if candidate has the desired skill in the correct stats array
  function hasDesiredSkill(cand: CandidateRow, skill: string) {
    const stats =
      mode === "interview"
        ? cand.interview_skill_stats
        : cand.practice_skill_stats;
    return stats.some((s) => s.skill === skill);
  }

  // Check if candidate’s location matches
  function locationMatches(cand: CandidateRow, location: string) {
    if (location === "Remote") return true;
    return cand.country === location;
  }

  useEffect(() => {
    // 1) Filter
    const filtered = candidates.filter((cand) => {
      return (
        locationMatches(cand, prefs.location) &&
        hasDesiredSkill(cand, prefs.skill)
      );
    });

    // 2) If none => skill-gap message
    if (filtered.length === 0) {
      setSkillGapMessage(
        `No candidates found for ${mode} skill: ${prefs.skill} in ${
          prefs.location
        }.
         You may broaden your search or consider remote options.`
      );
    } else {
      setSkillGapMessage("");
    }

    // 3) Sort by highest average skill
    const sorted = filtered.slice().sort((a, b) => getAvg(b) - getAvg(a));
    setMatched(sorted);

    // 4) top 3 & top prospect
    const top3 = sorted.slice(0, 3);
    setTopThree(top3);
    setTopProspect(top3.length > 0 ? top3[0] : null);

    // 5) optional: compute percentiles
    if (sorted.length > 0) {
      const scoresOnly = sorted.map((cand) => getAvg(cand)).sort((a, b) => a - b);
      const pMap: { [id: string]: number } = {};
      sorted.forEach((cand) => {
        const candidateAvg = getAvg(cand);
        const lessOrEqual = scoresOnly.filter((s) => s <= candidateAvg).length;
        const percentile = (lessOrEqual / sorted.length) * 100;
        pMap[cand.id] = percentile;
      });
      setPercentiles(pMap);
    }
  }, [candidates, prefs, mode]);

  return {
    matched,
    topThree,
    topProspect,
    skillGapMessage,
    percentiles,
  };
}
