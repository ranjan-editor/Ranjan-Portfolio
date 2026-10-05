import React, { useState } from 'react';
import { Lightbulb, Wrench } from 'lucide-react';
import { motion } from 'motion/react';
import { usePortfolio } from '../context/PortfolioContext';
import { SoftwareToolItem } from '../types/portfolio';

const SoftwareLogoBadge: React.FC<{ tool: SoftwareToolItem; compact?: boolean }> = ({
  tool,
  compact = false,
}) => {
  const [logoError, setLogoError] = useState(false);
  const sizeClass = compact ? 'w-10 h-10' : 'w-11 h-11';

  // 1. If Admin uploaded a custom logo image, display it with automatic fallback if broken
  if (tool.logoUrl && !logoError) {
    return (
      <div
        className={`${sizeClass} rounded-xl bg-white border border-indigo-100/80 p-1.5 flex items-center justify-center shadow-xs overflow-hidden shrink-0`}
      >
        <img
          src={tool.logoUrl}
          alt={tool.name}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setLogoError(true)}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  const nameLower = (tool.name || '').toLowerCase();

  if (nameLower.includes('davinci')) {
    return (
      <div className={`${sizeClass} rounded-xl bg-[#131624] flex items-center justify-center shadow-xs relative overflow-hidden shrink-0`}>
        <div className="grid grid-cols-2 gap-0.5 p-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 block" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 block" />
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 col-span-2 mx-auto block" />
        </div>
      </div>
    );
  }

  if (nameLower.includes('audacity')) {
    return (
      <div className={`${sizeClass} rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-xs shrink-0`}>
        <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>
      </div>
    );
  }

  if (nameLower.includes('capcut')) {
    return (
      <div className={`${sizeClass} rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs shrink-0`}>
        <svg className="w-6 h-6 text-[#10152B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M4 7l16 10M4 17L20 7" strokeLinecap="round" />
          <rect x="3" y="5" width="4" height="4" rx="1" />
          <rect x="3" y="15" width="4" height="4" rx="1" />
        </svg>
      </div>
    );
  }

  if (nameLower.includes('canva')) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00C4CC] to-[#7D2AE8] flex items-center justify-center text-white font-signature text-sm font-bold shadow-xs shrink-0">
        Canva
      </div>
    );
  }

  if (nameLower.includes('chatgpt')) {
    return (
      <div className="w-10 h-10 rounded-xl bg-[#10A37F]/15 text-[#10A37F] flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1 2 7.5l-.5.8a4 4 0 0 1-5.5 5.2l-1-.5a4 4 0 0 1-7-2.5v-1A4 4 0 0 1 2 9l.5-.8A4 4 0 0 1 8 3l1 .5A4 4 0 0 1 12 2Z" />
        </svg>
      </div>
    );
  }

  if (nameLower.includes('drive')) {
    return (
      <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shadow-xs shrink-0">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
          <path d="M8 3L2 14l3 5h14l3-5L16 3H8z" stroke="#2563EB" strokeWidth="2" strokeLinejoin="round" />
          <path d="M2 14h20" stroke="#16A34A" strokeWidth="2" />
          <path d="M12 3l6 11" stroke="#EAB308" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  if (nameLower.includes('figma')) {
    return (
      <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shadow-xs shrink-0">
        <div className="grid grid-cols-2 gap-0.5">
          <span className="w-2 h-2 rounded-l-full bg-rose-500" />
          <span className="w-2 h-2 rounded-r-full bg-orange-400" />
          <span className="w-2 h-2 rounded-l-full bg-purple-500" />
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span className="w-2 h-2 rounded-l-full rounded-b-full bg-emerald-500" />
        </div>
      </div>
    );
  }

  const fallbackText =
    (tool.shortCode || '').trim() ||
    (tool.name || 'SW')
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  return (
    <div
      style={{
        backgroundColor: tool.bgColor || '#10152B',
        color: tool.textColor || '#FFFFFF',
      }}
      className={`${sizeClass} rounded-xl flex items-center justify-center font-extrabold text-sm sm:text-base tracking-tight shadow-xs select-none shrink-0`}
    >
      {fallbackText || <Wrench className="w-4 h-4" />}
    </div>
  );
};

export const ToolsSkills: React.FC = () => {
  const { data } = usePortfolio();

  // Filter ONLY enabled software/tools and sort by Admin display order
  const enabledSoftware = (data.softwareTools || [])
    .filter((t) => t && t.enabled !== false && t.name)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const primaryToolkit = enabledSoftware.filter(
    (t) => t.category !== 'Other Tools' && t.category !== 'other'
  );
  const extraTools = enabledSoftware.filter(
    (t) => t.category === 'Other Tools' || t.category === 'other'
  );

  // Filter ONLY enabled skills and sort by Admin display order
  const enabledSkills = (data.skills || [])
    .filter((s) => s && s.enabled !== false && s.name)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const hasAnySoftware = primaryToolkit.length > 0 || extraTools.length > 0;
  const hasAnySkills = enabledSkills.length > 0;

  // Hide the entire section gracefully if neither software nor skills are enabled
  if (!hasAnySoftware && !hasAnySkills) return null;

  return (
    <section id="tools" className="py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* COLUMN 1: MY EDITING TOOLKIT */}
          {primaryToolkit.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4 }}
              className={`${
                hasAnySkills && extraTools.length > 0
                  ? 'lg:col-span-5'
                  : hasAnySkills || extraTools.length > 0
                  ? 'lg:col-span-6'
                  : 'lg:col-span-12'
              } glass-panel rounded-[32px] p-6 sm:p-7 flex flex-col justify-between`}
            >
              <div>
                <span className="text-xs font-bold tracking-[0.16em] uppercase text-[#3B82F6]">
                  TOOLS &amp; SOFTWARE
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#10152B] mt-1">
                  My Editing Toolkit
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6">
                  {primaryToolkit.map((tool) => {
                    const prof =
                      typeof tool.proficiency === 'number' ? tool.proficiency : 90;
                    return (
                      <div
                        key={tool.id}
                        title={
                          tool.description
                            ? `${tool.name} (${tool.category}) — ${tool.description}`
                            : `${tool.name} (${prof}%)`
                        }
                        className="glass-card rounded-2xl p-3.5 flex flex-col items-center justify-between text-center gap-2 hover:-translate-y-1 transition-transform duration-200"
                      >
                        <SoftwareLogoBadge tool={tool} />
                        <div className="w-full space-y-1">
                          <span className="block text-[11px] font-semibold text-[#10152B] leading-tight truncate">
                            {tool.name}
                          </span>
                          {tool.description && (
                            <span className="block text-[9px] text-[#667085] leading-tight line-clamp-1">
                              {tool.description}
                            </span>
                          )}
                          <div className="pt-0.5 space-y-1">
                            <span className="block text-[10px] font-bold text-[#6C63FF] tabular-nums">
                              {prof}%
                            </span>
                            <div className="w-full h-1 rounded-full bg-indigo-100/80 overflow-hidden">
                              <div
                                style={{ width: `${prof}%` }}
                                className="h-full rounded-full bg-gradient-to-r from-[#3B82F6] to-[#6C63FF]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* COLUMN 2: CORE SKILLS */}
          {hasAnySkills && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className={`${
                primaryToolkit.length > 0 && extraTools.length > 0
                  ? 'lg:col-span-4'
                  : primaryToolkit.length > 0 || extraTools.length > 0
                  ? 'lg:col-span-6'
                  : 'lg:col-span-12'
              } glass-panel rounded-[32px] p-6 sm:p-7 flex flex-col justify-between`}
            >
              <div>
                <span className="text-xs font-bold tracking-[0.16em] uppercase text-[#6C63FF]">
                  SKILLS
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#10152B] mt-1">
                  Core Skills
                </h2>

                <div className="space-y-4 mt-6">
                  {enabledSkills.map((skill) => {
                    const level =
                      typeof skill.proficiency === 'number'
                        ? skill.proficiency
                        : skill.percentage;
                    return (
                      <div key={skill.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs sm:text-[13px]">
                          <div className="min-w-0 pr-2">
                            <span className="font-semibold text-[#475467] block truncate">
                              {skill.name}
                            </span>
                            {skill.description && (
                              <span className="text-[10px] text-[#667085] block truncate">
                                {skill.description}
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-[#10152B] tabular-nums shrink-0">
                            {level}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-indigo-100/80 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${level}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full bg-gradient-to-r from-[#3B82F6] via-[#6C63FF] to-[#8B5CF6]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* COLUMN 3: OTHER TOOLS I USE */}
          {extraTools.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: 0.14 }}
              className={`${
                primaryToolkit.length > 0 && hasAnySkills
                  ? 'lg:col-span-3'
                  : primaryToolkit.length > 0 || hasAnySkills
                  ? 'lg:col-span-6'
                  : 'lg:col-span-12'
              } glass-panel rounded-[32px] p-6 sm:p-7 flex flex-col justify-between gap-4`}
            >
              <div>
                <span className="text-xs font-bold tracking-[0.16em] uppercase text-[#8B5CF6]">
                  EXTRA TOOLS
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#10152B] mt-1">
                  Other Tools I Use
                </h2>

                <div className="grid grid-cols-3 gap-3 mt-6">
                  {extraTools.map((tool) => {
                    const prof =
                      typeof tool.proficiency === 'number' ? tool.proficiency : 90;
                    return (
                      <div
                        key={tool.id}
                        title={
                          tool.description
                            ? `${tool.name} — ${tool.description} (${prof}%)`
                            : `${tool.name} (${prof}%)`
                        }
                        className="glass-card rounded-2xl p-3 flex flex-col items-center justify-center text-center gap-1.5 hover:-translate-y-1 transition-transform duration-200"
                      >
                        <SoftwareLogoBadge tool={tool} compact />
                        <span className="text-[11px] font-semibold text-[#10152B] leading-tight truncate w-full">
                          {tool.name}
                        </span>
                        <span className="text-[9px] font-bold text-[#6C63FF] tabular-nums">
                          {prof}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Callout Card */}
              <div className="mt-2 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-purple-50/90 to-pink-50/80 border border-white p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center text-[#6C63FF] shrink-0">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <p className="text-xs font-medium text-[#475467] leading-snug">
                  Always open to learning new tools &amp; technologies.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};
