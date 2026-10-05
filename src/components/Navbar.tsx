import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Menu, X, Volume2, VolumeX } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';

export const Navbar: React.FC = () => {
  const { data, visitorAudioMuted, toggleVisitorAudioMute } = usePortfolio();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      const sections = ['home', 'about', 'services', 'work', 'tools', 'testimonials', 'contact'];
      const scrollPosition = window.scrollY + 240;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveNav(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Home', href: '#home', id: 'home' },
    { label: 'About', href: '#about', id: 'about' },
    { label: 'Services', href: '#services', id: 'services' },
    { label: 'Work', href: '#work', id: 'work' },
    { label: 'Tools', href: '#tools', id: 'tools' },
    { label: 'Testimonials', href: '#testimonials', id: 'testimonials' },
    { label: 'Contact', href: '#contact', id: 'contact' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, id: string) => {
    e.preventDefault();
    setActiveNav(id);
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isMasterAudioEnabled = data.audio?.masterEnabled !== false;

  return (
    <header className="sticky top-4 z-40 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto transition-all duration-200">
      <div
        className={`glass-panel rounded-full px-4 sm:px-6 py-3 flex items-center justify-between transition-all duration-200 ${
          scrolled ? 'shadow-lg bg-white/85' : 'bg-white/70'
        }`}
      >
        {/* Left: Circular R logo + Ranjan Kumar + Subtitle */}
        <a
          href="#home"
          onClick={(e) => handleNavClick(e, '#home', 'home')}
          className="flex items-center gap-3 group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-indigo-100/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            {data.profile.logoUrl ? (
              <img
                src={data.profile.logoUrl}
                alt={data.profile.name}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <span className="font-signature text-2xl font-bold text-[#10152B] tracking-tighter select-none">
                {data.profile.logoLetter || 'R'}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold tracking-tight text-[#10152B] leading-tight whitespace-nowrap">
              {data.profile.name}
            </span>
            <span className="text-[11px] font-medium text-[#667085] leading-tight whitespace-nowrap">
              {data.profile.profession}
            </span>
          </div>
        </a>

        {/* Center Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navItems.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href, item.id)}
                className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-150 whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-[#6C63FF] shadow-xs font-semibold'
                    : 'text-[#475467] hover:text-[#10152B] hover:bg-white/50'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Right: Visitor Audio Toggle + Let's Talk ↗ button */}
        <div className="hidden sm:flex items-center gap-2">
          {isMasterAudioEnabled && (
            <button
              type="button"
              data-sfx="toggle"
              onClick={toggleVisitorAudioMute}
              title={visitorAudioMuted ? 'Unmute portfolio sound & BGM' : 'Mute portfolio sound & BGM'}
              aria-label={visitorAudioMuted ? 'Unmute audio' : 'Mute audio'}
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-200 cursor-pointer ${
                visitorAudioMuted
                  ? 'bg-white/75 text-[#667085] border-indigo-100/80 hover:text-[#10152B]'
                  : 'bg-white text-[#6C63FF] border-indigo-100/90 shadow-xs hover:bg-[#6C63FF] hover:text-white'
              }`}
            >
              {visitorAudioMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          )}

          <a
            href="#contact"
            data-sfx="contact"
            onClick={(e) => handleNavClick(e, '#contact', 'contact')}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-[13px] font-semibold text-[#6C63FF] bg-white hover:bg-[#6C63FF] hover:text-white border border-indigo-100/90 shadow-xs transition-all duration-200 whitespace-nowrap group"
          >
            <span>Let&apos;s Talk</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-1.5 lg:hidden">
          {isMasterAudioEnabled && (
            <button
              type="button"
              data-sfx="toggle"
              onClick={toggleVisitorAudioMute}
              aria-label={visitorAudioMuted ? 'Unmute audio' : 'Mute audio'}
              className="p-2 rounded-full text-[#475467] hover:bg-white/80 transition-colors cursor-pointer"
            >
              {visitorAudioMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#6C63FF]" />
              )}
            </button>
          )}
          <button
            type="button"
            data-sfx="toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-full text-[#10152B] hover:bg-white/80 transition-colors focus:outline-none"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 glass-panel rounded-3xl p-4 shadow-xl border border-white/90 animate-in fade-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href, item.id)}
                className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
                  activeNav === item.id
                    ? 'bg-indigo-50/90 text-[#6C63FF] font-semibold'
                    : 'text-[#10152B] hover:bg-white/60'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 pt-3 border-t border-indigo-100/60 flex items-center justify-between gap-3">
            <a
              href="#contact"
              data-sfx="contact"
              onClick={(e) => handleNavClick(e, '#contact', 'contact')}
              className="w-full inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-[#10152B] hover:bg-[#6C63FF] transition-colors"
            >
              <span>Let&apos;s Talk</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
