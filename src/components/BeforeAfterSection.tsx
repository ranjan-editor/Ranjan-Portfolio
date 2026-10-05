import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MoveHorizontal, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { usePortfolio } from '../context/PortfolioContext';
import { BeforeAfterItem } from '../types/portfolio';

const getShortLabel = (rawLabel: string, fallback: string): string => {
  const cleaned = rawLabel.trim();
  if (!cleaned) return fallback;
  const withoutParens = cleaned.replace(/\s*\([^)]*\)/g, '').trim();
  return withoutParens || cleaned;
};

const ComparisonCard: React.FC<{ item: BeforeAfterItem }> = ({ item }) => {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const updateSliderFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const relX = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (relX / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      updateSliderFromClientX(e.clientX);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updateSliderFromClientX(e.touches[0].clientX);
      }
    };
    const handleStop = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleStop);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleStop);
    window.addEventListener('touchcancel', handleStop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleStop);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleStop);
      window.removeEventListener('touchcancel', handleStop);
    };
  }, [isDragging, updateSliderFromClientX]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSliderPos((prev) => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSliderPos((prev) => Math.min(100, prev + 5));
    }
  };

  const beforeLabel = item.beforeLabel || 'BEFORE';
  const afterLabel = item.afterLabel || 'AFTER (COLOR GRADED)';
  const shortBeforeLabel = getShortLabel(beforeLabel, 'BEFORE');
  const shortAfterLabel = getShortLabel(afterLabel, 'AFTER');

  return (
    <div className="glass-card rounded-[24px] sm:rounded-[28px] p-[clamp(0.875rem,3.5vw,1.5rem)] space-y-[clamp(0.75rem,2.5vw,1.125rem)]">
      {/* Card Header: Title, Subtitle, Interactive Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[clamp(0.5rem,2vw,0.875rem)]">
        <div className="min-w-0 max-w-full">
          <h3 className="text-[clamp(1.05rem,4.2vw,1.35rem)] font-extrabold text-[#10152B] tracking-tight leading-[1.24] max-w-full break-normal">
            {item.title}
          </h3>
          {item.subtitle && (
            <p className="text-[clamp(0.76rem,2.5vw,0.875rem)] text-[#667085] leading-relaxed mt-1 max-w-full">
              {item.subtitle}
            </p>
          )}
        </div>
        <div className="inline-flex items-center gap-1.5 px-[clamp(0.625rem,2vw,0.8rem)] py-1 rounded-full bg-indigo-50/90 border border-indigo-100 text-[#6C63FF] text-[clamp(0.65rem,2vw,0.75rem)] font-semibold self-start sm:self-auto shrink-0 max-w-full">
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span className="truncate">Interactive Drag Comparison</span>
        </div>
      </div>

      {/* Interactive Split Comparison Viewport */}
      <div
        ref={containerRef}
        role="slider"
        tabIndex={0}
        aria-label={`Before and After comparison slider for ${item.title}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(sliderPos)}
        onKeyDown={handleKeyDown}
        onMouseDown={(e) => {
          setIsDragging(true);
          updateSliderFromClientX(e.clientX);
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
          if (e.touches.length > 0) {
            updateSliderFromClientX(e.touches[0].clientX);
          }
        }}
        className="relative w-full aspect-16/9 max-h-[520px] rounded-[16px] sm:rounded-[22px] overflow-hidden bg-slate-900 select-none cursor-ew-resize shadow-inner border border-white/80 touch-pan-y focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]/60"
      >
        {/* Base Layer: AFTER Image (Right Side / Full Width underneath) */}
        <img
          src={item.afterImageUrl}
          alt={`${item.title} - ${afterLabel}`}
          referrerPolicy="no-referrer"
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        />

        {/* Clipped Top Layer: BEFORE Image (Left Side revealed up to sliderPos%) */}
        <div
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
          className="absolute inset-0 w-full h-full pointer-events-none select-none"
        >
          <img
            src={item.beforeImageUrl}
            alt={`${item.title} - ${beforeLabel}`}
            referrerPolicy="no-referrer"
            draggable={false}
            className="w-full h-full object-cover pointer-events-none select-none filter saturate-[0.65] contrast-[0.92]"
          />
        </div>

        {/* Responsive Top Overlay Row for BEFORE and AFTER Labels (Never Overlaps) */}
        <div className="absolute inset-x-0 top-0 z-10 p-[clamp(0.5rem,2.5vw,0.875rem)] flex items-start justify-between gap-2 pointer-events-none">
          {/* Left "BEFORE" Pill Badge */}
          <div className="px-[clamp(0.5rem,2.2vw,0.75rem)] py-[clamp(0.2rem,0.8vw,0.3rem)] rounded-full bg-black/65 backdrop-blur-md border border-white/25 text-white text-[clamp(0.58rem,2vw,0.6875rem)] font-bold tracking-[0.05em] sm:tracking-wider uppercase leading-tight whitespace-nowrap truncate max-w-[44%] shadow-xs">
            <span className="max-[359px]:hidden">{beforeLabel}</span>
            <span className="hidden max-[359px]:inline">{shortBeforeLabel}</span>
          </div>

          {/* Right "AFTER" Pill Badge */}
          <div className="px-[clamp(0.5rem,2.2vw,0.75rem)] py-[clamp(0.2rem,0.8vw,0.3rem)] rounded-full bg-[#6C63FF]/85 backdrop-blur-md border border-white/35 text-white text-[clamp(0.58rem,2vw,0.6875rem)] font-bold tracking-[0.05em] sm:tracking-wider uppercase leading-tight whitespace-nowrap truncate max-w-[54%] shadow-xs">
            <span className="max-[359px]:hidden">{afterLabel}</span>
            <span className="hidden max-[359px]:inline">{shortAfterLabel}</span>
          </div>
        </div>

        {/* Vertical Divider Line & Center Drag Handle */}
        <div
          style={{ left: `${sliderPos}%` }}
          className="absolute top-0 bottom-0 z-20 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.6)] pointer-events-none"
        >
          {/* Generous 44x44px touch target wrapper centered on divider */}
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-full bg-white text-[#6C63FF] shadow-[0_8px_24px_rgba(16,21,43,0.35)] border-2 border-indigo-100 flex items-center justify-center transition-transform duration-150 scale-100 hover:scale-110">
              <MoveHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const BeforeAfterSection: React.FC = () => {
  const { data } = usePortfolio();
  const visibleItems = (data.beforeAfterItems || [])
    .filter((item) => item.visible && item.beforeImageUrl && item.afterImageUrl)
    .sort((a, b) => a.order - b.order);

  if (visibleItems.length === 0) return null;

  return (
    <section id="before-after" className="py-5 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4 }}
          className="glass-panel rounded-[26px] sm:rounded-[32px] p-[clamp(1rem,4vw,2rem)] space-y-[clamp(1rem,3vw,1.5rem)] overflow-hidden"
        >
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-[clamp(0.5rem,2vw,0.875rem)]">
            <div className="min-w-0 max-w-full">
              <span className="block text-[clamp(0.65rem,2vw,0.75rem)] font-bold tracking-[0.16em] uppercase text-[#6C63FF]">
                VISUAL TRANSFORMATION
              </span>
              <h2 className="text-[clamp(1.3rem,5vw,1.875rem)] font-extrabold text-[#10152B] tracking-tight leading-[1.2] mt-1 max-w-full break-normal">
                Before &amp; After Color Grading
              </h2>
            </div>
            <p className="text-[clamp(0.78rem,2.4vw,0.875rem)] text-[#667085] leading-relaxed max-w-md">
              Slide the handle left and right to inspect raw camera footage vs. finished cinematic color grading and visual polish.
            </p>
          </div>

          {/* Comparison Cards List */}
          <div className="space-y-[clamp(1rem,3vw,1.5rem)]">
            {visibleItems.map((item) => (
              <ComparisonCard key={item.id} item={item} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
