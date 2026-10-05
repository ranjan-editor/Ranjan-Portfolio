import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Download, Play, Crown } from 'lucide-react';
import { motion } from 'motion/react';
import { usePortfolio } from '../context/PortfolioContext';

export const Hero: React.FC = () => {
  const { data, setActiveVideoModal, triggerSfx } = usePortfolio();
  const { profile, resume } = data;
  const [imgError, setImgError] = useState(false);

  // Reset image error state whenever portraitUrl is updated in Admin Panel
  useEffect(() => {
    setImgError(false);
  }, [profile.portraitUrl]);

  const hasUploadedResume = Boolean(resume && resume.fileUrl);

  const handleDownloadCV = () => {
    if (!resume || !resume.fileUrl) return;
    triggerSfx('buttonClick');
    const link = document.createElement('a');
    link.href = resume.fileUrl;
    link.download = resume.filename || `${profile.name.replace(/\s+/g, '_')}_CV.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenShowreel = () => {
    triggerSfx('projectOpen');
    setActiveVideoModal({
      isOpen: true,
      title: `${profile.name} — Official Showreel`,
      videoUrl: profile.showreelVideoUrl,
      thumbnail: profile.portraitUrl,
      duration: '01:24',
      tags: ['Showreel', 'Video Editing', 'Motion Graphics', 'Color Grading'],
      description: profile.heroDescription,
    });
  };

  return (
    <section id="home" className="relative pt-8 pb-14 lg:pt-12 lg:pb-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-block">
              <span className="text-xs sm:text-sm font-bold tracking-[0.18em] uppercase text-[#8B5CF6]">
                {profile.heroGreeting}
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl sm:text-6xl xl:text-[64px] font-extrabold tracking-tight text-[#10152B] leading-[1.08]">
                {profile.name}
              </h1>
              <h2 className="text-2xl sm:text-4xl xl:text-[42px] font-extrabold tracking-tight leading-[1.15] bg-gradient-to-r from-[#8B5CF6] via-[#6C63FF] to-[#3B82F6] bg-clip-text text-transparent">
                {profile.profession}
              </h2>
            </div>

            <p className="text-base sm:text-[17px] text-[#475467] leading-relaxed max-w-xl font-normal">
              {profile.heroDescription}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#work"
                onMouseEnter={() => triggerSfx('buttonHover')}
                onClick={(e) => {
                  e.preventDefault();
                  triggerSfx('buttonClick');
                  document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#10152B] hover:bg-[#1E2646] text-white text-sm font-semibold shadow-lg shadow-[#10152B]/15 hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <span>View My Work</span>
                <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>

              <button
                type="button"
                onMouseEnter={() => hasUploadedResume && triggerSfx('buttonHover')}
                onClick={handleDownloadCV}
                disabled={!hasUploadedResume}
                title={
                  hasUploadedResume
                    ? `Download ${resume?.filename}`
                    : 'CV not available yet'
                }
                className={`inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full glass-pill text-sm font-semibold transition-all duration-200 group ${
                  hasUploadedResume
                    ? 'hover:bg-white text-[#10152B] hover:-translate-y-0.5 cursor-pointer'
                    : 'text-[#98A2B3] opacity-65 cursor-not-allowed'
                }`}
              >
                <span>{hasUploadedResume ? 'Download CV' : 'CV not available yet'}</span>
                <Download
                  className={`w-4 h-4 transition-colors ${
                    hasUploadedResume
                      ? 'text-[#475467] group-hover:text-[#6C63FF]'
                      : 'text-[#98A2B3]'
                  }`}
                />
              </button>
            </div>

            {/* Trusted by / Worked with */}
            <div className="pt-6 space-y-3.5">
              <p className="text-xs font-medium text-[#667085] tracking-wide">
                Trusted by
              </p>
              <div className="flex flex-wrap items-center gap-6 sm:gap-8 text-[#475467]/85">
                {/* YouTube */}
                <div className="flex items-center gap-1.5 hover:text-[#10152B] transition-colors select-none">
                  <svg className="w-5 h-5 text-[#475467]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  <span className="text-sm font-semibold tracking-tight">YouTube</span>
                </div>

                {/* Instagram */}
                <div className="flex items-center gap-1.5 hover:text-[#10152B] transition-colors select-none">
                  <svg className="w-4 h-4 text-[#475467]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                  <span className="text-sm font-medium">Instagram</span>
                </div>

                {/* TikTok */}
                <div className="flex items-center gap-1.5 hover:text-[#10152B] transition-colors select-none">
                  <svg className="w-4 h-4 text-[#475467]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                  <span className="text-sm font-semibold">TikTok</span>
                </div>

                {/* Google */}
                <div className="flex items-center hover:text-[#10152B] transition-colors select-none">
                  <span className="text-[16px] font-semibold tracking-tight text-[#667085]">Google</span>
                </div>

                {/* Canva */}
                <div className="flex items-center hover:text-[#10152B] transition-colors select-none">
                  <span className="font-signature text-2xl font-bold text-[#475467] tracking-normal">
                    Canva
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Portrait inside rounded glass frame + floating cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative flex items-center justify-center"
          >
            {/* Ambient soft glow behind portrait */}
            <div
              className="absolute -inset-6 rounded-[48px] bg-gradient-to-tr from-[#6C63FF]/25 via-[#8B5CF6]/15 to-[#EC4899]/20 blur-2xl pointer-events-none"
              aria-hidden="true"
            />

            {/* Main Glass Portrait Frame */}
            <div className="relative w-full max-w-[420px] aspect-square rounded-[42px] p-2.5 bg-gradient-to-b from-white/90 to-white/50 backdrop-blur-xl border-2 border-white shadow-[0_24px_60px_-15px_rgba(108,99,255,0.18)]">
              <div className="relative w-full h-full rounded-[34px] overflow-hidden bg-gradient-to-br from-[#E9ECFF] via-[#F3E8FF] to-[#FCE7F3]">
                {!imgError && profile.portraitUrl ? (
                  <img
                    src={profile.portraitUrl}
                    alt={`${profile.name} — ${profile.profession}`}
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
                    <div className="w-24 h-24 rounded-full bg-white/80 flex items-center justify-center text-3xl font-bold text-[#6C63FF] mb-3 shadow-md">
                      {profile.logoLetter}
                    </div>
                    <p className="font-bold text-[#10152B] text-lg">{profile.name}</p>
                    <p className="text-xs text-[#667085]">{profile.profession}</p>
                  </div>
                )}

                {/* Subtle red/warm creative rim light overlay matching prompt */}
                <div
                  className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-rose-500/10 pointer-events-none"
                  aria-hidden="true"
                />
              </div>

              {/* Floating Circular Play Button (Left Center) */}
              <button
                type="button"
                onClick={handleOpenShowreel}
                title="Play Showreel"
                className="absolute -left-5 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full glass-pill flex items-center justify-center text-[#6C63FF] shadow-xl hover:scale-110 hover:bg-white transition-all duration-200 cursor-pointer group z-20"
                aria-label="Play Showreel Video"
              >
                <span className="absolute inset-0 rounded-full bg-[#6C63FF]/15 animate-ping opacity-40" />
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#6C63FF] to-[#8B5CF6] flex items-center justify-center text-white shadow-md">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
              </button>

              {/* Floating Top-Right Card: 2+ Years of Experience */}
              <div className="absolute -right-3 sm:-right-6 top-6 glass-pill rounded-3xl px-5 py-4 shadow-xl border border-white/95 z-20 min-w-[125px]">
                <p className="text-2xl sm:text-3xl font-extrabold text-[#10152B] tabular-nums leading-none">
                  {profile.experienceYears}
                </p>
                <p className="mt-1.5 text-[11px] font-medium text-[#667085] leading-snug">
                  Years of
                  <br />
                  Experience
                </p>
              </div>

              {/* Handwritten Signature Floating on Right Middle */}
              <div className="hidden sm:flex flex-col items-center absolute -right-10 top-[54%] -rotate-12 z-20 pointer-events-none select-none">
                <Crown className="w-4 h-4 text-[#475467] mb-0.5 opacity-75" />
                <span className="font-signature text-2xl font-bold text-[#10152B]/85 tracking-wide whitespace-nowrap">
                  {profile.signatureText}
                </span>
                <div className="w-24 h-0.5 bg-gradient-to-r from-[#10152B]/60 to-transparent rounded-full -mt-1" />
              </div>

              {/* Floating Bottom-Right Card: Projects Completed 50+ with Sparkline */}
              <div className="absolute -right-2 sm:-right-6 -bottom-4 glass-pill rounded-3xl px-5 py-3.5 shadow-xl border border-white/95 z-20 flex items-center gap-4 min-w-[200px]">
                <div>
                  <p className="text-[11px] font-semibold text-[#667085] whitespace-nowrap">
                    Projects Completed
                  </p>
                  <p className="text-xl sm:text-2xl font-extrabold text-[#10152B] tabular-nums mt-0.5">
                    {profile.projectsCompleted.startsWith('+')
                      ? profile.projectsCompleted
                      : `+${profile.projectsCompleted.replace('+', '')}`}
                  </p>
                </div>
                {/* Mini Rising Line Graph */}
                <svg
                  className="w-16 h-9 text-[#8B5CF6] shrink-0"
                  viewBox="0 0 80 36"
                  fill="none"
                >
                  <path
                    d="M4 30 L24 22 L42 25 L62 12 L76 4"
                    stroke="url(#sparkline-grad)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4 30 L24 22 L42 25 L62 12 L76 4 L76 34 L4 34 Z"
                    fill="url(#sparkline-fill)"
                    opacity="0.2"
                  />
                  <defs>
                    <linearGradient id="sparkline-grad" x1="0" y1="0" x2="80" y2="0" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#6C63FF" />
                      <stop offset="1" stopColor="#EC4899" />
                    </linearGradient>
                    <linearGradient id="sparkline-fill" x1="40" y1="4" x2="40" y2="34" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#8B5CF6" />
                      <stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
