import React, { useState, useMemo, useRef } from 'react';
import {
  Upload,
  Search,
  Film,
  Image as ImageIcon,
  Music,
  FileText,
  Lock,
  Globe,
  Play,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Check,
  X,
  Loader2,
  ExternalLink,
  HardDrive,
} from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import {
  MediaCategoryType,
  MediaMetadata,
  MediaUploadStatus,
} from '../../types/portfolio';
import {
  uploadAnyMediaToLibrary,
  appendAdminTokenToUrl,
  getAdminHeaders,
} from '../../utils/mediaUploadService';
import { detachOrReplaceMediaReferences } from '../../utils/mediaUsageTracker';

export type MediaLibraryFilter =
  | 'all'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'private'
  | 'public'
  | 'used'
  | 'unused'
  | 'failed';

interface ActiveUploadTask {
  uploadId: string;
  mediaId: string;
  file: File;
  filename: string;
  size: number;
  mimeType: string;
  status: MediaUploadStatus;
  uploadedBytes: number;
  percentage: number;
  speedBytesPerSec: number;
  errorMessage?: string;
  errorCode?: string;
}

const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatSpeed = (bytesPerSec: number): string => {
  if (!bytesPerSec || bytesPerSec <= 0) return '0.0 MB/s';
  const mbps = bytesPerSec / (1024 * 1024);
  if (mbps >= 0.1) {
    return `${mbps.toFixed(1)} MB/s`;
  }
  const kbps = bytesPerSec / 1024;
  return `${kbps.toFixed(0)} KB/s`;
};

