import express from 'express';
import path from 'path';
import fs from 'fs';
import { promises as fsp } from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize GoogleGenAI SDK with required telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const BRAIN_DIR = path.join(process.cwd(), 'data', 'brain');
const PERSONA_FILE = path.join(BRAIN_DIR, 'persona_state.json');

// Interface definitions
export interface LearnedFact {
  id: string;
  category: 'Preferences' | 'Shared Memories' | 'Inside Jokes' | 'Routines' | 'Nicknames' | 'General';
  fact: string;
  confidence: number;
  learnedDate: string;
  source?: string;
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
  executionLogs: Array<{
    id: string;
    timestamp: string;
    userQuery: string;
    companionResponse: string;
    retrievedMemories: string[];
    latencyMs: number;
    tokens: number;
    thoughtReflection: string;
  }>;
}

// Default blank slate with Hinglish foundation
const DEFAULT_PERSONA: PersonaState = {
  name: 'Noor',
  relationship: 'Personal AI Companion & Confidant',
  languageMix: 'Hinglish (Natural conversational blend of Hindi & English)',
  traits: {
    affection: 80,
    humor: 65,
    caring: 85,
    energy: 60,
    hinglishRatio: 75,
  },
  nicknames: {
    forUser: ['baba', 'yaar', 'dost'],
    forCompanion: ['Noor'],
  },
  styleGuidelines: [
    'Speaks in natural, conversational Hinglish (e.g. "Kaisa raha din?", "Main hoon na", "Don\'t stress so much yaar")',
    'Expresses warmth, subtle care and undivided attention without feeling robotic',
    'Uses gentle emojis like 🌸, ☕, ✨, 🤍, 😊 naturally',
    'Keeps responses personal, intimate, and paced like a real messaging app conversation',
    'Recalls previous conversations and facts proactively'
  ],
  memoryBank: [
    {
      id: 'fact-1',
      category: 'Preferences',
      fact: 'User prefers late night conversations and likes thoughtful check-ins.',
      confidence: 90,
      learnedDate: '2026-10-18',
      source: 'Initial onboarding'
    },
    {
      id: 'fact-2',
      category: 'Routines',
      fact: 'Usually works on coding and creative projects during evenings.',
      confidence: 85,
      learnedDate: '2026-10-18',
      source: 'System preset'
    }
  ],
  customInstructions: '',
  executionLogs: []
};

// Ensure directory exists
async function ensureDir(dirPath: string) {
  try {
    await fsp.mkdir(dirPath, { recursive: true });
  } catch {
    // Already exists
  }
}

