import React from 'react';
import { motion } from 'motion/react';
import { usePortfolio } from '../context/PortfolioContext';
import { TestimonialItem } from '../types/portfolio';

const avatarGradients = [
  'from-indigo-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-blue-500 to-cyan-600',
];

const renderClientAvatar = (item: TestimonialItem, idx: number) => {
  if (item.avatarUrl) {
    return (
      <img
        src={item.avatarUrl}
        alt={item.clientName}
        referrerPolicy="no-referrer"
        className="w-10 h-10 rounded-full object-cover border border-white shadow-xs shrink-0"
      />
    );
  }

  const initials = item.clientName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`w-10 h-10 rounded-full bg-gradient-to-tr ${
        avatarGradients[idx % avatarGradients.length]
      } text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-xs shrink-0 select-none`}
    >
      {initials}
    </div>
  );
};

export const Testimonials: React.FC = () => {
  const { data } = usePortfolio();

  return (
    <section id="testimonials" className="py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-[32px] p-6 sm:p-8 space-y-6">
          <div>
            <span className="text-xs font-bold tracking-[0.16em] uppercase text-[#6C63FF]">
              TESTIMONIALS
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#10152B] tracking-tight mt-1">
              What Clients Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {data.testimonials.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
                className="glass-card rounded-[24px] p-6 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-200"
              >
                <div className="space-y-2">
                  <span className="text-3xl font-serif font-bold text-[#98A2B3] leading-none block select-none">
                    &ldquo;
                  </span>
                  <p className="text-xs sm:text-[13.5px] text-[#475467] leading-relaxed">
                    &ldquo;{item.quote.replace(/^"|"$/g, '')}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-5 mt-4 border-t border-indigo-50/80">
                  {renderClientAvatar(item, index)}
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#10152B] leading-tight">
                      {item.clientName}
                    </h3>
                    <p className="text-[11px] font-medium text-[#667085] mt-0.5">
                      {item.roleCompany}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
