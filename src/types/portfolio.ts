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
  category: string; // e.g. 'Video Editing' | 'Motion Graphics' | 'Color Grading' | 'Audio' | 'Design' | 'Other Tools' | 'editing' | 'other'
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
  iconType: string | null; // e.g. 'youtube' | 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'behance' | 'dribbble' | 'github' | 'vimeo' | 'tiktok' | 'whatsapp' | 'globe'
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
  audioUrl: string | null; // custom uploaded SFX URL or null (uses Web Audio synthesized studio sound)
  filename?: string | null;
  size?: number;
}

export interface AudioConfig {
  masterEnabled: boolean;
  bgmEnabled: boolean;
  bgmVolume: number; // 0.0 to 1.0
  bgmLoop: boolean;
  bgmDuckingEnabled: boolean; // Automatically duck BGM when project video plays
  bgmDuckingVolume: number; // e.g. 0.08
  bgmUrl: string | null;
  bgmFilename: string | null;
  bgmSize?: number;
  sfxMasterEnabled: boolean;
  sfxMasterVolume: number; // 0.0 to 1.0
  sfxSlots: Record<SfxActionType, SfxSlotConfig>;
}

export type MediaUploadStatus = 'uploading' | 'processing' | 'ready' | 'failed';

export interface MediaMetadata {
  id: string;
  filename: string;
  type: 'video' | string;
  mimeType: string;
  size: number; // in bytes
  duration: number | null; // in seconds
  durationFormatted: string;
  mediaUrl: string;
  storageUrl: string;
  thumbnailUrl: string | null;
  thumbnail: string;
  createdAt: number;
  uploadDate: string;
  visibility: 'public' | 'private';
  uploadStatus?: MediaUploadStatus;
  resolution?: string;
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
  afterImageUrl: string;
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
    heroGreeting: string;
    heroDescription: string;
    portraitUrl: string;
    experienceYears: string;
    projectsCompleted: string;
    happyClients: string;
    signatureText: string;
    showreelVideoUrl: string;
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
