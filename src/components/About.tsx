import React from 'react';
import { ArrowUpRight, Layers, Trophy, Users, Crown } from 'lucide-react';
import { motion } from 'motion/react';
import { usePortfolio } from '../context/PortfolioContext';

export const About: React.FC = () => {
  const { data } = usePortfolio();
  const { about, profile } = data;

  const stats = [
    {
      id: 'stat-projects',
      value: profile.projectsCompleted,
      label: 'Projects Completed',
      icon: Layers,
      iconBg: 'bg-purple-100/80 text-[#8B5CF6]',
    },
    {
      id: 'stat-exp',
      value: profile.experienceYears,
      label: 'Years Experience',
      icon: Trophy,
      iconBg: 'bg-indigo-100/80 text-[#6C63FF]',
    },
    {
      id: 'stat-clients',
      value: profile.happyClients,
      label: 'Happy Clients',
      icon: Users,
      iconBg: 'bg-blue-100/80 text-[#3B82F6]',
    },
  ];

  return (
    <section id="about" className="py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Container: About Text + 3 Statistic Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45 }}
            className="lg:col-span-9 glass-panel rounded-[32px] p-6 sm:p-9 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8"
          >
            {/* Bio Copy */}
            <div className="space-y-4 max-w-md">
              <span className="text-xs font-bold tracking-[0.16em] uppercase text-[#6C63FF]">
                {about.label}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#10152B] tracking-tight leading-tight whitespace-pre-line">
                {about.heading}
              </h2>
              <p className="text-sm sm:text-[15px] text-[#667085] leading-relaxed">
                {about.paragraph}
              </p>
              <div className="pt-1">
                <a
                  href="#process"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('process')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#10152B] hover:bg-[#6C63FF] text-white text-xs sm:text-sm font-semibold transition-all duration-200 group"
                >
                  <span>More About Me</span>
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </div>
            </div>

            {/* 3 Statistic Cards */}
            <div className="w-full xl:w-auto grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
              {stats.map((stat) => {
                const IconComponent = stat.icon;
                return (
                  <div
                    key={stat.id}
                    className="glass-card rounded-2xl p-5 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-200"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center mb-5`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl sm:text-3xl font-extrabold text-[#10152B] tabular-nums">
                        {stat.value}
                      </p>
                      <p className="text-xs font-medium text-[#667085] mt-1">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Right Container: Testimonial-style Quote Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="lg:col-span-3 glass-panel rounded-[32px] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="space-y-3">
              <span className="text-4xl font-serif font-bold text-[#6C63FF]/50 leading-none select-none block">
                &ldquo;
              </span>
              <blockquote className="text-sm sm:text-[15px] font-medium text-[#475467] leading-relaxed">
                &ldquo;{about.quote.replace(/^"|"$/g, '')}&rdquo;
              </blockquote>
            </div>

            <div className="pt-6 mt-4 border-t border-indigo-100/60 flex items-center justify-between">
              <div>
                <span className="font-signature text-2xl font-bold text-[#10152B] tracking-wide">
                  — {about.quoteAuthor}
                </span>
              </div>
              <Crown className="w-4 h-4 text-[#8B5CF6]/60" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
