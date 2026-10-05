import React, { useState } from 'react';
import {
  Volume2,
  Music,
  Upload,
  Trash2,
  Play,
  Square,
  Sliders,
  Check,
  Sparkles,
} from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { SfxActionType } from '../../types/portfolio';
import { DEFAULT_AUDIO_CONFIG } from '../../data/portfolioData';

const SFX_ACTION_ORDER: SfxActionType[] = [
  'buttonClick',
  'buttonHover',
  'navigation',
  'projectOpen',
  'modalOpen',
  'modalClose',
  'toggle',
  'contact',
];

const formatBytes = (bytes?: number) => {
  if (!bytes || bytes <= 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const AdminAudioTab: React.FC<{ onStatus: (msg: string) => void }> = ({ onStatus }) => {
  const { data, updateData, triggerSfx, visitorAudioMuted, toggleVisitorAudioMute } =
    usePortfolio();
  const audio = data.audio || DEFAULT_AUDIO_CONFIG;

  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [bgmPreviewEl, setBgmPreviewEl] = useState<HTMLAudioElement | null>(null);
  const [isBgmPreviewPlaying, setIsBgmPreviewPlaying] = useState(false);

  const stopBgmPreview = () => {
    if (bgmPreviewEl) {
      bgmPreviewEl.pause();
      setBgmPreviewEl(null);
    }
    setIsBgmPreviewPlaying(false);
  };

  const handleToggleBgmPreview = () => {
    if (!audio.bgmUrl) return;
    if (isBgmPreviewPlaying && bgmPreviewEl) {
      stopBgmPreview();
      return;
    }
    const el = new Audio(audio.bgmUrl);
    el.volume = Math.max(0.05, Math.min(1, audio.bgmVolume ?? 0.25));
    el.onended = () => setIsBgmPreviewPlaying(false);
    el.play().catch(() => {});
    setBgmPreviewEl(el);
    setIsBgmPreviewPlaying(true);
  };

  const handleUploadAudioFile = async (
    slotKey: 'bgm' | SfxActionType,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadingSlot(slotKey);
    try {
      const res = await fetch('/api/audio/upload', {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'audio/mpeg',
          'x-filename': encodeURIComponent(file.name),
          'x-audio-slot': slotKey,
        },
        body: file,
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload.audioUrl) {
        throw new Error(payload?.error || 'Audio upload failed');
      }

      if (slotKey === 'bgm') {
        stopBgmPreview();
        updateData((prev) => ({
          ...prev,
          audio: {
            ...(prev.audio || DEFAULT_AUDIO_CONFIG),
            bgmUrl: payload.audioUrl,
            bgmFilename: file.name,
            bgmSize: file.size,
            bgmEnabled: true,
          },
        }));
        onStatus(`Uploaded Background Music: "${file.name}" (${formatBytes(file.size)})`);
      } else {
        updateData((prev) => {
          const currentAudio = prev.audio || DEFAULT_AUDIO_CONFIG;
          const currentSlot = currentAudio.sfxSlots[slotKey];
          return {
            ...prev,
            audio: {
              ...currentAudio,
              sfxSlots: {
                ...currentAudio.sfxSlots,
                [slotKey]: {
                  ...currentSlot,
                  audioUrl: payload.audioUrl,
                  filename: file.name,
                  size: file.size,
                  enabled: true,
                },
              },
            },
          };
        });
        onStatus(`Uploaded custom ${audio.sfxSlots[slotKey]?.label || slotKey}: "${file.name}"`);
      }
    } catch (err: any) {
      onStatus(err?.message || 'Failed to upload audio file.');
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleRemoveAudioFile = async (slotKey: 'bgm' | SfxActionType) => {
    if (slotKey === 'bgm') {
      stopBgmPreview();
      if (audio.bgmUrl?.startsWith('/api/audio/stream/')) {
        const fname = audio.bgmUrl.split('/').pop();
        if (fname) {
          fetch(`/api/audio/${encodeURIComponent(fname)}`, { method: 'DELETE' }).catch(() => {});
        }
      }
      updateData((prev) => ({
        ...prev,
        audio: {
          ...(prev.audio || DEFAULT_AUDIO_CONFIG),
          bgmUrl: null,
          bgmFilename: null,
          bgmSize: undefined,
        },
      }));
      onStatus('Removed Background Music track.');
    } else {
      const currentSlot = audio.sfxSlots[slotKey];
      if (currentSlot?.audioUrl?.startsWith('/api/audio/stream/')) {
        const fname = currentSlot.audioUrl.split('/').pop();
        if (fname) {
          fetch(`/api/audio/${encodeURIComponent(fname)}`, { method: 'DELETE' }).catch(() => {});
        }
      }
      updateData((prev) => {
        const currentAudio = prev.audio || DEFAULT_AUDIO_CONFIG;
        return {
          ...prev,
          audio: {
            ...currentAudio,
            sfxSlots: {
              ...currentAudio.sfxSlots,
              [slotKey]: {
                ...currentAudio.sfxSlots[slotKey],
                audioUrl: null,
                filename: null,
                size: undefined,
              },
            },
          },
        };
      });
      onStatus(`Removed custom audio for ${currentSlot?.label || slotKey} (reverted to studio synthesizer).`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Master Audio & Preference Card */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#6C63FF] flex items-center justify-center">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#10152B]">
                Master Audio &amp; Sound Design System
              </h3>
              <p className="text-xs text-[#667085]">
                Persistent BGM, automatic video playback ducking &amp; 8 interactive UI SFX channels
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              updateData((prev) => ({
                ...prev,
                audio: {
                  ...(prev.audio || DEFAULT_AUDIO_CONFIG),
                  masterEnabled: !audio.masterEnabled,
                },
              }))
            }
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              audio.masterEnabled
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            {audio.masterEnabled ? 'Master Audio: ON' : 'Master Audio: OFF'}
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-[#F7F8FF] border border-indigo-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[#10152B]">
              Visitor Browser Audio Preference Memory
            </p>
            <p className="text-[11px] text-[#667085]">
              Your current browser session preference is{' '}
              <span className="font-bold text-[#6C63FF]">
                {visitorAudioMuted ? 'Muted' : 'Unmuted (Active)'}
              </span>
              .
            </p>
          </div>
          <button
            type="button"
            onClick={toggleVisitorAudioMute}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#10152B] text-[#10152B] hover:text-white border border-indigo-100 text-xs font-semibold transition-colors cursor-pointer"
          >
            {visitorAudioMuted ? 'Unmute My Browser' : 'Mute My Browser'}
          </button>
        </div>
      </div>

      {/* Background Music (BGM) & Auto-Ducking Card */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Music className="w-4 h-4 text-[#6C63FF]" />
            <h4 className="text-sm font-bold text-[#10152B]">Background Music (BGM)</h4>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                updateData((prev) => ({
                  ...prev,
                  audio: {
                    ...(prev.audio || DEFAULT_AUDIO_CONFIG),
                    bgmEnabled: !audio.bgmEnabled,
                  },
                }))
              }
              className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                audio.bgmEnabled
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {audio.bgmEnabled ? 'BGM Enabled' : 'BGM Disabled'}
            </button>
          </div>
        </div>

        {/* Uploaded BGM Info or Upload Prompt */}
        <div className="p-4 rounded-xl bg-white border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            {audio.bgmUrl ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#10152B] truncate">
                    {audio.bgmFilename || 'Background_Music.mp3'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                    Active Track
                  </span>
                </div>
                <p className="text-[11px] text-[#667085] mt-0.5">
                  {audio.bgmSize ? `${formatBytes(audio.bgmSize)} · ` : ''}Loops automatically while visitors browse
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-bold text-[#10152B]">No Background Music Uploaded</p>
                <p className="text-[11px] text-[#667085]">
                  Upload an ambient MP3, WAV, or OGG track to play softly in the background.
                </p>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {audio.bgmUrl && (
              <button
                type="button"
                onClick={handleToggleBgmPreview}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-[#6C63FF] hover:bg-[#6C63FF] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                {isBgmPreviewPlaying ? (
                  <>
                    <Square className="w-3 h-3 fill-current" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>Preview</span>
                  </>
                )}
              </button>
            )}

            <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#10152B] hover:bg-[#6C63FF] text-white text-xs font-semibold transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>
                {uploadingSlot === 'bgm'
                  ? 'Uploading...'
                  : audio.bgmUrl
                  ? 'Replace Track'
                  : 'Upload BGM'}
              </span>
              <input
                type="file"
                accept=".mp3,.wav,.ogg,.m4a,.aac,audio/*"
                onChange={(e) => handleUploadAudioFile('bgm', e)}
                className="hidden"
              />
            </label>

            {audio.bgmUrl && (
              <button
                type="button"
                onClick={() => handleRemoveAudioFile('bgm')}
                className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Remove Background Music"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* BGM Volume & Automatic Video Ducking Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-3 rounded-xl bg-white border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#475467]">BGM Volume</span>
              <span className="font-bold text-[#10152B] tabular-nums">
                {Math.round((audio.bgmVolume ?? 0.25) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round((audio.bgmVolume ?? 0.25) * 100)}
              onChange={(e) =>
                updateData((prev) => ({
                  ...prev,
                  audio: {
                    ...(prev.audio || DEFAULT_AUDIO_CONFIG),
                    bgmVolume: Number(e.target.value) / 100,
                  },
                }))
              }
              className="w-full accent-[#6C63FF]"
            />
          </div>

          <div className="p-3 rounded-xl bg-white border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#475467]">
                Auto-Ducking on Video Play
              </span>
              <button
                type="button"
                onClick={() =>
                  updateData((prev) => ({
                    ...prev,
                    audio: {
                      ...(prev.audio || DEFAULT_AUDIO_CONFIG),
                      bgmDuckingEnabled: !audio.bgmDuckingEnabled,
                    },
                  }))
                }
                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                  audio.bgmDuckingEnabled
                    ? 'bg-indigo-50 text-[#6C63FF]'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {audio.bgmDuckingEnabled ? 'Auto-Duck ON' : 'OFF'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#667085] whitespace-nowrap">Ducked Level:</span>
              <input
                type="range"
                min={0}
                max={50}
                value={Math.round((audio.bgmDuckingVolume ?? 0.05) * 100)}
                onChange={(e) =>
                  updateData((prev) => ({
                    ...prev,
                    audio: {
                      ...(prev.audio || DEFAULT_AUDIO_CONFIG),
                      bgmDuckingVolume: Number(e.target.value) / 100,
                    },
                  }))
                }
                className="flex-1 accent-[#6C63FF]"
              />
              <span className="text-[11px] font-bold text-[#10152B] tabular-nums w-8 text-right">
                {Math.round((audio.bgmDuckingVolume ?? 0.05) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 8 Interactive UI Sound Effects (SFX) Channels */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#6C63FF]" />
            <h4 className="text-sm font-bold text-[#10152B]">
              Interactive UI Sound Effects (8 Channels)
            </h4>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#667085]">Master SFX Vol:</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round((audio.sfxMasterVolume ?? 0.55) * 100)}
                onChange={(e) =>
                  updateData((prev) => ({
                    ...prev,
                    audio: {
                      ...(prev.audio || DEFAULT_AUDIO_CONFIG),
                      sfxMasterVolume: Number(e.target.value) / 100,
                    },
                  }))
                }
                className="w-20 accent-[#6C63FF]"
              />
              <span className="text-xs font-bold text-[#10152B] tabular-nums w-9">
                {Math.round((audio.sfxMasterVolume ?? 0.55) * 100)}%
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                updateData((prev) => ({
                  ...prev,
                  audio: {
                    ...(prev.audio || DEFAULT_AUDIO_CONFIG),
                    sfxMasterEnabled: !audio.sfxMasterEnabled,
                  },
                }))
              }
              className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                audio.sfxMasterEnabled
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {audio.sfxMasterEnabled ? 'All SFX: ON' : 'All SFX: OFF'}
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {SFX_ACTION_ORDER.map((actionKey) => {
            const slot = audio.sfxSlots?.[actionKey] || DEFAULT_AUDIO_CONFIG.sfxSlots[actionKey];
            return (
              <div
                key={actionKey}
                className="p-3.5 rounded-xl bg-white border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#10152B]">{slot.label}</span>
                    {slot.audioUrl ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-[#6C63FF] text-[10px] font-bold truncate max-w-[160px]">
                        <Check className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{slot.filename || 'Custom Audio'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-[#667085] text-[10px] font-semibold">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Studio Synth Default</span>
                      </span>
                    )}
                  </div>

                  {/* Per-channel Volume Slider */}
                  <div className="flex items-center gap-2 max-w-xs">
                    <span className="text-[10px] text-[#667085] w-12">Volume:</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round((slot.volume ?? 0.6) * 100)}
                      onChange={(e) =>
                        updateData((prev) => {
                          const cur = prev.audio || DEFAULT_AUDIO_CONFIG;
                          return {
                            ...prev,
                            audio: {
                              ...cur,
                              sfxSlots: {
                                ...cur.sfxSlots,
                                [actionKey]: {
                                  ...slot,
                                  volume: Number(e.target.value) / 100,
                                },
                              },
                            },
                          };
                        })
                      }
                      className="flex-1 accent-[#6C63FF]"
                    />
                    <span className="text-[10px] font-bold text-[#10152B] tabular-nums w-8 text-right">
                      {Math.round((slot.volume ?? 0.6) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Controls: Preview, Upload/Replace, Remove Custom, Enable/Disable */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => triggerSfx(actionKey, true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-[#6C63FF] hover:bg-[#6C63FF] hover:text-white text-[11px] font-semibold transition-colors cursor-pointer"
                    title={`Preview ${slot.label}`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Preview</span>
                  </button>

                  <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F7F8FF] hover:bg-indigo-50 text-[#10152B] border border-indigo-100 text-[11px] font-semibold transition-colors cursor-pointer">
                    <Upload className="w-3 h-3 text-[#6C63FF]" />
                    <span>
                      {uploadingSlot === actionKey
                        ? '...'
                        : slot.audioUrl
                        ? 'Replace'
                        : 'Upload'}
                    </span>
                    <input
                      type="file"
                      accept=".mp3,.wav,.ogg,.m4a,audio/*"
                      onChange={(e) => handleUploadAudioFile(actionKey, e)}
                      className="hidden"
                    />
                  </label>

                  {slot.audioUrl && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAudioFile(actionKey)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove custom SFX file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      updateData((prev) => {
                        const cur = prev.audio || DEFAULT_AUDIO_CONFIG;
                        return {
                          ...prev,
                          audio: {
                            ...cur,
                            sfxSlots: {
                              ...cur.sfxSlots,
                              [actionKey]: {
                                ...slot,
                                enabled: !slot.enabled,
                              },
                            },
                          },
                        };
                      })
                    }
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                      slot.enabled
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {slot.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
