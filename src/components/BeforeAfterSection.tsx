import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MoveHorizontal, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { usePortfolio } from '../context/PortfolioContext';
import { BeforeAfterItem } from '../types/portfolio';

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

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleStop);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleStop);
    };
  }, [isDragging, updateSliderFromClientX]);

  const beforeLabel = item.beforeLabel || 'BEFORE (RAW / LOG)';
  const afterLabel = item.afterLabel || 'AFTER (COLOR GRADED)';

  return (
    <div className="glass-card rounded-[28px] p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-[#10152B] tracking-tight">
            {item.title}
          </h3>
          {item.subtitle && (
            <p className="text-xs sm:text-sm text-[#667085] mt-0.5">{item.subtitle}</p>
          )}
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50/90 border border-indigo-100 text-[#6C63FF] text-xs font-semibold self-start sm:self-auto">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Drag Comparison</span>
        </div>
      </div>

      {/* Interactive Split Comparison Viewport */}
      <div
        ref={containerRef}
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
        className="relative w-full aspect-16/9 max-h-[520px] rounded-[22px] overflow-hidden bg-slate-900 select-none cursor-ew-resize shadow-inner border border-white/80"
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

        {/* Left "BEFORE" Pill Badge */}
        <div className="absolute top-3.5 left-3.5 z-10 px-3 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/25 text-white text-[11px] font-bold tracking-wider uppercase pointer-events-none">
          {beforeLabel}
        </div>

        {/* Right "AFTER" Pill Badge */}
        <div className="absolute top-3.5 right-3.5 z-10 px-3 py-1 rounded-full bg-[#6C63FF]/85 backdrop-blur-md border border-white/35 text-white text-[11px] font-bold tracking-wider uppercase pointer-events-none">
          {afterLabel}
        </div>

        {/* Vertical Divider Line & Center Drag Handle */}
        <div
          style={{ left: `${sliderPos}%` }}
          className="absolute top-0 bottom-0 z-20 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.6)] pointer-events-none"
        >
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white text-[#6C63FF] shadow-[0_8px_24px_rgba(16,21,43,0.35)] border-2 border-indigo-100 flex items-center justify-center transition-transform duration-150 scale-100 hover:scale-110">
            <MoveHorizontal className="w-5 h-5" />
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
    <section id="before-after" className="py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4 }}
          className="glass-panel rounded-[32px] p-6 sm:p-8 space-y-6"
        >
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <span className="text-xs font-bold tracking-[0.16em] uppercase text-[#6C63FF]">
                VISUAL TRANSFORMATION
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#10152B] tracking-tight mt-1">
                Before &amp; After Color Grading
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#667085] max-w-md">
              Slide the handle left and right to inspect raw camera footage vs. finished cinematic color grading and visual polish.
            </p>
          </div>

          {/* Comparison Cards List */}
          <div className="space-y-6">
            {visibleItems.map((item) => (
              <ComparisonCard key={item.id} item={item} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
