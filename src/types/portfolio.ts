export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  iconName: 'video' | 'type' | 'palette' | 'camera' | 'smartphone' | 'sparkles';
}

export interface SoftwareToolItem {
  id: string;
  name: string;
  shortCode: string;
  logoMediaId?: string | null;
  logoUrl?: string | null;
  description?: string;
  category: string;
  proficiency: number; // 0 - 100
  enabled: boolean;
  order: number;
  bgColor: string;
  textColor: string;
  borderColor?: string;
}

export interface SkillItem {
  id: string;
  name: string;
  description?: string;
  proficiency: number; // 0 - 100
  percentage: number; // kept in sync with proficiency for backward compatibility
  enabled: boolean;
  order: number;
}

export interface SocialLinkItem {
  id: string;
  platform: string;
  url: string;
  iconMediaId: string | null;
  iconUrl?: string | null;
  iconType: string | null;
  enabled: boolean;
  order: number;
}

export type SfxActionType =
  | 'buttonClick'
  | 'buttonHover'
  | 'navigation'
  | 'projectOpen'
  | 'modalOpen'
  | 'modalClose'
  | 'toggle'
  | 'contact';

export interface SfxSlotConfig {
  action: SfxActionType;
  label: string;
  enabled: boolean;
  volume: number; // 0.0 to 1.0
  audioUrl: string | null;
  mediaId?: string | null;
  filename?: string | null;
  size?: number;
}

export interface AudioConfig {
  masterEnabled: boolean;
  bgmEnabled: boolean;
  bgmVolume: number; // 0.0 to 1.0
  bgmLoop: boolean;
  bgmDuckingEnabled: boolean;
  bgmDuckingVolume: number;
  bgmUrl: string | null;
  bgmMediaId?: string | null;
  bgmFilename: string | null;
  bgmSize?: number;
  sfxMasterEnabled: boolean;
  sfxMasterVolume: number; // 0.0 to 1.0
  sfxSlots: Record<SfxActionType, SfxSlotConfig>;
}

export type MediaUploadStatus = 'uploading' | 'processing' | 'ready' | 'failed';
export type MediaCategoryType = 'image' | 'video' | 'audio' | 'document' | 'other';
export type MediaVisibility = 'private' | 'public';

export type MediaUsageTargetType =
  | 'profilePhoto'
  | 'brandLogo'
  | 'projectVideo'
  | 'projectThumbnail'
  | 'beforeAfterBefore'
  | 'beforeAfterAfter'
  | 'resume'
  | 'softwareLogo'
  | 'socialIcon'
  | 'bgmAudio'
  | 'sfxAudio'
  | 'showreel';

export interface MediaUsageReference {
  type: MediaUsageTargetType;
  id: string;
  label: string;
}

export interface MediaMetadata {
  id: string;
  filename: string;
  fileName?: string;
  originalFileName?: string;
  type: MediaCategoryType | string;
  mediaType?: MediaCategoryType;
  mimeType: string;
  size: number; // in bytes
  fileSize?: number;
  duration: number | null; // in seconds
  durationFormatted: string;
  width?: number | null;
  height?: number | null;
  resolution?: string;
  storagePath?: string;
  mediaUrl: string;
  storageUrl: string;
  publicUrl?: string;
  thumbnailUrl: string | null;
  thumbnail: string;
  createdAt: number;
  uploadedAt?: number;
  updatedAt?: number;
  uploadDate: string;
  uploadedBy?: string;
  visibility: MediaVisibility;
  status?: MediaUploadStatus;
  uploadStatus?: MediaUploadStatus;
  isPublished?: boolean;
  usedBy?: MediaUsageReference[];
  usageCount?: number;
}

export interface ProjectItem {
  id: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  duration: string;
  thumbnail?: string;
  videoMediaId?: string;
  thumbnailMediaId?: string;
  client?: string;
  year?: string;
}

export interface ProcessStepItem {
  id: string;
  stepNumber: string;
  title: string;
  description: string;
}

export interface TestimonialItem {
  id: string;
  quote: string;
  clientName: string;
  roleCompany: string;
  avatarUrl: string;
}

export interface CustomFontItem {
  id: string;
  name: string;
  format: 'woff' | 'woff2' | 'ttf' | 'otf';
  dataUrl: string;
}

export interface ResumeMetadata {
  id: string;
  mediaId?: string;
  type: 'resume';
  filename: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  createdAt: number;
  updatedAt: number;
}

export interface BeforeAfterItem {
  id: string;
  title: string;
  subtitle?: string;
  beforeLabel?: string;
  afterLabel?: string;
  beforeImageUrl: string;
  beforeMediaId?: string | null;
  afterImageUrl: string;
  afterMediaId?: string | null;
  order: number;
  visible: boolean;
}

export type SectionId =
  | 'hero'
  | 'about'
  | 'services'
  | 'tools'
  | 'projects'
  | 'beforeAfter'
  | 'process'
  | 'testimonials'
  | 'contact';

export interface SectionConfig {
  id: SectionId;
  label: string;
  visible: boolean;
}

export interface ThemeConfig {
  primaryText: string;
  secondaryText: string;
  primaryAccent: string;
  secondaryAccent: string;
  blueAccent: string;
  background: string;
  selectedFont: string;
  headingFont: string;
  customFonts: CustomFontItem[];
}

export interface PortfolioConfig {
  profile: {
    name: string;
    profession: string;
    location: string;
    logoLetter: string;
    logoUrl?: string;
    logoMediaId?: string | null;
    heroGreeting: string;
    heroDescription: string;
    portraitUrl: string;
    portraitMediaId?: string | null;
    experienceYears: string;
    projectsCompleted: string;
    happyClients: string;
    signatureText: string;
    showreelVideoUrl: string;
    showreelMediaId?: string | null;
    cvUrl?: string;
  };
  resume?: ResumeMetadata | null;
  beforeAfterItems: BeforeAfterItem[];
  audio: AudioConfig;
  about: {
    label: string;
    heading: string;
    paragraph: string;
    quote: string;
    quoteAuthor: string;
  };
  services: ServiceItem[];
  softwareTools: SoftwareToolItem[];
  editingTools: SoftwareToolItem[];
  otherTools: SoftwareToolItem[];
  skills: SkillItem[];
  socialLinks: SocialLinkItem[];
  projects: ProjectItem[];
  processSteps: ProcessStepItem[];
  testimonials: TestimonialItem[];
  contact: {
    email: string;
    phone: string;
    whatsappNumber: string;
    location: string;
    heading: string;
    subheading: string;
  };
  socials: {
    instagram: string;
    youtube: string;
    facebook: string;
    linkedin: string;
    twitter: string;
  };
  theme: ThemeConfig;
  sectionOrder: SectionConfig[];
  mediaLibrary: MediaMetadata[];
}
