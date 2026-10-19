import React, { useState, useEffect } from 'react';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { Navbar } from './components/Navbar';
import { ChatView } from './components/ChatView';
import { UploadView } from './components/UploadView';
import { BrainView } from './components/BrainView';
import { FilesView } from './components/FilesView';
import { ContextDrawer } from './components/ContextDrawer';
import { PersonaState } from './types';
import { api } from './services/api';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'chat' | 'upload' | 'brain' | 'files'>('chat');
  const [persona, setPersona] = useState<PersonaState | null>(null);
  const [isContextDrawerOpen, setIsContextDrawerOpen] = useState(false);

  // Date session state (controlled via hamburger menu)
  const getTodayStr = () => new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [availableDates, setAvailableDates] = useState<string[]>([getTodayStr()]);
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  // Telemetry for context drawer
  const [lastRetrievedMemories, setLastRetrievedMemories] = useState<string[]>([]);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | undefined>(undefined);
  const [lastTokens, setLastTokens] = useState<number | undefined>(undefined);
  const [lastThoughts, setLastThoughts] = useState<string | undefined>(undefined);

  // Fetch initial brain state
  const loadBrain = async () => {
    try {
      const res = await api.getBrain();
      if (res.success && res.persona) {
        setPersona(res.persona);
        if (res.persona.executionLogs && res.persona.executionLogs.length > 0) {
          const latest = res.persona.executionLogs[0];
          setLastRetrievedMemories(latest.retrievedMemories || []);
          setLastLatencyMs(latest.latencyMs);
          setLastTokens(latest.tokens);
          setLastThoughts(latest.thoughtReflection);
        } else if (res.persona.memoryBank) {
          setLastRetrievedMemories(res.persona.memoryBank.slice(0, 3).map((f) => f.fact));
        }
      }
    } catch (err) {
      console.error('Failed to load persona state:', err);
    }
  };

  const refreshDateList = async () => {
    try {
      const res = await api.getFiles();
      if (res.success && res.files) {
        const dates = res.files
          .filter((f) => f.type === 'directory' && /^\d{4}-\d{2}-\d{2}$/.test(f.name))
          .map((f) => f.name)
          .sort()
          .reverse();
        const today = getTodayStr();
        if (!dates.includes(today)) dates.unshift(today);
        setAvailableDates(dates);
      }
    } catch (err) {
      console.error('Failed to load available dates:', err);
    }
  };

  useEffect(() => {
    loadBrain();
    refreshDateList();
  }, []);

  const handleUpdateExecutionStats = (
    memories: string[],
    latency: number,
    tokens: number,
    thoughts: string
  ) => {
    setLastRetrievedMemories(memories);
    setLastLatencyMs(latency);
    setLastTokens(tokens);
    setLastThoughts(thoughts);
  };

  const handlePersonaUpdated = (updated: PersonaState) => {
    setPersona(updated);
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg,#0E0D10)] text-[var(--text-main,#EDE8EE)] flex flex-col selection:bg-rose-500/30 selection:text-rose-200 transition-colors duration-200">
      {/* Top Bar Navigation with Hamburger Menu containing Navigation, Date Selector, Theme, and Brain Inspector */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        companionName={persona?.name || 'Noor'}
        persona={persona}
        onOpenContextInspector={() => setIsContextDrawerOpen(true)}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        availableDates={availableDates}
        onReloadSession={() => setReloadTrigger((prev) => prev + 1)}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'chat' && (
          <ChatView
            persona={persona}
            onOpenContextInspector={() => setIsContextDrawerOpen(true)}
            onUpdateExecutionStats={handleUpdateExecutionStats}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            availableDates={availableDates}
            refreshDateList={refreshDateList}
            reloadTrigger={reloadTrigger}
          />
        )}

        {activeTab === 'upload' && (
          <UploadView
            onPersonaUpdated={handlePersonaUpdated}
            onNavigateToChat={() => setActiveTab('chat')}
            onNavigateToBrain={() => setActiveTab('brain')}
          />
        )}

        {activeTab === 'brain' && (
          <BrainView persona={persona} onPersonaUpdated={handlePersonaUpdated} />
        )}

        {activeTab === 'files' && (
          <FilesView
            onPersonaReset={(newPersona) => {
              if (newPersona) setPersona(newPersona);
              else loadBrain();
            }}
          />
        )}
      </main>

      {/* Context & Telemetry Inspector Drawer */}
      <ContextDrawer
        isOpen={isContextDrawerOpen}
        onClose={() => setIsContextDrawerOpen(false)}
        persona={persona}
        lastRetrievedMemories={lastRetrievedMemories}
        lastLatencyMs={lastLatencyMs}
        lastTokens={lastTokens}
        lastThoughts={lastThoughts}
      />
    </div>
  );
}

export default function App() {
  return (
    <AccessibilityProvider>
      <AppContent />
    </AccessibilityProvider>
  );
}
