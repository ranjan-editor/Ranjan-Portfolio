import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  PortfolioConfig,
  CustomFontItem,
  MediaMetadata,
  SectionConfig,
  SoftwareToolItem,
  SkillItem,
  SocialLinkItem,
  AudioConfig,
  SfxActionType,
} from '../types/portfolio';
import {
  initialPortfolioData,
  DEFAULT_AUDIO_CONFIG,
  DEFAULT_SOFTWARE_TOOLS,
  DEFAULT_SKILLS,
  DEFAULT_SOCIAL_LINKS,
} from '../data/portfolioData';
import { generateVideoThumbnailAndMeta } from '../utils/videoThumbnail';
import { soundEngine } from '../utils/soundEngine';

export type AdminRouteTab =
  | 'dashboard'
  | 'profile'
  | 'resume'
  | 'projects'
  | 'media'
  | 'software'
  | 'skills'
  | 'beforeAfter'
  | 'audio'
  | 'socials'
  | 'contact'
  | 'testimonials'
  | 'services'
  | 'fonts'
  | 'sections';

interface PortfolioContextType {
  data: PortfolioConfig;
  updateData: (updater: (prev: PortfolioConfig) => PortfolioConfig) => void;
  resetToDefaults: () => void;
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  isAdminAuthenticated: boolean;
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
  activeAdminTab: AdminRouteTab;
  navigateAdminTab: (tab: AdminRouteTab) => void;
  openAdminPanel: () => void;
  closeAdminToPublic: () => void;
  ensureVideoThumbnail: (mediaId: string) => Promise<string>;
  visitorAudioMuted: boolean;
  toggleVisitorAudioMute: () => void;
  triggerSfx: (action: SfxActionType, forcePreview?: boolean) => void;
  activeVideoModal: {
    isOpen: boolean;
    projectId?: string;
    videoMediaId?: string;
    mediaType?: string;
    title: string;
    videoUrl: string;
    thumbnail?: string;
    duration?: string;
    tags?: string[];
    description?: string;
  } | null;
  setActiveVideoModal: (modal: PortfolioContextType['activeVideoModal']) => void;
}

const STORAGE_KEY = 'ranjan_kumar_portfolio_cms_v2';
const ADMIN_AUTH_SESSION_KEY = 'ranjan_portfolio_admin_session_auth';

const normalizeMediaList = (rawList: any[]): MediaMetadata[] => {
  const baseList =
    Array.isArray(rawList) && rawList.length > 0 ? rawList : initialPortfolioData.mediaLibrary;
  const normalized: MediaMetadata[] = baseList
    .filter((m) => {
      const url = m?.mediaUrl || m?.storageUrl || '';
      return typeof url === 'string' && !url.startsWith('blob:');
    })
    .map((m) => {
      const playableUrl = m.mediaUrl || m.storageUrl || '';
      const thumbUrl = m.thumbnailUrl || m.thumbnail || '';
      return {
        id: m.id,
        filename: m.filename || 'video.mp4',
        type: 'video',
        mimeType: m.mimeType || (m.type && m.type.includes('/') ? m.type : 'video/mp4'),
        size: Number(m.size) || 0,
        duration: m.duration !== undefined && m.duration !== null ? Number(m.duration) : 0,
        durationFormatted: m.durationFormatted || '00:15',
        mediaUrl: playableUrl,
        storageUrl: playableUrl,
        thumbnailUrl: thumbUrl || null,
        thumbnail: thumbUrl || '',
        createdAt: Number(m.createdAt) || Date.parse(m.uploadDate || '') || Date.now(),
        uploadDate: m.uploadDate || new Date().toISOString(),
        visibility: m.visibility === 'private' ? 'private' : 'public',
        uploadStatus: m.uploadStatus || 'ready',
        resolution: m.resolution || '1920x1080',
      };
    });

  const existingIds = new Set(normalized.map((item) => item.id));
  for (const defMedia of initialPortfolioData.mediaLibrary) {
    if (!existingIds.has(defMedia.id)) {
      normalized.push(defMedia);
    }
  }
  return normalized;
};

const normalizeSoftwareTools = (parsed: any): SoftwareToolItem[] => {
  if (Array.isArray(parsed.softwareTools)) {
    return parsed.softwareTools
      .filter((t: any) => t && typeof t === 'object' && t.name)
      .map((t: any, idx: number) => ({
        id: String(t.id || `tool-${idx + 1}`),
        name: String(t.name).trim(),
        shortCode: String(t.shortCode || t.name.slice(0, 2)).trim(),
        logoMediaId: t.logoMediaId || null,
        logoUrl: t.logoUrl || null,
        description: String(t.description || ''),
        category: String(t.category || 'Video Editing'),
        proficiency:
          typeof t.proficiency === 'number'
            ? Math.max(0, Math.min(100, t.proficiency))
            : 90,
        enabled: t.enabled !== undefined ? Boolean(t.enabled) : true,
        order: typeof t.order === 'number' ? t.order : idx + 1,
        bgColor: t.bgColor || '#10152B',
        textColor: t.textColor || '#FFFFFF',
      }))
      .sort((a: SoftwareToolItem, b: SoftwareToolItem) => a.order - b.order);
  }

  // Migrate legacy editingTools + otherTools arrays if softwareTools is not yet saved
  const legacyEditing: any[] = Array.isArray(parsed.editingTools) ? parsed.editingTools : [];
  const legacyOther: any[] = Array.isArray(parsed.otherTools) ? parsed.otherTools : [];
  if (legacyEditing.length > 0 || legacyOther.length > 0) {
    const combined: SoftwareToolItem[] = [];
    legacyEditing.forEach((t, i) => {
      const defMatch = DEFAULT_SOFTWARE_TOOLS.find((d) => d.id === t.id);
      combined.push({
        id: t.id || `tool-ed-${i}`,
        name: t.name || 'Software',
        shortCode: t.shortCode || (t.name || 'Sw').slice(0, 2),
        logoMediaId: t.logoMediaId || null,
        logoUrl: t.logoUrl || null,
        description: t.description || defMatch?.description || 'Creative editing software',
        category:
          t.category && t.category !== 'editing'
            ? t.category
            : defMatch?.category || 'Video Editing',
        proficiency:
          typeof t.proficiency === 'number'
            ? t.proficiency
            : defMatch?.proficiency || 90,
        enabled: t.enabled !== undefined ? Boolean(t.enabled) : true,
        order: combined.length + 1,
        bgColor: t.bgColor || '#00005B',
        textColor: t.textColor || '#9999FF',
      });
    });
    legacyOther.forEach((t, i) => {
      const defMatch = DEFAULT_SOFTWARE_TOOLS.find((d) => d.id === t.id);
      combined.push({
        id: t.id || `tool-ot-${i}`,
        name: t.name || 'Tool',
        shortCode: t.shortCode || (t.name || 'Tl').slice(0, 2),
        logoMediaId: t.logoMediaId || null,
        logoUrl: t.logoUrl || null,
        description: t.description || defMatch?.description || 'Creative workflow tool',
        category: 'Other Tools',
        proficiency:
          typeof t.proficiency === 'number'
            ? t.proficiency
            : defMatch?.proficiency || 90,
        enabled: t.enabled !== undefined ? Boolean(t.enabled) : true,
        order: combined.length + 1,
        bgColor: t.bgColor || '#111827',
        textColor: t.textColor || '#FFFFFF',
      });
    });
    return combined;
  }

  return DEFAULT_SOFTWARE_TOOLS;
};

const normalizeSkills = (rawSkills: any): SkillItem[] => {
  if (!Array.isArray(rawSkills)) return DEFAULT_SKILLS;
  return rawSkills
    .filter((sk) => sk && typeof sk === 'object' && sk.name)
    .map((sk, idx) => {
      const prof =
        typeof sk.proficiency === 'number'
          ? sk.proficiency
          : typeof sk.percentage === 'number'
          ? sk.percentage
          : 85;
      const clamped = Math.max(0, Math.min(100, prof));
      const defMatch = DEFAULT_SKILLS.find((d) => d.id === sk.id);
      return {
        id: String(sk.id || `sk-${idx + 1}`),
        name: String(sk.name).trim(),
        description:
          sk.description !== undefined
            ? String(sk.description)
            : defMatch?.description || '',
        proficiency: clamped,
        percentage: clamped,
        enabled: sk.enabled !== undefined ? Boolean(sk.enabled) : true,
        order: typeof sk.order === 'number' ? sk.order : idx + 1,
      };
    })
    .sort((a, b) => a.order - b.order);
};

const normalizeSocialLinks = (parsed: any): SocialLinkItem[] => {
  if (Array.isArray(parsed.socialLinks)) {
    return parsed.socialLinks
      .filter((s: any) => s && typeof s === 'object' && s.platform)
      .map((s: any, idx: number) => ({
        id: String(s.id || `soc-${idx + 1}`),
        platform: String(s.platform).trim(),
        url: String(s.url || 'https://').trim(),
        iconMediaId: s.iconMediaId || null,
        iconUrl: s.iconUrl || null,
        iconType: s.iconType || 'globe',
        enabled: s.enabled !== undefined ? Boolean(s.enabled) : true,
        order: typeof s.order === 'number' ? s.order : idx + 1,
      }))
      .sort((a: SocialLinkItem, b: SocialLinkItem) => a.order - b.order);
  }

  // Migrate legacy socials object into socialLinks array
  if (parsed.socials && typeof parsed.socials === 'object') {
    const migrated: SocialLinkItem[] = [];
    const entries: Array<{ key: string; label: string; iconType: string }> = [
      { key: 'youtube', label: 'YouTube', iconType: 'youtube' },
      { key: 'instagram', label: 'Instagram', iconType: 'instagram' },
      { key: 'facebook', label: 'Facebook', iconType: 'facebook' },
      { key: 'linkedin', label: 'LinkedIn', iconType: 'linkedin' },
      { key: 'twitter', label: 'X (Twitter)', iconType: 'twitter' },
    ];
    entries.forEach((item, idx) => {
      const urlVal = parsed.socials[item.key];
      if (urlVal && typeof urlVal === 'string') {
        migrated.push({
          id: `soc-${item.key}`,
          platform: item.label,
          url: urlVal,
          iconMediaId: null,
          iconUrl: null,
          iconType: item.iconType,
          enabled: true,
          order: idx + 1,
        });
      }
    });
    if (migrated.length > 0) return migrated;
  }

  return DEFAULT_SOCIAL_LINKS;
};

const normalizeAudioConfig = (rawAudio: any): AudioConfig => {
  if (!rawAudio || typeof rawAudio !== 'object') return DEFAULT_AUDIO_CONFIG;
  const mergedSlots = { ...DEFAULT_AUDIO_CONFIG.sfxSlots };
  if (rawAudio.sfxSlots && typeof rawAudio.sfxSlots === 'object') {
    (Object.keys(DEFAULT_AUDIO_CONFIG.sfxSlots) as SfxActionType[]).forEach((key) => {
      if (rawAudio.sfxSlots[key]) {
        mergedSlots[key] = {
          ...DEFAULT_AUDIO_CONFIG.sfxSlots[key],
          ...rawAudio.sfxSlots[key],
        };
      }
    });
  }
  return {
    ...DEFAULT_AUDIO_CONFIG,
    ...rawAudio,
    sfxSlots: mergedSlots,
  };
};

const normalizeSectionOrder = (rawOrder: any[]): SectionConfig[] => {
  const baseOrder: SectionConfig[] = Array.isArray(rawOrder)
    ? [...rawOrder]
    : [...initialPortfolioData.sectionOrder];

  const hasBeforeAfter = baseOrder.some((s) => s.id === 'beforeAfter');
  if (!hasBeforeAfter) {
    const projIdx = baseOrder.findIndex((s) => s.id === 'projects');
    const baSection: SectionConfig = {
      id: 'beforeAfter',
      label: 'Before / After Grading',
      visible: true,
    };
    if (projIdx >= 0) {
      baseOrder.splice(projIdx + 1, 0, baSection);
    } else {
      baseOrder.push(baSection);
    }
  }
  return baseOrder;
};

