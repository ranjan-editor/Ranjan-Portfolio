/**
 * Utility to automatically extract duration, resolution, and a non-black representative
 * video frame thumbnail AFTER upload completes.
 * Can capture from the local File reference (zero re-download) or from a range-enabled media URL,
 * and uploads the captured JPEG binary blob to /api/media/thumbnail/:mediaId so state stays lightweight.
 */

export interface ExtractedVideoInfo {
  duration: number;
  durationFormatted: string;
  thumbnailUrl: string;
  resolution: string;
}

export const formatDurationSeconds = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const isFrameMostlyBlack = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): boolean => {
  try {
    const sampleSize = 16;
    const stepX = Math.max(1, Math.floor(width / sampleSize));
    const stepY = Math.max(1, Math.floor(height / sampleSize));
    const imgData = ctx.getImageData(0, 0, width, height).data;
    let totalLuma = 0;
    let count = 0;

    for (let y = 0; y < height; y += stepY) {
      for (let x = 0; x < width; x += stepX) {
        const idx = (y * width + x) * 4;
        const r = imgData[idx];
        const g = imgData[idx + 1];
        const b = imgData[idx + 2];
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        totalLuma += luma;
        count++;
      }
    }
    const avgLuma = count > 0 ? totalLuma / count : 0;
    return avgLuma < 12;
  } catch {
    return false;
  }
};

const uploadThumbnailBlobToServer = async (
  mediaId: string,
  blob: Blob
): Promise<string | null> => {
  try {
    const res = await fetch(`/api/media/thumbnail/${encodeURIComponent(mediaId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: blob,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.thumbnailUrl || null;
  } catch (err) {
    console.warn('[Thumbnail Upload] Could not upload binary thumbnail to server:', err);
    return null;
  }
};

export const generateVideoThumbnailAndMeta = (
  source: File | string,
  mediaId?: string
): Promise<ExtractedVideoInfo> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    let tempObjectUrl: string | null = null;

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    if (typeof source === 'string') {
      video.crossOrigin = 'anonymous';
      video.src = source;
    } else {
      tempObjectUrl = URL.createObjectURL(source);
      video.src = tempObjectUrl;
    }

    let resolved = false;
    const cleanup = () => {
      if (tempObjectUrl) {
        URL.revokeObjectURL(tempObjectUrl);
        tempObjectUrl = null;
      }
      video.removeAttribute('src');
      video.load();
    };

    const finish = (result: ExtractedVideoInfo) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve(result);
    };

    const timeoutId = window.setTimeout(() => {
      finish({
        duration: 0,
        durationFormatted: '00:00',
        thumbnailUrl: '',
        resolution: 'HD Original',
      });
    }, 12000);

    let candidateTimes: number[] = [1];
    let attemptIndex = 0;

    video.onloadedmetadata = () => {
      const dur = video.duration && isFinite(video.duration) ? video.duration : 0;
      if (dur <= 0) {
        candidateTimes = [0];
      } else if (dur < 1) {
        candidateTimes = [0, dur * 0.5];
      } else {
        const fifteenPct = Math.min(Math.max(1, dur * 0.15), dur - 0.1);
        const twentyFivePct = Math.min(Math.max(1.5, dur * 0.25), dur - 0.1);
        candidateTimes = [fifteenPct, 1.0, twentyFivePct, 0.2];
      }
      attemptIndex = 0;
      video.currentTime = candidateTimes[0];
    };

    video.onseeked = () => {
      try {
        const vw = video.videoWidth || 640;
        const vh = video.videoHeight || 360;
        const targetWidth = Math.min(960, vw);
        const targetHeight = Math.round((targetWidth / vw) * vh);

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

          if (
            isFrameMostlyBlack(ctx, targetWidth, targetHeight) &&
            attemptIndex + 1 < candidateTimes.length
          ) {
            attemptIndex++;
            video.currentTime = candidateTimes[attemptIndex];
            return;
          }

          const dur = video.duration && isFinite(video.duration) ? Math.round(video.duration) : 0;
          const resolution = `${vw}x${vh}`;

          if (mediaId) {
            canvas.toBlob(
              async (blob) => {
                window.clearTimeout(timeoutId);
                if (blob) {
                  const serverThumbUrl = await uploadThumbnailBlobToServer(mediaId, blob);
                  if (serverThumbUrl) {
                    finish({
                      duration: dur,
                      durationFormatted: formatDurationSeconds(dur),
                      thumbnailUrl: serverThumbUrl,
                      resolution,
                    });
                    return;
                  }
                }
                const fallbackDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                finish({
                  duration: dur,
                  durationFormatted: formatDurationSeconds(dur),
                  thumbnailUrl: fallbackDataUrl,
                  resolution,
                });
              },
              'image/jpeg',
              0.86
            );
            return;
          }

          const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
          window.clearTimeout(timeoutId);
          finish({
            duration: dur,
            durationFormatted: formatDurationSeconds(dur),
            thumbnailUrl: dataUrl,
            resolution,
          });
          return;
        }
      } catch {
        // Canvas tainted or capture failed
      }

      const dur = video.duration && isFinite(video.duration) ? Math.round(video.duration) : 0;
      window.clearTimeout(timeoutId);
      finish({
        duration: dur,
        durationFormatted: formatDurationSeconds(dur),
        thumbnailUrl: '',
        resolution:
          video.videoWidth && video.videoHeight
            ? `${video.videoWidth}x${video.videoHeight}`
            : 'HD Original',
      });
    };

    video.onerror = () => {
      window.clearTimeout(timeoutId);
      finish({
        duration: 0,
        durationFormatted: '00:00',
        thumbnailUrl: '',
        resolution: 'HD Original',
      });
    };
  });
};
