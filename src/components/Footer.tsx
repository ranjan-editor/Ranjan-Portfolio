import React, { useState } from 'react';
import { ArrowUp, Crown, Globe, MessageCircle } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { SocialLinkItem } from '../types/portfolio';

export const renderSocialPlatformIcon = (item: SocialLinkItem) => {
  const iconType = (item.iconType || item.platform || '').toLowerCase();

  if (iconType.includes('youtube')) {
    return (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }

  if (iconType.includes('instagram')) {
    return (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    );
  }

  if (iconType.includes('facebook')) {
    return (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    );
  }

  if (iconType.includes('linkedin')) {
    return (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    );
  }

  if (iconType.includes('twitter') || iconType === 'x') {
    return (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }

  if (iconType.includes('behance')) {
    return (
      <span className="text-[11px] font-extrabold tracking-tighter leading-none select-none">
        Bē
      </span>
    );
  }

  if (iconType.includes('dribbble')) {
    return (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32" />
      </svg>
    );
  }

  if (iconType.includes('tiktok')) {
    return (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    );
  }

  if (iconType.includes('github')) {
    return (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    );
  }

  if (iconType.includes('vimeo')) {
    return (
      <span className="text-xs font-extrabold leading-none select-none">V</span>
    );
  }

  if (iconType.includes('whatsapp')) {
    return <MessageCircle className="w-3.5 h-3.5" />;
  }

  return <Globe className="w-3.5 h-3.5" />;
};

const SocialIconButton: React.FC<{ item: SocialLinkItem }> = ({ item }) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={item.platform}
      title={item.platform}
      className="w-8 h-8 rounded-full bg-white/80 hover:bg-[#10152B] hover:text-white flex items-center justify-center transition-colors overflow-hidden"
    >
      {item.iconUrl && !imgFailed ? (
        <img
          src={item.iconUrl}
          alt={item.platform}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setImgFailed(true)}
          className="w-4 h-4 object-contain"
        />
      ) : (
        renderSocialPlatformIcon(item)
      )}
    </a>
  );
};

export const Footer: React.FC = () => {
  const { data, openAdminPanel } = usePortfolio();
  const { profile } = data;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter ONLY enabled social links with valid https:// or http:// URLs, sorted by order
  const enabledSocialLinks = (data.socialLinks || [])
    .filter(
      (item) =>
        item &&
        item.enabled !== false &&
        item.platform &&
        typeof item.url === 'string' &&
        /^https?:\/\/.+/i.test(item.url.trim())
    )
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <footer className="pt-6 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-full px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: Logo + Name + Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white shadow-xs border border-indigo-100 flex items-center justify-center shrink-0 overflow-hidden">
              {profile.logoUrl ? (
                <img
                  src={profile.logoUrl}
                  alt={profile.name}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-full object-contain"
                />
              ) : (
                <span className="font-signature text-xl font-bold text-[#10152B] select-none">
                  {profile.logoLetter || 'R'}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-[#10152B] leading-tight">
                {profile.name}
              </p>
              <p className="text-[11px] font-medium text-[#667085] leading-tight">
                {profile.profession}
              </p>
            </div>
          </div>

          {/* Center-Left: Dynamic Admin-Controlled Social Icons (Gracefully hidden if none enabled) */}
          {enabledSocialLinks.length > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium text-[#667085] hidden sm:inline">
                Follow Me
              </span>
              <div className="flex flex-wrap items-center gap-2.5 text-[#10152B]">
                {enabledSocialLinks.map((social) => (
                  <SocialIconButton key={social.id} item={social} />
                ))}
              </div>
            </div>
          )}

          {/* Copyright */}
          <p
            onDoubleClick={openAdminPanel}
            className="text-xs font-medium text-[#667085] text-center select-none"
          >
            © 2026 {profile.name}. All rights reserved.
          </p>

          {/* Right: Handwritten signature + Back to top */}
          <div className="flex items-center gap-4">
            <div
              onDoubleClick={openAdminPanel}
              className="flex items-center gap-1 select-none"
            >
              <span className="font-signature text-xl font-bold text-[#475467] -rotate-6 inline-block">
                {profile.signatureText}
              </span>
              <Crown className="w-3.5 h-3.5 text-[#8B5CF6]/70 -mt-2" />
            </div>

            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Scroll to top"
              className="w-9 h-9 rounded-full bg-white hover:bg-[#6C63FF] text-[#10152B] hover:text-white border border-indigo-100 shadow-xs flex items-center justify-center transition-all cursor-pointer"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