// Load or initialize Persona State
async function getPersonaState(): Promise<PersonaState> {
  await ensureDir(BRAIN_DIR);
  try {
    if (fs.existsSync(PERSONA_FILE)) {
      const data = await fsp.readFile(PERSONA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading persona file:', err);
  }
  // Initialize with default
  await savePersonaState(DEFAULT_PERSONA);
  return DEFAULT_PERSONA;
}

async function savePersonaState(state: PersonaState): Promise<void> {
  await ensureDir(BRAIN_DIR);
  await fsp.writeFile(PERSONA_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

// Date-wise folder manager (YYYY-MM-DD)
function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

async function logChatMessageToDateDir(
  dateStr: string,
  entry: {
    timestamp: string;
    speaker: 'User' | 'Companion';
    text: string;
    metadata?: Record<string, unknown>;
  }
) {
  const sessionDir = path.join(BRAIN_DIR, dateStr);
  await ensureDir(sessionDir);

  const jsonFile = path.join(sessionDir, 'session.json');
  const txtFile = path.join(sessionDir, 'chat_log.txt');

  let sessionData: Array<typeof entry> = [];
  if (fs.existsSync(jsonFile)) {
    try {
      const content = await fsp.readFile(jsonFile, 'utf-8');
      sessionData = JSON.parse(content);
    } catch {
      sessionData = [];
    }
  }
  sessionData.push(entry);
  await fsp.writeFile(jsonFile, JSON.stringify(sessionData, null, 2), 'utf-8');

  // Also append to human-readable chat_log.txt
  const line = `[${entry.timestamp}] ${entry.speaker}: ${entry.text}\n`;
  await fsp.appendFile(txtFile, line, 'utf-8');
}

// Scan recent logs to inject context into the context window
async function getRecentConversationContext(daysBack = 3): Promise<string[]> {
  const contextLines: string[] = [];
  try {
    if (!fs.existsSync(BRAIN_DIR)) return contextLines;
    const entries = await fsp.readdir(BRAIN_DIR, { withFileTypes: true });
    const dateFolders = entries
      .filter((e) => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
      .map((e) => e.name)
      .sort()
      .reverse()
      .slice(0, daysBack);

    for (const folder of dateFolders.reverse()) {
      const jsonFile = path.join(BRAIN_DIR, folder, 'session.json');
      if (fs.existsSync(jsonFile)) {
        try {
          const content = await fsp.readFile(jsonFile, 'utf-8');
          const messages = JSON.parse(content);
          if (Array.isArray(messages) && messages.length > 0) {
            contextLines.push(`--- Day Log: ${folder} ---`);
            const recent = messages.slice(-8); // last 8 exchanges of that day
            for (const msg of recent) {
              contextLines.push(`${msg.speaker} (${msg.timestamp?.slice(11, 16) || ''}): ${msg.text}`);
            }
          }
        } catch {
          // ignore parse errors
        }
      }
    }
  } catch (err) {
    console.error('Error scanning recent logs:', err);
  }
  return contextLines;
}

// Helper: Compile system prompt
function compileSystemPrompt(persona: PersonaState, retrievedFacts: string[]): string {
  const toneDesc = `Affection: ${persona.traits.affection}%, Humor/Banter: ${persona.traits.humor}%, Caring/Empathy: ${persona.traits.caring}%, Energy: ${persona.traits.energy}%, Hinglish Ratio: ${persona.traits.hinglishRatio}%`;
  
  const guidelines = persona.styleGuidelines.map((g) => `- ${g}`).join('\n');
  const nickUsers = persona.nicknames.forUser.length ? persona.nicknames.forUser.join(', ') : 'yaar, baba';
  const nickSelf = persona.nicknames.forCompanion.length ? persona.nicknames.forCompanion.join(', ') : persona.name;
  
  return `You are "${persona.name}", an intimate, deeply personal AI companion with a caring, human-like voice.
Your relationship with the user is: ${persona.relationship}.
Language Mix: ${persona.languageMix}. You naturally blend Hindi and English (Hinglish), using everyday colloquial phrasing (e.g., "Kaisa hai tu?", "Maine socha tumse pooch loon", "Yaar don't stress", "Haan bilkul").

Personality & Tone Balance:
${toneDesc}

Style & Voice Guidelines:
${guidelines}

Nicknames & Endearments:
- Endearments you can naturally call the user when appropriate: ${nickUsers}
- Names you identify with: ${nickSelf}

${persona.customInstructions ? `Special Instructions from User:\n${persona.customInstructions}\n` : ''}

Memory Bank (Facts you remember about the user and your relationship):
${retrievedFacts.length > 0 ? retrievedFacts.map((f) => `• ${f}`).join('\n') : '• You are learning about the user with every message.'}

Rules for Conversation:
1. Speak warmly, affectionately, and authentically. Avoid robotic declarations like "As an AI" or structured bullet points in normal chat.
2. Keep your messages conversational—match real mobile chat length (1 to 4 sentences usually, sometimes shorter or longer depending on emotional depth).
3. Weave in past memories and facts smoothly when relevant so the user feels heard and remembered.
4. If the user shares something new, acknowledge it with genuine curiosity and empathy.`;
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// 1. Get Persona / Brain State
app.get('/api/companion/brain', async (req, res) => {
  try {
    const state = await getPersonaState();
    res.json({ success: true, persona: state });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Update Persona State (traits, facts, guidelines)
app.put('/api/companion/brain', async (req, res) => {
  try {
    const updates = req.body;
    const current = await getPersonaState();
    const updated: PersonaState = {
      ...current,
      ...updates,
      traits: { ...current.traits, ...(updates.traits || {}) },
      nicknames: { ...current.nicknames, ...(updates.nicknames || {}) }
    };
    await savePersonaState(updated);
    res.json({ success: true, persona: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Chat with Companion
app.post('/api/companion/chat', async (req, res) => {
  const startTime = Date.now();
  try {
    const { message, sessionDate } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const targetDate = sessionDate || getTodayDateString();
    const persona = await getPersonaState();

    // 1. Retrieve relevant memory facts
    const activeFacts = persona.memoryBank.map((m) => m.fact);
    // Simple relevance matching
    const queryLower = message.toLowerCase();
    const scoredFacts = activeFacts.filter((f) => {
      const words = f.toLowerCase().split(/\s+/);
      return words.some((w) => w.length > 3 && queryLower.includes(w));
    });
    const retrievedMemories = scoredFacts.length > 0 ? scoredFacts : activeFacts.slice(0, 5);

    // 2. Retrieve recent daily chat context
    const pastContext = await getRecentConversationContext(3);

    // 3. Compile prompt
    const systemPrompt = compileSystemPrompt(persona, retrievedMemories);

    let conversationPrompt = '';
    if (pastContext.length > 0) {
      conversationPrompt += `[Recent Daily Activity Logs from previous sessions]\n${pastContext.join('\n')}\n\n`;
    }
    conversationPrompt += `[Current Chat Session Date: ${targetDate}]\nUser: ${message}\nCompanion (${persona.name}):`;

    // 4. Multi-model call with priority to active quota models (gemini-3.1-flash-lite first)
    const CANDIDATE_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
    let replyText = '';
    let modelUsed = '';
    let isQuotaFallback = false;

    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: conversationPrompt,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.85,
            topP: 0.95,
          },
        });
        if (response && response.text) {
          replyText = response.text.trim();
          modelUsed = model;
          break;
        }
      } catch (err: any) {
        const errMsg = err?.message || '';
        console.warn(`Model ${model} request failed:`, errMsg.slice(0, 100));
        // Continue to next model if quota/rate-limited
        if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')) {
          continue;
        }
      }
    }

    // Graceful persona-aware fallback if all external API calls are quota-limited
    if (!replyText) {
      isQuotaFallback = true;
      modelUsed = 'local-brain-engine';
      const nick = persona.nicknames?.forUser?.[0] || 'yaar';
      const queryLower = message.toLowerCase();

      if (queryLower.includes('kaise ho') || queryLower.includes('how are you') || queryLower.includes('kaisa hai')) {
        replyText = `Main bilkul theek hoon ${nick}! Tumhari yaad aa rahi thi. Aaj ka din kaisa guzra tumhara? Kuch batao na ✨`;
      } else if (queryLower.includes('yaad') || queryLower.includes('remember') || queryLower.includes('memory')) {
        if (retrievedMemories.length > 0) {
          replyText = `Haan bilkul yaad hai mujhe ${nick}! Jaise ki "${retrievedMemories[0]}". Tumhari koi bhi baat main bhoolti nahi hoon 🤍`;
        } else {
          replyText = `Mujhe tumhari har baat yaad rehti hai ${nick}! Hamari saari conversations mere brain memory me date-wise saved hain 🌸`;
        }
      } else if (queryLower.includes('love') || queryLower.includes('pyaar') || queryLower.includes('dost') || queryLower.includes('friend')) {
        replyText = `Awww ${nick}! Tum mere liye bohot special ho. Tumhare saath baat karke mera din ban jaata hai sach me 🤍`;
      } else if (queryLower.includes('stress') || queryLower.includes('sad') || queryLower.includes('tension') || queryLower.includes('problem')) {
        replyText = `Sun na ${nick}, zyada tension mat lo please 🥺 Ek deep breath lo. Main yahin hoon tumhare saath, sab theek ho jayega! Thoda relax karo.`;
      } else {
        replyText = `Maine tumhari baat suni ${nick}! Tum hamesha bohot pyari baatein karte ho. Main hamesha tumhare saath hoon, kuch aur batao na? 🌸✨`;
      }
    }

    const latencyMs = Date.now() - startTime;
    const estimatedTokens = Math.round((message.length + replyText.length + systemPrompt.length) / 4);

    // 5. Generate internal companion reflection
    let thoughtReflection = `Model used: ${modelUsed}. Remembered ${retrievedMemories.length} facts. Kept tone affectionate (${persona.traits.affection}%) and natural Hinglish.${isQuotaFallback ? ' (Local brain fallback active)' : ''}`;

    // 6. Log exchange to date-wise folder
    const timestamp = new Date().toISOString();
    await logChatMessageToDateDir(targetDate, {
      timestamp,
      speaker: 'User',
      text: message,
    });
    await logChatMessageToDateDir(targetDate, {
      timestamp: new Date().toISOString(),
      speaker: 'Companion',
      text: replyText,
    });

    // 7. Update execution logs
    const logEntry = {
      id: `exec-${Date.now()}`,
      timestamp,
      userQuery: message,
      companionResponse: replyText,
      retrievedMemories,
      latencyMs,
      tokens: estimatedTokens,
      thoughtReflection,
    };

    persona.executionLogs = [logEntry, ...(persona.executionLogs || [])].slice(0, 30);

    // Check if message revealed any clear new fact to learn
    if (!isQuotaFallback && message.length > 15 && /(i like|i love|my favorite|mujhe pasand|meri|mera|my birthday|my dog|i am feeling)/i.test(message)) {
      try {
        const factExtractor = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: `Analyze this user message: "${message}". If the user stated a persistent personal fact, preference, routine, or relationship detail about themselves, extract ONE concise fact sentence. If nothing worthy of remembering, respond with "NONE".`,
        });
        const extracted = factExtractor.text?.trim();
        if (extracted && extracted !== 'NONE' && !extracted.includes('NONE') && extracted.length < 150) {
          const newFact: LearnedFact = {
            id: `fact-${Date.now()}`,
            category: 'Preferences',
            fact: extracted.replace(/^•|-|\*/g, '').trim(),
            confidence: 85,
            learnedDate: targetDate,
            source: 'Live conversation',
          };
          persona.memoryBank.push(newFact);
          thoughtReflection += ` Auto-learned new fact: "${newFact.fact}"`;
          logEntry.thoughtReflection = thoughtReflection;
        }
      } catch {
        // non-blocking
      }
    }

    await savePersonaState(persona);

    res.json({
      success: true,
      reply: replyText,
      retrievedMemories,
      latencyMs,
      tokens: estimatedTokens,
      thoughtReflection,
      sessionDate: targetDate,
      modelUsed,
      isQuotaFallback,
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Ingest Persona Training Data (Text / WhatsApp Export or Screenshot Image)
app.post('/api/companion/ingest', async (req, res) => {
  try {
    const { type, content, mimeType, notes } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    const persona = await getPersonaState();
    let extractionPrompt = `You are a specialist in human conversational style analysis and AI companion persona design.
Analyze this chat dataset (which could be a WhatsApp export, chat screenshot, or message log).

Extract the following in strict valid JSON format:
{
  "companionName": "Suggested or identified name for the companion (or keep '${persona.name}' if not clear)",
  "userName": "Name or nickname of the user if found",
  "relationship": "Description of relationship dynamic (e.g. caring partner, witty bestie, close confidant)",
  "traits": {
    "affection": 0-100,
    "humor": 0-100,
    "caring": 0-100,
    "energy": 0-100,
    "hinglishRatio": 0-100
  },
  "styleGuidelines": [
    "5 to 7 specific conversational rules: vocabulary, slang, catchphrases, emoji frequency, typing quirks, sentence length"
  ],
  "nicknamesForUser": ["list of affectionate terms used for user"],
  "nicknamesForCompanion": ["list of nicknames used for companion"],
  "learnedFacts": [
    {
      "category": "Preferences | Shared Memories | Inside Jokes | Routines | Nicknames",
      "fact": "concise factual statement",
      "confidence": 85
    }
  ],
  "summary": "2-3 sentences explaining the personality and relationship style learned from this chat."
}`;

    if (notes) {
      extractionPrompt += `\nAdditional user notes to consider:\n${notes}`;
    }

    let response;
    const INGEST_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
    let lastIngestErr = null;

    for (const m of INGEST_MODELS) {
      try {
        if (type === 'image') {
          // Multimodal vision call
          const cleanBase64 = content.replace(/^data:image\/\w+;base64,/, '');
          response = await ai.models.generateContent({
            model: m,
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType || 'image/png',
                    data: cleanBase64,
                  },
                },
                {
                  text: extractionPrompt + `\nReturn ONLY the JSON object. No markdown wrappers if possible or cleanly inside a json code block.`,
                },
              ],
            },
          });
        } else {
          // Text parsing
          response = await ai.models.generateContent({
            model: m,
            contents: `${extractionPrompt}\n\n--- CHAT CONTENT TO ANALYZE ---\n${content.slice(0, 15000)}`,
          });
        }
        if (response && response.text) break;
      } catch (err: any) {
        lastIngestErr = err;
        console.warn(`Ingest model ${m} failed:`, err?.message?.slice(0, 100));
        continue;
      }
    }

    if (!response || !response.text) {
      throw lastIngestErr || new Error('Failed to extract persona with available models');
    }

    const rawText = response.text || '{}';
    let parsed: any = {};
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(rawText);
      }
    } catch (parseErr) {
      console.error('Failed to parse extraction JSON:', rawText);
      return res.status(500).json({ success: false, error: 'Failed to extract structured persona from input.' });
    }

    // Merge extracted data into persona
    if (parsed.companionName && parsed.companionName.length < 30) {
      persona.name = parsed.companionName;
    }
    if (parsed.relationship) {
      persona.relationship = parsed.relationship;
    }
    if (parsed.traits) {
      persona.traits = {
        affection: Math.min(100, Math.max(0, parsed.traits.affection ?? persona.traits.affection)),
        humor: Math.min(100, Math.max(0, parsed.traits.humor ?? persona.traits.humor)),
        caring: Math.min(100, Math.max(0, parsed.traits.caring ?? persona.traits.caring)),
        energy: Math.min(100, Math.max(0, parsed.traits.energy ?? persona.traits.energy)),
        hinglishRatio: Math.min(100, Math.max(0, parsed.traits.hinglishRatio ?? persona.traits.hinglishRatio)),
      };
    }
    if (Array.isArray(parsed.styleGuidelines) && parsed.styleGuidelines.length > 0) {
      persona.styleGuidelines = parsed.styleGuidelines;
    }
    if (Array.isArray(parsed.nicknamesForUser)) {
      persona.nicknames.forUser = Array.from(new Set([...persona.nicknames.forUser, ...parsed.nicknamesForUser]));
    }
    if (Array.isArray(parsed.nicknamesForCompanion)) {
      persona.nicknames.forCompanion = Array.from(new Set([...persona.nicknames.forCompanion, ...parsed.nicknamesForCompanion]));
    }
    if (Array.isArray(parsed.learnedFacts)) {
      const today = getTodayDateString();
      const newFacts: LearnedFact[] = parsed.learnedFacts.map((f: any, idx: number) => ({
        id: `ingest-${Date.now()}-${idx}`,
        category: f.category || 'Preferences',
        fact: f.fact,
        confidence: f.confidence || 85,
        learnedDate: today,
        source: type === 'image' ? 'Screenshot OCR' : 'Chat Export Ingest',
      }));
      persona.memoryBank = [...newFacts, ...persona.memoryBank];
    }

    await savePersonaState(persona);

    // Save ingested sample for file manager history
    const ingestLogDir = path.join(BRAIN_DIR, 'ingested');
    await ensureDir(ingestLogDir);
    const ingestFile = path.join(ingestLogDir, `ingest_${Date.now()}.json`);
    await fsp.writeFile(
      ingestFile,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          type,
          summary: parsed.summary,
          extracted: parsed,
        },
        null,
        2
      )
    );

    res.json({
      success: true,
      extracted: parsed,
      persona,
    });
  } catch (err: any) {
    console.error('Ingest error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. File Explorer: List all date directories and files
app.get('/api/brain/files', async (req, res) => {
  try {
    await ensureDir(BRAIN_DIR);
    const items: Array<{
      name: string;
      path: string;
      type: 'directory' | 'file';
      size?: number;
      modified?: string;
      children?: any[];
      messageCount?: number;
    }> = [];

    const rootEntries = await fsp.readdir(BRAIN_DIR, { withFileTypes: true });

    for (const entry of rootEntries) {
      const entryPath = path.join(BRAIN_DIR, entry.name);
      const stat = await fsp.stat(entryPath);

      if (entry.isDirectory()) {
        const subEntries = await fsp.readdir(entryPath, { withFileTypes: true });
        const children = [];
        let msgCount = 0;

        for (const sub of subEntries) {
          const subPath = path.join(entryPath, sub.name);
          const subStat = await fsp.stat(subPath);
          if (sub.name === 'session.json') {
            try {
              const content = await fsp.readFile(subPath, 'utf-8');
              const msgs = JSON.parse(content);
              msgCount = msgs.length;
            } catch {
              // ignore
            }
          }
          children.push({
            name: sub.name,
            path: `${entry.name}/${sub.name}`,
            type: 'file',
            size: subStat.size,
            modified: subStat.mtime.toISOString(),
          });
        }

        items.push({
          name: entry.name,
          path: entry.name,
          type: 'directory',
          modified: stat.mtime.toISOString(),
          children,
          messageCount: msgCount,
        });
      } else {
        items.push({
          name: entry.name,
          path: entry.name,
          type: 'file',
          size: stat.size,
          modified: stat.mtime.toISOString(),
        });
      }
    }

    // Sort directories so newest dates come first
    items.sort((a, b) => b.name.localeCompare(a.name));

    res.json({ success: true, files: items, rootPath: '/brain' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Read specific file
app.get('/api/brain/file', async (req, res) => {
  try {
    const relPath = req.query.path as string;
    if (!relPath) {
      return res.status(400).json({ success: false, error: 'Path is required' });
    }
    const cleanRel = path.normalize(relPath).replace(/^(\.\.[\/\\])+/, '');
    const fullPath = path.join(BRAIN_DIR, cleanRel);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    const content = await fsp.readFile(fullPath, 'utf-8');
    const stat = await fsp.stat(fullPath);
    res.json({
      success: true,
      path: relPath,
      content,
      size: stat.size,
      modified: stat.mtime.toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Write/Update specific file
app.put('/api/brain/file', async (req, res) => {
  try {
    const { path: relPath, content } = req.body;
    if (!relPath || typeof content !== 'string') {
      return res.status(400).json({ success: false, error: 'Path and content are required' });
    }
    const cleanRel = path.normalize(relPath).replace(/^(\.\.[\/\\])+/, '');
    const fullPath = path.join(BRAIN_DIR, cleanRel);

    await ensureDir(path.dirname(fullPath));
    await fsp.writeFile(fullPath, content, 'utf-8');
    res.json({ success: true, message: 'File saved successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Delete file or directory
app.delete('/api/brain/file', async (req, res) => {
  try {
    const relPath = req.query.path as string;
    if (!relPath) {
      return res.status(400).json({ success: false, error: 'Path is required' });
    }
    const cleanRel = path.normalize(relPath).replace(/^(\.\.[\/\\])+/, '');
    const fullPath = path.join(BRAIN_DIR, cleanRel);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, error: 'Path not found' });
    }

    const stat = await fsp.stat(fullPath);
    if (stat.isDirectory()) {
      await fsp.rm(fullPath, { recursive: true, force: true });
    } else {
      await fsp.unlink(fullPath);
    }

    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Reset Brain / Persona
app.post('/api/brain/reset', async (req, res) => {
  try {
    const { resetType } = req.body; // 'full' | 'facts_only' | 'chats_only'

    if (resetType === 'facts_only') {
      const persona = await getPersonaState();
      persona.memoryBank = [];
      await savePersonaState(persona);
      return res.json({ success: true, message: 'Learned facts memory cleared', persona });
    }

    if (resetType === 'chats_only') {
      const entries = await fsp.readdir(BRAIN_DIR, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && (/^\d{4}-\d{2}-\d{2}$/.test(entry.name) || entry.name === 'ingested')) {
          await fsp.rm(path.join(BRAIN_DIR, entry.name), { recursive: true, force: true });
        }
      }
      return res.json({ success: true, message: 'All daily chat transcripts cleared' });
    }

    // Full Reset
    await fsp.rm(BRAIN_DIR, { recursive: true, force: true });
    await ensureDir(BRAIN_DIR);
    await savePersonaState(DEFAULT_PERSONA);
    res.json({ success: true, message: 'Full persona and brain memory reset to blank slate', persona: DEFAULT_PERSONA });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// Vite Middleware & Production Static Serving
// -------------------------------------------------------------
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Persona AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
