// Utility function to select random elements
export const getRandomElements = <T>(arr: T[], count: number): T[] => {
    if (arr.length <= count) {
      return [...arr].sort(() => 0.5 - Math.random());
    }
  
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };
