import React, { useState } from 'react';
import { Play, ArrowUpRight, Film } from 'lucide-react';
import { motion } from 'motion/react';
import { usePortfolio } from '../context/PortfolioContext';
import { ProjectItem, MediaMetadata } from '../types/portfolio';

const isVideoMedia = (m: MediaMetadata) =>
  m.type === 'video' || m.type?.toLowerCase().startsWith('video/') || m.mimeType?.toLowerCase().startsWith('video/');

export const Projects: React.FC = () => {
  const { data, setActiveVideoModal, triggerSfx } = usePortfolio();
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const allTags = ['All', ...Array.from(new Set(data.projects.flatMap((p) => p.tags)))];

  const filteredProjects =
    selectedTag === 'All'
      ? data.projects
      : data.projects.filter((p) => p.tags.includes(selectedTag));

  const handleOpenProject = (project: ProjectItem) => {
    triggerSfx('projectOpen');
    const linkedVideo = data.mediaLibrary.find(
      (m) => m.id === project.videoMediaId && isVideoMedia(m) && m.visibility !== 'private'
    );

    const playableUrl = linkedVideo ? linkedVideo.mediaUrl || linkedVideo.storageUrl : '';
    const resolvedThumbnail =
      linkedVideo?.thumbnailUrl || linkedVideo?.thumbnail || project.thumbnail || '';

    setActiveVideoModal({
      isOpen: true,
      projectId: project.id,
      videoMediaId: project.videoMediaId,
      mediaType: linkedVideo?.mimeType || linkedVideo?.type || 'video/mp4',
      title: project.title,
      videoUrl: playableUrl,
      thumbnail: resolvedThumbnail,
      duration: linkedVideo?.durationFormatted || project.duration,
      tags: project.tags,
      description: project.description,
    });
  };

  return (
    <section id="work" className="py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-[32px] p-6 sm:p-8 space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold tracking-[0.16em] uppercase text-[#6C63FF]">
                FEATURED PROJECTS
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#10152B] tracking-tight mt-1">
                My Recent Work
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Tag Filter Controls */}
              <div className="hidden md:flex items-center gap-1 bg-white/60 p-1 rounded-full border border-white">
                {allTags.slice(0, 5).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      triggerSfx('toggle');
                      setSelectedTag(tag);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      selectedTag === tag
                        ? 'bg-[#10152B] text-white shadow-xs'
                        : 'text-[#667085] hover:text-[#10152B]'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onMouseEnter={() => triggerSfx('buttonHover')}
                onClick={() => {
                  triggerSfx('buttonClick');
                  setSelectedTag('All');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#10152B] text-[#10152B] hover:text-white border border-indigo-100/80 text-xs font-semibold shadow-2xs transition-all duration-200 cursor-pointer group"
              >
                <span>View All Projects</span>
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>
          </div>

          {/* 4-Column Project Grid matching reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredProjects.map((project, index) => {
              const hasFailed = failedImages[project.id];
              const linkedVideo = data.mediaLibrary.find(
                (m) => m.id === project.videoMediaId && isVideoMedia(m)
              );
              const displayDuration = linkedVideo?.durationFormatted || project.duration;
              // Always prefer the selected video's automatic thumbnail first
              const displayThumbnail =
                linkedVideo?.thumbnailUrl || linkedVideo?.thumbnail || project.thumbnail || '';

              return (
                <motion.article
                  key={project.id}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.35, delay: index * 0.06 }}
                  onClick={() => handleOpenProject(project)}
                  className="group glass-card rounded-[24px] p-3 flex flex-col justify-between cursor-pointer hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(108,99,255,0.2)] transition-all duration-200"
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-16/10 w-full rounded-[18px] overflow-hidden bg-slate-900">
                    {!hasFailed && displayThumbnail ? (
                      <img
                        src={displayThumbnail}
                        alt={project.title}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [project.id]: true }))
                        }
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center text-white p-4">
                        <Film className="w-8 h-8 text-indigo-300 mb-2" />
                        <span className="text-xs font-semibold text-center">{project.title}</span>
                      </div>
                    )}

                    {/* Dark Bottom Scrim + Hover Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-200" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#6C63FF]/30 via-transparent to-[#EC4899]/25 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                    {/* Play Button Overlay (Bottom-Left matching reference) */}
                    <div className="absolute left-3 bottom-3 w-9 h-9 rounded-full bg-black/55 backdrop-blur-md border border-white/40 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-[#6C63FF] group-hover:border-white transition-all duration-200">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>

                    {/* Video Duration Badge (Bottom-Right matching reference) */}
                    <div className="absolute right-3 bottom-3 px-2.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold tabular-nums">
                      {displayDuration}
                    </div>
                  </div>

                  {/* Card Body: Title, Tags & Arrow Button */}
                  <div className="pt-3.5 px-1.5 pb-1 flex items-end justify-between gap-2">
                    <div className="space-y-2 min-w-0">
                      <h3 className="text-[15px] font-bold text-[#10152B] group-hover:text-[#6C63FF] transition-colors truncate">
                        {project.title}
                      </h3>

                      {/* Subtle Tag Chips matching reference */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {project.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-0.5 rounded-full bg-[#F2F4FF] text-[#475467] text-[11px] font-medium border border-indigo-100/60"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="w-7 h-7 rounded-full bg-white/80 group-hover:bg-[#10152B] text-[#475467] group-hover:text-white flex items-center justify-center shrink-0 transition-colors duration-200">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
