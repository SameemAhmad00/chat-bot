import React from 'react';
import { X, Sparkles, Brain, Clock, ShieldCheck, Database, Terminal } from 'lucide-react';
import { PersonaState } from '../types';

interface ContextDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  persona: PersonaState | null;
  lastRetrievedMemories: string[];
  lastLatencyMs?: number;
  lastTokens?: number;
  lastThoughts?: string;
}

export const ContextDrawer: React.FC<ContextDrawerProps> = ({
  isOpen,
  onClose,
  persona,
  lastRetrievedMemories,
  lastLatencyMs,
  lastTokens,
  lastThoughts,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg h-full bg-[#141217] light:bg-white border-l border-white/[0.1] light:border-slate-300 flex flex-col shadow-2xl overflow-hidden">
        {/* Header with >=44px close button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] light:border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 light:bg-amber-100 text-amber-400 light:text-amber-700">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white light:text-slate-900">Inside the Brain: Context Inspector</h2>
              <p className="text-xs md:text-sm text-neutral-300 light:text-slate-600 font-medium">Real-time prompt injection & retrieved memory telemetry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-neutral-300 hover:text-white light:text-slate-500 light:hover:text-black hover:bg-white/[0.08] light:hover:bg-slate-100 transition-colors"
            title="Close Drawer"
            aria-label="Close Context Inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Recent Execution Telemetry */}
          <div className="p-5 rounded-2xl bg-white/[0.03] light:bg-slate-50 border border-white/[0.08] light:border-slate-200 space-y-3 shadow-sm">
            <div className="flex items-center justify-between text-xs md:text-sm font-semibold text-neutral-300 light:text-slate-600">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                Latest Response Telemetry
              </span>
              <span className="font-mono text-white light:text-slate-900">Live</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-black/40 light:bg-white border border-white/[0.06] light:border-slate-200">
                <div className="text-xs text-neutral-400 light:text-slate-500 font-semibold">Response Latency</div>
                <div className="text-lg font-bold font-mono text-amber-400 light:text-amber-700 mt-0.5">
                  {lastLatencyMs ? `${lastLatencyMs} ms` : 'Idle'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 light:bg-white border border-white/[0.06] light:border-slate-200">
                <div className="text-xs text-neutral-400 light:text-slate-500 font-semibold">Est. Context Tokens</div>
                <div className="text-lg font-bold font-mono text-rose-400 light:text-rose-700 mt-0.5">
                  {lastTokens ? `${lastTokens}` : '—'}
                </div>
              </div>
            </div>

            {lastThoughts && (
              <div className="mt-2 text-xs md:text-sm text-neutral-200 light:text-slate-800 p-3 rounded-xl bg-rose-500/10 light:bg-rose-50 border border-rose-500/25 light:border-rose-200 font-medium">
                <span className="font-bold text-rose-400 light:text-rose-700 block mb-1">Companion's Inner Reflection:</span>
                "{lastThoughts}"
              </div>
            )}
          </div>

          {/* Active Retrieved Memories */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-neutral-300 light:text-slate-700 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-rose-500" />
                Retrieved Memories for Current Context
              </h3>
              <span className="text-xs text-neutral-400 light:text-slate-500 font-mono font-bold">
                {lastRetrievedMemories.length} active
              </span>
            </div>

            {lastRetrievedMemories.length > 0 ? (
              <div className="space-y-2.5">
                {lastRetrievedMemories.map((mem, i) => (
                  <div
                    key={i}
                    className="p-3.5 text-xs md:text-sm rounded-xl bg-white/[0.03] light:bg-slate-50 border border-white/[0.08] light:border-slate-200 text-neutral-200 light:text-slate-800 flex items-start gap-2.5 font-medium shadow-sm"
                  >
                    <span className="text-amber-400 light:text-amber-600 font-mono mt-0.5">•</span>
                    <span>{mem}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 text-sm text-center rounded-xl bg-white/[0.02] light:bg-slate-50 border border-dashed border-white/[0.1] light:border-slate-300 text-neutral-300 light:text-slate-600 font-medium">
                No custom memories injected yet. Send a message or upload chat histories to train!
              </div>
            )}
          </div>

          {/* Persona Traits */}
          {persona && (
            <div className="space-y-3">
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-neutral-300 light:text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Active Personality Configuration
              </h3>
              <div className="p-5 rounded-2xl bg-white/[0.03] light:bg-slate-50 border border-white/[0.08] light:border-slate-200 space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between text-xs md:text-sm">
                  <span className="text-neutral-400 light:text-slate-500 font-semibold">Companion Name</span>
                  <span className="font-bold text-white light:text-slate-900">{persona.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs md:text-sm">
                  <span className="text-neutral-400 light:text-slate-500 font-semibold">Language Dynamic</span>
                  <span className="text-rose-400 light:text-rose-700 font-bold">{persona.languageMix}</span>
                </div>
                <div className="flex items-center justify-between text-xs md:text-sm">
                  <span className="text-neutral-400 light:text-slate-500 font-semibold">Relationship Type</span>
                  <span className="text-neutral-200 light:text-slate-800 font-bold">{persona.relationship}</span>
                </div>

                <div className="pt-2 border-t border-white/[0.08] light:border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-neutral-400 light:text-slate-500">Trait Balances:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs md:text-sm font-semibold">
                    <div className="p-2.5 rounded-lg bg-black/30 light:bg-white border light:border-slate-200 flex justify-between">
                      <span className="text-neutral-400 light:text-slate-500">Affection</span>
                      <span className="font-mono text-rose-400 light:text-rose-700 font-bold">{persona.traits.affection}%</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/30 light:bg-white border light:border-slate-200 flex justify-between">
                      <span className="text-neutral-400 light:text-slate-500">Hinglish</span>
                      <span className="font-mono text-amber-400 light:text-amber-700 font-bold">{persona.traits.hinglishRatio}%</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/30 light:bg-white border light:border-slate-200 flex justify-between">
                      <span className="text-neutral-400 light:text-slate-500">Caring</span>
                      <span className="font-mono text-emerald-400 light:text-emerald-700 font-bold">{persona.traits.caring}%</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/30 light:bg-white border light:border-slate-200 flex justify-between">
                      <span className="text-neutral-400 light:text-slate-500">Humor</span>
                      <span className="font-mono text-cyan-400 light:text-cyan-700 font-bold">{persona.traits.humor}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-black/40 light:bg-slate-100 border-t border-white/[0.08] light:border-slate-200 text-center text-xs md:text-sm text-neutral-400 light:text-slate-600 font-medium flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Local Brain Privacy Guarantee: Logs are stored in /data/brain/</span>
        </div>
      </div>
    </div>
  );
};
