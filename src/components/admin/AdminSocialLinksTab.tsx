import React, { useState } from 'react';
import {
  Share2,
  Plus,
  Trash2,
  Upload,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { SocialLinkItem } from '../../types/portfolio';
import { renderSocialPlatformIcon } from '../Footer';
import { uploadAnyMediaToLibrary } from '../../utils/mediaUploadService';

const BUILTIN_ICON_OPTIONS = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'X / Twitter' },
  { value: 'behance', label: 'Behance' },
  { value: 'dribbble', label: 'Dribbble' },
  { value: 'github', label: 'GitHub' },
  { value: 'vimeo', label: 'Vimeo' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'globe', label: 'Website / Globe' },
];

interface AdminSocialLinksTabProps {
  onStatusMessage: (msg: string) => void;
}

export const AdminSocialLinksTab: React.FC<AdminSocialLinksTabProps> = ({
  onStatusMessage,
}) => {
  const { data, updateData, triggerSfx } = usePortfolio();

  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [newPlatform, setNewPlatform] = useState<string>('');
  const [newUrl, setNewUrl] = useState<string>('https://');
  const [newIconType, setNewIconType] = useState<string>('instagram');
  const [newIconUrl, setNewIconUrl] = useState<string | null>(null);
  const [newIconMediaId, setNewIconMediaId] = useState<string | null>(null);
  const [isUploadingNewIcon, setIsUploadingNewIcon] = useState<boolean>(false);
  const [uploadingSocialId, setUploadingSocialId] = useState<string | null>(null);

  const sortedLinks = [...(data.socialLinks || [])].sort((a, b) => a.order - b.order);

  const isValidSocialUrl = (rawUrl: string): boolean => {
    const trimmed = rawUrl.trim();
    return trimmed.startsWith('https://') || trimmed.startsWith('http://');
  };

  const uploadCustomSocialIcon = async (
    file: File
  ): Promise<{ imageUrl: string; mediaId: string }> => {
    const allowedExt = ['.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExt.includes(ext)) {
      throw new Error('Unsupported icon format. Please upload PNG, JPG, JPEG, WEBP, AVIF, or SVG.');
    }

    const mediaRecord = await uploadAnyMediaToLibrary({ file });
    updateData((prev) => ({
      ...prev,
      mediaLibrary: [mediaRecord, ...prev.mediaLibrary],
    }));

    return {
      imageUrl: mediaRecord.mediaUrl,
      mediaId: mediaRecord.id,
    };
  };

  const deleteCustomIconFromServer = async (_iconUrl?: string | null) => {
    // Keep uploaded icon safely in Admin Media Library (Private) when unassigned
  };

  const handleAddSocialLink = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPlatform = newPlatform.trim();
    const trimmedUrl = newUrl.trim();

    if (!trimmedPlatform) {
      onStatusMessage('Please enter a Platform Name (e.g., Instagram, YouTube, Behance).');
      return;
    }

    if (!isValidSocialUrl(trimmedUrl)) {
      onStatusMessage('URL must begin with https:// or http://');
      return;
    }

    const nextOrder =
      sortedLinks.length > 0 ? Math.max(...sortedLinks.map((s) => s.order)) + 1 : 1;

    const newItem: SocialLinkItem = {
      id: `soc-${Date.now()}`,
      platform: trimmedPlatform,
      url: trimmedUrl,
      iconMediaId: newIconMediaId,
      iconUrl: newIconUrl,
      iconType: newIconType || 'globe',
      enabled: true,
      order: nextOrder,
    };

    updateData((prev) => ({
      ...prev,
      socialLinks: [...(prev.socialLinks || []), newItem],
    }));

    triggerSfx('buttonClick');
    onStatusMessage(`Added "${trimmedPlatform}" to Social Links.`);
    setNewPlatform('');
    setNewUrl('https://');
    setNewIconType('instagram');
    setNewIconUrl(null);
    setNewIconMediaId(null);
    setIsAddingNew(false);
  };

  const handleNewIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsUploadingNewIcon(true);
    try {
      const { imageUrl, mediaId } = await uploadCustomSocialIcon(file);
      setNewIconUrl(imageUrl);
      setNewIconMediaId(mediaId);
      onStatusMessage(`Uploaded custom icon "${file.name}".`);
    } catch (err: any) {
      onStatusMessage(err?.message || 'Failed to upload social icon.');
    } finally {
      setIsUploadingNewIcon(false);
    }
  };

  const handleExistingIconUpload = async (
    item: SocialLinkItem,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadingSocialId(item.id);
    try {
      const oldIcon = item.iconUrl;
      const { imageUrl, mediaId } = await uploadCustomSocialIcon(file);
      updateData((prev) => ({
        ...prev,
        socialLinks: prev.socialLinks.map((s) =>
          s.id === item.id ? { ...s, iconUrl: imageUrl, iconMediaId: mediaId } : s
        ),
      }));
      if (oldIcon && oldIcon !== imageUrl) {
        await deleteCustomIconFromServer(oldIcon);
      }
      onStatusMessage(`Updated custom icon for "${item.platform}".`);
    } catch (err: any) {
      onStatusMessage(err?.message || 'Failed to upload custom icon.');
    } finally {
      setUploadingSocialId(null);
    }
  };

  const handleRemoveCustomIcon = async (item: SocialLinkItem) => {
    const oldIcon = item.iconUrl;
    updateData((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.map((s) =>
        s.id === item.id ? { ...s, iconUrl: null, iconMediaId: null } : s
      ),
    }));
    await deleteCustomIconFromServer(oldIcon);
    onStatusMessage(`Reverted "${item.platform}" to built-in vector icon.`);
  };

  const handleDeleteSocial = async (item: SocialLinkItem) => {
    const oldIcon = item.iconUrl;
    updateData((prev) => {
      const remaining = prev.socialLinks
        .filter((s) => s.id !== item.id)
        .map((s, idx) => ({ ...s, order: idx + 1 }));
      return {
        ...prev,
        socialLinks: remaining,
      };
    });
    await deleteCustomIconFromServer(oldIcon);
    onStatusMessage(`Deleted "${item.platform}" social link.`);
  };

  const handleMoveSocial = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedLinks.length) return;

    const copy = [...sortedLinks];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);

    const reordered = copy.map((s, idx) => ({
      ...s,
      order: idx + 1,
    }));

    updateData((prev) => ({
      ...prev,
      socialLinks: reordered,
    }));
  };

  const updateSocialField = (id: string, patch: Partial<SocialLinkItem>) => {
    updateData((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  return (
    <div className="space-y-5">
      {/* Header & Add Button */}
      <div className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-[#10152B] flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#6C63FF]" />
            <span>Social Links Management ({sortedLinks.length})</span>
          </h3>
          <p className="text-xs text-[#667085] mt-0.5">
            Manage social platforms, profile URLs, built-in icons or custom uploaded SVG/PNG icons, order, and visibility.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingNew((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#10152B] hover:bg-[#6C63FF] text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
        >
          {isAddingNew ? (
            <>
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Add Social Link</span>
            </>
          )}
        </button>
      </div>

      {/* Add Social Link Form */}
      {isAddingNew && (
        <form
          onSubmit={handleAddSocialLink}
          className="glass-card rounded-2xl p-5 border-2 border-indigo-200 space-y-4 bg-white/95"
        >
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#6C63FF]">
            Add New Social Platform Link
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#10152B] mb-1">
                Platform Name *
              </label>
              <input
                type="text"
                required
                value={newPlatform}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewPlatform(val);
                  const lower = val.toLowerCase();
                  const matched = BUILTIN_ICON_OPTIONS.find((o) =>
                    lower.includes(o.value)
                  );
                  if (matched) setNewIconType(matched.value);
                }}
                placeholder="e.g., Instagram, YouTube, Behance..."
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-indigo-100 text-xs text-[#10152B] focus:outline-none focus:border-[#6C63FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#10152B] mb-1">
                Built-in Icon Library
              </label>
              <select
                value={newIconType}
                onChange={(e) => setNewIconType(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-indigo-100 text-xs text-[#10152B] focus:outline-none focus:border-[#6C63FF]"
              >
                {BUILTIN_ICON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#10152B] mb-1">
                Full Social URL (https://...) *
              </label>
              <input
                type="url"
                required
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://instagram.com/yourhandle"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-indigo-100 text-xs text-[#10152B] focus:outline-none focus:border-[#6C63FF]"
              />
            </div>

            {/* Custom Icon Upload Option */}
            <div className="sm:col-span-2 p-3.5 rounded-xl bg-[#F7F8FF] border border-indigo-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-indigo-100 flex items-center justify-center text-[#10152B] shadow-2xs overflow-hidden">
                  {newIconUrl ? (
                    <img
                      src={newIconUrl}
                      alt="Custom Icon"
                      className="w-5 h-5 object-contain"
                    />
                  ) : (
                    renderSocialPlatformIcon({
                      id: 'preview',
                      platform: newPlatform || newIconType,
                      url: newUrl,
                      iconMediaId: null,
                      iconType: newIconType,
                      enabled: true,
                      order: 0,
                    })
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#10152B]">
                    Custom Uploaded Icon (Optional)
                  </p>
                  <p className="text-[11px] text-[#667085]">
                    Upload SVG, PNG, WEBP, or JPG to override the built-in icon.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#6C63FF] hover:bg-[#10152B] text-white text-xs font-semibold transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingNewIcon ? 'Uploading...' : 'Upload Custom Icon'}</span>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.svg"
                    onChange={handleNewIconUpload}
                    className="hidden"
                  />
                </label>
                {newIconUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      deleteCustomIconFromServer(newIconUrl);
                      setNewIconUrl(null);
                      setNewIconMediaId(null);
                    }}
                    className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 text-xs font-semibold cursor-pointer"
                  >
                    Use Built-in
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="px-4 py-2 rounded-full text-xs font-semibold text-[#475467] hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#10152B] hover:bg-[#6C63FF] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Social Link</span>
            </button>
          </div>
        </form>
      )}

      {/* Existing Social Links List */}
      <div className="space-y-3">
        {sortedLinks.map((item, idx) => {
          const isUploadingThis = uploadingSocialId === item.id;
          const urlValid = isValidSocialUrl(item.url);

          return (
            <div
              key={item.id}
              className={`glass-card rounded-2xl p-4 space-y-3 transition-all ${
                !item.enabled ? 'opacity-65 bg-slate-50/70' : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-white border border-indigo-100 flex items-center justify-center text-[#10152B] shrink-0 shadow-2xs overflow-hidden">
                    {item.iconUrl ? (
                      <img
                        src={item.iconUrl}
                        alt={item.platform}
                        className="w-5 h-5 object-contain"
                      />
                    ) : (
                      renderSocialPlatformIcon(item)
                    )}
                  </div>

                  <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={item.platform}
                      onChange={(e) =>
                        updateSocialField(item.id, { platform: e.target.value })
                      }
                      placeholder="Platform Name"
                      className="px-3 py-1.5 rounded-xl bg-white border border-indigo-100 text-xs font-extrabold text-[#10152B]"
                    />
                    <div className="relative flex items-center">
                      <input
                        type="url"
                        value={item.url}
                        onChange={(e) => updateSocialField(item.id, { url: e.target.value })}
                        placeholder="https://..."
                        className={`w-full pl-3 pr-8 py-1.5 rounded-xl bg-white border text-xs text-[#475467] ${
                          urlValid ? 'border-indigo-100' : 'border-rose-400'
                        }`}
                      />
                      {urlValid && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Test ${item.platform} link`}
                          className="absolute right-2.5 text-[#667085] hover:text-[#6C63FF]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Controls: Order, Enable/Disable, Delete */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleMoveSocial(idx, 'up')}
                    disabled={idx === 0}
                    title="Move Up"
                    className="p-1.5 rounded-lg bg-white border border-indigo-100 text-[#475467] hover:text-[#10152B] disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveSocial(idx, 'down')}
                    disabled={idx === sortedLinks.length - 1}
                    title="Move Down"
                    className="p-1.5 rounded-lg bg-white border border-indigo-100 text-[#475467] hover:text-[#10152B] disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateSocialField(item.id, { enabled: !item.enabled });
                      triggerSfx('toggle');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                      item.enabled
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {item.enabled ? (
                      <>
                        <Eye className="w-3 h-3" /> Enabled
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" /> Disabled
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteSocial(item)}
                    title="Delete Social Link"
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Icon Selector & Custom Upload Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-indigo-50 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#667085]">Icon Style:</span>
                  <select
                    value={item.iconType || 'globe'}
                    onChange={(e) =>
                      updateSocialField(item.id, { iconType: e.target.value })
                    }
                    className="px-2.5 py-1 rounded-lg bg-white border border-indigo-100 text-xs text-[#10152B]"
                  >
                    {BUILTIN_ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 hover:bg-[#6C63FF] text-[#6C63FF] hover:text-white text-[11px] font-semibold transition-colors cursor-pointer">
                    <Upload className="w-3 h-3" />
                    <span>
                      {isUploadingThis
                        ? 'Uploading...'
                        : item.iconUrl
                        ? 'Replace Custom Icon'
                        : 'Upload Custom Icon'}
                    </span>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,.svg"
                      onChange={(e) => handleExistingIconUpload(item, e)}
                      className="hidden"
                    />
                  </label>

                  {item.iconUrl && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomIcon(item)}
                      className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 text-[11px] font-semibold cursor-pointer"
                    >
                      Remove Custom Icon
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
