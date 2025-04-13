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