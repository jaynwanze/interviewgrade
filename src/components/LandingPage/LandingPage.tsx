import { Footer } from './Footer';
import HeroSection from './HeroSection';
import HowItWorks from './HowItWorks';
import Features from './Features';
import SocialProof from './SocialProof';
import Pricing from './Pricing';
import FAQ from './FAQ';
import FinalCTA from './FinalCTA';

export const LandingPage = () => {
  return (
    <main className="overflow-hidden">
      <HeroSection />
      <SocialProof />
      <HowItWorks />
      <Features />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
};
