import React, { useState } from 'react';
import {
  Brain,
  Sliders,
  Database,
  Terminal,
  Activity,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Save,
  Clock,
  Sparkles,
} from 'lucide-react';
import { PersonaState, LearnedFact } from '../types';
import { api } from '../services/api';

interface BrainViewProps {
  persona: PersonaState | null;
  onPersonaUpdated: (updated: PersonaState) => void;
}

export const BrainView: React.FC<BrainViewProps> = ({ persona, onPersonaUpdated }) => {
  const [activeSubTab, setActiveSubTab] = useState<'knowledge' | 'tuning' | 'prompt' | 'logs'>('knowledge');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // New Fact Form
  const [showAddFact, setShowAddFact] = useState(false);
  const [newFactCategory, setNewFactCategory] = useState<LearnedFact['category']>('Preferences');
  const [newFactText, setNewFactText] = useState('');

  // Editing Fact
  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [editingFactText, setEditingFactText] = useState('');

  // Personality Sliders State (local copy for instant feedback)
  const [localTraits, setLocalTraits] = useState(
    persona?.traits || {
      affection: 80,
      humor: 65,
      caring: 85,
      energy: 60,
      hinglishRatio: 75,
    }
  );

  const [companionName, setCompanionName] = useState(persona?.name || 'Noor');
  const [relationshipDesc, setRelationshipDesc] = useState(
    persona?.relationship || 'Personal AI Companion & Confidant'
  );
  const [customPromptNote, setCustomPromptNote] = useState(persona?.customInstructions || '');
  const [nicknamesUser, setNicknamesUser] = useState(
    persona?.nicknames?.forUser?.join(', ') || 'baba, yaar, dost'
  );
  const [newGuideline, setNewGuideline] = useState('');

  // Save changes to backend
  const handleSaveTuning = async () => {
    if (!persona) return;
    setIsSaving(true);
    try {
      const updatedNicknames = {
        forUser: nicknamesUser.split(',').map((n) => n.trim()).filter(Boolean),
        forCompanion: persona.nicknames?.forCompanion || [companionName],
      };

      const res = await api.updateBrain({
        name: companionName,
        relationship: relationshipDesc,
        traits: localTraits,
        customInstructions: customPromptNote,
        nicknames: updatedNicknames,
      });

      if (res.success) {
        onPersonaUpdated(res.persona);
        setSaveToast('Personality parameters saved successfully!');
        setTimeout(() => setSaveToast(null), 3000);
      }
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Add new fact
  const handleAddFact = async () => {
    if (!persona || !newFactText.trim()) return;
    const newFact: LearnedFact = {
      id: `fact-${Date.now()}`,
      category: newFactCategory,
      fact: newFactText.trim(),
      confidence: 100,
      learnedDate: new Date().toISOString().split('T')[0],
      source: 'Manual addition',
    };

    const updatedBank = [newFact, ...(persona.memoryBank || [])];
    const res = await api.updateBrain({ memoryBank: updatedBank });
    if (res.success) {
      onPersonaUpdated(res.persona);
      setNewFactText('');
      setShowAddFact(false);
      setSaveToast('New fact added to Memory Bank!');
      setTimeout(() => setSaveToast(null), 3000);
    }
  };

  // Delete fact
  const handleDeleteFact = async (id: string) => {
    if (!persona) return;
    const updatedBank = persona.memoryBank.filter((f) => f.id !== id);
    const res = await api.updateBrain({ memoryBank: updatedBank });
    if (res.success) {
      onPersonaUpdated(res.persona);
    }
  };

  // Save edited fact
  const handleSaveEditFact = async (id: string) => {
    if (!persona || !editingFactText.trim()) return;
    const updatedBank = persona.memoryBank.map((f) =>
      f.id === id ? { ...f, fact: editingFactText.trim() } : f
    );
    const res = await api.updateBrain({ memoryBank: updatedBank });
    if (res.success) {
      onPersonaUpdated(res.persona);
      setEditingFactId(null);
      setEditingFactText('');
    }
  };

  // Add style guideline
  const handleAddGuideline = async () => {
    if (!persona || !newGuideline.trim()) return;
    const updated = [...(persona.styleGuidelines || []), newGuideline.trim()];
    const res = await api.updateBrain({ styleGuidelines: updated });
    if (res.success) {
      onPersonaUpdated(res.persona);
      setNewGuideline('');
    }
  };

  // Delete style guideline
  const handleDeleteGuideline = async (index: number) => {
    if (!persona) return;
    const updated = persona.styleGuidelines.filter((_, i) => i !== index);
    const res = await api.updateBrain({ styleGuidelines: updated });
    if (res.success) {
      onPersonaUpdated(res.persona);
    }
  };

  const categories = ['All', 'Preferences', 'Shared Memories', 'Inside Jokes', 'Routines', 'Nicknames', 'General'];
  const filteredFacts = (persona?.memoryBank || []).filter((f) =>
    categoryFilter === 'All' ? true : f.category === categoryFilter
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white light:text-slate-900 tracking-tight flex items-center gap-2.5">
            <Brain className="w-6 h-6 text-rose-500" />
            Inside the Brain: Observability & Introspection
          </h1>
          <p className="mt-1 text-sm md:text-base text-neutral-300 light:text-slate-600 font-medium">
            Full introspection into what your companion has learned, its active personality traits,
            and execution telemetry.
          </p>
        </div>

        {saveToast && (
          <div className="px-4 py-2 rounded-xl bg-emerald-500/20 light:bg-emerald-100 border border-emerald-500/40 text-emerald-300 light:text-emerald-800 text-xs md:text-sm font-bold animate-in fade-in flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{saveToast}</span>
          </div>
        )}
      </div>

      {/* Sub Tabs with min 44px touch targets */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white/[0.04] light:bg-slate-100 border border-white/[0.08] light:border-slate-300 rounded-2xl max-w-fit">
        <button
          onClick={() => setActiveSubTab('knowledge')}
          className={`min-h-[44px] flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold rounded-xl transition-colors whitespace-nowrap ${
            activeSubTab === 'knowledge'
              ? 'bg-rose-500/20 text-rose-300 light:bg-rose-600 light:text-white border border-rose-500/40 shadow-sm'
              : 'text-neutral-300 light:text-slate-700 hover:text-white light:hover:text-black hover:bg-white/[0.06] light:hover:bg-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Knowledge & Memories ({persona?.memoryBank?.length ?? 0})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('tuning')}
          className={`min-h-[44px] flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold rounded-xl transition-colors whitespace-nowrap ${
            activeSubTab === 'tuning'
              ? 'bg-rose-500/20 text-rose-300 light:bg-rose-600 light:text-white border border-rose-500/40 shadow-sm'
              : 'text-neutral-300 light:text-slate-700 hover:text-white light:hover:text-black hover:bg-white/[0.06] light:hover:bg-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Personality & Tone Tuning</span>
        </button>

        <button
          onClick={() => setActiveSubTab('prompt')}
          className={`min-h-[44px] flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold rounded-xl transition-colors whitespace-nowrap ${
            activeSubTab === 'prompt'
              ? 'bg-rose-500/20 text-rose-300 light:bg-rose-600 light:text-white border border-rose-500/40 shadow-sm'
              : 'text-neutral-300 light:text-slate-700 hover:text-white light:hover:text-black hover:bg-white/[0.06] light:hover:bg-slate-200'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Active Prompt Inspection</span>
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`min-h-[44px] flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold rounded-xl transition-colors whitespace-nowrap ${
            activeSubTab === 'logs'
              ? 'bg-rose-500/20 text-rose-300 light:bg-rose-600 light:text-white border border-rose-500/40 shadow-sm'
              : 'text-neutral-300 light:text-slate-700 hover:text-white light:hover:text-black hover:bg-white/[0.06] light:hover:bg-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Execution Logs ({persona?.executionLogs?.length ?? 0})</span>
        </button>
      </div>

      {/* Sub Tab 1: Knowledge & Memories */}
      {activeSubTab === 'knowledge' && (
        <div className="space-y-6">
          {/* Controls bar with >=44px buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Filter tags (segmented control) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 bg-white/[0.03] light:bg-slate-100 border border-white/[0.08] light:border-slate-300 rounded-xl">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`min-h-[40px] px-3.5 py-1.5 text-xs md:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    categoryFilter === cat
                      ? 'bg-white light:bg-slate-900 text-black light:text-white shadow-sm'
                      : 'text-neutral-300 light:text-slate-700 hover:text-white light:hover:text-black'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAddFact(true)}
              className="min-h-[44px] flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs md:text-sm font-bold transition-colors shrink-0 shadow-md shadow-rose-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Learned Fact</span>
            </button>
          </div>

          {/* Add Fact Form */}
          {showAddFact && (
            <div className="p-6 rounded-2xl bg-[#141217] light:bg-white border border-rose-500/40 light:border-rose-400 space-y-4 shadow-lg animate-in fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white light:text-slate-900">Add New Long-Term Memory</h3>
                <button
                  onClick={() => setShowAddFact(false)}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center text-neutral-400 hover:text-white light:text-slate-500 light:hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 light:text-slate-700 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={newFactCategory}
                    onChange={(e) => setNewFactCategory(e.target.value as any)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white/[0.04] light:bg-slate-50 border border-white/[0.1] light:border-slate-300 text-xs md:text-sm text-white light:text-slate-900 focus:outline-none focus:border-rose-500 font-semibold"
                  >
                    <option value="Preferences" className="bg-[#1C1922] light:bg-white">Preferences</option>
                    <option value="Shared Memories" className="bg-[#1C1922] light:bg-white">Shared Memories</option>
                    <option value="Inside Jokes" className="bg-[#1C1922] light:bg-white">Inside Jokes</option>
                    <option value="Routines" className="bg-[#1C1922] light:bg-white">Routines</option>
                    <option value="Nicknames" className="bg-[#1C1922] light:bg-white">Nicknames</option>
                    <option value="General" className="bg-[#1C1922] light:bg-white">General</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-neutral-300 light:text-slate-700 uppercase mb-1">
                    Fact Statement
                  </label>
                  <input
                    type="text"
                    value={newFactText}
                    onChange={(e) => setNewFactText(e.target.value)}
                    placeholder="e.g. User loves filter coffee with less sugar in the morning"
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white/[0.04] light:bg-slate-50 border border-white/[0.1] light:border-slate-300 text-xs md:text-sm text-white light:text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAddFact(false)}
                  className="min-h-[40px] px-4 py-2 text-xs md:text-sm font-semibold text-neutral-300 light:text-slate-600 hover:text-white light:hover:text-black"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFact}
                  disabled={!newFactText.trim()}
                  className="min-h-[40px] px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs md:text-sm font-bold disabled:opacity-50"
                >
                  Save Fact
                </button>
              </div>
            </div>
          )}

          {/* Facts List */}
          {filteredFacts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFacts.map((fact) => {
                const isEditing = editingFactId === fact.id;
                return (
                  <div
                    key={fact.id}
                    className="p-5 rounded-2xl bg-white/[0.03] light:bg-white border border-white/[0.08] light:border-slate-300 hover:border-rose-500/40 light:hover:border-rose-400 transition-all flex flex-col justify-between shadow-sm group"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-neutral-300 light:text-slate-600 mb-2 font-medium">
                        <span className="font-bold text-rose-400 light:text-rose-700 uppercase tracking-wider text-[11px]">
                          {fact.category}
                        </span>
                        <div className="flex items-center gap-2 font-mono">
                          <span>{fact.learnedDate}</span>
                          <span className="text-neutral-500" aria-hidden="true">·</span>
                          <span className="text-amber-400 light:text-amber-600 font-bold">{fact.confidence}% conf</span>
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="space-y-3 mt-2">
                          <textarea
                            value={editingFactText}
                            onChange={(e) => setEditingFactText(e.target.value)}
                            rows={3}
                            className="w-full p-3 text-xs md:text-sm rounded-xl bg-black/40 light:bg-slate-50 border border-rose-500 text-white light:text-slate-900 focus:outline-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingFactId(null)}
                              className="min-h-[36px] px-3 py-1.5 text-xs text-neutral-300 light:text-slate-600 hover:text-white light:hover:text-black"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEditFact(fact.id)}
                              className="min-h-[36px] px-4 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm md:text-base text-neutral-100 light:text-slate-900 leading-relaxed font-medium">
                          {fact.fact}
                        </p>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.06] light:border-slate-200 text-xs text-neutral-400 light:text-slate-500">
                        <span className="truncate max-w-[220px]">
                          Source: {fact.source || 'Live conversation'}
                        </span>
                        <div className="flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingFactId(fact.id);
                              setEditingFactText(fact.fact);
                            }}
                            className="min-h-[36px] min-w-[36px] flex items-center justify-center p-1.5 rounded-lg text-neutral-300 light:text-slate-600 hover:text-white light:hover:text-black transition-colors"
                            title="Edit Fact"
                            aria-label="Edit this fact"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFact(fact.id)}
                            className="min-h-[36px] min-w-[36px] flex items-center justify-center p-1.5 rounded-lg text-neutral-300 light:text-slate-600 hover:text-red-400 light:hover:text-red-600 transition-colors"
                            title="Delete Fact from Memory"
                            aria-label="Delete this fact from memory"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-white/[0.01] light:bg-slate-50 border border-dashed border-white/[0.1] light:border-slate-300 text-neutral-300 light:text-slate-600 space-y-2">
              <Database className="w-8 h-8 mx-auto text-neutral-400 light:text-slate-400" />
              <p className="text-base font-bold text-white light:text-slate-900">No memory facts in this category</p>
              <p className="text-sm">
                As you chat or ingest chat logs, the companion will extract and index memory points here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sub Tab 2: Personality & Tone Tuning */}
      {activeSubTab === 'tuning' && (
        <div className="space-y-8">
          {/* Identity Parameters */}
          <div className="p-6 rounded-2xl bg-white/[0.03] light:bg-white border border-white/[0.08] light:border-slate-300 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-rose-400 light:text-rose-700 uppercase tracking-wider">
              Core Identity
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs md:text-sm font-bold text-neutral-300 light:text-slate-700 uppercase mb-1">
                  Companion Name
                </label>
                <input
                  type="text"
                  value={companionName}
                  onChange={(e) => setCompanionName(e.target.value)}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-white/[0.04] light:bg-slate-50 border border-white/[0.1] light:border-slate-300 text-sm md:text-base text-white light:text-slate-900 focus:outline-none focus:border-rose-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-bold text-neutral-300 light:text-slate-700 uppercase mb-1">
                  Relationship Dynamics
                </label>
                <input
                  type="text"
                  value={relationshipDesc}
                  onChange={(e) => setRelationshipDesc(e.target.value)}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-white/[0.04] light:bg-slate-50 border border-white/[0.1] light:border-slate-300 text-sm md:text-base text-white light:text-slate-900 focus:outline-none focus:border-rose-500 font-semibold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs md:text-sm font-bold text-neutral-300 light:text-slate-700 uppercase mb-1">
                  Endearments & Nicknames for User (Comma-separated)
                </label>
                <input
                  type="text"
                  value={nicknamesUser}
                  onChange={(e) => setNicknamesUser(e.target.value)}
                  placeholder="baba, yaar, dost, jaan"
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-white/[0.04] light:bg-slate-50 border border-white/[0.1] light:border-slate-300 text-sm md:text-base text-white light:text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Interactive Trait Sliders with High Contrast Readouts */}
          <div className="p-6 rounded-2xl bg-white/[0.03] light:bg-white border border-white/[0.08] light:border-slate-300 space-y-6 shadow-sm">
            <h3 className="text-sm font-bold text-amber-400 light:text-amber-700 uppercase tracking-wider">
              Personality Trait Balances
            </h3>

            <div className="space-y-6">
              {/* Affection */}
              <div>
                <div className="flex justify-between text-sm md:text-base mb-2">
                  <span className="font-bold text-white light:text-slate-900">Affection Level</span>
                  <span className="font-mono font-bold text-rose-400 light:text-rose-700 text-base">{localTraits.affection}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localTraits.affection}
                  onChange={(e) =>
                    setLocalTraits({ ...localTraits, affection: Number(e.target.value) })
                  }
                  className="w-full accent-rose-500 h-2 bg-neutral-700 light:bg-slate-300 rounded-lg cursor-pointer"
                  aria-label="Affection Level Slider"
                />
                <div className="flex justify-between text-xs text-neutral-400 light:text-slate-600 mt-1 font-medium">
                  <span>Reserved / Formal</span>
                  <span>Warm & Deeply Affectionate</span>
                </div>
              </div>

              {/* Hinglish Blend Ratio */}
              <div>
                <div className="flex justify-between text-sm md:text-base mb-2">
                  <span className="font-bold text-white light:text-slate-900">Hinglish Natural Ratio</span>
                  <span className="font-mono font-bold text-amber-400 light:text-amber-700 text-base">{localTraits.hinglishRatio}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localTraits.hinglishRatio}
                  onChange={(e) =>
                    setLocalTraits({ ...localTraits, hinglishRatio: Number(e.target.value) })
                  }
                  className="w-full accent-amber-500 h-2 bg-neutral-700 light:bg-slate-300 rounded-lg cursor-pointer"
                  aria-label="Hinglish Blend Ratio Slider"
                />
                <div className="flex justify-between text-xs text-neutral-400 light:text-slate-600 mt-1 font-medium">
                  <span>More English</span>
                  <span>Heavy Colloquial Hinglish Blend</span>
                </div>
              </div>

              {/* Caring vs Strict */}
              <div>
                <div className="flex justify-between text-sm md:text-base mb-2">
                  <span className="font-bold text-white light:text-slate-900">Caring & Empathy Ratio</span>
                  <span className="font-mono font-bold text-emerald-400 light:text-emerald-700 text-base">{localTraits.caring}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localTraits.caring}
                  onChange={(e) =>
                    setLocalTraits({ ...localTraits, caring: Number(e.target.value) })
                  }
                  className="w-full accent-emerald-500 h-2 bg-neutral-700 light:bg-slate-300 rounded-lg cursor-pointer"
                  aria-label="Caring & Empathy Ratio Slider"
                />
                <div className="flex justify-between text-xs text-neutral-400 light:text-slate-600 mt-1 font-medium">
                  <span>Strict / Objective</span>
                  <span>Deeply Caring & Nurturing</span>
                </div>
              </div>

              {/* Humor / Banter */}
              <div>
                <div className="flex justify-between text-sm md:text-base mb-2">
                  <span className="font-bold text-white light:text-slate-900">Humor & Banter</span>
                  <span className="font-mono font-bold text-cyan-400 light:text-cyan-700 text-base">{localTraits.humor}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localTraits.humor}
                  onChange={(e) =>
                    setLocalTraits({ ...localTraits, humor: Number(e.target.value) })
                  }
                  className="w-full accent-cyan-500 h-2 bg-neutral-700 light:bg-slate-300 rounded-lg cursor-pointer"
                  aria-label="Humor & Banter Slider"
                />
                <div className="flex justify-between text-xs text-neutral-400 light:text-slate-600 mt-1 font-medium">
                  <span>Serious & Soothing</span>
                  <span>Witty Banter & Playful Teasing</span>
                </div>
              </div>
            </div>
          </div>

          {/* Style Guidelines Manager */}
          <div className="p-6 rounded-2xl bg-white/[0.03] light:bg-white border border-white/[0.08] light:border-slate-300 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-rose-300 light:text-rose-700 uppercase tracking-wider">
              Style & Conversational Rules ({persona?.styleGuidelines?.length ?? 0})
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={newGuideline}
                onChange={(e) => setNewGuideline(e.target.value)}
                placeholder="e.g. Always remind user to take deep breaths when they mention stress"
                className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-white/[0.04] light:bg-slate-50 border border-white/[0.1] light:border-slate-300 text-sm text-white light:text-slate-900 focus:outline-none focus:border-rose-500"
              />
              <button
                onClick={handleAddGuideline}
                disabled={!newGuideline.trim()}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-white/[0.08] light:bg-slate-200 hover:bg-white/[0.14] light:hover:bg-slate-300 text-white light:text-slate-900 text-xs md:text-sm font-bold transition-colors disabled:opacity-40"
              >
                Add Rule
              </button>
            </div>

            <div className="space-y-2">
              {(persona?.styleGuidelines || []).map((rule, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-white/[0.03] light:bg-slate-50 border border-white/[0.06] light:border-slate-200 text-xs md:text-sm text-neutral-200 light:text-slate-800 flex items-center justify-between group font-medium"
                >
                  <span>{rule}</span>
                  <button
                    onClick={() => handleDeleteGuideline(idx)}
                    className="min-h-[36px] min-w-[36px] flex items-center justify-center p-1 text-neutral-400 hover:text-red-400 light:text-slate-500 light:hover:text-red-600 transition-colors"
                    aria-label={`Delete rule ${idx + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveTuning}
              disabled={isSaving}
              className="min-h-[48px] px-8 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm md:text-base transition-colors shadow-lg shadow-rose-600/25 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              <span>{isSaving ? 'Saving Changes...' : 'Save All Brain Adjustments'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Sub Tab 3: Active Prompt Inspection */}
      {activeSubTab === 'prompt' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white/[0.03] light:bg-slate-100 border border-white/[0.08] light:border-slate-300 text-sm text-neutral-300 light:text-slate-700 font-medium">
            Below is the full, transparent System Instruction automatically compiled from your companion's
            personality parameters, learned facts, and style rules sent to Gemini on every turn.
          </div>

          <div className="p-6 rounded-2xl bg-black/80 light:bg-slate-900 border border-white/[0.1] font-mono text-xs md:text-sm text-emerald-300 light:text-emerald-400 leading-relaxed whitespace-pre-wrap max-h-[600px] overflow-y-auto">
{`SYSTEM INSTRUCTION COMPILED FOR: ${persona?.name || 'Noor'}
------------------------------------------------------------
You are "${persona?.name || 'Noor'}", an intimate, deeply personal AI companion with a caring, human-like voice.
Your relationship with the user is: ${persona?.relationship || 'Personal AI Companion & Confidant'}.
Language Mix: ${persona?.languageMix || 'Hinglish (Natural conversational blend of Hindi & English)'}.

Personality & Tone Balance:
Affection: ${persona?.traits?.affection || 80}%, Humor/Banter: ${persona?.traits?.humor || 65}%, Caring/Empathy: ${persona?.traits?.caring || 85}%, Energy: ${persona?.traits?.energy || 60}%, Hinglish Ratio: ${persona?.traits?.hinglishRatio || 75}%

Style & Voice Guidelines:
${(persona?.styleGuidelines || []).map((g) => `- ${g}`).join('\n')}

Nicknames & Endearments:
- For User: ${(persona?.nicknames?.forUser || []).join(', ') || 'baba, yaar'}
- For Companion: ${(persona?.nicknames?.forCompanion || []).join(', ') || persona?.name || 'Noor'}

Active Memory Bank Excerpts:
${(persona?.memoryBank || []).slice(0, 10).map((f) => `• [${f.category}] ${f.fact}`).join('\n')}`}
          </div>
        </div>
      )}

      {/* Sub Tab 4: Execution Logs */}
      {activeSubTab === 'logs' && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-300 light:text-slate-600 font-medium">
            Transparent execution logs for every companion turn, including response latency, estimated tokens,
            retrieved memories injected, and companion internal reflection.
          </p>

          {persona?.executionLogs && persona.executionLogs.length > 0 ? (
            <div className="space-y-4">
              {persona.executionLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-5 rounded-2xl bg-white/[0.03] light:bg-white border border-white/[0.08] light:border-slate-300 space-y-3 text-xs md:text-sm shadow-sm"
                >
                  <div className="flex items-center justify-between text-xs text-neutral-300 light:text-slate-600 font-mono font-medium">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-500" />
                      {log.timestamp}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-amber-400 light:text-amber-700 font-bold">{log.latencyMs} ms latency</span>
                      <span className="text-neutral-500" aria-hidden="true">·</span>
                      <span className="text-rose-400 light:text-rose-700 font-bold">~{log.tokens} tokens</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-black/30 light:bg-slate-50 border border-white/[0.06] light:border-slate-200">
                      <span className="text-[11px] uppercase font-bold text-neutral-400 light:text-slate-500 block mb-1">
                        User Query
                      </span>
                      <p className="text-white light:text-slate-900 font-medium">{log.userQuery}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-rose-500/10 light:bg-rose-50 border border-rose-500/25 light:border-rose-200">
                      <span className="text-[11px] uppercase font-bold text-rose-400 light:text-rose-700 block mb-1">
                        Companion Reply
                      </span>
                      <p className="text-white light:text-slate-900 font-medium">{log.companionResponse}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-white/[0.01] light:bg-slate-50 border border-dashed border-white/[0.1] light:border-slate-300 text-neutral-400 light:text-slate-600">
              No chat execution logs recorded yet. Send a message in Chat to see real-time execution logs!
            </div>
          )}
        </div>
      )}
    </div>
  );
};