const normalizePortfolioConfig = (parsed: any): PortfolioConfig => {
  if (!parsed || typeof parsed !== 'object') return initialPortfolioData;

  const mergedMedia = normalizeMediaList(parsed.mediaLibrary);
  const migratedProjects = Array.isArray(parsed.projects)
    ? parsed.projects.map((proj: any, idx: number) => {
        if (proj.videoMediaId) {
          return proj;
        }
        const matchedMedia =
          mergedMedia.find(
            (m) => m.mediaUrl === proj.videoUrl || m.storageUrl === proj.videoUrl
          ) || initialPortfolioData.mediaLibrary[idx % initialPortfolioData.mediaLibrary.length];
        const { videoUrl, ...rest } = proj;
        return {
          ...rest,
          videoMediaId: matchedMedia?.id,
        };
      })
    : initialPortfolioData.projects;

  const rawPortrait = parsed.profile?.portraitUrl || initialPortfolioData.profile.portraitUrl;
  const fixedPortraitUrl =
    typeof rawPortrait === 'string' && rawPortrait.endsWith('.jpg.png')
      ? rawPortrait.replace(/\.jpg\.png$/, '.jpg')
      : rawPortrait.startsWith('src/')
      ? `/${rawPortrait}`
      : rawPortrait;

  const normalizedSoftware = normalizeSoftwareTools(parsed);
  const normalizedSkills = normalizeSkills(parsed.skills);
  const normalizedSocials = normalizeSocialLinks(parsed);
  const normalizedAudio = normalizeAudioConfig(parsed.audio);

  return {
    ...initialPortfolioData,
    ...parsed,
    profile: {
      ...initialPortfolioData.profile,
      ...(parsed.profile || {}),
      portraitUrl: fixedPortraitUrl,
    },
    contact: {
      ...initialPortfolioData.contact,
      ...(parsed.contact || {}),
      whatsappNumber:
        parsed.contact?.whatsappNumber ||
        parsed.contact?.phone ||
        initialPortfolioData.contact.whatsappNumber,
    },
    resume: parsed.resume !== undefined ? parsed.resume : initialPortfolioData.resume,
    beforeAfterItems:
      Array.isArray(parsed.beforeAfterItems) && parsed.beforeAfterItems.length > 0
        ? parsed.beforeAfterItems
        : initialPortfolioData.beforeAfterItems,
    audio: normalizedAudio,
    softwareTools: normalizedSoftware,
    editingTools: normalizedSoftware.filter(
      (t) => t.category !== 'Other Tools' && t.category !== 'other'
    ),
    otherTools: normalizedSoftware.filter(
      (t) => t.category === 'Other Tools' || t.category === 'other'
    ),
    skills: normalizedSkills,
    socialLinks: normalizedSocials,
    sectionOrder: normalizeSectionOrder(parsed.sectionOrder),
    mediaLibrary: mergedMedia,
    projects: migratedProjects,
  };
};

