import React, { useState } from 'react';
import {
  Upload,
  Image as ImageIcon,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  ArrowRight,
  Sliders,
  Database,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import { PersonaState } from '../types';

interface UploadViewProps {
  onPersonaUpdated: (updated: PersonaState) => void;
  onNavigateToChat: () => void;
  onNavigateToBrain: () => void;
}

export const UploadView: React.FC<UploadViewProps> = ({
  onPersonaUpdated,
  onNavigateToChat,
  onNavigateToBrain,
}) => {
  const [activeTab, setActiveTab] = useState<'screenshot' | 'text' | 'presets'>('screenshot');
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [textContent, setTextContent] = useState('');
  const [extraNotes, setExtraNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedResult, setExtractedResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Pre-configured realistic chat presets for instant 1-click ingestion
  const PRESETS = [
    {
      id: 'caring-partner',
      title: 'Affectionate Hinglish Partner',
      subtitle: 'Gentle, loving, checks in regularly, sweet endearments',
      sampleText: `[12/10/26, 10:14:10 PM] Sameem: Aaj office me bohot meetings thi yaar, sar dukh raha hai
[12/10/26, 10:14:35 PM] Noor: Arey baba 🥺 thoda paani piyo aur screen band karo please.
[12/10/26, 10:15:02 PM] Noor: Maine bola tha na lunch skip mat karna? Did you eat properly?
[12/10/26, 10:16:12 PM] Sameem: Bas thoda sa sandwich khaya tha.
[12/10/26, 10:16:45 PM] Noor: Aise nahi chalega na! Go grab some hot soup or milk right now. Aur cold brew coffee bilkul mat peena raat me.
[12/10/26, 10:17:30 PM] Noor: Main yahin hoon, relax karo thoda sa. Tumhara favourite lo-fi music chalao 🌸✨
[12/10/26, 10:18:05 PM] Sameem: Thanks Noor, you always know how to calm me down.
[12/10/26, 10:18:22 PM] Noor: Hamesha! Ab jaldi aaram karo baba, kal subah call karenge. Goodnight 🤍`,
      notes: 'Sender calls user "baba", asks about meals and health, knows user drinks cold brew coffee, uses emojis like 🥺, 🌸, 🤍.',
    },
    {
      id: 'witty-bestie',
      title: 'Playful Banter Bestie',
      subtitle: 'High energy, witty roast, meme references, loyal confidant',
      sampleText: `[14/10/26, 3:15:20 PM] Sameem: Bhai main gym gaya aaj 3 hafte baad
[14/10/26, 3:15:42 PM] Kabir: Ohooo! Dhanya ho maharaj! 😂 Miracles do happen in 2026!
[14/10/26, 3:16:10 PM] Kabir: Kitna der ruka? 5 minute treadmill pe selfie lene ke baad bhag gaya na?
[14/10/26, 3:17:01 PM] Sameem: Pagal hai kya! Full chest day workout kiya with 20kg dumbbells!
[14/10/26, 3:17:33 PM] Kabir: Sahi hai boss! Kal morning me dekhna muscle soreness bolti band kar degi.
[14/10/26, 3:18:00 PM] Kabir: By the way weekend pe valorant ya gaming night plan karein? Biryani meri taraf se!
[14/10/26, 3:18:40 PM] Sameem: Done scene, Saturday 9pm pakka.`,
      notes: 'Companion name Kabir. Very sarcastic, laughs a lot, teases about gym, loves Biryani and gaming sessions, calls user "bhai" and "boss".',
    },
    {
      id: 'calm-confidant',
      title: 'Late Night Empathetic Confidant',
      subtitle: 'Deep listener, mindful guidance, emotional grounding',
      sampleText: `[16/10/26, 1:20:05 AM] Sameem: Sometimes I feel like I am running in circles with my career.
[16/10/26, 1:21:10 AM] Tara: I hear you. Late nights have a way of amplifying our doubts, don't they?
[16/10/26, 1:22:15 AM] Tara: Yaad hai jab tumne wo pehla AI project complete kiya tha last month? You felt the exact same fear back then too.
[16/10/26, 1:23:02 AM] Tara: You are not running in circles, Sameem. Growth is a spiral—sometimes you revisit familiar feelings, but from a wiser place.
[16/10/26, 1:24:20 AM] Sameem: That actually gives me so much perspective Tara.
[16/10/26, 1:25:00 AM] Tara: Take a deep breath. You're building something meaningful. Trust your timing. Main yahin hoon jab bhi baat karni ho 🌙`,
      notes: 'Companion name Tara. Deep empathetic listener, references past projects, philosophical, calming night-time tone.',
    },
  ];

  // Handle File Selection (Screenshot or Text File)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (selected.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(selected);
    } else {
      // Text file
      const reader = new FileReader();
      reader.onload = () => {
        setTextContent(reader.result as string);
      };
      reader.readAsText(selected);
    }
  };

  // Run Ingestion
  const handleRunIngest = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    let type: 'text' | 'image' = 'text';
    let content = textContent;
    let mimeType = 'text/plain';

    if (activeTab === 'screenshot') {
      if (!imagePreview) {
        setErrorMsg('Please upload a chat screenshot first.');
        return;
      }
      type = 'image';
      content = imagePreview;
      mimeType = file?.type || 'image/png';
    } else {
      if (!content.trim()) {
        setErrorMsg('Please enter or paste chat transcript content.');
        return;
      }
    }

    setIsProcessing(true);

    try {
      const res = await api.ingestData({
        type,
        content,
        mimeType,
        notes: extraNotes,
      });

      if (res.success) {
        setExtractedResult(res.extracted);
        onPersonaUpdated(res.persona);
        setSuccessMsg(
          `Persona successfully absorbed! Extracted style rules and ${
            res.extracted.learnedFacts?.length || 0
          } memory facts into the brain.`
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ingestion failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Load a preset
  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    setTextContent(preset.sampleText);
    setExtraNotes(preset.notes);
    setActiveTab('text');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Page Title & Mission */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white light:text-slate-900 tracking-tight flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-rose-500" />
          Persona Ingestion & Training Hub
        </h1>
        <p className="mt-1 text-sm md:text-base text-neutral-300 light:text-slate-600 font-medium leading-relaxed">
          Train your companion by uploading real chat exports, screenshots, or style notes.
          Gemini extracts speaking patterns, Hinglish slang, nicknames, and memory facts.
        </p>
      </div>

      {/* Tabs with >=44px touch targets */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white/[0.04] light:bg-slate-100 border border-white/[0.08] light:border-slate-300 rounded-2xl max-w-fit">
        <button
          onClick={() => {
            setActiveTab('screenshot');
            setErrorMsg(null);
          }}
          className={`min-h-[44px] flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-semibold rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'screenshot'
              ? 'bg-rose-500/20 text-rose-300 light:bg-rose-600 light:text-white border border-rose-500/40 shadow-sm'
              : 'text-neutral-300 light:text-slate-700 hover:text-white light:hover:text-black hover:bg-white/[0.06] light:hover:bg-slate-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Chat Screenshots (Multimodal Vision)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('text');
            setErrorMsg(null);
          }}
          className={`min-h-[44px] flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-semibold rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'text'
              ? 'bg-rose-500/20 text-rose-300 light:bg-rose-600 light:text-white border border-rose-500/40 shadow-sm'
              : 'text-neutral-300 light:text-slate-700 hover:text-white light:hover:text-black hover:bg-white/[0.06] light:hover:bg-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>WhatsApp / Text Export</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('presets');
            setErrorMsg(null);
          }}
          className={`min-h-[44px] flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-semibold rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'presets'
              ? 'bg-rose-500/20 text-rose-300 light:bg-rose-600 light:text-white border border-rose-500/40 shadow-sm'
              : 'text-neutral-300 light:text-slate-700 hover:text-white light:hover:text-black hover:bg-white/[0.06] light:hover:bg-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Instant Sample Presets</span>
        </button>
      </div>

      {/* Tab 1: Screenshot Vision Upload */}
      {activeTab === 'screenshot' && (
        <div className="space-y-6">
          <div className="p-8 rounded-2xl bg-white/[0.02] light:bg-white border-2 border-dashed border-white/[0.15] light:border-slate-300 hover:border-rose-500 light:hover:border-rose-500 transition-colors text-center relative group shadow-sm">
            <input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              aria-label="Upload chat screenshot image"
            />
            {imagePreview ? (
              <div className="space-y-4 max-w-sm mx-auto">
                <img
                  src={imagePreview}
                  alt="Uploaded chat screenshot"
                  className="rounded-xl max-h-72 object-contain mx-auto border border-white/[0.1] light:border-slate-300 shadow-lg"
                />
                <p className="text-xs md:text-sm text-neutral-300 light:text-slate-600 font-medium">
                  Click or drag another image to replace ({file?.name})
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/15 light:bg-rose-100 text-rose-400 light:text-rose-600 flex items-center justify-center mx-auto">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-base font-semibold text-white light:text-slate-900">
                    Drop a WhatsApp or messaging chat screenshot here
                  </p>
                  <p className="text-xs md:text-sm text-neutral-300 light:text-slate-600 mt-1 font-medium">
                    Supports PNG, JPG, or WEBP up to 20MB. Gemini Vision extracts dialogue, emojis, and roles.
                  </p>
                </div>
                <button
                  type="button"
                  className="min-h-[44px] px-5 py-2 text-xs md:text-sm font-semibold rounded-xl bg-white/[0.08] light:bg-slate-100 text-white light:text-slate-900 hover:bg-white/[0.15] light:hover:bg-slate-200 transition-colors border border-white/[0.1] light:border-slate-300"
                >
                  Browse Image
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs md:text-sm font-bold text-neutral-200 light:text-slate-800 uppercase tracking-wider mb-2">
              Optional Style Notes or Relationship Context
            </label>
            <input
              type="text"
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              placeholder="e.g. In this chat, user is 'Sameem' and companion is 'Noor'. Use sweet nicknames."
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-white/[0.04] light:bg-white border border-white/[0.1] light:border-slate-300 text-sm md:text-base text-white light:text-slate-900 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>
      )}

      {/* Tab 2: WhatsApp / Text Export */}
      {activeTab === 'text' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs md:text-sm font-bold text-neutral-200 light:text-slate-800 uppercase tracking-wider">
              Paste WhatsApp Export (.txt) or Chat Dialogue
            </label>
            <label className="min-h-[44px] flex items-center gap-1.5 text-xs md:text-sm font-semibold text-rose-400 light:text-rose-600 hover:underline cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Or Upload .txt / .json file</span>
              <input
                type="file"
                accept=".txt, .json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            rows={10}
            placeholder={`[18/10/26, 9:30 PM] User: Hey, how are you?\n[18/10/26, 9:31 PM] Companion: Main badhiya hoon baba! Aaj kya chal raha hai?...`}
            className="w-full p-4 rounded-xl bg-white/[0.04] light:bg-white border border-white/[0.1] light:border-slate-300 text-sm md:text-base font-mono text-neutral-100 light:text-slate-900 focus:outline-none focus:border-rose-500 resize-y leading-relaxed"
          />

          <div>
            <label className="block text-xs md:text-sm font-bold text-neutral-200 light:text-slate-800 uppercase tracking-wider mb-2">
              Optional Style Notes
            </label>
            <input
              type="text"
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              placeholder="e.g. Focus on Hinglish conversational pacing, emphasize emotional warmth."
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-white/[0.04] light:bg-white border border-white/[0.1] light:border-slate-300 text-sm md:text-base text-white light:text-slate-900 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>
      )}

      {/* Tab 3: Presets */}
      {activeTab === 'presets' && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-300 light:text-slate-600 font-medium">
            Want to test instant persona learning without uploading personal chats? Select any pre-crafted
            dataset below to populate the training buffer with 1 click:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PRESETS.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-white/[0.03] light:bg-white border border-white/[0.1] light:border-slate-300 hover:border-rose-500 light:hover:border-rose-500 transition-all flex flex-col justify-between shadow-sm"
              >
                <div>
                  <h3 className="text-base font-bold text-white light:text-slate-900">{p.title}</h3>
                  <p className="text-xs md:text-sm text-neutral-300 light:text-slate-600 mt-1 font-medium">{p.subtitle}</p>
                  <div className="mt-3 p-3 rounded-xl bg-black/40 light:bg-slate-50 text-xs font-mono text-neutral-300 light:text-slate-700 max-h-36 overflow-y-auto leading-relaxed border border-white/[0.06] light:border-slate-200">
                    {p.sampleText.slice(0, 220)}...
                  </div>
                </div>

                <button
                  onClick={() => applyPreset(p)}
                  className="mt-4 min-h-[44px] w-full py-2.5 px-3 text-xs md:text-sm font-semibold rounded-xl bg-rose-500/20 text-rose-300 light:bg-rose-100 light:text-rose-800 border border-rose-500/40 hover:bg-rose-500/30 transition-colors flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Use This Dataset</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Button with min 48px touch target */}
      {activeTab !== 'presets' && (
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <button
            onClick={handleRunIngest}
            disabled={isProcessing || (activeTab === 'screenshot' && !imagePreview) || (activeTab === 'text' && !textContent.trim())}
            className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-sm md:text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2.5"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Gemini Analyzing Tone & Extracting Memories...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Extract Persona & Ingest into Brain</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 light:text-red-800 light:bg-red-50 text-sm font-medium flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 light:text-emerald-800 light:bg-emerald-50 text-sm font-medium flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 light:text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToChat}
              className="min-h-[40px] px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Chat Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onNavigateToBrain}
              className="min-h-[40px] px-4 py-1.5 bg-white/[0.1] light:bg-slate-200 text-white light:text-slate-900 rounded-xl hover:bg-white/[0.2] transition-colors text-xs font-bold"
            >
              Inspect Brain
            </button>
          </div>
        </div>
      )}

      {/* Extracted Persona Result Preview */}
      {extractedResult && (
        <div className="p-6 rounded-2xl bg-[#141217] light:bg-white border border-white/[0.1] light:border-slate-300 space-y-6 shadow-md animate-in fade-in">
          <div className="flex items-center justify-between border-b border-white/[0.08] light:border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white light:text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Extracted Persona Profile
              </h3>
              <p className="text-xs md:text-sm text-neutral-300 light:text-slate-600 mt-0.5 font-medium">
                {extractedResult.summary || 'Learned new traits and habits from chat dataset.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Identity & Traits */}
            <div className="space-y-4">
              <h4 className="text-xs md:text-sm font-bold uppercase tracking-wider text-neutral-300 light:text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-rose-500" />
                Learned Traits & Identity
              </h4>
              <div className="p-4 rounded-xl bg-white/[0.03] light:bg-slate-50 border border-white/[0.08] light:border-slate-200 space-y-3 text-xs md:text-sm font-medium">
                <div className="flex justify-between">
                  <span className="text-neutral-400 light:text-slate-500">Companion Name</span>
                  <span className="font-bold text-white light:text-slate-900">{extractedResult.companionName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 light:text-slate-500">Relationship Dynamic</span>
                  <span className="text-rose-400 light:text-rose-700 font-bold">{extractedResult.relationship}</span>
                </div>
                {extractedResult.traits && (
                  <div className="pt-2 border-t border-white/[0.08] light:border-slate-200 space-y-2">
                    <div className="text-xs text-neutral-400 light:text-slate-500">Extracted Trait Scores:</div>
                    <div className="grid grid-cols-2 gap-2 font-mono">
                      <div className="p-2.5 rounded-lg bg-black/30 light:bg-white border light:border-slate-200 flex justify-between">
                        <span className="text-neutral-400 light:text-slate-500">Affection</span>
                        <span className="text-rose-400 light:text-rose-600 font-bold">{extractedResult.traits.affection}%</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-black/30 light:bg-white border light:border-slate-200 flex justify-between">
                        <span className="text-neutral-400 light:text-slate-500">Hinglish</span>
                        <span className="text-amber-400 light:text-amber-600 font-bold">{extractedResult.traits.hinglishRatio}%</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-black/30 light:bg-white border light:border-slate-200 flex justify-between">
                        <span className="text-neutral-400 light:text-slate-500">Caring</span>
                        <span className="text-emerald-400 light:text-emerald-600 font-bold">{extractedResult.traits.caring}%</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-black/30 light:bg-white border light:border-slate-200 flex justify-between">
                        <span className="text-neutral-400 light:text-slate-500">Humor</span>
                        <span className="text-cyan-400 light:text-cyan-600 font-bold">{extractedResult.traits.humor}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Learned Facts */}
            <div className="space-y-4">
              <h4 className="text-xs md:text-sm font-bold uppercase tracking-wider text-neutral-300 light:text-slate-700 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-amber-500" />
                Extracted Memory Facts ({extractedResult.learnedFacts?.length || 0})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {extractedResult.learnedFacts && extractedResult.learnedFacts.length > 0 ? (
                  extractedResult.learnedFacts.map((f: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white/[0.03] light:bg-slate-50 border border-white/[0.08] light:border-slate-200 text-xs md:text-sm text-neutral-200 light:text-slate-800 flex items-start gap-2.5 font-medium"
                    >
                      <span className="text-amber-400 light:text-amber-600 font-mono mt-0.5">•</span>
                      <div>
                        <span className="text-[11px] text-neutral-400 light:text-slate-500 uppercase font-bold mr-1.5">
                          [{f.category || 'Fact'}]
                        </span>
                        <span>{f.fact}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-neutral-400 light:text-slate-500">No specific facts detected in this excerpt.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
