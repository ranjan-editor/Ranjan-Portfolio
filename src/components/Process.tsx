import React from 'react';
import { Compass, FolderKanban, Scissors, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { usePortfolio } from '../context/PortfolioContext';

const stepIcons = [Compass, FolderKanban, Scissors, Sparkles, CheckCircle2];

export const Process: React.FC = () => {
  const { data } = usePortfolio();

  return (
    <section id="process" className="py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Section Heading */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold tracking-[0.16em] uppercase text-[#6C63FF]">
            MY PROCESS
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#10152B] tracking-tight">
            How I Turn Footage Into Stories
          </h2>
        </div>

        {/* Desktop: 5 Horizontal Cards | Mobile: Vertical Timeline */}
        <div className="relative">
          {/* Desktop Connecting Line */}
          <div
            className="hidden lg:block absolute top-1/2 left-8 right-8 h-0.5 bg-gradient-to-r from-[#6C63FF]/20 via-[#8B5CF6]/30 to-[#3B82F6]/20 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5 relative z-10">
            {data.processSteps.map((step, index) => {
              const IconComponent = stepIcons[index % stepIcons.length];
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.35, delay: index * 0.06 }}
                  className="glass-card rounded-[26px] p-5 sm:p-6 flex lg:flex-col items-start gap-4 hover:-translate-y-1 transition-transform duration-200 relative"
                >
                  {/* Step Number Pill + Icon */}
                  <div className="flex items-center justify-between w-auto lg:w-full shrink-0">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6C63FF] to-[#8B5CF6] text-white text-xs font-extrabold tabular-nums shadow-md shadow-[#6C63FF]/20">
                      {step.stepNumber}
                    </span>
                    <div className="hidden lg:flex w-8 h-8 rounded-xl bg-indigo-50/80 text-[#6C63FF] items-center justify-center">
                      <IconComponent className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Step Title & Description */}
                  <div className="space-y-1.5">
                    <h3 className="text-base sm:text-[17px] font-bold text-[#10152B]">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-[13px] text-[#667085] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
