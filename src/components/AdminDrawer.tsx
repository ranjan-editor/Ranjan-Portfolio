import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  User,
  Briefcase,
  Film,
  Type as TypeIcon,
  Layers,
  MessageSquareQuote,
  Wrench,
  RotateCcw,
  Plus,
  Trash2,
  Upload,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  HardDrive,
  Play,
  Search,
  ChevronDown,
  AlertTriangle,
  Check,
  ArrowUpDown,
  Lock,
  LogOut,
  AlertCircle,
  Loader2,
  RefreshCw,
  FileText,
  Download,
  ExternalLink,
  SplitSquareVertical,
  Image as ImageIcon,
  Volume2,
  Lightbulb,
  Share2,
} from 'lucide-react';
import { usePortfolio, AdminRouteTab } from '../context/PortfolioContext';
import { PREDEFINED_FONTS } from '../data/portfolioData';
import {
  BeforeAfterItem,
  CustomFontItem,
  MediaMetadata,
  MediaUploadStatus,
  ProjectItem,
  ResumeMetadata,
  ServiceItem,
} from '../types/portfolio';
import { generateVideoThumbnailAndMeta } from '../utils/videoThumbnail';
import {
  validateVideoFileLightweight,
  uploadVideoFileResumable,
} from '../utils/videoUploader';
import { AdminAudioTab } from './admin/AdminAudioTab';
import { AdminSoftwareTab } from './admin/AdminSoftwareTab';
import { AdminSkillsTab } from './admin/AdminSkillsTab';
import { AdminSocialLinksTab } from './admin/AdminSocialLinksTab';

type VideoSortOption = 'newest' | 'name' | 'duration';

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

const isVideoMediaItem = (m: MediaMetadata): boolean =>
  m.type === 'video' ||
  Boolean(m.type && m.type.toLowerCase().startsWith('video/')) ||
  Boolean(m.mimeType && m.mimeType.toLowerCase().startsWith('video/'));

const uploadPersistentImageFile = async (file: File): Promise<string> => {
  const res = await fetch('/api/media/image', {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'image/jpeg',
      'x-filename': encodeURIComponent(file.name),
    },
    body: file,
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || !payload.imageUrl) {
    throw new Error(payload?.error || 'Failed to upload image file');
  }
  return payload.imageUrl as string;
};

