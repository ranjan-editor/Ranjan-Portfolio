import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Trash2,
  Upload,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Check,
  Edit3,
  X,
} from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { SoftwareToolItem } from '../../types/portfolio';

const SOFTWARE_CATEGORIES = [
  'Video Editing',
  'Motion Graphics',
  'Color Grading',
  'Audio',
  'Design',
  'Other Tools',
];

interface AdminSoftwareTabProps {
  onStatusMessage: (msg: string) => void;
}

export const AdminSoftwareTab: React.FC<AdminSoftwareTabProps> = ({ onStatusMessage }) => {
  const { data, updateData, triggerSfx } = usePortfolio();
  const [uploadingToolId, setUploadingToolId] = useState<string | null>(null);
  const [editingToolId, setEditingToolId] = useState<string | null>(null);

  // New software tool creation form state
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newShortCode, setNewShortCode] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Video Editing');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newProficiency, setNewProficiency] = useState<number>(90);
  const [newLogoUrl, setNewLogoUrl] = useState<string | null>(null);
  const [newLogoMediaId, setNewLogoMediaId] = useState<string | null>(null);
  const [newBgColor, setNewBgColor] = useState<string>('#10152B');
  const [newTextColor, setNewTextColor] = useState<string>('#FFFFFF');
  const [isUploadingNewLogo, setIsUploadingNewLogo] = useState<boolean>(false);

  const sortedTools = [...(data.softwareTools || [])].sort((a, b) => a.order - b.order);

  const uploadLogoImage = async (
    file: File
  ): Promise<{ imageUrl: string; mediaId: string }> => {
    const allowedExt = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExt.includes(ext)) {
      throw new Error('Unsupported logo format. Please upload PNG, JPG, JPEG, WEBP, or SVG.');
    }

    const res = await fetch('/api/media/image', {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'image/png',
        'x-filename': encodeURIComponent(file.name),
      },
      body: file,
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload.imageUrl) {
      throw new Error(payload?.error || 'Failed to upload software logo.');
    }
    return {
      imageUrl: payload.imageUrl as string,
      mediaId: (payload.id as string) || `img-${Date.now()}`,
    };
  };

  const deleteLogoFromServer = async (logoUrl?: string | null) => {
    if (!logoUrl || !logoUrl.startsWith('/api/media/stream/')) return;
    try {
      await fetch('/api/media/image/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: logoUrl }),
      });
    } catch {
      // Ignore cleanup errors
    }
  };

  const handleAddNewSoftware = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newName.trim();
    if (!trimmedName) {
      onStatusMessage('Please enter a Software / Tool Name.');
      return;
    }

    const clampedProf = Math.max(0, Math.min(100, Number(newProficiency) || 0));
    const derivedShort =
      newShortCode.trim() ||
      trimmedName
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 3) ||
      trimmedName.slice(0, 2);

    const nextOrder =
      sortedTools.length > 0 ? Math.max(...sortedTools.map((t) => t.order)) + 1 : 1;

    const newItem: SoftwareToolItem = {
      id: `tool-${Date.now()}`,
      name: trimmedName,
      shortCode: derivedShort,
      logoMediaId: newLogoMediaId,
      logoUrl: newLogoUrl,
      description: newDescription.trim(),
      category: newCategory || 'Video Editing',
      proficiency: clampedProf,
      enabled: true,
      order: nextOrder,
      bgColor: newBgColor || '#10152B',
      textColor: newTextColor || '#FFFFFF',
    };

    updateData((prev) => ({
      ...prev,
      softwareTools: [...(prev.softwareTools || []), newItem],
    }));

    triggerSfx('buttonClick');
    onStatusMessage(`Added "${trimmedName}" to Software & Tools.`);

    // Reset form
    setNewName('');
    setNewShortCode('');
    setNewCategory('Video Editing');
    setNewDescription('');
    setNewProficiency(90);
    setNewLogoUrl(null);
    setNewLogoMediaId(null);
    setIsAddingNew(false);
  };

  const handleNewToolLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsUploadingNewLogo(true);
    try {
      const { imageUrl, mediaId } = await uploadLogoImage(file);
      setNewLogoUrl(imageUrl);
      setNewLogoMediaId(mediaId);
      onStatusMessage(`Uploaded logo "${file.name}" for new tool.`);
    } catch (err: any) {
      onStatusMessage(err?.message || 'Failed to upload logo.');
    } finally {
      setIsUploadingNewLogo(false);
    }
  };

  const handleExistingToolLogoUpload = async (
    tool: SoftwareToolItem,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadingToolId(tool.id);
    try {
      const oldLogo = tool.logoUrl;
      const { imageUrl, mediaId } = await uploadLogoImage(file);
      updateData((prev) => ({
        ...prev,
        softwareTools: prev.softwareTools.map((t) =>
          t.id === tool.id ? { ...t, logoUrl: imageUrl, logoMediaId: mediaId } : t
        ),
      }));
      if (oldLogo && oldLogo !== imageUrl) {
        await deleteLogoFromServer(oldLogo);
      }
      onStatusMessage(`Updated logo for "${tool.name}".`);
    } catch (err: any) {
      onStatusMessage(err?.message || 'Failed to upload logo.');
    } finally {
      setUploadingToolId(null);
    }
  };

  const handleRemoveToolLogo = async (tool: SoftwareToolItem) => {
    const oldLogo = tool.logoUrl;
    updateData((prev) => ({
      ...prev,
      softwareTools: prev.softwareTools.map((t) =>
        t.id === tool.id ? { ...t, logoUrl: null, logoMediaId: null } : t
      ),
    }));
    await deleteLogoFromServer(oldLogo);
    onStatusMessage(`Removed custom logo for "${tool.name}" (using badge fallback).`);
  };

  const handleDeleteTool = async (tool: SoftwareToolItem) => {
    const oldLogo = tool.logoUrl;
    updateData((prev) => {
      const remaining = prev.softwareTools
        .filter((t) => t.id !== tool.id)
        .map((t, i) => ({ ...t, order: i + 1 }));
      return {
        ...prev,
        softwareTools: remaining,
      };
    });
    await deleteLogoFromServer(oldLogo);
    onStatusMessage(`Deleted "${tool.name}" from Software & Tools.`);
  };

  const handleMoveTool = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedTools.length) return;

    const reordered = [...sortedTools];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const normalizedOrder = reordered.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    updateData((prev) => ({
      ...prev,
      softwareTools: normalizedOrder,
    }));
  };

  const updateToolField = (toolId: string, patch: Partial<SoftwareToolItem>) => {
    updateData((prev) => ({
      ...prev,
      softwareTools: prev.softwareTools.map((t) =>
        t.id === toolId ? { ...t, ...patch } : t
      ),
    }));
  };

  return (
    <div className="space-y-5">
      {/* Header & Add Button */}
      <div className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-[#10152B] flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#6C63FF]" />
            <span>Software &amp; Tools Management ({sortedTools.length})</span>
          </h3>
          <p className="text-xs text-[#667085] mt-0.5">
            Add, edit, upload custom logos (PNG, SVG, WEBP, JPG), set proficiency (0–100%), reorder, or hide tools.
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
              <span>Add Software / Tool</span>
            </>
          )}
        </button>
      </div>

      {/* Add New Software / Tool Form */}
      {isAddingNew && (
        <form
          onSubmit={handleAddNewSoftware}
          className="glass-card rounded-2xl p-5 border-2 border-indigo-200 space-y-4 bg-white/95"
        >
          <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#6C63FF]">
              Add New Software / Tool
            </h4>
            <span className="text-[11px] text-[#667085]">All changes save immediately</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#10152B] mb-1">
                Software / Tool Name *
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Adobe Premiere Pro"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-indigo-100 text-xs text-[#10152B] focus:outline-none focus:border-[#6C63FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#10152B] mb-1">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-indigo-100 text-xs text-[#10152B] focus:outline-none focus:border-[#6C63FF]"
              >
                {SOFTWARE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#10152B] mb-1">
                Short Description / Subtitle (Optional)
              </label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="e.g., Primary NLE for narrative pacing & multi-cam timelines"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-indigo-100 text-xs text-[#10152B] focus:outline-none focus:border-[#6C63FF]"
              />
            </div>

            {/* Proficiency / Knowledge Level */}
            <div className="sm:col-span-2 p-3.5 rounded-xl bg-[#F7F8FF] border border-indigo-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#10152B]">
                  Proficiency / Knowledge Level (0% – 100%)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newProficiency}
                    onChange={(e) =>
                      setNewProficiency(Math.max(0, Math.min(100, Number(e.target.value) || 0)))
                    }
                    className="w-16 px-2 py-1 rounded-lg bg-white border border-indigo-200 text-xs font-extrabold text-[#10152B] text-right tabular-nums"
                  />
                  <span className="text-xs font-bold text-[#6C63FF]">%</span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={newProficiency}
                onChange={(e) => setNewProficiency(Number(e.target.value))}
                className="w-full accent-[#6C63FF] cursor-pointer"
              />
            </div>

            {/* Logo / Icon Upload + Badge Fallback */}
            <div className="sm:col-span-2 p-3.5 rounded-xl bg-white border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 shadow-xs border border-indigo-100"
                  style={{
                    backgroundColor: newLogoUrl ? '#FFFFFF' : newBgColor,
                    color: newTextColor,
                  }}
                >
                  {newLogoUrl ? (
                    <img
                      src={newLogoUrl}
                      alt="Logo Preview"
                      className="w-9 h-9 object-contain"
                    />
                  ) : (
                    <span className="text-sm font-extrabold tracking-tight">
                      {newShortCode.trim() || (newName ? newName.slice(0, 2) : 'Sw')}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#10152B]">
                    Software / Tool Logo (PNG, JPG, WEBP, SVG)
                  </p>
                  <p className="text-[11px] text-[#667085]">
                    Upload an official icon or use the customizable text badge fallback.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#6C63FF] hover:bg-[#10152B] text-white text-xs font-semibold transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingNewLogo ? 'Uploading...' : 'Upload Logo'}</span>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.svg"
                    onChange={handleNewToolLogoUpload}
                    className="hidden"
                  />
                </label>
                {newLogoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      deleteLogoFromServer(newLogoUrl);
                      setNewLogoUrl(null);
                      setNewLogoMediaId(null);
                    }}
                    className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 text-xs font-semibold hover:bg-rose-100 cursor-pointer"
                  >
                    Remove Logo
                  </button>
                )}
              </div>
            </div>

            {/* Fallback Badge Short Code & Colors */}
            <div>
              <label className="block text-[11px] font-semibold text-[#667085] mb-1">
                Fallback Badge Code (2–3 letters)
              </label>
              <input
                type="text"
                maxLength={4}
                value={newShortCode}
                onChange={(e) => setNewShortCode(e.target.value)}
                placeholder="Pr, Ae, Da, Ps..."
                className="w-full px-3 py-1.5 rounded-xl bg-white border border-indigo-100 text-xs text-[#10152B]"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-[#667085] mb-1">
                  Badge BG
                </label>
                <input
                  type="color"
                  value={newBgColor}
                  onChange={(e) => setNewBgColor(e.target.value)}
                  className="w-full h-8 rounded-lg cursor-pointer border border-indigo-100"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-[#667085] mb-1">
                  Badge Text
                </label>
                <input
                  type="color"
                  value={newTextColor}
                  onChange={(e) => setNewTextColor(e.target.value)}
                  className="w-full h-8 rounded-lg cursor-pointer border border-indigo-100"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
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
              <span>Save Software / Tool</span>
            </button>
          </div>
        </form>
      )}

      {/* Existing Software & Tools List */}
      <div className="space-y-3">
        {sortedTools.map((tool, idx) => {
          const isExpanded = editingToolId === tool.id;
          const isUploadingThis = uploadingToolId === tool.id;

          return (
            <div
              key={tool.id}
              className={`glass-card rounded-2xl p-4 transition-all space-y-3.5 ${
                !tool.enabled ? 'opacity-65 bg-slate-50/70' : ''
              }`}
            >
              {/* Top Row: Preview, Name, Category, Percentage, Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Icon / Logo Preview */}
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden shadow-2xs border border-indigo-100/80"
                    style={{
                      backgroundColor: tool.logoUrl ? '#FFFFFF' : tool.bgColor || '#10152B',
                      color: tool.textColor || '#FFFFFF',
                    }}
                  >
                    {tool.logoUrl ? (
                      <img
                        src={tool.logoUrl}
                        alt={tool.name}
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <span className="text-xs font-extrabold tracking-tight">
                        {tool.shortCode || tool.name.slice(0, 2)}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-extrabold text-[#10152B] truncate">
                        {tool.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-[#6C63FF] text-[10px] font-bold">
                        {tool.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#10152B] text-white text-[10px] font-extrabold tabular-nums">
                        {tool.proficiency}%
                      </span>
                    </div>
                    {tool.description && (
                      <p className="text-[11px] text-[#667085] truncate mt-0.5">
                        {tool.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Controls: Up/Down, Enable/Disable, Edit, Delete */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveTool(idx, 'up')}
                    disabled={idx === 0}
                    title="Move Up"
                    className="p-1.5 rounded-lg bg-white border border-indigo-100 text-[#475467] hover:text-[#10152B] disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveTool(idx, 'down')}
                    disabled={idx === sortedTools.length - 1}
                    title="Move Down"
                    className="p-1.5 rounded-lg bg-white border border-indigo-100 text-[#475467] hover:text-[#10152B] disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateToolField(tool.id, { enabled: !tool.enabled });
                      triggerSfx('toggle');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                      tool.enabled
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tool.enabled ? (
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
                    onClick={() => setEditingToolId(isExpanded ? null : tool.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer border ${
                      isExpanded
                        ? 'bg-[#6C63FF] text-white border-[#6C63FF]'
                        : 'bg-white text-[#10152B] border-indigo-100 hover:bg-indigo-50'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isExpanded ? 'Done' : 'Edit'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteTool(tool)}
                    title="Delete Software / Tool"
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Quick Proficiency Slider Row */}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[11px] font-semibold text-[#667085] w-20 shrink-0">
                  Proficiency:
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={tool.proficiency}
                  onChange={(e) =>
                    updateToolField(tool.id, {
                      proficiency: Math.max(0, Math.min(100, Number(e.target.value))),
                    })
                  }
                  className="flex-1 accent-[#6C63FF] cursor-pointer"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={tool.proficiency}
                  onChange={(e) =>
                    updateToolField(tool.id, {
                      proficiency: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                    })
                  }
                  className="w-14 px-2 py-1 rounded-lg bg-white border border-indigo-100 text-xs font-bold text-[#10152B] text-right tabular-nums"
                />
                <span className="text-xs font-bold text-[#6C63FF]">%</span>
              </div>

              {/* Expanded Full Editor Drawer for this Tool */}
              {isExpanded && (
                <div className="pt-3 border-t border-indigo-100/80 grid grid-cols-1 sm:grid-cols-2 gap-3.5 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-[11px] font-bold text-[#475467] mb-1">
                      Software / Tool Name
                    </label>
                    <input
                      type="text"
                      value={tool.name}
                      onChange={(e) => updateToolField(tool.id, { name: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-indigo-100 text-xs font-semibold text-[#10152B]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#475467] mb-1">
                      Category
                    </label>
                    <select
                      value={
                        SOFTWARE_CATEGORIES.includes(tool.category)
                          ? tool.category
                          : 'Other Tools'
                      }
                      onChange={(e) => updateToolField(tool.id, { category: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-indigo-100 text-xs text-[#10152B]"
                    >
                      {SOFTWARE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#475467] mb-1">
                      Short Description / Subtitle
                    </label>
                    <input
                      type="text"
                      value={tool.description || ''}
                      onChange={(e) =>
                        updateToolField(tool.id, { description: e.target.value })
                      }
                      placeholder="Short workflow note or specialty..."
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-indigo-100 text-xs text-[#10152B]"
                    />
                  </div>

                  {/* Custom Logo Upload / Replace / Remove */}
                  <div className="sm:col-span-2 p-3 rounded-xl bg-white border border-indigo-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <ImageIcon className="w-4 h-4 text-[#6C63FF]" />
                      <div>
                        <p className="text-xs font-bold text-[#10152B]">
                          Logo / Icon Image (PNG, JPG, WEBP, SVG)
                        </p>
                        <p className="text-[10px] text-[#667085]">
                          {tool.logoUrl
                            ? 'Custom uploaded logo active'
                            : 'Using fallback text badge'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#6C63FF] hover:bg-[#10152B] text-white text-[11px] font-semibold transition-colors cursor-pointer">
                        <Upload className="w-3 h-3" />
                        <span>
                          {isUploadingThis
                            ? 'Uploading...'
                            : tool.logoUrl
                            ? 'Replace Logo'
                            : 'Upload Logo'}
                        </span>
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.webp,.svg"
                          onChange={(e) => handleExistingToolLogoUpload(tool, e)}
                          className="hidden"
                        />
                      </label>

                      {tool.logoUrl && (
                        <button
                          type="button"
                          onClick={() => handleRemoveToolLogo(tool)}
                          className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 text-[11px] font-semibold cursor-pointer"
                        >
                          Remove Logo
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Fallback Badge Customization */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#475467] mb-1">
                      Fallback Short Code
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={tool.shortCode}
                      onChange={(e) =>
                        updateToolField(tool.id, { shortCode: e.target.value })
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-indigo-100 text-xs text-[#10152B]"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-[#475467] mb-1">
                        Badge BG
                      </label>
                      <input
                        type="color"
                        value={tool.bgColor || '#10152B'}
                        onChange={(e) =>
                          updateToolField(tool.id, { bgColor: e.target.value })
                        }
                        className="w-full h-8 rounded-lg cursor-pointer border border-indigo-100"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-[#475467] mb-1">
                        Badge Text
                      </label>
                      <input
                        type="color"
                        value={tool.textColor || '#FFFFFF'}
                        onChange={(e) =>
                          updateToolField(tool.id, { textColor: e.target.value })
                        }
                        className="w-full h-8 rounded-lg cursor-pointer border border-indigo-100"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
