import { getCandidateUserProfile } from "@/data/user/user";
import { CandidateSkillsStats, SkillBundle } from "@/types";
import { getCourseRecs } from "@/utils/courseCatalog";
import { serverGetLoggedInUser } from "@/utils/server/serverGetLoggedInUser";
import { useState } from "react";

const MAX_SKILLS = 5;
const COURSES_PER_SKILL = 3;
export function useSkillBuilder() {
  const [bundles, setBundles] = useState<SkillBundle[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"practice" | "interview">("practice");

  const fetchData = async (newMode?: "practice" | "interview") => {
    const interviewMode = newMode || mode;
    setIsLoading(true);
    setError(null);

    try {
      const user = await serverGetLoggedInUser();
      if (!user) throw new Error("No user");

      const candidate = await getCandidateUserProfile(user.id);
      if (!candidate) throw new Error("No candidate profile");

      const rawStats: CandidateSkillsStats[] =
        interviewMode === "interview"
          ? candidate.interview_skill_stats
          : candidate.practice_skill_stats;

      if (!rawStats?.length) {
        setBundles([]);
        return;
      }

      const ordered = [...rawStats]
        .sort((a, b) => a.avg_score - b.avg_score)
        .slice(0, MAX_SKILLS);

      const bundles: SkillBundle[] = await Promise.all(
        ordered.map(async (stats) => {
          const all = getCourseRecs(stats.skill);
          return {
            stats,
            courses: all.slice(0, COURSES_PER_SKILL),
          };
        })
      );

      setBundles(bundles);
      setMode(interviewMode); // update mode in state
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to fetch");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    bundles,
    isLoading,
    error,
    fetchData,
    mode,
  };
}
