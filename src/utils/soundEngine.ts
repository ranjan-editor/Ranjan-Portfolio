import { AudioConfig, SfxActionType } from '../types/portfolio';

const VISITOR_AUDIO_PREF_KEY = 'ranjan_portfolio_visitor_audio_pref_v1';

export interface VisitorAudioPreference {
  muted: boolean;
}

class PortfolioAudioEngine {
  private ctx: AudioContext | null = null;
  private bgmElement: HTMLAudioElement | null = null;
  private currentBgmUrl: string | null = null;
  private isVideoPlayingDuck: boolean = false;
  private isUnlocked: boolean = false;
  private config: AudioConfig | null = null;
  private visitorMuted: boolean = false;
  private lastHoverTime: number = 0;

  constructor() {
    try {
      const saved = localStorage.getItem(VISITOR_AUDIO_PREF_KEY);
      if (saved) {
        const parsed: VisitorAudioPreference = JSON.parse(saved);
        this.visitorMuted = Boolean(parsed.muted);
      }
    } catch {
      this.visitorMuted = false;
    }
  }

  public getVisitorMuted(): boolean {
    return this.visitorMuted;
  }

  public setVisitorMuted(muted: boolean) {
    this.visitorMuted = muted;
    try {
      localStorage.setItem(VISITOR_AUDIO_PREF_KEY, JSON.stringify({ muted }));
    } catch {
      // ignore storage errors
    }
    this.syncBgmPlayback();
  }

  public updateConfig(config: AudioConfig) {
    this.config = config;
    this.syncBgmPlayback();
  }

  public setVideoPlayingDuck(isPlaying: boolean) {
    if (this.isVideoPlayingDuck === isPlaying) return;
    this.isVideoPlayingDuck = isPlaying;
    this.applyBgmVolume();
  }

  public setVideoPlayingDucking(isPlaying: boolean) {
    this.setVideoPlayingDuck(isPlaying);
  }

  public unlockAudio() {
    if (!this.isUnlocked) {
      this.isUnlocked = true;
    }
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.syncBgmPlayback();
  }

  private applyBgmVolume() {
    if (!this.bgmElement || !this.config) return;
    if (!this.config.masterEnabled || !this.config.bgmEnabled || this.visitorMuted) {
      this.bgmElement.volume = 0;
      return;
    }
    const baseVol = Math.max(0, Math.min(1, this.config.bgmVolume ?? 0.25));
    if (this.isVideoPlayingDuck && this.config.bgmDuckingEnabled) {
      const duckVol = Math.max(0, Math.min(baseVol, this.config.bgmDuckingVolume ?? 0.05));
      this.bgmElement.volume = duckVol;
    } else {
      this.bgmElement.volume = baseVol;
    }
  }

  public syncBgmPlayback() {
    if (typeof window === 'undefined' || !this.config) return;

    const shouldPlay =
      this.config.masterEnabled &&
      this.config.bgmEnabled &&
      Boolean(this.config.bgmUrl) &&
      !this.visitorMuted;

    if (!shouldPlay || !this.config.bgmUrl) {
      if (this.bgmElement) {
        this.bgmElement.pause();
      }
      return;
    }

    if (!this.bgmElement || this.currentBgmUrl !== this.config.bgmUrl) {
      if (this.bgmElement) {
        this.bgmElement.pause();
      }
      this.bgmElement = new Audio(this.config.bgmUrl);
      this.currentBgmUrl = this.config.bgmUrl;
    }

    this.bgmElement.loop = this.config.bgmLoop ?? true;
    this.applyBgmVolume();

    if (this.isUnlocked && this.bgmElement.paused) {
      this.bgmElement.play().catch(() => {
        // Browser autoplay policy waiting for first user gesture
      });
    }
  }

  public playSfx(action: SfxActionType, forcePreview: boolean = false) {
    if (typeof window === 'undefined' || !this.config) return;

    if (!forcePreview) {
      if (!this.config.masterEnabled || !this.config.sfxMasterEnabled || this.visitorMuted) {
        return;
      }
    }

    const slot = this.config.sfxSlots?.[action];
    if (!slot) return;
    if (!forcePreview && !slot.enabled) return;

    // Throttle rapid hover events
    if (action === 'buttonHover' && !forcePreview) {
      const now = performance.now();
      if (now - this.lastHoverTime < 90) return;
      this.lastHoverTime = now;
    }

    const masterVol = forcePreview ? 1 : Math.max(0, Math.min(1, this.config.sfxMasterVolume ?? 0.6));
    const slotVol = Math.max(0, Math.min(1, slot.volume ?? 0.6));
    const finalVolume = Math.max(0.02, Math.min(1, masterVol * slotVol));

    // If Admin uploaded a custom audio file for this SFX slot, play it
    if (slot.audioUrl) {
      try {
        const audio = new Audio(slot.audioUrl);
        audio.volume = finalVolume;
        audio.play().catch(() => {});
        return;
      } catch {
        // fallback to synthesized Web Audio tone
      }
    }

    // Otherwise synthesize a clean, subtle studio UI sound using Web Audio API
    this.playSynthesizedSfx(action, finalVolume);
  }

  private playSynthesizedSfx(action: SfxActionType, volume: number) {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      const peak = Math.min(0.35, volume * 0.35);

      switch (action) {
        case 'buttonHover': {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(640, now);
          osc.frequency.exponentialRampToValueAtTime(820, now + 0.035);
          gain.gain.setValueAtTime(peak * 0.35, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
          osc.start(now);
          osc.stop(now + 0.04);
          break;
        }
        case 'buttonClick': {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(520, now);
          osc.frequency.exponentialRampToValueAtTime(980, now + 0.055);
          gain.gain.setValueAtTime(peak, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
          osc.start(now);
          osc.stop(now + 0.065);
          break;
        }
        case 'navigation': {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(660, now + 0.08);
          gain.gain.setValueAtTime(peak * 0.85, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
          osc.start(now);
          osc.stop(now + 0.09);
          break;
        }
        case 'projectOpen':
        case 'modalOpen': {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(380, now);
          osc.frequency.exponentialRampToValueAtTime(760, now + 0.14);
          gain.gain.setValueAtTime(peak, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.16);
          break;
        }
        case 'modalClose': {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(680, now);
          osc.frequency.exponentialRampToValueAtTime(340, now + 0.11);
          gain.gain.setValueAtTime(peak * 0.8, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.start(now);
          osc.stop(now + 0.13);
          break;
        }
        case 'toggle': {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.exponentialRampToValueAtTime(900, now + 0.05);
          gain.gain.setValueAtTime(peak * 0.75, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
          osc.start(now);
          osc.stop(now + 0.06);
          break;
        }
        case 'contact': {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, now); // C5
          osc.frequency.setValueAtTime(659.25, now + 0.07); // E5
          osc.frequency.setValueAtTime(783.99, now + 0.14); // G5
          gain.gain.setValueAtTime(peak, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
          osc.start(now);
          osc.stop(now + 0.27);
          break;
        }
      }
    } catch {
      // ignore Web Audio errors
    }
  }
}

export const soundEngine = new PortfolioAudioEngine();
