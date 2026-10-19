import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  X,
  MessageSquare,
  UploadCloud,
  Brain,
  FolderArchive,
  Sparkles,
  Sun,
  Moon,
  Zap,
  Type,
  Check,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { PersonaState } from '../types';

interface NavbarProps {
  activeTab: 'chat' | 'upload' | 'brain' | 'files';
  setActiveTab: (tab: 'chat' | 'upload' | 'brain' | 'files') => void;
  companionName: string;
  persona?: PersonaState | null;
  onOpenContextInspector: () => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  availableDates: string[];
  onReloadSession?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  companionName,
  persona,
  onOpenContextInspector,
  selectedDate,
  onSelectDate,
  availableDates,
  onReloadSession,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { theme, setTheme, fontScale, setFontScale } = useAccessibility();

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectTab = (tab: 'chat' | 'upload' | 'brain' | 'files') => {
    setActiveTab(tab);
    setIsOpen(false);
  };

  const navItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare, desc: 'Chat with companion' },
    { id: 'upload', label: 'Training Hub', icon: UploadCloud, desc: 'Upload chats & screenshots' },
    { id: 'brain', label: 'Inside the Brain', icon: Brain, desc: 'Memories, traits & prompt' },
    { id: 'files', label: 'Files & Memory', icon: FolderArchive, desc: 'Manage date logs & folders' },
  ] as const;

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-3 md:px-5 py-2 bg-[#0E0D10]/95 light:bg-white/95 backdrop-blur-md border-b border-white/[0.08] light:border-slate-300">
      {/* Companion Avatar & Info (Integrated in Single Compact Header) */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setActiveTab('chat')}
          className="relative focus-visible:ring-2 focus-visible:ring-rose-500 rounded-full shrink-0"
          aria-label="Persona AI Companion Home"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 p-0.5 shadow-md">
            <div className="w-full h-full rounded-full bg-[#1A1720] light:bg-slate-100 flex items-center justify-center text-rose-300 light:text-rose-700 font-bold text-sm">
              {persona?.name ? persona.name.slice(0, 1).toUpperCase() : companionName ? companionName.slice(0, 1).toUpperCase() : 'N'}
            </div>
          </div>
          <span
            className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0E0D10] light:ring-white"
            title="Online"
            aria-label="Companion status: Online"
          />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2 truncate">
            <span className="text-sm md:text-base font-bold text-white light:text-slate-900 tracking-tight truncate">
              {persona?.name || companionName || 'Noor'}
            </span>
            <span className="text-neutral-500 light:text-slate-400 text-xs hidden sm:inline" aria-hidden="true">·</span>
            <span className="text-xs text-rose-300 light:text-rose-700 font-semibold hidden sm:inline truncate">
              {persona?.relationship || 'Personal AI Companion'}
            </span>
            <span className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/[0.06] light:bg-slate-200 text-neutral-400 light:text-slate-600 font-mono hidden md:inline shrink-0">
              Persona AI
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-400 light:text-slate-600 truncate">
            <span>Hinglish</span>
            <span aria-hidden="true">·</span>
            <span>Affection {persona?.traits?.affection ?? 80}%</span>
            {persona?.memoryBank && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-[11px] hidden xs:inline">{persona.memoryBank.length} memories</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hamburger Menu Toggle Button */}
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border transition-all ${
            isOpen
              ? 'bg-rose-500/20 text-rose-300 light:bg-rose-100 light:text-rose-700 border-rose-500/50'
              : 'bg-white/[0.05] light:bg-slate-100 text-white light:text-slate-900 border-white/[0.1] light:border-slate-300 hover:bg-white/[0.1] light:hover:bg-slate-200'
          }`}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation and settings menu'}
        >
          {isOpen ? <X className="w-5 h-5 text-rose-400" /> : <Menu className="w-5 h-5" />}
          <span className="text-xs font-semibold hidden sm:inline">Menu</span>
        </button>

        {/* Hamburger Dropdown Drawer */}
        {isOpen && (
          <div
            ref={menuRef}
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#141217] light:bg-white border border-white/[0.12] light:border-slate-300 shadow-2xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150 z-50 text-white light:text-slate-900 max-h-[85vh] overflow-y-auto scrollbar-thin"
            role="menu"
            aria-orientation="vertical"
          >
            {/* Section 1: Navigation Tabs */}
            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 light:text-slate-500 px-2 mb-1.5">
                Navigation
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`min-h-[44px] w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-colors ${
                      isActive
                        ? 'bg-rose-500/20 text-rose-300 light:bg-rose-100 light:text-rose-800 font-bold border border-rose-500/40'
                        : 'text-neutral-200 light:text-slate-700 hover:text-white light:hover:text-black hover:bg-white/[0.06] light:hover:bg-slate-100'
                    }`}
                    role="menuitem"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isActive ? 'bg-rose-500/20 text-rose-300' : 'bg-white/[0.04] light:bg-slate-100 text-neutral-400 light:text-slate-600'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{item.label}</div>
                        <div className="text-[11px] text-neutral-400 light:text-slate-500 font-normal">
                          {item.desc}
                        </div>
                      </div>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-rose-400" />}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="border-t border-white/[0.08] light:border-slate-200" />

            {/* Section 2: Date Session History Switcher (moved into hamburger) */}
            <div className="space-y-2 px-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 light:text-slate-500">
                Chat Session Date
              </div>
              <div className="flex items-center gap-2">
                <div className="min-h-[44px] flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 light:bg-slate-100 border border-white/[0.08] light:border-slate-300 text-xs md:text-sm text-neutral-200 light:text-slate-800">
                  <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                  <select
                    value={selectedDate}
                    onChange={(e) => {
                      onSelectDate(e.target.value);
                      if (activeTab !== 'chat') setActiveTab('chat');
                    }}
                    className="w-full bg-transparent text-white light:text-slate-900 focus:outline-none cursor-pointer font-mono text-xs md:text-sm font-semibold"
                    aria-label="Select Chat Session Date"
                  >
                    {availableDates.map((date) => (
                      <option key={date} value={date} className="bg-[#1C1922] light:bg-white text-white light:text-slate-900">
                        {date}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => onReloadSession?.()}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-black/40 light:bg-slate-100 border border-white/[0.08] light:border-slate-300 text-neutral-300 light:text-slate-700 hover:text-white light:hover:text-black hover:bg-white/[0.08] light:hover:bg-slate-200 transition-colors"
                  title="Reload current session"
                  aria-label="Reload current session"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/[0.08] light:border-slate-200" />

            {/* Section 3: Quick Accessibility Settings */}
            <div className="space-y-3 px-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 light:text-slate-500">
                Display & Accessibility
              </div>

              {/* Theme Picker */}
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-neutral-300 light:text-slate-600">Theme Mode:</div>
                <div className="grid grid-cols-3 gap-1.5 bg-black/40 light:bg-slate-100 p-1 rounded-xl border border-white/[0.06] light:border-slate-200">
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`min-h-[36px] flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      theme === 'dark'
                        ? 'bg-rose-500/25 text-rose-300 border border-rose-500/60 shadow-sm'
                        : 'border border-transparent text-neutral-400 hover:text-white hover:bg-white/[0.06]'
                    }`}
                    aria-pressed={theme === 'dark'}
                  >
                    <Moon className="w-3.5 h-3.5 text-rose-400" />
                    <span>Dark</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`min-h-[36px] flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      theme === 'light'
                        ? 'bg-amber-500/25 text-amber-300 border border-amber-500/60 shadow-sm'
                        : 'border border-transparent text-neutral-400 hover:text-white hover:bg-white/[0.06]'
                    }`}
                    aria-pressed={theme === 'light'}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('high-contrast')}
                    className={`min-h-[36px] flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      theme === 'high-contrast'
                        ? 'bg-yellow-400/30 text-yellow-300 border border-yellow-400 shadow-sm'
                        : 'border border-transparent text-neutral-400 hover:text-white hover:bg-white/[0.06]'
                    }`}
                    aria-pressed={theme === 'high-contrast'}
                  >
                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Contrast</span>
                  </button>
                </div>
              </div>

              {/* Font Scale Picker */}
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-neutral-300 light:text-slate-600">Text Sizing:</div>
                <div className="grid grid-cols-3 gap-1.5 bg-black/40 light:bg-slate-100 p-1 rounded-xl border border-white/[0.06] light:border-slate-200">
                  <button
                    type="button"
                    onClick={() => setFontScale('normal')}
                    className={`min-h-[36px] flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      fontScale === 'normal'
                        ? 'bg-rose-500/25 text-rose-300 border border-rose-500/60 shadow-sm'
                        : 'border border-transparent text-neutral-400 hover:text-white hover:bg-white/[0.06]'
                    }`}
                    aria-pressed={fontScale === 'normal'}
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span>100%</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontScale('large')}
                    className={`min-h-[36px] flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      fontScale === 'large'
                        ? 'bg-rose-500/25 text-rose-300 border border-rose-500/60 shadow-sm'
                        : 'border border-transparent text-neutral-400 hover:text-white hover:bg-white/[0.06]'
                    }`}
                    aria-pressed={fontScale === 'large'}
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span>115%</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontScale('xlarge')}
                    className={`min-h-[36px] flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      fontScale === 'xlarge'
                        ? 'bg-rose-500/25 text-rose-300 border border-rose-500/60 shadow-sm'
                        : 'border border-transparent text-neutral-400 hover:text-white hover:bg-white/[0.06]'
                    }`}
                    aria-pressed={fontScale === 'xlarge'}
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span>130%</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/[0.08] light:border-slate-200" />

            {/* Section 4: Inspect Brain Action Button */}
            <div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenContextInspector();
                }}
                className="min-h-[44px] w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 light:bg-amber-100 hover:bg-amber-500/25 light:hover:bg-amber-200 border border-amber-500/30 light:border-amber-400 text-amber-200 light:text-amber-900 text-xs md:text-sm font-bold transition-colors shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-amber-400 light:text-amber-600" />
                <span>Inspect Brain Context</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
