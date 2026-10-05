import React, { useState } from 'react';
import {
  Lightbulb,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Check,
  X,
} from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { SkillItem } from '../../types/portfolio';

interface AdminSkillsTabProps {
  onStatusMessage: (msg: string) => void;
}

export const AdminSkillsTab: React.FC<AdminSkillsTabProps> = ({ onStatusMessage }) => {
  const { data, updateData, triggerSfx } = usePortfolio();

  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newProficiency, setNewProficiency] = useState<number>(90);

  const sortedSkills = [...(data.skills || [])].sort((a, b) => a.order - b.order);

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newName.trim();
    if (!trimmedName) {
      onStatusMessage('Please enter a Skill Name.');
      return;
    }

    const clamped = Math.max(0, Math.min(100, Number(newProficiency) || 0));
    const nextOrder =
      sortedSkills.length > 0 ? Math.max(...sortedSkills.map((s) => s.order)) + 1 : 1;

    const newSkill: SkillItem = {
      id: `sk-${Date.now()}`,
      name: trimmedName,
      description: newDescription.trim(),
      proficiency: clamped,
      percentage: clamped,
      enabled: true,
      order: nextOrder,
    };

    updateData((prev) => ({
      ...prev,
      skills: [...(prev.skills || []), newSkill],
    }));

    triggerSfx('buttonClick');
    onStatusMessage(`Added skill "${trimmedName}" (${clamped}%).`);
    setNewName('');
    setNewDescription('');
    setNewProficiency(90);
    setIsAddingNew(false);
  };

  const updateSkillField = (skillId: string, patch: Partial<SkillItem>) => {
    updateData((prev) => ({
      ...prev,
      skills: prev.skills.map((sk) => {
        if (sk.id !== skillId) return sk;
        const nextProf =
          patch.proficiency !== undefined
            ? Math.max(0, Math.min(100, Number(patch.proficiency)))
            : sk.proficiency;
        return {
          ...sk,
          ...patch,
          proficiency: nextProf,
          percentage: nextProf,
        };
      }),
    }));
  };

  const handleDeleteSkill = (skill: SkillItem) => {
    updateData((prev) => {
      const remaining = prev.skills
        .filter((s) => s.id !== skill.id)
        .map((s, idx) => ({ ...s, order: idx + 1 }));
      return {
        ...prev,
        skills: remaining,
      };
    });
    onStatusMessage(`Deleted skill "${skill.name}".`);
  };

  const handleMoveSkill = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedSkills.length) return;

    const copy = [...sortedSkills];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);

    const reordered = copy.map((sk, idx) => ({
      ...sk,
      order: idx + 1,
    }));

    updateData((prev) => ({
      ...prev,
      skills: reordered,
    }));
  };

  return (
    <div className="space-y-5">
      {/* Header & Add Skill Button */}
      <div className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-[#10152B] flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[#8B5CF6]" />
            <span>Skills Management ({sortedSkills.length})</span>
          </h3>
          <p className="text-xs text-[#667085] mt-0.5">
            Add, edit, reorder, enable/disable, or adjust proficiency percentages (0% – 100%) for your creative skills.
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
              <span>Add Skill</span>
            </>
          )}
        </button>
      </div>

      {/* Add New Skill Form */}
      {isAddingNew && (
        <form
          onSubmit={handleAddSkill}
          className="glass-card rounded-2xl p-5 border-2 border-indigo-200 space-y-4 bg-white/95"
        >
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#6C63FF]">
            Add New Skill
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#10152B] mb-1">
                Skill Name *
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Cinematic Color Grading, Motion Graphics, Audio Mixing..."
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-indigo-100 text-xs text-[#10152B] focus:outline-none focus:border-[#6C63FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#10152B] mb-1">
                Short Description (Optional)
              </label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="e.g., High-retention pacing & emotional visual storytelling"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-indigo-100 text-xs text-[#10152B] focus:outline-none focus:border-[#6C63FF]"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-[#F7F8FF] border border-indigo-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#10152B]">
                  Skill Percentage / Proficiency (0% – 100%)
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
              <span>Save Skill</span>
            </button>
          </div>
        </form>
      )}

      {/* Existing Skills List */}
      <div className="space-y-3">
        {sortedSkills.map((skill, idx) => {
          const pct =
            typeof skill.proficiency === 'number' ? skill.proficiency : skill.percentage;

          return (
            <div
              key={skill.id}
              className={`glass-card rounded-2xl p-4 space-y-3 transition-all ${
                !skill.enabled ? 'opacity-65 bg-slate-50/70' : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={skill.name}
                    onChange={(e) => updateSkillField(skill.id, { name: e.target.value })}
                    placeholder="Skill Name"
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-indigo-100 text-xs font-extrabold text-[#10152B] focus:outline-none focus:border-[#6C63FF]"
                  />
                  <input
                    type="text"
                    value={skill.description || ''}
                    onChange={(e) =>
                      updateSkillField(skill.id, { description: e.target.value })
                    }
                    placeholder="Optional short description..."
                    className="w-full px-3 py-1.5 rounded-xl bg-white/80 border border-indigo-50 text-[11px] text-[#667085] focus:outline-none focus:border-[#6C63FF]"
                  />
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                  <button
                    type="button"
                    onClick={() => handleMoveSkill(idx, 'up')}
                    disabled={idx === 0}
                    title="Move Skill Up"
                    className="p-1.5 rounded-lg bg-white border border-indigo-100 text-[#475467] hover:text-[#10152B] disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveSkill(idx, 'down')}
                    disabled={idx === sortedSkills.length - 1}
                    title="Move Skill Down"
                    className="p-1.5 rounded-lg bg-white border border-indigo-100 text-[#475467] hover:text-[#10152B] disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateSkillField(skill.id, { enabled: !skill.enabled });
                      triggerSfx('toggle');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                      skill.enabled
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {skill.enabled ? (
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
                    onClick={() => handleDeleteSkill(skill)}
                    title="Delete Skill"
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Percentage Slider + Numeric Input */}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[11px] font-semibold text-[#667085] w-20 shrink-0">
                  Proficiency:
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={pct}
                  onChange={(e) =>
                    updateSkillField(skill.id, { proficiency: Number(e.target.value) })
                  }
                  className="flex-1 accent-[#6C63FF] cursor-pointer"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={pct}
                  onChange={(e) =>
                    updateSkillField(skill.id, {
                      proficiency: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                    })
                  }
                  className="w-14 px-2 py-1 rounded-lg bg-white border border-indigo-100 text-xs font-extrabold text-[#10152B] text-right tabular-nums"
                />
                <span className="text-xs font-bold text-[#6C63FF]">%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