const formatUploadDate = (isoOrTs?: string | number): string => {
  if (!isoOrTs) return '—';
  const d = new Date(isoOrTs);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

interface AdminMediaLibraryTabProps {
  onStatusMessage: (msg: string) => void;
}

export const AdminMediaLibraryTab: React.FC<AdminMediaLibraryTabProps> = ({
  onStatusMessage,
}) => {
  const { adminMediaLibrary, updateData, setActiveVideoModal, isAdminAuthenticated } =
    usePortfolio();

  const [activeFilter, setActiveFilter] = useState<MediaLibraryFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [uploadTasks, setUploadTasks] = useState<Record<string, ActiveUploadTask>>({});
  const inFlightUploadsRef = useRef<Set<string>>(new Set());

  // Delete Protection Modal State
  const [deleteCandidate, setDeleteCandidate] = useState<MediaMetadata | null>(null);
  const [replacementMediaId, setReplacementMediaId] = useState<string>('');

  const handleStartUpload = async (file: File, existingTask?: ActiveUploadTask) => {
    const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
    const uploadId =
      existingTask?.uploadId || `up_${cleanName}_${file.size}_${file.lastModified}`;

    if (inFlightUploadsRef.current.has(uploadId)) return;
    inFlightUploadsRef.current.add(uploadId);

    const mediaId = existingTask?.mediaId || `media-${Date.now()}`;

    setUploadTasks((prev) => ({
      ...prev,
      [uploadId]: {
        uploadId,
        mediaId,
        file,
        filename: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        status: 'uploading',
        uploadedBytes: existingTask?.uploadedBytes || 0,
        percentage: existingTask?.percentage || 0,
        speedBytesPerSec: 0,
        errorMessage: undefined,
        errorCode: undefined,
      },
    }));

    try {
      const uploadedRecord = await uploadAnyMediaToLibrary({
        file,
        uploadId,
        mediaId,
        onProgress: (prog) => {
          setUploadTasks((prev) => {
            const current = prev[uploadId];
            if (!current) return prev;
            return {
              ...prev,
              [uploadId]: {
                ...current,
                status: 'uploading',
                uploadedBytes: prog.uploadedBytes,
                percentage: prog.percentage,
                speedBytesPerSec: prog.speedBytesPerSec,
              },
            };
          });
        },
      });

      updateData((prev) => {
        const exists = prev.mediaLibrary.some((m) => m.id === uploadedRecord.id);
        const nextLibrary = exists
          ? prev.mediaLibrary.map((m) =>
              m.id === uploadedRecord.id ? uploadedRecord : m
            )
          : [uploadedRecord, ...prev.mediaLibrary];
        return {
          ...prev,
          mediaLibrary: nextLibrary,
        };
      });

      setUploadTasks((prev) => {
        const copy = { ...prev };
        delete copy[uploadId];
        return copy;
      });

      onStatusMessage(
        `Uploaded "${file.name}" (${formatFileSize(file.size)}) to Admin Media Library (Private by default).`
      );
    } catch (err: any) {
      const errMsg =
        err?.userMessage || err?.message || 'Upload failed. Please retry.';
      setUploadTasks((prev) => {
        const current = prev[uploadId];
        if (!current) return prev;
        return {
          ...prev,
          [uploadId]: {
            ...current,
            status: 'failed',
            errorMessage: errMsg,
            errorCode: err?.code || 'UPLOAD_FAILED',
          },
        };
      });
      onStatusMessage(errMsg);
    } finally {
      inFlightUploadsRef.current.delete(uploadId);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      handleStartUpload(file);
    });
    e.target.value = '';
  };

  const dismissFailedTask = (uploadId: string) => {
    setUploadTasks((prev) => {
      const copy = { ...prev };
      delete copy[uploadId];
      return copy;
    });
  };

  const executeConfirmedDelete = async (
    target: MediaMetadata,
    replaceWithId?: string
  ) => {
    try {
      await fetch(`/api/media/file/${encodeURIComponent(target.id)}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
    } catch {
      // ignore disk cleanup errors
    }

    updateData((prev) => {
      const replacementItem = replaceWithId
        ? prev.mediaLibrary.find((m) => m.id === replaceWithId) || null
        : null;
      const cleanedState = detachOrReplaceMediaReferences(
        prev,
        target.id,
        replacementItem
      );
      return {
        ...cleanedState,
        mediaLibrary: cleanedState.mediaLibrary.filter((m) => m.id !== target.id),
      };
    });

    setDeleteCandidate(null);
    setReplacementMediaId('');
    onStatusMessage(
      replaceWithId
        ? `Replaced & deleted "${target.filename}". All public references updated.`
        : `Deleted "${target.filename}" from Admin Media Library.`
    );
  };

  const handleRequestDelete = (media: MediaMetadata) => {
    const usedCount = media.usageCount || (media.usedBy ? media.usedBy.length : 0);
    if (usedCount > 0) {
      setDeleteCandidate(media);
      setReplacementMediaId('');
      return;
    }
    executeConfirmedDelete(media);
  };

  const handleAssignToProfilePhoto = (media: MediaMetadata) => {
    const url = media.mediaUrl || media.storageUrl || media.publicUrl;
    updateData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        portraitUrl: url,
        portraitMediaId: media.id,
      },
    }));
    onStatusMessage(`Published "${media.filename}" as public Profile Photo.`);
  };

  const handleAssignToResume = (media: MediaMetadata) => {
    const url = media.mediaUrl || media.storageUrl || media.publicUrl;
    const now = Date.now();
    updateData((prev) => ({
      ...prev,
      resume: {
        id: media.id,
        mediaId: media.id,
        type: 'resume',
        filename: media.filename,
        fileUrl: url,
        mimeType: media.mimeType || 'application/pdf',
        size: media.size,
        createdAt: media.createdAt || now,
        updatedAt: now,
      },
      profile: {
        ...prev.profile,
        cvUrl: url,
      },
    }));
    onStatusMessage(`Published "${media.filename}" as active public Resume / CV.`);
  };

  const filteredItems = useMemo(() => {
    return adminMediaLibrary
      .filter((item) => {
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const matchName = (item.filename || '').toLowerCase().includes(q);
          const matchOrig = (item.originalFileName || '').toLowerCase().includes(q);
          if (!matchName && !matchOrig) return false;
        }

        const cat: MediaCategoryType =
          item.mediaType || (item.type as MediaCategoryType) || 'video';
        const usedCount = item.usageCount ?? (item.usedBy ? item.usedBy.length : 0);
        const status = item.status || item.uploadStatus || 'ready';

        switch (activeFilter) {
          case 'image':
            return cat === 'image';
          case 'video':
            return cat === 'video';
          case 'audio':
            return cat === 'audio';
          case 'document':
            return cat === 'document';
          case 'private':
            return item.visibility === 'private';
          case 'public':
            return item.visibility === 'public';
          case 'used':
            return usedCount > 0;
          case 'unused':
            return usedCount === 0;
          case 'failed':
            return status === 'failed';
          default:
            return true;
        }
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [adminMediaLibrary, activeFilter, searchQuery]);

  const activeUploadList: ActiveUploadTask[] = Object.values(uploadTasks);
  const failedTasksCount = activeUploadList.filter((t) => t.status === 'failed').length;

  const filterTabs: Array<{ id: MediaLibraryFilter; label: string; count?: number }> = [
    { id: 'all', label: 'All', count: adminMediaLibrary.length },
    {
      id: 'video',
      label: 'Videos',
      count: adminMediaLibrary.filter(
        (m) => (m.mediaType || m.type) === 'video'
      ).length,
    },
    {
      id: 'image',
      label: 'Images',
      count: adminMediaLibrary.filter(
        (m) => (m.mediaType || m.type) === 'image'
      ).length,
    },
    {
      id: 'audio',
      label: 'Audio',
      count: adminMediaLibrary.filter(
        (m) => (m.mediaType || m.type) === 'audio'
      ).length,
    },
    {
      id: 'document',
      label: 'Documents',
      count: adminMediaLibrary.filter(
        (m) => (m.mediaType || m.type) === 'document'
      ).length,
    },
    {
      id: 'private',
      label: '🔒 Private',
      count: adminMediaLibrary.filter((m) => m.visibility === 'private').length,
    },
    {
      id: 'public',
      label: '🌐 Public',
      count: adminMediaLibrary.filter((m) => m.visibility === 'public').length,
    },
    {
      id: 'used',
      label: 'Used',
      count: adminMediaLibrary.filter((m) => (m.usageCount || 0) > 0).length,
    },
    {
      id: 'unused',
      label: 'Unused',
      count: adminMediaLibrary.filter((m) => (m.usageCount || 0) === 0).length,
    },
    {
      id: 'failed',
      label: 'Failed',
      count:
        adminMediaLibrary.filter(
          (m) => (m.status || m.uploadStatus) === 'failed'
        ).length + failedTasksCount,
    },
  ];

  const replacementCandidates = useMemo(() => {
    if (!deleteCandidate) return [];
    const targetCat = deleteCandidate.mediaType || deleteCandidate.type;
    return adminMediaLibrary.filter(
      (m) =>
        m.id !== deleteCandidate.id &&
        (m.mediaType || m.type) === targetCat &&
        (m.status || m.uploadStatus) !== 'failed'
    );
  }, [deleteCandidate, adminMediaLibrary]);

  return (
    <div className="space-y-5">
      {/* Upload Dropzone Card */}
      <div className="glass-card rounded-2xl p-5 border-2 border-dashed border-indigo-200 text-center space-y-3">
        <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-[#6C63FF] flex items-center justify-center mx-auto">
          <HardDrive className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-[#10152B]">
            Production Media Library (Private by Default)
          </h3>
          <p className="text-xs text-[#667085] max-w-lg mx-auto mt-1">
            Upload original-quality Videos (MP4, MOV, WEBM), Images (JPG, PNG, WEBP, AVIF, SVG), Audio (MP3, WAV), or Documents (PDF). Every upload starts as{' '}
            <span className="font-bold text-[#10152B]">🔒 Private (Admin-only)</span> and becomes{' '}
            <span className="font-bold text-emerald-700">🌐 Public</span> only when assigned to live website content.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#6C63FF] hover:bg-[#10152B] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Media Files (Video, Image, Audio, PDF)</span>
            <input
              type="file"
              multiple
              accept="video/*,image/*,audio/*,.pdf,.doc,.docx"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Active & Failed Upload Tasks */}
      {activeUploadList.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#6C63FF]">
            Upload Pipeline ({activeUploadList.length})
          </h4>
          {activeUploadList.map((task) => (
            <div
              key={task.uploadId}
              className={`glass-card rounded-2xl p-4 space-y-2.5 border ${
                task.status === 'failed'
                  ? 'border-rose-200 bg-rose-50/40'
                  : 'border-indigo-100'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#10152B] truncate">
                    {task.filename}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-[#667085] tabular-nums">
                    {task.status === 'uploading' && (
                      <>
                        <span className="font-semibold text-[#6C63FF]">
                          Uploading {task.percentage}%
                        </span>
                        <span>·</span>
                        <span>
                          {formatFileSize(task.uploadedBytes)} / {formatFileSize(task.size)}
                        </span>
                        {task.speedBytesPerSec > 0 && (
                          <>
                            <span>·</span>
                            <span>{formatSpeed(task.speedBytesPerSec)}</span>
                          </>
                        )}
                      </>
                    )}
                    {task.status === 'processing' && (
                      <span className="font-semibold text-indigo-600 flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Processing metadata &amp; thumbnail...
                      </span>
                    )}
                    {task.status === 'failed' && (
                      <span className="font-semibold text-rose-600 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        {task.errorMessage || 'Upload failed. Please retry.'}
                      </span>
                    )}
                  </div>
                </div>

                {task.status === 'uploading' && (
                  <span className="text-xs font-extrabold text-[#6C63FF] tabular-nums shrink-0">
                    {task.percentage}%
                  </span>
                )}

                {task.status === 'failed' && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartUpload(task.file, task)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#6C63FF] hover:bg-[#10152B] text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => dismissFailedTask(task.uploadId)}
                      className="p-1.5 rounded-full text-[#667085] hover:bg-slate-200 transition-colors cursor-pointer"
                      aria-label="Dismiss failed upload"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {(task.status === 'uploading' || task.status === 'processing') && (
                <div className="w-full h-2 rounded-full bg-indigo-100/80 overflow-hidden">
                  <div
                    style={{ width: `${task.percentage}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-[#3B82F6] via-[#6C63FF] to-[#8B5CF6] transition-all duration-150"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#98A2B3] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Media Library by filename..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-indigo-100 text-xs text-[#10152B] placeholder:text-[#98A2B3] focus:outline-none focus:border-[#6C63FF]"
          />
        </div>

        {/* 10 Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                  isActive
                    ? 'bg-[#10152B] text-white shadow-2xs'
                    : 'bg-white text-[#475467] hover:text-[#10152B] border border-indigo-100/70'
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] tabular-nums ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-indigo-50 text-[#6C63FF]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Media Items List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#667085]">
            Showing {filteredItems.length} of {adminMediaLibrary.length} Media Assets
          </h4>
        </div>

        {filteredItems.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center space-y-2">
            <p className="text-xs font-bold text-[#10152B]">
              No media assets match this filter.
            </p>
            <p className="text-[11px] text-[#667085]">
              Try clearing your search query or switching filter tabs above.
            </p>
          </div>
        ) : (
          filteredItems.map((media) => {
            const cat: MediaCategoryType =
              media.mediaType || (media.type as MediaCategoryType) || 'video';
            const rawThumb = media.thumbnailUrl || media.thumbnail;
            const thumbSrc = rawThumb
              ? appendAdminTokenToUrl(rawThumb, isAdminAuthenticated)
              : '';
            const rawPlayable = media.mediaUrl || media.storageUrl || media.publicUrl;
            const playableSrc = appendAdminTokenToUrl(rawPlayable, isAdminAuthenticated);
            const status: MediaUploadStatus =
              media.status || media.uploadStatus || 'ready';
            const isPublic = media.visibility === 'public' && media.isPublished;
            const usedRefs = media.usedBy || [];
            const dimensionsLabel =
              media.width && media.height
                ? `${media.width}×${media.height}`
                : media.resolution || 'Original';

            return (
              <div
                key={media.id}
                className="glass-card rounded-2xl p-4 space-y-3 border border-white/90"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Thumbnail / Category Preview */}
                    <div className="relative w-20 h-13 rounded-xl overflow-hidden bg-slate-900 shrink-0 flex items-center justify-center border border-indigo-100/60">
                      {(cat === 'video' || cat === 'image') && thumbSrc ? (
                        <img
                          src={thumbSrc}
                          alt={media.filename}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : status === 'processing' ? (
                        <Loader2 className="w-4 h-4 text-indigo-300 animate-spin" />
                      ) : cat === 'audio' ? (
                        <Music className="w-5 h-5 text-indigo-300" />
                      ) : cat === 'document' ? (
                        <FileText className="w-5 h-5 text-indigo-300" />
                      ) : cat === 'image' ? (
                        <ImageIcon className="w-5 h-5 text-indigo-300" />
                      ) : (
                        <Film className="w-5 h-5 text-indigo-300" />
                      )}
                    </div>

                    {/* Metadata Details */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          type="text"
                          value={media.filename}
                          onChange={(e) =>
                            updateData((prev) => ({
                              ...prev,
                              mediaLibrary: prev.mediaLibrary.map((m) =>
                                m.id === media.id
                                  ? {
                                      ...m,
                                      filename: e.target.value,
                                      fileName: e.target.value,
                                    }
                                  : m
                              ),
                            }))
                          }
                          title="Rename media asset"
                          className="text-xs font-extrabold text-[#10152B] bg-white/80 hover:bg-white focus:bg-white px-2 py-0.5 rounded-lg border border-transparent hover:border-indigo-100 focus:border-[#6C63FF] focus:outline-none min-w-[140px] flex-1 truncate"
                        />

                        {/* Visibility Badge: 🔒 Private vs 🌐 Public */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                            isPublic
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {isPublic ? (
                            <>
                              <Globe className="w-2.5 h-2.5" />
                              <span>🌐 Public</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-2.5 h-2.5" />
                              <span>🔒 Private</span>
                            </>
                          )}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                            status === 'ready'
                              ? 'bg-indigo-50 text-[#6C63FF]'
                              : status === 'processing'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-600'
                          }`}
                        >
                          {status}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#667085] tabular-nums px-1">
                        <span className="font-semibold uppercase text-[#475467]">
                          {cat}
                        </span>{' '}
                        · {media.mimeType} · {formatFileSize(media.size)}
                        {cat === 'video' && ` · ${media.durationFormatted}`}
                        {(cat === 'video' || cat === 'image') &&
                          dimensionsLabel &&
                          ` · ${dimensionsLabel}`}{' '}
                        · Uploaded {formatUploadDate(media.uploadDate || media.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {cat === 'video' && (
                      <button
                        type="button"
                        onClick={() =>
                          setActiveVideoModal({
                            isOpen: true,
                            videoMediaId: media.id,
                            mediaType: media.mimeType || 'video/mp4',
                            title: media.filename,
                            videoUrl: playableSrc,
                            thumbnail: thumbSrc || undefined,
                            duration: media.durationFormatted,
                          })
                        }
                        className="p-2 rounded-xl bg-indigo-50 text-[#6C63FF] hover:bg-[#6C63FF] hover:text-white transition-colors cursor-pointer"
                        title="Preview Video in Player"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {cat === 'image' && (
                      <button
                        type="button"
                        onClick={() => handleAssignToProfilePhoto(media)}
                        className="px-2.5 py-1.5 rounded-xl bg-indigo-50 text-[#6C63FF] hover:bg-[#6C63FF] hover:text-white text-[11px] font-semibold transition-colors cursor-pointer"
                        title="Set as Public Profile Photo"
                      >
                        Use as Profile Photo
                      </button>
                    )}

                    {cat === 'document' && (
                      <button
                        type="button"
                        onClick={() => handleAssignToResume(media)}
                        className="px-2.5 py-1.5 rounded-xl bg-indigo-50 text-[#6C63FF] hover:bg-[#6C63FF] hover:text-white text-[11px] font-semibold transition-colors cursor-pointer"
                        title="Set as Active Public Resume / CV"
                      >
                        Set Active Resume
                      </button>
                    )}

                    {(cat === 'image' || cat === 'document' || cat === 'audio') && (
                      <a
                        href={playableSrc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-slate-100 text-[#475467] hover:bg-[#10152B] hover:text-white transition-colors"
                        title="Open / Preview File"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRequestDelete(media)}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete from Media Library"
                      aria-label="Delete media item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Usage Status Footer Row */}
                <div className="pt-2 border-t border-indigo-50/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  {usedRefs.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-emerald-700">Used by:</span>
                      {usedRefs.map((ref, i) => (
                        <span
                          key={`${ref.type}-${ref.id}-${i}`}
                          className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold"
                        >
                          {ref.label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[#667085] font-medium">
                      Unused: Not currently assigned to public content (Admin-only private asset)
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADMIN DELETE PROTECTION MODAL */}
      {deleteCandidate && (
        <div
          className="fixed inset-0 z-50 bg-[#10152B]/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setDeleteCandidate(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-rose-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-[#10152B]">
                  This media is currently being used by public content.
                </h3>
                <p className="text-xs text-[#667085]">
                  Asset: <span className="font-bold text-[#10152B]">{deleteCandidate.filename}</span>
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                Currently Used In ({deleteCandidate.usedBy?.length || 0}):
              </p>
              <ul className="space-y-1 text-xs font-semibold text-[#10152B]">
                {(deleteCandidate.usedBy || []).map((u, idx) => (
                  <li key={`${u.type}-${u.id}-${idx}`} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>{u.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {replacementCandidates.length > 0 && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#10152B]">
                  Optional: Replace references with another {deleteCandidate.mediaType || 'media'} asset
                </label>
                <select
                  value={replacementMediaId}
                  onChange={(e) => setReplacementMediaId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F8FF] border border-indigo-100 text-xs text-[#10152B]"
                >
                  <option value="">— Do not replace (clear references safely) —</option>
                  {replacementCandidates.map((cand) => (
                    <option key={cand.id} value={cand.id}>
                      {cand.filename} ({formatFileSize(cand.size)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#475467] hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>

              {replacementMediaId && (
                <button
                  type="button"
                  onClick={() =>
                    executeConfirmedDelete(deleteCandidate, replacementMediaId)
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#6C63FF] hover:bg-[#10152B] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Replace &amp; Delete</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => executeConfirmedDelete(deleteCandidate)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Anyway</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
