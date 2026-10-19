export interface LearnedFact {
  id: string;
  category: 'Preferences' | 'Shared Memories' | 'Inside Jokes' | 'Routines' | 'Nicknames' | 'General';
  fact: string;
  confidence: number;
  learnedDate: string;
  source?: string;
}

export interface ExecutionLog {
  id: string;
  timestamp: string;
  userQuery: string;
  companionResponse: string;
  retrievedMemories: string[];
  latencyMs: number;
  tokens: number;
  thoughtReflection: string;
}

export interface PersonaState {
  name: string;
  relationship: string;
  languageMix: string;
  traits: {
    affection: number;
    humor: number;
    caring: number;
    energy: number;
    hinglishRatio: number;
  };
  nicknames: {
    forUser: string[];
    forCompanion: string[];
  };
  styleGuidelines: string[];
  memoryBank: LearnedFact[];
  customInstructions: string;
  executionLogs: ExecutionLog[];
}

export interface ChatMessage {
  id?: string;
  timestamp: string;
  speaker: 'User' | 'Companion';
  text: string;
  retrievedMemories?: string[];
  latencyMs?: number;
  thoughtReflection?: string;
}

export interface FileItem {
  name: string;
  path: string;
  type: 'directory' | 'file';
  size?: number;
  modified?: string;
  children?: FileItem[];
  messageCount?: number;
}
