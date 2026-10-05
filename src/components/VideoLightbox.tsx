import React, { useEffect, useState, useRef } from 'react';
import { X, Clock, Film, Loader2, RefreshCw } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { soundEngine } from '../utils/soundEngine';

export const VideoLightbox: React.FC = () => {
  const { activeVideoModal, setActiveVideoModal, triggerSfx } = usePortfolio();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [blobFallbackUrl, setBlobFallbackUrl] = useState<string | null>(null);
  const [isAttemptingFallback, setIsAttemptingFallback] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const playableMediaUrl = activeVideoModal?.videoUrl?.trim() || '';
  const thumbnailUrl = activeVideoModal?.thumbnail || '';

  // Clean up any generated ObjectURL and restore BGM ducking when modal closes or URL changes
  useEffect(() => {
    return () => {
      soundEngine.setVideoPlayingDucking(false);
      if (blobFallbackUrl) {
        URL.revokeObjectURL(blobFallbackUrl);
      }
    };
  }, [blobFallbackUrl]);

  useEffect(() => {
    if (activeVideoModal?.isOpen) {
      triggerSfx('modalOpen');
      setRetryCount(0);
      setIsAttemptingFallback(false);
      if (blobFallbackUrl) {
        URL.revokeObjectURL(blobFallbackUrl);
        setBlobFallbackUrl(null);
      }

      if (!playableMediaUrl) {
        setIsLoading(false);
        setHasError(true);
        console.error('[Public Video Player Error] Missing playable media URL', {
          projectId: activeVideoModal.projectId || 'N/A',
          videoMediaId: activeVideoModal.videoMediaId || 'N/A',
          resolvedMediaUrl: playableMediaUrl,
          mediaType: activeVideoModal.mediaType || 'unknown',
          errorMessage: 'No playable media URL found for the selected Media Library item.',
        });
      } else {
        setIsLoading(true);
        setHasError(false);
      }
    } else {
      soundEngine.setVideoPlayingDucking(false);
    }
  }, [activeVideoModal, playableMediaUrl]);

  const handleCloseModal = () => {
    soundEngine.setVideoPlayingDucking(false);
    triggerSfx('modalClose');
    setActiveVideoModal(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseModal();
      }
    };
    if (activeVideoModal?.isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeVideoModal]);

  if (!activeVideoModal || !activeVideoModal.isOpen) return null;

  const handleVideoReady = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleManualRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setIsAttemptingFallback(false);
    if (blobFallbackUrl) {
      URL.revokeObjectURL(blobFallbackUrl);
      setBlobFallbackUrl(null);
    }
    setRetryCount((prev) => prev + 1);
  };

  const handleVideoError = async (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const videoEl = e.currentTarget;
    const mediaErr = videoEl.error;

    // If direct Range streaming failed and we haven't tried a clean binary Blob fetch yet, try fetching as a Blob
    if (!blobFallbackUrl && !isAttemptingFallback && playableMediaUrl) {
      setIsAttemptingFallback(true);
      setIsLoading(true);
      setHasError(false);
      try {
        const resp = await fetch(playableMediaUrl);
        if (resp.ok) {
          const rawBlob = await resp.blob();
          const mimeType = activeVideoModal.mediaType || 'video/mp4';
          const typedBlob = new Blob([rawBlob], { type: mimeType });
          const objUrl = URL.createObjectURL(typedBlob);
          setBlobFallbackUrl(objUrl);
          return;
        }
      } catch {
        // Proceed to error state below if blob recovery also fails
      }
    }

    setIsLoading(false);
    setHasError(true);
    console.error('[Public Video Player Error] Failed to load or play video:', {
      projectId: activeVideoModal.projectId || 'N/A',
      videoMediaId: activeVideoModal.videoMediaId || 'N/A',
      resolvedMediaUrl: playableMediaUrl,
      mediaType: activeVideoModal.mediaType || 'video/mp4',
      errorCode: mediaErr?.code ?? 'UNKNOWN_CODE',
      errorMessage: mediaErr?.message || 'Media element failed to load source.',
    });
  };

  const effectiveVideoUrl =
    blobFallbackUrl ||
    (retryCount > 0 && playableMediaUrl
      ? `${playableMediaUrl}${playableMediaUrl.includes('?') ? '&' : '?'}r=${retryCount}`
      : playableMediaUrl);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#10152B]/75 backdrop-blur-md animate-in fade-in duration-150"
      onClick={handleCloseModal}
    >
      <div
        className="relative w-full max-w-4xl glass-panel bg-white/95 rounded-[32px] p-4 sm:p-6 shadow-2xl border border-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#6C63FF] flex items-center justify-center shrink-0">
              <Film className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold text-[#10152B] truncate">
                {activeVideoModal.title}
              </h3>
              {activeVideoModal.duration && (
                <p className="text-xs text-[#667085] flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Duration: {activeVideoModal.duration} · Original Uncompressed Stream
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseModal}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-[#10152B] text-[#10152B] hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Close video player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* HTML5 Video Player Container (No autoplay; explicit visitor Play click) */}
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-inner flex items-center justify-center">
          {effectiveVideoUrl && !hasError && (
            <video
              ref={videoRef}
              key={`${effectiveVideoUrl}-${retryCount}`}
              src={effectiveVideoUrl}
              controls
              playsInline
              preload="metadata"
              poster={thumbnailUrl}
              onLoadedMetadata={handleVideoReady}
              onLoadedData={handleVideoReady}
              onCanPlay={handleVideoReady}
              onPlay={() => soundEngine.setVideoPlayingDucking(true)}
              onPause={() => soundEngine.setVideoPlayingDucking(false)}
              onEnded={() => soundEngine.setVideoPlayingDucking(false)}
              onError={handleVideoError}
              className="w-full h-full object-contain"
            >
              <source
                src={effectiveVideoUrl}
                type={activeVideoModal.mediaType || 'video/mp4'}
              />
              Your browser does not support HTML5 high-definition video playback.
            </video>
          )}

          {/* Loading State Overlay */}
          {effectiveVideoUrl && isLoading && !hasError && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] text-white gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
              <span className="text-xs font-semibold tracking-wide">Loading video...</span>
            </div>
          )}

          {/* Error State */}
          {hasError && (
            <div className="text-center p-6 space-y-3">
              <Film className="w-10 h-10 text-rose-400/80 mx-auto" />
              <p className="text-sm font-semibold text-white">Unable to play this video.</p>
              {playableMediaUrl && (
                <button
                  type="button"
                  onClick={handleManualRetry}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Playback</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Details */}
        {(activeVideoModal.description || (activeVideoModal.tags && activeVideoModal.tags.length > 0)) && (
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {activeVideoModal.description && (
              <p className="text-xs sm:text-sm text-[#475467] max-w-2xl leading-relaxed">
                {activeVideoModal.description}
              </p>
            )}
            {activeVideoModal.tags && (
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                {activeVideoModal.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-indigo-50 text-[#6C63FF] text-xs font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
