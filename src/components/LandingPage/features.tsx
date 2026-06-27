import { featuresData } from '@/data/anon/features-data';
import { Sparkles } from 'lucide-react';
import { BentoCard, BentoGrid } from '../magicui/bento-grid';
import TitleBlock from '../title-block';

export default function Features() {
  return (
    <section className="py-16 max-w-6xl flex flex-col justify-center items-center  mx-auto space-y-10 overflow-hidden px-6">
      <TitleBlock
        icon={<Sparkles size={18} />}
        title="Key Features for Interview Success"
        section="Features"
        subtitle="Unlock the tools and insights you need to excel in your interviews. Our platform is designed to help you prepare, practice, and perform at your best."
      />
      <BentoGrid className="grid-cols-1 md:grid-cols-2">
        {featuresData.slice(0, 2).map((feature, idx) => (
          <BentoCard key={idx} {...feature} />
        ))}
      </BentoGrid>
      <BentoGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
        {featuresData.slice(2, 5).map((feature, idx) => (
          <BentoCard key={idx} {...feature} />
        ))}
      </BentoGrid>
    </section>
  );
}
