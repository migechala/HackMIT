import HeroSection from './components/HeroSection';
import StatsSection from './components/StatsSection';
import LogoMarquee from './components/LogoMarquee';
import ImageSection from './components/ImageSection';
import TestimonialSection from './components/TestimonialSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';

export default function LegacyLanding() {
  return (
    <div className="bg-black min-h-screen font-sans text-white">
      <HeroSection />
      <StatsSection />
      <LogoMarquee />
      <ImageSection />
      <TestimonialSection />
      <ContactSection />
      <Footer />
    </div>
  );
}