const parseAdminRouteFromPath = (
  pathname: string
): { isAdminRoute: boolean; tab: AdminRouteTab } => {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/admin' || clean.startsWith('/admin/')) {
    const sub = clean.slice('/admin'.length).replace(/^\/+/, '').toLowerCase();
    const routeMap: Record<string, AdminRouteTab> = {
      '': 'dashboard',
      dashboard: 'dashboard',
      profile: 'profile',
      resume: 'resume',
      media: 'media',
      projects: 'projects',
      software: 'software',
      tools: 'software',
      skills: 'skills',
      'before-after': 'beforeAfter',
      beforeafter: 'beforeAfter',
      audio: 'audio',
      socials: 'socials',
      'social-links': 'socials',
      contact: 'contact',
      services: 'services',
      testimonials: 'testimonials',
      fonts: 'fonts',
      settings: 'sections',
      sections: 'sections',
    };
    return {
      isAdminRoute: true,
      tab: routeMap[sub] || 'dashboard',
    };
  }
  return { isAdminRoute: false, tab: 'dashboard' };
};

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<PortfolioConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return normalizePortfolioConfig(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load portfolio state from localStorage:', e);
    }
    return initialPortfolioData;
  });

  const initialRoute = parseAdminRouteFromPath(window.location.pathname);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(initialRoute.isAdminRoute);
  const [activeAdminTab, setActiveAdminTab] = useState<AdminRouteTab>(initialRoute.tab);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(ADMIN_AUTH_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [visitorAudioMuted, setVisitorAudioMuted] = useState<boolean>(() =>
    soundEngine.getVisitorMuted()
  );

  const [activeVideoModal, setActiveVideoModalState] =
    useState<PortfolioContextType['activeVideoModal']>(null);

  const hydratedFromServer = useRef(false);

  // Keep soundEngine updated with latest audio config
  useEffect(() => {
    soundEngine.updateConfig(data.audio || DEFAULT_AUDIO_CONFIG);
  }, [data.audio]);

  // Automatic BGM ducking when project video modal opens or closes
  const setActiveVideoModal = (modal: PortfolioContextType['activeVideoModal']) => {
    if (modal && modal.isOpen) {
      soundEngine.setVideoPlayingDuck(true);
      soundEngine.playSfx('projectOpen');
    } else if (activeVideoModal?.isOpen && (!modal || !modal.isOpen)) {
      soundEngine.setVideoPlayingDuck(false);
      soundEngine.playSfx('modalClose');
    }
    setActiveVideoModalState(modal);
  };

  const toggleVisitorAudioMute = () => {
    soundEngine.unlockAudio();
    const nextMuted = !visitorAudioMuted;
    soundEngine.setVisitorMuted(nextMuted);
    setVisitorAudioMuted(nextMuted);
    if (!nextMuted) {
      soundEngine.playSfx('toggle', true);
    }
  };

  const triggerSfx = (action: SfxActionType, forcePreview: boolean = false) => {
    soundEngine.unlockAudio();
    soundEngine.playSfx(action, forcePreview);
  };

  // Global delegated listener to unlock Web Audio & BGM on first interaction and play subtle button/link SFX
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      soundEngine.unlockAudio();
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const interactive = target.closest('button, a, [role="button"]');
      if (interactive) {
        const sfxAttr = interactive.getAttribute('data-sfx') as SfxActionType | null;
        if (sfxAttr) {
          soundEngine.playSfx(sfxAttr);
        } else if (interactive.tagName.toLowerCase() === 'a' && interactive.getAttribute('href')?.startsWith('#')) {
          soundEngine.playSfx('navigation');
        } else {
          soundEngine.playSfx('buttonClick');
        }
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const interactive = target.closest('button, a, [role="button"]');
      if (interactive) {
        soundEngine.playSfx('buttonHover');
      }
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('mouseover', handleMouseOver, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  // Hydrate persistent state from backend server on load
  useEffect(() => {
    let mounted = true;
    fetch('/api/portfolio')
      .then((r) => (r.ok ? r.json() : null))
      .then((payload) => {
        if (!mounted || !payload) return;
        const remoteConfig = payload.profile ? payload : payload.state;
        if (remoteConfig && remoteConfig.profile) {
          hydratedFromServer.current = true;
          const normalized = normalizePortfolioConfig(remoteConfig);
          setData(normalized);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
          } catch {
            // ignore quota warning
          }
        } else {
          hydratedFromServer.current = true;
          fetch('/api/portfolio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          }).catch(() => {});
        }
      })
      .catch(() => {
        hydratedFromServer.current = true;
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Automatically generate missing thumbnails for any Media Library video item
  const generatingThumbsRef = useRef<Set<string>>(new Set());
  const ensureVideoThumbnail = async (mediaId: string): Promise<string> => {
    const target = data.mediaLibrary.find((m) => m.id === mediaId);
    if (!target) return '';
    const existingThumb = target.thumbnailUrl || target.thumbnail;
    if (existingThumb) return existingThumb;
    if (generatingThumbsRef.current.has(mediaId)) return '';

    const playableUrl = target.mediaUrl || target.storageUrl;
    if (!playableUrl) return '';

    generatingThumbsRef.current.add(mediaId);
    try {
      const info = await generateVideoThumbnailAndMeta(playableUrl, mediaId);
      if (info.thumbnailUrl) {
        updateData((prev) => ({
          ...prev,
          mediaLibrary: prev.mediaLibrary.map((m) =>
            m.id === mediaId
              ? {
                  ...m,
                  thumbnailUrl: info.thumbnailUrl,
                  thumbnail: info.thumbnailUrl,
                  duration: info.duration || m.duration,
                  durationFormatted:
                    info.duration > 0 ? info.durationFormatted : m.durationFormatted,
                  uploadStatus: 'ready',
                }
              : m
          ),
        }));
        return info.thumbnailUrl;
      }
    } finally {
      generatingThumbsRef.current.delete(mediaId);
    }
    return '';
  };

  useEffect(() => {
    data.mediaLibrary.forEach((media) => {
      if (
        (media.type === 'video' || media.mimeType?.startsWith('video/')) &&
        !media.thumbnailUrl &&
        !media.thumbnail
      ) {
        ensureVideoThumbnail(media.id);
      }
    });
  }, [data.mediaLibrary]);

  // Listen to browser popstate (back/forward navigation for /admin routes)
  useEffect(() => {
    const handlePopState = () => {
      const route = parseAdminRouteFromPath(window.location.pathname);
      setIsAdminOpen(route.isAdminRoute);
      if (route.isAdminRoute) {
        setActiveAdminTab(route.tab);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openAdminPanel = () => {
    try {
      if (!window.location.pathname.startsWith('/admin')) {
        window.history.pushState({}, '', '/admin');
      }
    } catch {
      // ignore history errors inside restricted iframe environments
    }
    soundEngine.playSfx('modalOpen');
    setActiveAdminTab('dashboard');
    setIsAdminOpen(true);
  };

  // Global keyboard shortcut: CTRL + SHIFT + ALT + M -> navigate to /admin
  useEffect(() => {
    const pressedCodes = new Set<string>();

    const checkAndTriggerAdmin = (e: KeyboardEvent) => {
      pressedCodes.add(e.code);

      const isMKey =
        e.code === 'KeyM' ||
        e.key === 'm' ||
        e.key === 'M' ||
        e.key === 'µ' ||
        e.keyCode === 77 ||
        e.which === 77 ||
        pressedCodes.has('KeyM');

      const hasCtrlOrMeta =
        e.ctrlKey ||
        e.metaKey ||
        pressedCodes.has('ControlLeft') ||
        pressedCodes.has('ControlRight') ||
        pressedCodes.has('MetaLeft') ||
        pressedCodes.has('MetaRight');

      const hasShift =
        e.shiftKey ||
        pressedCodes.has('ShiftLeft') ||
        pressedCodes.has('ShiftRight');

      const hasAlt =
        e.altKey ||
        pressedCodes.has('AltLeft') ||
        pressedCodes.has('AltRight') ||
        (typeof e.getModifierState === 'function' && e.getModifierState('AltGraph'));

      if (hasCtrlOrMeta && hasShift && hasAlt && isMKey) {
        e.preventDefault();
        e.stopPropagation();
        pressedCodes.clear();
        openAdminPanel();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      pressedCodes.delete(e.code);
    };

    const handleWindowBlur = () => {
      pressedCodes.clear();
    };

    window.addEventListener('keydown', checkAndTriggerAdmin, { capture: true });
    document.addEventListener('keydown', checkAndTriggerAdmin, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('keydown', checkAndTriggerAdmin, { capture: true });
      document.removeEventListener('keydown', checkAndTriggerAdmin, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  // Apply dynamic fonts & theme colors to document root
  useEffect(() => {
    const root = document.documentElement;
    const { theme } = data;

    root.style.setProperty(
      '--font-primary',
      `'${theme.selectedFont}', -apple-system, BlinkMacSystemFont, sans-serif`
    );
    root.style.setProperty(
      '--font-heading',
      `'${theme.headingFont || theme.selectedFont}', -apple-system, BlinkMacSystemFont, sans-serif`
    );
    root.style.setProperty('--color-primary-text', theme.primaryText);
    root.style.setProperty('--color-secondary-text', theme.secondaryText);
    root.style.setProperty('--color-primary-accent', theme.primaryAccent);
    root.style.setProperty('--color-secondary-accent', theme.secondaryAccent);
    root.style.setProperty('--color-blue-accent', theme.blueAccent);
    root.style.setProperty('--color-bg', theme.background);

    const styleId = 'dynamic-custom-fonts';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    const fontFaces = theme.customFonts
      .map((font: CustomFontItem) => {
        const formatMap: Record<string, string> = {
          woff2: 'woff2',
          woff: 'woff',
          ttf: 'truetype',
          otf: 'opentype',
        };
        const fmt = formatMap[font.format] || 'truetype';
        return `
          @font-face {
            font-family: '${font.name}';
            src: url('${font.dataUrl}') format('${fmt}');
            font-weight: 100 900;
            font-style: normal;
            font-display: swap;
          }
        `;
      })
      .join('\n');

    styleEl.textContent = fontFaces;
  }, [data.theme]);

  const persistStateEverywhere = (nextData: PortfolioConfig) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
    } catch (e) {
      console.warn('Could not persist full state to localStorage:', e);
    }
    fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nextData),
    }).catch((err) => {
      console.warn('Could not sync portfolio state to server:', err);
    });
  };

  const updateData = (updater: (prev: PortfolioConfig) => PortfolioConfig) => {
    setData((prev) => {
      const rawNext = updater(prev);
      // Keep legacy editingTools / otherTools synchronized with softwareTools
      const next: PortfolioConfig = {
        ...rawNext,
        editingTools: (rawNext.softwareTools || []).filter(
          (t) => t.category !== 'Other Tools' && t.category !== 'other'
        ),
        otherTools: (rawNext.softwareTools || []).filter(
          (t) => t.category === 'Other Tools' || t.category === 'other'
        ),
      };
      persistStateEverywhere(next);
      return next;
    });
  };

  const resetToDefaults = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData(initialPortfolioData);
    persistStateEverywhere(initialPortfolioData);
  };

  // Fixed case-sensitive Admin password check
  const loginAdmin = (password: string): boolean => {
    const expected = [80, 82, 79, 69, 68, 73, 84, 79, 82]
      .map((c) => String.fromCharCode(c))
      .join('');
    if (password === expected) {
      setIsAdminAuthenticated(true);
      try {
        sessionStorage.setItem(ADMIN_AUTH_SESSION_KEY, 'true');
      } catch {
        // ignore storage error
      }
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    try {
      sessionStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
    } catch {
      // ignore storage error
    }
    window.history.pushState({}, '', '/admin');
  };

  const navigateAdminTab = (tab: AdminRouteTab) => {
    soundEngine.playSfx('navigation');
    setActiveAdminTab(tab);
    const slugMap: Record<AdminRouteTab, string> = {
      dashboard: '/admin',
      profile: '/admin/profile',
      resume: '/admin/resume',
      media: '/admin/media',
      projects: '/admin/projects',
      software: '/admin/software',
      skills: '/admin/skills',
      beforeAfter: '/admin/before-after',
      audio: '/admin/audio',
      socials: '/admin/socials',
      contact: '/admin/contact',
      services: '/admin/services',
      testimonials: '/admin/testimonials',
      fonts: '/admin/fonts',
      sections: '/admin/settings',
    };
    const targetPath = slugMap[tab] || '/admin';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  const closeAdminToPublic = () => {
    soundEngine.playSfx('modalClose');
    setIsAdminOpen(false);
    if (window.location.pathname.startsWith('/admin')) {
      window.history.pushState({}, '', '/');
    }
  };

  return (
    <PortfolioContext.Provider
      value={{
        data,
        updateData,
        resetToDefaults,
        isAdminOpen,
        setIsAdminOpen,
        isAdminAuthenticated,
        loginAdmin,
        logoutAdmin,
        activeAdminTab,
        navigateAdminTab,
        openAdminPanel,
        closeAdminToPublic,
        ensureVideoThumbnail,
        visitorAudioMuted,
        toggleVisitorAudioMute,
        triggerSfx,
        activeVideoModal,
        setActiveVideoModal,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used within a PortfolioProvider');
  return ctx;
};
