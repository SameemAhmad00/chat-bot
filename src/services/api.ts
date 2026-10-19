import { PersonaState, FileItem } from '../types';

export const api = {
  // Brain & Persona State
  async getBrain(): Promise<{ success: boolean; persona: PersonaState }> {
    const res = await fetch('/api/companion/brain');
    if (!res.ok) throw new Error(`Failed to fetch brain state: ${res.statusText}`);
    return res.json();
  },

  async updateBrain(updates: Partial<PersonaState>): Promise<{ success: boolean; persona: PersonaState }> {
    const res = await fetch('/api/companion/brain', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(`Failed to update brain: ${res.statusText}`);
    return res.json();
  },

  // Chat
  async sendChat(message: string, sessionDate?: string): Promise<{
    success: boolean;
    reply: string;
    retrievedMemories: string[];
    latencyMs: number;
    tokens: number;
    thoughtReflection: string;
    sessionDate: string;
  }> {
    const res = await fetch('/api/companion/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionDate }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Chat failed: ${res.statusText}`);
    }
    return res.json();
  },

  // Ingest / Training
  async ingestData(payload: {
    type: 'text' | 'image';
    content: string;
    mimeType?: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    extracted: any;
    persona: PersonaState;
  }> {
    const res = await fetch('/api/companion/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Ingestion failed: ${res.statusText}`);
    }
    return res.json();
  },

  // File Manager
  async getFiles(): Promise<{ success: boolean; files: FileItem[]; rootPath: string }> {
    const res = await fetch('/api/brain/files');
    if (!res.ok) throw new Error(`Failed to list files: ${res.statusText}`);
    return res.json();
  },

  async getFileContent(filePath: string): Promise<{
    success: boolean;
    path: string;
    content: string;
    size: number;
    modified: string;
  }> {
    const res = await fetch(`/api/brain/file?path=${encodeURIComponent(filePath)}`);
    if (!res.ok) throw new Error(`Failed to get file: ${res.statusText}`);
    return res.json();
  },

  async saveFileContent(filePath: string, content: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/brain/file', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath, content }),
    });
    if (!res.ok) throw new Error(`Failed to save file: ${res.statusText}`);
    return res.json();
  },

  async deleteFile(filePath: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/brain/file?path=${encodeURIComponent(filePath)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete file: ${res.statusText}`);
    return res.json();
  },

  async resetBrain(resetType: 'full' | 'facts_only' | 'chats_only'): Promise<{ success: boolean; message: string; persona?: PersonaState }> {
    const res = await fetch('/api/brain/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetType }),
    });
    if (!res.ok) throw new Error(`Failed to reset: ${res.statusText}`);
    return res.json();
  },
};
