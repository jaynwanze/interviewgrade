import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { LucideIcon, User } from 'lucide-react';

interface RadioCardProps {
  label: string;
  icon: LucideIcon;
}

const RadioCard = function RadioCard({ label, icon }: RadioCardProps) {
  return (
    <div className="flex items-center p-4 border rounded-lg">
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