export const AdminDrawer: React.FC = () => {
  const {
    data,
    updateData,
    resetToDefaults,
    isAdminOpen,
    isAdminAuthenticated,
    loginAdmin,
    logoutAdmin,
    activeAdminTab,
    navigateAdminTab,
    closeAdminToPublic,
    ensureVideoThumbnail,
    setActiveVideoModal,
  } = usePortfolio();

  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isResumeUploading, setIsResumeUploading] = useState<boolean>(false);
  const [isAssetUploading, setIsAssetUploading] = useState<boolean>(false);

  // Isolated non-blocking upload tasks map (keyed by deterministic uploadId to prevent duplicates)
  const [uploadTasks, setUploadTasks] = useState<Record<string, ActiveUploadTask>>({});
  const inFlightUploadsRef = useRef<Set<string>>(new Set());

  // Project Video Selector Modal state
  const [selectorProjectId, setSelectorProjectId] = useState<string | null>(null);
  const [videoSearchQuery, setVideoSearchQuery] = useState<string>('');
  const [videoSortBy, setVideoSortBy] = useState<VideoSortOption>('newest');

  // Filter ONLY ready video files from Media Library, then apply search and sort
  const filteredVideoLibrary = useMemo(() => {
    const onlyVideos = data.mediaLibrary.filter(
      (m) => isVideoMediaItem(m) && m.uploadStatus !== 'failed'
    );

    const searched = videoSearchQuery.trim()
      ? onlyVideos.filter((v) =>
          v.filename.toLowerCase().includes(videoSearchQuery.trim().toLowerCase())
        )
      : onlyVideos;

    return [...searched].sort((a, b) => {
      if (videoSortBy === 'name') {
        return a.filename.localeCompare(b.filename);
      }
      if (videoSortBy === 'duration') {
        return (b.duration || 0) - (a.duration || 0);
      }
      return (
        (b.createdAt || new Date(b.uploadDate).getTime()) -
        (a.createdAt || new Date(a.uploadDate).getTime())
      );
    });
  }, [data.mediaLibrary, videoSearchQuery, videoSortBy]);

  if (!isAdminOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = loginAdmin(passwordInput);
    if (ok) {
      setPasswordInput('');
      setLoginError('');
    } else {
      setLoginError('Incorrect admin password.');
    }
  };

  // Protected Admin Login Screen when not authenticated
  if (!isAdminAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#10152B]/65 backdrop-blur-md animate-in fade-in duration-150">
        <div className="w-full max-w-md glass-panel bg-white/95 rounded-[32px] p-6 sm:p-8 shadow-2xl border border-white space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#6C63FF] flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#10152B]">Admin Login</h2>
                <p className="text-xs text-[#667085]">Enter your admin password to continue</p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeAdminToPublic}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-[#10152B] text-[#10152B] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Return to Portfolio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-password-input"
                className="block text-xs font-bold text-[#10152B] mb-1.5"
              >
                Admin Password
              </label>
              <input
                id="admin-password-input"
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (loginError) setLoginError('');
                }}
                placeholder="Enter password"
                autoFocus
                className={`w-full px-4 py-3 rounded-2xl bg-white border text-sm text-[#10152B] focus:outline-none focus:ring-2 transition-all ${
                  loginError
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-indigo-100 focus:border-[#6C63FF] focus:ring-[#6C63FF]/20'
                }`}
              />
              {loginError && (
                <p className="mt-2 text-xs font-semibold text-rose-600 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{loginError}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={closeAdminToPublic}
                className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#475467] hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Back to Website
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-[#10152B] hover:bg-[#6C63FF] text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
              >
                Unlock Admin Panel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Upload Brand Logo (PNG, JPG, JPEG, WEBP, SVG)
  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsAssetUploading(true);
    try {
      const imageUrl = await uploadPersistentImageFile(file);
      updateData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          logoUrl: imageUrl,
        },
      }));
      setUploadStatus(`Uploaded & applied brand logo: "${file.name}"`);
    } catch (err: any) {
      setUploadStatus(err?.message || 'Failed to upload brand logo.');
    } finally {
      setIsAssetUploading(false);
    }
  };

  // Upload Hero Portrait Image (PNG, JPG, JPEG, WEBP)
  const handlePortraitFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsAssetUploading(true);
    try {
      const imageUrl = await uploadPersistentImageFile(file);
      updateData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          portraitUrl: imageUrl,
        },
      }));
      setUploadStatus(`Uploaded & updated Hero portrait photo: "${file.name}"`);
    } catch (err: any) {
      setUploadStatus(err?.message || 'Failed to upload portrait image.');
    } finally {
      setIsAssetUploading(false);
    }
  };

  // Upload or Replace Resume / CV File (.pdf, .doc, .docx)
  const handleResumeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['pdf', 'doc', 'docx'].includes(ext)) {
      setUploadStatus('Unsupported format. Please upload a PDF, DOC, or DOCX resume.');
      return;
    }

    setIsResumeUploading(true);
    try {
      const res = await fetch('/api/resume/upload', {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/pdf',
          'x-filename': encodeURIComponent(file.name),
        },
        body: file,
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload.resume) {
        throw new Error(payload?.error || 'Failed to upload Resume / CV');
      }

      const newResume: ResumeMetadata = payload.resume;
      updateData((prev) => ({
        ...prev,
        resume: newResume,
        profile: {
          ...prev.profile,
          cvUrl: newResume.fileUrl,
        },
      }));
      setUploadStatus(`Uploaded Resume / CV: "${newResume.filename}" (${formatFileSize(newResume.size)})`);
    } catch (err: any) {
      setUploadStatus(err?.message || 'Failed to upload Resume / CV.');
    } finally {
      setIsResumeUploading(false);
    }
  };

  const handleDeleteResume = async () => {
    try {
      await fetch('/api/resume', { method: 'DELETE' });
    } catch {
      // ignore
    }
    updateData((prev) => ({
      ...prev,
      resume: null,
      profile: {
        ...prev.profile,
        cvUrl: undefined,
      },
    }));
    setUploadStatus('Removed active Resume / CV.');
  };

  // Upload Before or After Image for a Comparison Item
  const handleBeforeAfterImageUpload = async (
    itemId: string,
    side: 'before' | 'after',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsAssetUploading(true);
    try {
      const imageUrl = await uploadPersistentImageFile(file);
      updateData((prev) => ({
        ...prev,
        beforeAfterItems: (prev.beforeAfterItems || []).map((item) =>
          item.id === itemId
            ? side === 'before'
              ? { ...item, beforeImageUrl: imageUrl }
              : { ...item, afterImageUrl: imageUrl }
            : item
        ),
      }));
      setUploadStatus(`Uploaded ${side.toUpperCase()} comparison image: "${file.name}"`);
    } catch (err: any) {
      setUploadStatus(err?.message || 'Failed to upload comparison image.');
    } finally {
      setIsAssetUploading(false);
    }
  };

  const moveBeforeAfterItem = (index: number, direction: 'up' | 'down') => {
    const sorted = [...(data.beforeAfterItems || [])].sort((a, b) => a.order - b.order);
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sorted.length) return;
    const [moved] = sorted.splice(index, 1);
    sorted.splice(newIndex, 0, moved);
    const reordered = sorted.map((item, idx) => ({ ...item, order: idx + 1 }));
    updateData((prev) => ({ ...prev, beforeAfterItems: reordered }));
  };

  // Handle Custom Font Upload (WOFF, WOFF2, TTF, OTF)
  const handleFontFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['woff', 'woff2', 'ttf', 'otf'].includes(ext)) {
      setUploadStatus('Unsupported font format. Please upload WOFF, WOFF2, TTF, or OTF.');
      return;
    }

    const fontFamilyName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newFont: CustomFontItem = {
        id: `font-${Date.now()}`,
        name: fontFamilyName,
        format: ext as CustomFontItem['format'],
        dataUrl,
      };

      updateData((prev) => ({
        ...prev,
        theme: {
          ...prev.theme,
          selectedFont: fontFamilyName,
          headingFont: fontFamilyName,
          customFonts: [...prev.theme.customFonts, newFont],
        },
      }));
      setUploadStatus(`Uploaded & applied custom font: "${fontFamilyName}" (${ext.toUpperCase()})`);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Core Upload & Post-Upload Thumbnail Pipeline
   */
  const startOrResumeVideoUpload = async (file: File, existingTask?: ActiveUploadTask) => {
    const validation = validateVideoFileLightweight(file);
    if (!validation.valid) {
      console.error('[VideoUpload] File validation failed:', {
        filename: file?.name,
        fileSize: file?.size,
        mimeType: file?.type,
        errorCode: validation.code,
        errorMessage: validation.userMessage,
      });
      setUploadStatus(validation.userMessage || 'This video format is not supported.');
      return;
    }

    const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
    const uploadId =
      existingTask?.uploadId || `up_${cleanName}_${file.size}_${file.lastModified}`;

    if (inFlightUploadsRef.current.has(uploadId)) {
      return;
    }

    const existingMediaItem = data.mediaLibrary.find(
      (m) => m.filename.toLowerCase() === file.name.toLowerCase()
    );
    const mediaId =
      existingTask?.mediaId || existingMediaItem?.id || `media-${Date.now()}`;

    inFlightUploadsRef.current.add(uploadId);

    setUploadTasks((prev) => ({
      ...prev,
      [uploadId]: {
        uploadId,
        mediaId,
        file,
        filename: file.name,
        size: file.size,
        mimeType: file.type || 'video/mp4',
        status: 'uploading',
        uploadedBytes: existingTask?.uploadedBytes || 0,
        percentage: existingTask?.percentage || 0,
        speedBytesPerSec: 0,
        errorMessage: undefined,
        errorCode: undefined,
      },
    }));

    try {
      const uploadResult = await uploadVideoFileResumable({
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

      const nowTs = Date.now();
      const persistentMediaUrl = uploadResult.mediaUrl;

      setUploadTasks((prev) => {
        const current = prev[uploadId];
        if (!current) return prev;
        return {
          ...prev,
          [uploadId]: {
            ...current,
            status: 'processing',
            uploadedBytes: file.size,
            percentage: 100,
          },
        };
      });

      const initialMediaRecord: MediaMetadata = {
        id: mediaId,
        filename: file.name,
        type: 'video',
        mimeType: file.type || 'video/mp4',
        size: file.size,
        duration: null,
        durationFormatted: '00:00',
        mediaUrl: persistentMediaUrl,
        storageUrl: persistentMediaUrl,
        thumbnailUrl: null,
        thumbnail: '',
        createdAt: nowTs,
        uploadDate: new Date(nowTs).toISOString(),
        visibility: 'public',
        uploadStatus: 'processing',
        resolution: 'Original HD',
      };

      updateData((prev) => {
        const exists = prev.mediaLibrary.some((m) => m.id === mediaId);
        const updatedLibrary = exists
          ? prev.mediaLibrary.map((m) => (m.id === mediaId ? initialMediaRecord : m))
          : [initialMediaRecord, ...prev.mediaLibrary];
        return {
          ...prev,
          mediaLibrary: updatedLibrary,
        };
      });

      let extracted = await generateVideoThumbnailAndMeta(file, mediaId);
      if (!extracted.thumbnailUrl && persistentMediaUrl) {
        extracted = await generateVideoThumbnailAndMeta(persistentMediaUrl, mediaId);
      }

      updateData((prev) => {
        const updatedLibrary = prev.mediaLibrary.map((m) =>
          m.id === mediaId
            ? {
                ...m,
                duration: extracted.duration || 0,
                durationFormatted: extracted.durationFormatted || '00:15',
                thumbnailUrl: extracted.thumbnailUrl || null,
                thumbnail: extracted.thumbnailUrl || '',
                resolution: extracted.resolution || 'Original HD',
                uploadStatus: 'ready' as MediaUploadStatus,
              }
            : m
        );

        const updatedProjects = prev.projects.map((p) =>
          p.videoMediaId === mediaId
            ? {
                ...p,
                duration: extracted.durationFormatted || p.duration,
                thumbnail: extracted.thumbnailUrl || p.thumbnail,
              }
            : p
        );

        return {
          ...prev,
          mediaLibrary: updatedLibrary,
          projects: updatedProjects,
        };
      });

      setUploadTasks((prev) => {
        const copy = { ...prev };
        delete copy[uploadId];
        return copy;
      });

      setUploadStatus(
        `Ready: "${file.name}" (${formatFileSize(file.size)}) uploaded and thumbnail generated.`
      );
    } catch (err: any) {
      const userMsg = err?.userMessage || 'Upload failed. Please retry.';
      setUploadTasks((prev) => {
        const current = prev[uploadId];
        if (!current) return prev;
        return {
          ...prev,
          [uploadId]: {
            ...current,
            status: 'failed',
            errorMessage: userMsg,
            errorCode: err?.code || 'UPLOAD_FAILED',
          },
        };
      });
    } finally {
      inFlightUploadsRef.current.delete(uploadId);
    }
  };

  const handleVideoMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    startOrResumeVideoUpload(file);
  };

  const dismissFailedUploadTask = (uploadId: string) => {
    setUploadTasks((prev) => {
      const copy = { ...prev };
      delete copy[uploadId];
      return copy;
    });
  };

  const handleSelectVideoForProject = async (projectId: string, videoItem: MediaMetadata) => {
    let thumbToUse = videoItem.thumbnailUrl || videoItem.thumbnail || '';
    if (!thumbToUse) {
      thumbToUse = await ensureVideoThumbnail(videoItem.id);
    }

    updateData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              videoMediaId: videoItem.id,
              duration: videoItem.durationFormatted || p.duration,
              thumbnail: thumbToUse || '',
            }
          : p
      ),
    }));
    setSelectorProjectId(null);
    setVideoSearchQuery('');
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= data.sectionOrder.length) return;
    updateData((prev) => {
      const copy = [...prev.sectionOrder];
      const [moved] = copy.splice(index, 1);
      copy.splice(newIndex, 0, moved);
      return { ...prev, sectionOrder: copy };
    });
  };

  const activeSelectorProject = selectorProjectId
    ? data.projects.find((p) => p.id === selectorProjectId)
    : null;

  const activeUploadList: ActiveUploadTask[] = Object.values(uploadTasks);
  const isCurrentlyUploadingAny = activeUploadList.some(
    (t) => t.status === 'uploading' || t.status === 'processing'
  );

  const sortedBeforeAfterItems = [...(data.beforeAfterItems || [])].sort(
    (a, b) => a.order - b.order
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#10152B]/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-[#F7F8FF] h-full shadow-2xl border-l border-white flex flex-col overflow-hidden">
        {/* Top Drawer Bar */}
        <div className="px-6 py-4 bg-white border-b border-indigo-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[#10152B]">
              Portfolio Studio CMS &amp; Admin
            </h2>
            <p className="text-xs text-[#667085]">
              Customize content, Resume/CV, Before/After grading, HD media, and section order
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetToDefaults}
              title="Reset to default portfolio content"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={logoutAdmin}
              title="Logout of Admin Session"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#475467] bg-slate-100 hover:bg-[#10152B] hover:text-white transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
            <button
              type="button"
              onClick={closeAdminToPublic}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-[#10152B] text-[#10152B] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close Admin Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2.5 bg-white/70 border-b border-indigo-100 flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'profile', label: 'Profile & Branding', icon: User },
            { id: 'resume', label: 'Resume / CV', icon: FileText },
            { id: 'projects', label: 'Projects', icon: Film },
            { id: 'beforeAfter', label: 'Before / After', icon: SplitSquareVertical },
            {
              id: 'media',
              label: isCurrentlyUploadingAny ? 'HD Media Library (Uploading...)' : 'HD Media Library',
              icon: HardDrive,
            },
            { id: 'audio', label: 'Audio & Sound', icon: Volume2 },
            { id: 'software', label: 'Software & Tools', icon: Wrench },
            { id: 'skills', label: 'Skills', icon: Lightbulb },
            { id: 'socials', label: 'Social Links', icon: Share2 },
            { id: 'services', label: 'Services', icon: Briefcase },
            { id: 'testimonials', label: 'Testimonials', icon: MessageSquareQuote },
            { id: 'fonts', label: 'Fonts & Theme', icon: TypeIcon },
            { id: 'sections', label: 'Section Order', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  navigateAdminTab(tab.id as AdminRouteTab);
                  setUploadStatus('');
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeAdminTab === tab.id
                    ? 'bg-[#6C63FF] text-white shadow-xs'
                    : 'text-[#475467] hover:bg-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Status Toast */}
        {uploadStatus && (
          <div className="mx-6 mt-4 px-4 py-2.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs font-semibold text-[#6C63FF] flex items-center justify-between">
            <span>{uploadStatus}</span>
            <button
              type="button"
              onClick={() => setUploadStatus('')}
              className="text-indigo-400 hover:text-indigo-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: PROFILE, BRAND LOGO, HERO PORTRAIT, ABOUT & CONTACT / WHATSAPP */}
          {activeAdminTab === 'profile' && (
            <div className="space-y-6">
              {/* Brand Logo & Hero Portrait Upload Card */}
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-[#10152B]">
                  Brand Logo &amp; Hero Portrait Photo
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Brand Logo */}
                  <div className="p-3.5 rounded-xl bg-white border border-indigo-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#10152B]">Navbar &amp; Footer Logo</span>
                      {data.profile.logoUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            updateData((prev) => ({
                              ...prev,
                              profile: { ...prev.profile, logoUrl: undefined },
                            }))
                          }
                          className="text-[11px] font-semibold text-rose-500 hover:underline cursor-pointer"
                        >
                          Reset to &quot;{data.profile.logoLetter || 'R'}&quot;
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#F7F8FF] border border-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
                        {data.profile.logoUrl ? (
                          <img
                            src={data.profile.logoUrl}
                            alt="Brand Logo"
                            className="w-9 h-9 rounded-full object-contain"
                          />
                        ) : (
                          <span className="font-signature text-2xl font-bold text-[#10152B]">
                            {data.profile.logoLetter || 'R'}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#10152B] hover:bg-[#6C63FF] text-white text-[11px] font-semibold transition-colors cursor-pointer">
                          <Upload className="w-3 h-3" />
                          <span>{isAssetUploading ? 'Uploading...' : 'Upload Logo'}</span>
                          <input
                            type="file"
                            accept=".png,.jpg,.jpeg,.webp,.svg"
                            onChange={handleLogoFileUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[10px] text-[#667085]">PNG, JPG, WEBP, or SVG</p>
                      </div>
                    </div>
                  </div>

                  {/* Hero Portrait Photo */}
                  <div className="p-3.5 rounded-xl bg-white border border-indigo-100 space-y-3">
                    <span className="block text-xs font-bold text-[#10152B]">
                      Hero Portrait Photo
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#F7F8FF] border border-indigo-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {data.profile.portraitUrl ? (
                          <img
                            src={data.profile.portraitUrl}
                            alt="Hero Portrait"
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-[#667085]" />
                        )}
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#6C63FF] hover:bg-[#10152B] text-white text-[11px] font-semibold transition-colors cursor-pointer">
                          <Upload className="w-3 h-3" />
                          <span>{isAssetUploading ? 'Uploading...' : 'Upload Photo'}</span>
                          <input
                            type="file"
                            accept=".png,.jpg,.jpeg,.webp"
                            onChange={handlePortraitFileUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[10px] text-[#667085]">Updates Hero frame immediately</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-[#10152B]">Hero &amp; Identity</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#475467] mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={data.profile.name}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          profile: { ...prev.profile, name: e.target.value },
                        }))
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-indigo-100 text-xs text-[#10152B]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#475467] mb-1">
                      Profession Subtitle
                    </label>
                    <input
                      type="text"
                      value={data.profile.profession}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          profile: { ...prev.profile, profession: e.target.value },
                        }))
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-indigo-100 text-xs text-[#10152B]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#475467] mb-1">
                      Experience Badge
                    </label>
                    <input
                      type="text"
                      value={data.profile.experienceYears}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          profile: { ...prev.profile, experienceYears: e.target.value },
                        }))
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-indigo-100 text-xs text-[#10152B]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#475467] mb-1">
                      Projects Completed Badge
                    </label>
                    <input
                      type="text"
                      value={data.profile.projectsCompleted}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          profile: { ...prev.profile, projectsCompleted: e.target.value },
                        }))
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-indigo-100 text-xs text-[#10152B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#475467] mb-1">
                    Hero Bio Description
                  </label>
                  <textarea
                    rows={3}
                    value={data.profile.heroDescription}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, heroDescription: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-indigo-100 text-xs text-[#10152B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#475467] mb-1">
                    Portrait Image URL (or use Upload Photo above)
                  </label>
                  <input
                    type="text"
                    value={data.profile.portraitUrl}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, portraitUrl: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-indigo-100 text-xs text-[#10152B]"
                  />
                </div>
              </div>

              <div className="glass-card rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-[#10152B]">
                  About, Contact &amp; WhatsApp Integration
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-[#475467] mb-1">
                    About Paragraph
                  </label>
                  <textarea
                    rows={3}
                    value={data.about.paragraph}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        about: { ...prev.about, paragraph: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-indigo-100 text-xs text-[#10152B]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#475467] mb-1">Email</label>
                    <input
                      type="text"
                      value={data.contact.email}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          contact: { ...prev.contact, email: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-indigo-100 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#475467] mb-1">Phone</label>
                    <input
                      type="text"
                      value={data.contact.phone}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          contact: { ...prev.contact, phone: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-indigo-100 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#6C63FF] mb-1">
                      WhatsApp Number (for Contact Form)
                    </label>
                    <input
                      type="text"
                      value={data.contact.whatsappNumber || ''}
                      placeholder="+917654800013"
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          contact: { ...prev.contact, whatsappNumber: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-indigo-200 text-xs font-semibold text-[#10152B]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#475467] mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={data.contact.location}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          contact: { ...prev.contact, location: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-indigo-100 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RESUME / CV MANAGER */}
          {activeAdminTab === 'resume' && (
            <div className="space-y-5">
              <div className="glass-card rounded-2xl p-5 border-2 border-dashed border-indigo-200 text-center space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-[#6C63FF] flex items-center justify-center mx-auto">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#10152B]">
                    {data.resume ? 'Replace Active Resume / CV' : 'Upload Resume / CV'}
                  </h3>
                  <p className="text-xs text-[#667085] max-w-md mx-auto mt-1">
                    Supported formats: PDF (.pdf recommended), DOC (.doc), DOCX (.docx). The uploaded file powers the public &quot;Download CV&quot; button in the Hero section.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#6C63FF] hover:bg-[#10152B] text-white text-xs font-semibold transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {isResumeUploading
                      ? 'Uploading Resume...'
                      : data.resume
                      ? 'Replace Resume / CV File'
                      : 'Select Resume / CV File'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleResumeFileUpload}
                    disabled={isResumeUploading}
                    className="hidden"
                  />
                </label>
              </div>

              {data.resume ? (
                <div className="glass-card rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#10152B] truncate">
                            {data.resume.filename}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                            Active Resume
                          </span>
                        </div>
                        <p className="text-xs text-[#667085] tabular-nums mt-0.5">
                          {formatFileSize(data.resume.size)} · Uploaded{' '}
                          {new Date(data.resume.updatedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`${data.resume.fileUrl}?preview=1`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-[#6C63FF] hover:bg-[#6C63FF] hover:text-white text-xs font-semibold transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </a>
                      <a
                        href={data.resume.fileUrl}
                        download={data.resume.filename}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-[#10152B] hover:bg-[#10152B] hover:text-white text-xs font-semibold transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                      <button
                        type="button"
                        onClick={handleDeleteResume}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Resume / CV"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-card rounded-2xl p-6 text-center space-y-1">
                  <p className="text-xs font-bold text-[#10152B]">No Resume / CV Uploaded Yet</p>
                  <p className="text-[11px] text-[#667085]">
                    Until a resume is uploaded, the public Hero button displays &quot;CV not available yet&quot;.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PROJECTS MANAGER */}
          {activeAdminTab === 'projects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#10152B]">
                  Featured Projects ({data.projects.length})
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    const firstAvailableVideo = data.mediaLibrary.find(isVideoMediaItem);
                    const newProj: ProjectItem = {
                      id: `proj-${Date.now()}`,
                      title: 'New Video Edit Project',
                      category: 'Social Edit',
                      description: 'Custom high-retention edit with color grading and motion graphics.',
                      tags: ['Editing', 'Grading'],
                      duration: firstAvailableVideo?.durationFormatted || '00:15',
                      thumbnail:
                        firstAvailableVideo?.thumbnailUrl || firstAvailableVideo?.thumbnail || '',
                      videoMediaId: firstAvailableVideo?.id,
                    };
                    updateData((prev) => ({
                      ...prev,
                      projects: [newProj, ...prev.projects],
                    }));
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#10152B] text-white text-xs font-semibold hover:bg-[#6C63FF] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Project</span>
                </button>
              </div>

              {data.projects.map((proj) => {
                const selectedVideoMedia = data.mediaLibrary.find(
                  (m) => m.id === proj.videoMediaId && isVideoMediaItem(m)
                );
                const isDeletedMedia = Boolean(proj.videoMediaId && !selectedVideoMedia);
                const resolvedThumb =
                  selectedVideoMedia?.thumbnailUrl ||
                  selectedVideoMedia?.thumbnail ||
                  proj.thumbnail ||
                  '';

                return (
                  <div key={proj.id} className="glass-card rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-12 h-8 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-indigo-100 flex items-center justify-center">
                        {resolvedThumb ? (
                          <img
                            src={resolvedThumb}
                            alt={proj.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Film className="w-4 h-4 text-indigo-300" />
                        )}
                      </div>

                      <input
                        type="text"
                        value={proj.title}
                        onChange={(e) =>
                          updateData((prev) => ({
                            ...prev,
                            projects: prev.projects.map((p) =>
                              p.id === proj.id ? { ...p, title: e.target.value } : p
                            ),
                          }))
                        }
                        className="font-bold text-sm text-[#10152B] bg-white px-3 py-1.5 rounded-xl border border-indigo-100 flex-1"
                      />
                      <span
                        title="Duration is automatically synced from the selected Media Library video"
                        className="w-16 text-xs font-semibold text-center bg-indigo-50/70 text-[#475467] px-2 py-1.5 rounded-xl border border-indigo-100 tabular-nums"
                      >
                        {selectedVideoMedia?.durationFormatted || proj.duration}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateData((prev) => ({
                            ...prev,
                            projects: prev.projects.filter((p) => p.id !== proj.id),
                          }))
                        }
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        aria-label="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#667085] mb-1">
                          Tags (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={proj.tags.join(', ')}
                          onChange={(e) =>
                            updateData((prev) => ({
                              ...prev,
                              projects: prev.projects.map((p) =>
                                p.id === proj.id
                                  ? {
                                      ...p,
                                      tags: e.target.value
                                        .split(',')
                                        .map((t) => t.trim())
                                        .filter(Boolean),
                                    }
                                  : p
                              ),
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white border border-indigo-100 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#667085] mb-1">
                          Project Video
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectorProjectId(proj.id);
                            setVideoSearchQuery('');
                          }}
                          className={`w-full px-3 py-1.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                            isDeletedMedia
                              ? 'bg-rose-50/90 border-rose-200 text-rose-700 hover:border-rose-300'
                              : selectedVideoMedia
                              ? 'bg-white border-indigo-100 text-[#10152B] hover:border-[#6C63FF]'
                              : 'bg-white border-indigo-100 text-[#667085] hover:border-[#6C63FF]'
                          }`}
                        >
                          {selectedVideoMedia ? (
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-5 rounded-md overflow-hidden bg-slate-900 shrink-0">
                                {(selectedVideoMedia.thumbnailUrl || selectedVideoMedia.thumbnail) && (
                                  <img
                                    src={
                                      selectedVideoMedia.thumbnailUrl || selectedVideoMedia.thumbnail
                                    }
                                    alt={selectedVideoMedia.filename}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-[#10152B] truncate">
                                  {selectedVideoMedia.filename}
                                </p>
                              </div>
                              <span className="text-[10px] font-bold text-[#6C63FF] bg-indigo-50 px-1.5 py-0.5 rounded-md tabular-nums shrink-0">
                                {selectedVideoMedia.durationFormatted}
                              </span>
                            </div>
                          ) : isDeletedMedia ? (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 min-w-0">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">
                                Video unavailable — Select another video
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-[#667085] truncate">
                              Select Video from Media Library
                            </span>
                          )}
                          <ChevronDown className="w-3.5 h-3.5 text-[#667085] shrink-0" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: BEFORE / AFTER COMPARISON MANAGER */}
          {activeAdminTab === 'beforeAfter' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#10152B]">
                    Before / After Comparisons ({sortedBeforeAfterItems.length})
                  </h3>
                  <p className="text-[11px] text-[#667085]">
                    Interactive drag sliders showcasing raw footage vs. final color-graded masters
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newItem: BeforeAfterItem = {
                      id: `ba-${Date.now()}`,
                      title: 'Cinematic Color Grading Comparison',
                      subtitle: 'Drag the center handle to compare raw LOG footage with the final grade.',
                      beforeLabel: 'BEFORE',
                      afterLabel: 'AFTER',
                      beforeImageUrl: '/src/assets/images/project_travel_reel_1791134705927.jpg',
                      afterImageUrl: '/src/assets/images/project_event_highlights_1791134737005.jpg',
                      order: sortedBeforeAfterItems.length + 1,
                      visible: true,
                    };
                    updateData((prev) => ({
                      ...prev,
                      beforeAfterItems: [...(prev.beforeAfterItems || []), newItem],
                    }));
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#10152B] text-white text-xs font-semibold hover:bg-[#6C63FF] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Comparison</span>
                </button>
              </div>

              {sortedBeforeAfterItems.map((item, idx) => (
                <div key={item.id} className="glass-card rounded-2xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={item.title}
                      placeholder="Comparison Title"
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          beforeAfterItems: (prev.beforeAfterItems || []).map((ba) =>
                            ba.id === item.id ? { ...ba, title: e.target.value } : ba
                          ),
                        }))
                      }
                      className="font-bold text-xs text-[#10152B] bg-white px-3 py-1.5 rounded-xl border border-indigo-100 flex-1"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveBeforeAfterItem(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg bg-white border border-indigo-100 text-[#475467] disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBeforeAfterItem(idx, 'down')}
                        disabled={idx === sortedBeforeAfterItems.length - 1}
                        className="p-1.5 rounded-lg bg-white border border-indigo-100 text-[#475467] disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateData((prev) => ({
                            ...prev,
                            beforeAfterItems: (prev.beforeAfterItems || []).map((ba) =>
                              ba.id === item.id ? { ...ba, visible: !ba.visible } : ba
                            ),
                          }))
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                          item.visible
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.visible ? 'Visible' : 'Hidden'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateData((prev) => ({
                            ...prev,
                            beforeAfterItems: (prev.beforeAfterItems || []).filter(
                              (ba) => ba.id !== item.id
                            ),
                          }))
                        }
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Delete Comparison"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={item.subtitle || ''}
                    placeholder="Optional description or subtitle..."
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        beforeAfterItems: (prev.beforeAfterItems || []).map((ba) =>
                          ba.id === item.id ? { ...ba, subtitle: e.target.value } : ba
                        ),
                      }))
                    }
                    className="w-full text-xs text-[#667085] bg-white px-3 py-1.5 rounded-xl border border-indigo-100"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Before Image */}
                    <div className="p-3 rounded-xl bg-white border border-indigo-100 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-[#10152B]">BEFORE Image</span>
                        <input
                          type="text"
                          value={item.beforeLabel || 'BEFORE'}
                          onChange={(e) =>
                            updateData((prev) => ({
                              ...prev,
                              beforeAfterItems: (prev.beforeAfterItems || []).map((ba) =>
                                ba.id === item.id ? { ...ba, beforeLabel: e.target.value } : ba
                              ),
                            }))
                          }
                          className="w-28 px-2 py-0.5 rounded bg-[#F7F8FF] border border-indigo-100 text-[10px] font-semibold text-right"
                        />
                      </div>
                      <div className="aspect-16/9 w-full rounded-lg overflow-hidden bg-slate-900">
                        {item.beforeImageUrl && (
                          <img
                            src={item.beforeImageUrl}
                            alt="Before preview"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <label className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F7F8FF] hover:bg-indigo-50 text-[#6C63FF] border border-indigo-100 text-[11px] font-semibold transition-colors cursor-pointer">
                        <Upload className="w-3 h-3" />
                        <span>Upload Before Image</span>
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.webp"
                          onChange={(e) => handleBeforeAfterImageUpload(item.id, 'before', e)}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* After Image */}
                    <div className="p-3 rounded-xl bg-white border border-indigo-100 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-[#10152B]">AFTER Image</span>
                        <input
                          type="text"
                          value={item.afterLabel || 'AFTER'}
                          onChange={(e) =>
                            updateData((prev) => ({
                              ...prev,
                              beforeAfterItems: (prev.beforeAfterItems || []).map((ba) =>
                                ba.id === item.id ? { ...ba, afterLabel: e.target.value } : ba
                              ),
                            }))
                          }
                          className="w-28 px-2 py-0.5 rounded bg-[#F7F8FF] border border-indigo-100 text-[10px] font-semibold text-right"
                        />
                      </div>
                      <div className="aspect-16/9 w-full rounded-lg overflow-hidden bg-slate-900">
                        {item.afterImageUrl && (
                          <img
                            src={item.afterImageUrl}
                            alt="After preview"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <label className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F7F8FF] hover:bg-indigo-50 text-[#6C63FF] border border-indigo-100 text-[11px] font-semibold transition-colors cursor-pointer">
                        <Upload className="w-3 h-3" />
                        <span>Upload After Image</span>
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.webp"
                          onChange={(e) => handleBeforeAfterImageUpload(item.id, 'after', e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: UNCOMPRESSED HD/4K MEDIA LIBRARY */}
          {activeAdminTab === 'media' && (
            <div className="space-y-5">
              <div className="glass-card rounded-2xl p-5 border-2 border-dashed border-indigo-200 text-center space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-[#6C63FF] flex items-center justify-center mx-auto">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#10152B]">
                    Upload Original HD / 4K Video Files
                  </h3>
                  <p className="text-xs text-[#667085] max-w-md mx-auto mt-1">
                    No 50 MB limit. Videos upload immediately via resumable chunks in 100% original quality, followed by automatic thumbnail generation.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#6C63FF] hover:bg-[#10152B] text-white text-xs font-semibold transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Select High-Res Video File</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/*"
                    onChange={handleVideoMediaUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {activeUploadList.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#6C63FF]">
                    Upload Activity ({activeUploadList.length})
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
                                  Uploaded: {formatFileSize(task.uploadedBytes)} /{' '}
                                  {formatFileSize(task.size)}
                                </span>
                                {task.speedBytesPerSec > 0 && (
                                  <>
                                    <span>·</span>
                                    <span>Upload speed: {formatSpeed(task.speedBytesPerSec)}</span>
                                  </>
                                )}
                              </>
                            )}
                            {task.status === 'processing' && (
                              <span className="font-semibold text-indigo-600 flex items-center gap-1.5">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Processing thumbnail...
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
                              onClick={() => startOrResumeVideoUpload(task.file, task)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#6C63FF] hover:bg-[#10152B] text-white text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Retry Upload</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => dismissFailedUploadTask(task.uploadId)}
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

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#667085]">
                  Stored Media Metadata ({data.mediaLibrary.length} items)
                </h4>
                {data.mediaLibrary.map((media) => {
                  const usedByCount = data.projects.filter(
                    (p) => p.videoMediaId === media.id
                  ).length;
                  const thumbSrc = media.thumbnailUrl || media.thumbnail;
                  const playableSrc = media.mediaUrl || media.storageUrl;
                  const status: MediaUploadStatus = media.uploadStatus || 'ready';

                  return (
                    <div
                      key={media.id}
                      className="glass-card rounded-2xl p-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="relative w-20 h-12 rounded-xl overflow-hidden bg-slate-900 shrink-0 flex items-center justify-center">
                          {thumbSrc ? (
                            <img
                              src={thumbSrc}
                              alt={media.filename}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : status === 'processing' ? (
                            <Loader2 className="w-4 h-4 text-indigo-300 animate-spin" />
                          ) : (
                            <Film className="w-4 h-4 text-indigo-300" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={media.filename}
                              onChange={(e) =>
                                updateData((prev) => ({
                                  ...prev,
                                  mediaLibrary: prev.mediaLibrary.map((m) =>
                                    m.id === media.id ? { ...m, filename: e.target.value } : m
                                  ),
                                }))
                              }
                              title="Rename video in Media Library (projects linked by ID remain connected)"
                              className="text-xs font-bold text-[#10152B] bg-white/80 hover:bg-white focus:bg-white px-2 py-1 rounded-lg border border-transparent hover:border-indigo-100 focus:border-[#6C63FF] focus:outline-none w-full truncate"
                            />
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                status === 'ready'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : status === 'processing'
                                  ? 'bg-indigo-50 text-[#6C63FF]'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {status === 'ready'
                                ? 'Ready'
                                : status === 'processing'
                                ? 'Processing thumbnail...'
                                : status}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#667085] tabular-nums mt-0.5 px-2">
                            {media.mimeType || media.type} · {formatFileSize(media.size)} ·{' '}
                            {media.durationFormatted} · {media.resolution || 'Original HD'}
                            {usedByCount > 0 && (
                              <span className="ml-2 text-[#6C63FF] font-semibold">
                                · Used in {usedByCount} project{usedByCount > 1 ? 's' : ''}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
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
                          title="Preview Stream"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateData((prev) => ({
                              ...prev,
                              mediaLibrary: prev.mediaLibrary.filter((m) => m.id !== media.id),
                            }))
                          }
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete video from Media Library"
                          aria-label="Delete video from Media Library"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: SERVICES */}
          {activeAdminTab === 'services' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#10152B]">
                  Services ({data.services.length})
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    const newService: ServiceItem = {
                      id: `srv-${Date.now()}`,
                      title: 'Custom Creative Service',
                      description: 'High-impact visual storytelling and post-production.',
                      iconName: 'sparkles',
                    };
                    updateData((prev) => ({
                      ...prev,
                      services: [...prev.services, newService],
                    }));
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#10152B] text-white text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Service</span>
                </button>
              </div>
              {data.services.map((srv) => (
                <div key={srv.id} className="glass-card rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={srv.title}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          services: prev.services.map((s) =>
                            s.id === srv.id ? { ...s, title: e.target.value } : s
                          ),
                        }))
                      }
                      className="font-bold text-xs text-[#10152B] bg-white px-3 py-1.5 rounded-xl border border-indigo-100 flex-1"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateData((prev) => ({
                          ...prev,
                          services: prev.services.filter((s) => s.id !== srv.id),
                        }))
                      }
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={srv.description}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        services: prev.services.map((s) =>
                          s.id === srv.id ? { ...s, description: e.target.value } : s
                        ),
                      }))
                    }
                    className="w-full text-xs text-[#667085] bg-white px-3 py-1.5 rounded-xl border border-indigo-100"
                  />
                </div>
              ))}
            </div>
          )}

          {/* TAB: AUDIO & SOUND DESIGN */}
          {activeAdminTab === 'audio' && (
            <AdminAudioTab onStatusMessage={(msg) => setUploadStatus(msg)} />
          )}

          {/* TAB: SOFTWARE & TOOLS */}
          {activeAdminTab === 'software' && (
            <AdminSoftwareTab onStatusMessage={(msg) => setUploadStatus(msg)} />
          )}

          {/* TAB: SKILLS */}
          {activeAdminTab === 'skills' && (
            <AdminSkillsTab onStatusMessage={(msg) => setUploadStatus(msg)} />
          )}

          {/* TAB: SOCIAL LINKS */}
          {activeAdminTab === 'socials' && (
            <AdminSocialLinksTab onStatusMessage={(msg) => setUploadStatus(msg)} />
          )}

          {/* TAB 8: TESTIMONIALS */}
          {activeAdminTab === 'testimonials' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#10152B]">
                  Client Testimonials ({data.testimonials.length})
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    updateData((prev) => ({
                      ...prev,
                      testimonials: [
                        ...prev.testimonials,
                        {
                          id: `test-${Date.now()}`,
                          quote: 'Incredible pacing and visual storytelling!',
                          clientName: 'New Client',
                          roleCompany: 'Brand Director',
                          avatarUrl: '',
                        },
                      ],
                    }))
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#10152B] text-white text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Testimonial</span>
                </button>
              </div>
              {data.testimonials.map((t) => (
                <div key={t.id} className="glass-card rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={t.clientName}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          testimonials: prev.testimonials.map((item) =>
                            item.id === t.id ? { ...item, clientName: e.target.value } : item
                          ),
                        }))
                      }
                      className="font-bold text-xs text-[#10152B] bg-white px-3 py-1.5 rounded-xl border border-indigo-100 flex-1"
                    />
                    <input
                      type="text"
                      value={t.roleCompany}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          testimonials: prev.testimonials.map((item) =>
                            item.id === t.id ? { ...item, roleCompany: e.target.value } : item
                          ),
                        }))
                      }
                      className="text-xs text-[#667085] bg-white px-3 py-1.5 rounded-xl border border-indigo-100 flex-1"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateData((prev) => ({
                          ...prev,
                          testimonials: prev.testimonials.filter((item) => item.id !== t.id),
                        }))
                      }
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={t.quote}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        testimonials: prev.testimonials.map((item) =>
                          item.id === t.id ? { ...item, quote: e.target.value } : item
                        ),
                      }))
                    }
                    className="w-full text-xs text-[#475467] bg-white px-3 py-1.5 rounded-xl border border-indigo-100"
                  />
                </div>
              ))}
            </div>
          )}

          {/* TAB 9: FONT ENGINE */}
          {activeAdminTab === 'fonts' && (
            <div className="space-y-5">
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-[#10152B]">
                  1. Select Predefined or Uploaded Typography
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    ...PREDEFINED_FONTS,
                    ...data.theme.customFonts.map((cf) => ({
                      name: cf.name,
                      label: `${cf.name} (Custom ${cf.format.toUpperCase()})`,
                    })),
                  ].map((fontObj) => {
                    const isSelected = data.theme.selectedFont === fontObj.name;
                    return (
                      <button
                        key={fontObj.name}
                        type="button"
                        onClick={() =>
                          updateData((prev) => ({
                            ...prev,
                            theme: {
                              ...prev.theme,
                              selectedFont: fontObj.name,
                              headingFont: fontObj.name,
                            },
                          }))
                        }
                        style={{ fontFamily: `'${fontObj.name}', sans-serif` }}
                        className={`px-4 py-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50/90 border-[#6C63FF] text-[#10152B] font-bold'
                            : 'bg-white border-indigo-100 text-[#475467] hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-sm">{fontObj.label}</span>
                        {isSelected && (
                          <span className="text-xs font-semibold text-[#6C63FF]">Active</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="glass-card rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-[#10152B]">
                  2. Upload Custom Web Font (WOFF, WOFF2, TTF, OTF)
                </h3>
                <p className="text-xs text-[#667085]">
                  Upload any font file from your computer and it will dynamically register via @font-face and apply across the entire portfolio.
                </p>
                <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#10152B] hover:bg-[#6C63FF] text-white text-xs font-semibold transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Font File (.woff2, .woff, .ttf, .otf)</span>
                  <input
                    type="file"
                    accept=".woff,.woff2,.ttf,.otf"
                    onChange={handleFontFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 10: SECTION VISIBILITY & REORDERING */}
          {activeAdminTab === 'sections' && (
            <div className="space-y-3">
              <p className="text-xs text-[#667085]">
                Toggle visibility or reorder sections on the single-page portfolio.
              </p>
              {data.sectionOrder.map((sec, idx) => (
                <div
                  key={sec.id}
                  className="glass-card rounded-2xl p-3.5 flex items-center justify-between"
                >
                  <span className="text-xs font-bold text-[#10152B]">{sec.label}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => moveSection(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg bg-white border border-indigo-100 text-[#475467] disabled:opacity-30 cursor-pointer"
                      aria-label="Move section up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(idx, 'down')}
                      disabled={idx === data.sectionOrder.length - 1}
                      className="p-1.5 rounded-lg bg-white border border-indigo-100 text-[#475467] disabled:opacity-30 cursor-pointer"
                      aria-label="Move section down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateData((prev) => ({
                          ...prev,
                          sectionOrder: prev.sectionOrder.map((s) =>
                            s.id === sec.id ? { ...s, visible: !s.visible } : s
                          ),
                        }))
                      }
                      className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                        sec.visible
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {sec.visible ? (
                        <>
                          <Eye className="w-3.5 h-3.5" /> Visible
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" /> Hidden
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SEARCHABLE MEDIA LIBRARY VIDEO SELECTOR MODAL */}
        {selectorProjectId && (
          <div
            className="absolute inset-0 z-50 bg-[#10152B]/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
            onClick={() => setSelectorProjectId(null)}
          >
            <div
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-indigo-100 overflow-hidden flex flex-col max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-indigo-100/80 flex items-center justify-between bg-[#F7F8FF]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#6C63FF] flex items-center justify-center shrink-0">
                    <Film className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-[#10152B] truncate">
                      Select Project Video
                    </h3>
                    {activeSelectorProject && (
                      <p className="text-[11px] text-[#667085] truncate">
                        For: {activeSelectorProject.title}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectorProjectId(null)}
                  className="w-7 h-7 rounded-full bg-white hover:bg-[#10152B] text-[#475467] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close Video Selector"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 border-b border-indigo-50 space-y-2.5 bg-white">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#98A2B3] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={videoSearchQuery}
                    onChange={(e) => setVideoSearchQuery(e.target.value)}
                    placeholder="Search videos by filename or title..."
                    autoFocus
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F7F8FF] border border-indigo-100 text-xs text-[#10152B] placeholder:text-[#98A2B3] focus:outline-none focus:border-[#6C63FF]"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-[#667085] font-medium">
                    Showing {filteredVideoLibrary.length} video
                    {filteredVideoLibrary.length === 1 ? '' : 's'} from Media Library
                  </span>
                  <div className="flex items-center gap-1">
                    <ArrowUpDown className="w-3 h-3 text-[#667085]" />
                    <span className="text-[#667085]">Sort:</span>
                    {(
                      [
                        { id: 'newest', label: 'Newest' },
                        { id: 'name', label: 'Name' },
                        { id: 'duration', label: 'Duration' },
                      ] as { id: VideoSortOption; label: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setVideoSortBy(opt.id)}
                        className={`px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                          videoSortBy === opt.id
                            ? 'bg-[#6C63FF] text-white'
                            : 'text-[#475467] hover:bg-indigo-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filteredVideoLibrary.length === 0 ? (
                  <div className="py-10 text-center space-y-2">
                    <Film className="w-8 h-8 text-[#98A2B3] mx-auto" />
                    <p className="text-xs font-bold text-[#10152B]">No matching videos found</p>
                    <p className="text-[11px] text-[#667085]">
                      Upload a video in the HD Media Library tab or try another search term.
                    </p>
                  </div>
                ) : (
                  filteredVideoLibrary.map((videoItem) => {
                    const isCurrentlySelected =
                      activeSelectorProject?.videoMediaId === videoItem.id;
                    const thumbSrc = videoItem.thumbnailUrl || videoItem.thumbnail;

                    return (
                      <button
                        key={videoItem.id}
                        type="button"
                        onClick={() =>
                          handleSelectVideoForProject(selectorProjectId, videoItem)
                        }
                        className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                          isCurrentlySelected
                            ? 'bg-indigo-50/90 border-[#6C63FF] shadow-2xs'
                            : 'bg-white hover:bg-[#F7F8FF] border-indigo-100/70'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-20 h-12 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-indigo-100/50">
                            {thumbSrc ? (
                              <img
                                src={thumbSrc}
                                alt={videoItem.filename}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-indigo-300">
                                <Film className="w-4 h-4" />
                              </div>
                            )}
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/75 text-white text-[9px] font-bold tabular-nums">
                              {videoItem.durationFormatted}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#10152B] truncate">
                              {videoItem.filename}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-[#667085] tabular-nums">
                              <span className="font-semibold text-[#6C63FF]">
                                {videoItem.durationFormatted}
                              </span>
                              <span>·</span>
                              <span>{videoItem.mimeType || videoItem.type}</span>
                              <span>·</span>
                              <span>{formatFileSize(videoItem.size)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 pr-1">
                          {isCurrentlySelected ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#6C63FF] text-white text-[10px] font-bold">
                              <Check className="w-3 h-3" /> Selected
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-[#6C63FF] group-hover:underline">
                              Select
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="px-5 py-3 bg-[#F7F8FF] border-t border-indigo-100/80 flex items-center justify-between">
                <span className="text-[11px] text-[#667085]">
                  Need to upload a new video?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectorProjectId(null);
                    navigateAdminTab('media');
                  }}
                  className="text-xs font-bold text-[#6C63FF] hover:underline cursor-pointer"
                >
                  Go to HD Media Library →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
