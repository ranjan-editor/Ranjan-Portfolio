/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PortfolioProvider, usePortfolio } from './context/PortfolioContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Services } from './components/Services';
import { ToolsSkills } from './components/ToolsSkills';
import { Projects } from './components/Projects';
import { BeforeAfterSection } from './components/BeforeAfterSection';
import { Process } from './components/Process';
import { Testimonials } from './components/Testimonials';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { VideoLightbox } from './components/VideoLightbox';
import { AdminDrawer } from './components/AdminDrawer';
import { SectionId } from './types/portfolio';

const PortfolioContent: React.FC = () => {
  const { data } = usePortfolio();

  const sectionComponents: Record<SectionId, React.ReactNode> = {
    hero: <Hero key="hero" />,
    about: <About key="about" />,
    services: <Services key="services" />,
    tools: <ToolsSkills key="tools" />,
    projects: <Projects key="projects" />,
    beforeAfter: <BeforeAfterSection key="beforeAfter" />,
    process: <Process key="process" />,
    testimonials: <Testimonials key="testimonials" />,
    contact: <Contact key="contact" />,
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-[#6C63FF]/20 selection:text-[#6C63FF]">
      {/* Subtle Ambient Pastel Gradient Glows matching the reference image */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -left-40 w-[550px] h-[550px] rounded-full bg-gradient-to-br from-[#6C63FF]/12 via-[#8B5CF6]/10 to-transparent blur-3xl" />
        <div className="absolute top-[15%] -right-32 w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-[#EC4899]/10 via-[#8B5CF6]/12 to-[#3B82F6]/10 blur-3xl" />
        <div className="absolute top-[55%] left-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#3B82F6]/10 via-[#6C63FF]/8 to-transparent blur-3xl" />
        <div className="absolute -bottom-32 right-[15%] w-[550px] h-[550px] rounded-full bg-gradient-to-tl from-[#8B5CF6]/12 via-[#EC4899]/8 to-transparent blur-3xl" />
      </div>

      {/* Sticky Glassmorphism Navigation */}
      <Navbar />

      {/* Main Dynamic Sections */}
      <main>
        {data.sectionOrder
          .filter((sec) => sec.visible)
          .map((sec) => sectionComponents[sec.id])}
      </main>

      {/* Minimal Premium Footer */}
      <Footer />

      {/* High-Definition Video Lightbox Modal */}
      <VideoLightbox />

      {/* Built-in Studio Admin / CMS Drawer */}
      <AdminDrawer />
    </div>
  );
};

export default function App() {
  return (
    <PortfolioProvider>
      <PortfolioContent />
    </PortfolioProvider>
  );
}
