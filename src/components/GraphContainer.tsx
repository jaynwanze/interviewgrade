import { T } from '@/components/ui/Typography';
import { cn } from '@/utils/cn';
import { BadgeDelta } from '@tremor/react';

type GraphContainerProps = {
  title: string;
  subTitle?: string;
  children: React.ReactNode;
  classname?: string;
  badgeValue?: string;
};

const getDeltaType = (percentage: string): string => {
  const percentageValue = parseFloat(percentage.replace('%', ''));
  if (percentageValue <= -50) {
    return 'decrease';
  } else if (-50 < percentageValue && percentageValue < 0) {
    return 'moderateDecrease';
  } else if (percentageValue === 0) {
    return 'unchanged';
  } else if (0 < percentageValue && percentageValue <= 50) {
    return 'moderateIncrease';
  }
  return 'increase';
};

export function GraphContainer({
  title,
  subTitle,
  children,
  classname,
  badgeValue,
}: GraphContainerProps) {
  return (
    <div className={cn('bg-card border rounded-xl overflow-hidden', classname)}>
      <div className="px-[18px] flex justify-between py-4 w-full ">
        <div className="">
          <T.H4 className="mt-0 text-card-foreground text-base">{title}</T.H4>
          <T.P className="text-muted-foreground text-base">{subTitle}</T.P>
        </div>
        {badgeValue && (
          <BadgeDelta
            deltaType={getDeltaType(badgeValue)}
            size="xs"
            className="h-fit"
          >
            {badgeValue}
          </BadgeDelta>
        )}
      </div>
      <div className="px-5 pb-6 h-full ">
        <div className="dark h-full ">{children}</div>
      </div>
    </div>
  );
}
