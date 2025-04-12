// useTour.ts
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

export const useTour = () => {
    const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
            classes: 'shadow-md bg-white rounded-lg p-4 text-sm',
            scrollTo: true,
            cancelIcon: { enabled: true },
        },
    });

    const addSteps = (steps) => {
        steps.forEach((step) => tour.addStep(step));
    };

    const startTour = () => tour.start();
    const completeTour = () => tour.complete();

    return { addSteps, startTour, completeTour, tour };
};
