import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface RadioCardProps {
  label: string;
  icon: LucideIcon;
}

const RadioCard = function RadioCard({ label, icon }: RadioCardProps) {
  const Icon = icon;
  return (
    <div className="flex items-center p-4 border rounded-lg">
      <Icon className="mr-2" />
      <span>{label}</span>
    </div>
  );
};

const RadioCards = function RadioCards() {
  return (
    <RadioGroup>
      <RadioGroupItem value="employer" id="employer">
        <RadioCard label="Employer" icon={User} />
      </RadioGroupItem>
      <RadioGroupItem value="candidate" id="candidate">
        <RadioCard label="candidate" icon={User} />
      </RadioGroupItem>
    </RadioGroup>
  );
};

export { RadioCard, RadioCards };
