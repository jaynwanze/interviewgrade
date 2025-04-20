//
// Helper function to determine badge color based on score.
//
export const getBadgeColor = (score: number): string => {
  if (score >= 70) return 'bg-green-500 text-white';
  if (score >= 60) return 'bg-lime-500 text-white';
  if (score >= 50) return 'bg-yellow-500 text-white';
  if (score >= 40) return 'bg-orange-500 text-white';
  return 'bg-red-500 text-white';
};

export const getProgressBarColor = (score: number): string => {
  if (score >= 70) return 'bg-green-500';
  if (score >= 60) return 'bg-lime-500';
  if (score >= 50) return 'bg-yellow-400';
  if (score >= 40) return 'bg-orange-400';
  return 'bg-red-500';
};
export const getStatus = (score: number) => {
  if (score >= 70) return { label: "On Track", variant: "success" }
  if (score >= 60) return { label: "Getting There", variant: "primary" }
  if (score >= 50) return { label: "Needs Practice", variant: "warning" }
  if (score >= 40) return { label: "Struggling", variant: "light" }
  return { label: "Needs Improvement", variant: "danger" }
}