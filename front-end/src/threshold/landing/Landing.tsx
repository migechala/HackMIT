import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HeroStory from './HeroStory';
import { HowItWorks, LogoStrip, PreviewCards, Sustainability } from './Sections';
import Nav, { Footer } from '../ui/Nav';
import ProgressiveBlur from '../ui/ProgressiveBlur';
import { useTheme } from '../useTheme';

export default function Landing() {
  useTheme('threshold');
  const { hash, key } = useLocation();

  // Nav anchors: scroll to #how-it-works after the pin-spacer has been measured.
  useEffect(() => {
    if (!hash) return;
    const id = window.setTimeout(() => {
      ScrollTrigger.refresh();
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }, 120);
    return () => window.clearTimeout(id);
  }, [hash, key]);

  return (
    <div className="min-h-screen bg-[#FAFAF7] font-sans text-[#2B2E28]">
      <a href="#how-it-works" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-[#1F3D2B] focus:px-4 focus:py-2 focus:text-[#FAFAF7]">Skip to content</a>
      <ProgressiveBlur />
      <Nav />
      <main>
        <HeroStory />
        <LogoStrip />
        <HowItWorks />
        <Sustainability />
        <PreviewCards />
      </main>
      <Footer />
    </div>
  );
}
