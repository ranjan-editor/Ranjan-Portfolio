import React from 'react';
import { PlaySquare, Type, Palette, Camera, Smartphone, Sparkles, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { usePortfolio } from '../context/PortfolioContext';
import { ServiceItem } from '../types/portfolio';

const iconMap: Record<ServiceItem['iconName'], React.FC<{ className?: string }>> = {
  video: PlaySquare,
  type: Type,
  palette: Palette,
  camera: Camera,
  smartphone: Smartphone,
  sparkles: Sparkles,
};

const iconColorMap: Record<ServiceItem['iconName'], string> = {
  video: 'bg-rose-50 text-rose-500 border-rose-100',
  type: 'bg-purple-50 text-[#8B5CF6] border-purple-100',
  palette: 'bg-amber-50 text-amber-500 border-amber-100',
  camera: 'bg-indigo-50 text-[#6C63FF] border-indigo-100',
  smartphone: 'bg-blue-50 text-[#3B82F6] border-blue-100',
  sparkles: 'bg-emerald-50 text-emerald-500 border-emerald-100',
};

export const Services: React.FC = () => {
  const { data } = usePortfolio();

  const handleServiceSelect = (serviceTitle: string) => {
    const projectInput = document.getElementById('contact-project-input') as HTMLInputElement | null;
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
      if (projectInput) {
        setTimeout(() => {
          projectInput.value = serviceTitle;
          projectInput.dispatchEvent(new Event('input', { bubbles: true }));
          projectInput.focus();
        }, 500);
      }
    }
  };

  return (
    <section id="services" className="py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Section Header */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold tracking-[0.16em] uppercase text-[#6C63FF]">
            MY SERVICES
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#10152B] tracking-tight">
            What I Can Do For You
          </h2>
        </div>

        {/* 5 Premium Glass Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
          {data.services.map((service, index) => {
            const IconComponent = iconMap[service.iconName] || PlaySquare;
            const colorClasses = iconColorMap[service.iconName] || iconColorMap.video;

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                onClick={() => handleServiceSelect(service.title)}
                className="group glass-card rounded-[28px] p-6 flex flex-col justify-between cursor-pointer hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(108,99,255,0.22)] hover:border-[#6C63FF]/30 transition-all duration-200"
              >
                <div>
                  {/* Minimal Icon */}
                  <div
                    className={`w-11 h-11 rounded-2xl border ${colorClasses} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-200`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>

                  {/* Service Title */}
                  <h3 className="text-[17px] font-bold text-[#10152B] group-hover:text-[#6C63FF] transition-colors">
                    {service.title}
                  </h3>

                  {/* Short Description */}
                  <p className="mt-2 text-xs sm:text-[13px] text-[#667085] leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {/* Subtle Bottom Arrow */}
                <div className="pt-5 mt-4 flex items-center justify-between text-xs font-semibold text-[#667085] group-hover:text-[#6C63FF] transition-colors">
                  <span>Inquire</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-0.5" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
