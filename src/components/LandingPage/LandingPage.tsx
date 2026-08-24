import { Footer } from './Footer';
import HeroSection from './HeroSection';
import HowItWorks from './HowItWorks';
import CTA from './cta';
import Features from './features';
import Pricing from './pricing';

export const LandingPage = () => {
  return (
    <main>
      <HeroSection />
      <HowItWorks />
      <Features />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
};
