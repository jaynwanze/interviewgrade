// course‑catalog.ts
import type { CourseRec } from "@/types";

export const COURSE_CATALOG: CourseRec[] = [
  /* ──────────── Problem‑solving ──────────── */
  {
    id: "umn-creative-problem-solving",
    title: "Creative Problem Solving",
    provider: "University of Minnesota · Coursera",
    length_minutes: 4 * 4 * 60,            // 4 weeks × 4 h
    url: "https://www.coursera.org/learn/creative-problem-solving",
    tags: ["Problem Solving"],
  },
  {
    id: "ucdavis-problem-solving",
    title: "Effective Problem-Solving and Decision-Making",
    provider: "University of California,  Irvine · Coursera",
    length_minutes: 4 * 3 * 60,            // 4 weeks × 3 h
    url: "https://www.coursera.org/learn/problem-solving",
    tags: ["Problem Solving"],
  },
  {
    id: "yt-critical-thinking-problem-solving",
    title: "Problem‑Solving, Creativity & Critical Thinking",
    provider: "YouTube (Edu‑pedia)",
    length_minutes: 30,
    url: "https://www.youtube.com/watch?v=VtiMEflipAg",
    tags: ["Problem Solving"],
  },

  /* ──────────── Adaptability / Resilience ──────────── */
  {
    id: "linkedin-building-resilience",
    title: "Building Resilience",
    provider: "LinkedIn Learning",
    length_minutes: 40,
    url: "https://www.linkedin.com/learning/building-resilience",
    tags: ["Adaptability"],
  },
  {

    id: "uc-davis-adaptability-resilience",
    title: "Adaptability and Resilience",
    provider: "University of California, Davis · Coursera",
    length_minutes: 4 * 3 * 60,            // 4 weeks × 3 h
    url: "https://www.coursera.org/learn/adaptability-and-resiliency",
    tags: ["Adaptability"],
  },
  {
    id: "openlearn-adaptability-resilience",
    title: "Developing Career Resilience & Adaptability",
    provider: "OpenLearn (Open University)",
    length_minutes: 120,
    url: "https://www.open.edu/openlearn/ocw/mod/oucontent/view.php?id=84957",
    tags: ["Adaptability"]
  },

  /* ──────────── Decision‑making ──────────── */

  {
    id: "edx-exec-decision-making",
    title: "Critical Thinking: Reasoned Decision Making",
    provider: "Technolgico de Monterry · edX",
    length_minutes: 4 * 3 * 60,            // 4 weeks × 3 h
    url: "https://www.edx.org/learn/critical-thinking-skills/tecnologico-de-monterrey-critical-thinking-reasoned-decision-making?index=product&queryID=833a687c2093fdc5c2fdd457ff10a3da&position=10&results_level=second-level-results&term=decision+making&objectID=course-5127aff6-6a49-4592-bdd1-f608b8b43f3e&campaign=Critical+thinking%3A+reasoned+decision+making&source=edX&product_category=course&placement_url=https%3A%2F%2Fwww.edx.org%2Fsearch",
    tags: ["Decision Making"],
  },
  {
    id: "brian-tracy-decision-making",
    title: "6 Tips for Successful Decision Making in the Workplace",
    url: "https://www.youtube.com/watch?v=WPFDtijUbMg&ab_channel=BrianTracy",
    provider: "Youtube | Brian Tracy",
    length_minutes: 8,
    tags: ["Decision Making"],
  },


  /* ──────────── Conflict resolution ──────────── */
  {
    id: "uci-conflict-resolution",
    title: "Conflict Resolution Skills",
    provider: "University of California, Irvine · Coursera",
    length_minutes: 6 * 60,
    url: "https://www.coursera.org/learn/conflict-resolution-skills",
    tags: ["Conflict Resolution"],
  },
  {
    id: "udemy-conflict-management",
    title: "Conflict Management",
    provider: "Udemy",
    length_minutes: 180,
    url: "https://www.udemy.com/course/conflict-management-with-emotional-intelligence/",
    tags: ["Conflict Resolution"],
  },
  {
    id: "coursera-conflict-management",
    title: "Conflict Management and Negotiation",
    provider: "University of California, Irvine (Coursera ‑ free audit)",
    length_minutes: 360,
    url: "https://www.coursera.org/learn/conflict-management",
    tags: ["conflict_resolution"]
  },
  {
    id: "ted-talk-conflict-resolution",
    title: "Why There’s So Much Conflict at Work and What You Can Do to Fix It ",
    url: "https://www.youtube.com/watch?v=2l-AOBz69KU&ab_channel=TEDxTalks",
    provider: "TEDx Talks",
    length_minutes: 15,
    tags: ["Conflict Resolution"],
  },

];

export function getCourseRecs(skillTag: string): CourseRec[] {
  return COURSE_CATALOG.filter(c => c.tags.includes(skillTag))
    .slice(0, 3);           // take top‑3 for brevity
}
