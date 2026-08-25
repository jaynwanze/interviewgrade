import { Tab } from './Tab';
import { TabsNavigationProps } from './types';

export const TabsNavigation = ({ tabs }: TabsNavigationProps) => {
  return (
    <div className="overflow-x-auto border-b">
      <div className="flex min-w-max gap-3 sm:gap-5">
        {tabs.map((tab) => {
          return <Tab key={tab.href} {...tab} />;
        })}
      </div>
    </div>
  );
};
