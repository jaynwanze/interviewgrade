import React, { createContext, useContext, useMemo } from 'react';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

interface WalkthroughContextType {
  startTour: (steps: Shepherd.StepOptions[]) => void;
  resetTour: () => void;
}

const WalkthroughContext = createContext<WalkthroughContextType>({
  startTour: () => {},
  resetTour: () => {},
});

export const WalkthroughProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Use useMemo so the tour instance remains stable
  const tour = useMemo(() => {
    return new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: 'shadow-md bg-white rounded-lg p-4 text-sm',
        scrollTo: true,
        cancelIcon: { enabled: true },
      },
    });
  }, []);

  // Function to start the tour with a set of steps
  const startTour = (steps: Shepherd.StepOptions[]) => {
    // Remove any previous steps
    tour.steps.forEach((step) => tour.removeStep(step.id));
    // Add new steps for the current page
    steps.forEach((step) => {
      tour.addStep(step);
    });
    tour.start();
  };

  const resetTour = () => {
    tour.complete();
  };

  return (
    <WalkthroughContext.Provider value={{ startTour, resetTour }}>
      {children}
    </WalkthroughContext.Provider>
  );
};

export const useWalkthrough = () => useContext(WalkthroughContext);
