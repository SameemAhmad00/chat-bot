# Persona AI Companion 🌸

An intimate, observable, and fully customizable personal AI companion web application built with **React**, **TypeScript**, **Tailwind CSS**, **Node.js/Express**, and the **Google Gemini API**.

---

## ✨ Features

- **Brain Memory & Daily Activity Logging**:
  - Automatically records every day's conversations in date-wise folders (`data/brain/YYYY-MM-DD/session.json` and `chat_log.txt`).
  - Seamlessly injects recent conversation context into the companion's prompt so past memories are never lost.
- **Persona Training & Ingestion (Training Hub)**:
  - **Vision/Screenshot Extraction**: Upload chat screenshots (WhatsApp, Instagram, etc.); Gemini extracts speech patterns, inside jokes, nicknames, and facts.
  - **Text / WhatsApp Exports**: Paste or upload `.txt` / `.json` export logs to fine-tune personality traits and vocabulary.
  - **1-Click Presets**: Pre-configured relationship templates (Affectionate Partner, Playful Banter Bestie, Calm Confidant).
- **Inside the Brain (Observability Dashboard)**:
  - Transparently inspect all learned facts and memory confidence levels.
  - Live personality sliders (Affection, Humor, Caring, Energy, Hinglish blend).
  - Inspect prompt injection and token usage in real time.
- **Files & Memory Management**:
  - In-browser file explorer to browse, view, edit, download, and delete daily session transcripts.
  - Granular reset controls (delete specific facts, purge chat logs, or reset to a clean blank slate).
- **Accessibility & Customization**:
  - Hamburger menu with one-click theme switcher (**Dark**, **Light**, and **High Contrast** modes).
  - Dynamic font scale controls (**100%**, **115%**, **130%**).
  - Web Speech API integration for Hinglish voice dictation and speech synthesis.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion
- **Backend**: Express (Node.js), TypeScript via TSX
- **Vite**: Middleware mode development and optimized production build
- **AI / LLM**: `@google/genai` SDK (Google Gemini 3.1 Flash Lite / 3.8 Flash)
- **Storage**: Local filesystem structured memory (`data/brain/`)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0 or higher)
- [npm](https://www.npmjs.com/) (installed with Node)
- A **Google Gemini API Key** (Free from [Google AI Studio](https://aistudio.google.com/apikey))

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/persona-ai-companion.git
cd persona-ai-companion
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` in any editor and add your Gemini API key:
```env
GEMINI_API_KEY="your_actual_gemini_api_key_here"
PORT=3000
```
> **Tip**: You can generate a free API key in seconds at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

### 5. Start Development Server
```bash
npm run dev
```
Open your browser and navigate to **`http://localhost:3000`**.

---

## 📦 Production Deployment

To run in production mode:
```bash
# 1. Build the frontend
npm run build

# 2. Start the production server
npm start
```
The server will automatically serve the compiled static assets from `dist/` with full Express API routes enabled.

---

## 📂 Project Structure

```text
├── data/
│   └── brain/                     # Local storage for companion memory
│       ├── persona_state.json     # Active persona, traits & memory bank
│       └── YYYY-MM-DD/            # Date-wise daily logs
│           ├── session.json       # Structured chat transcript
│           └── chat_log.txt       # Readable conversation text log
├── src/
│   ├── components/
│   │   ├── Navbar.tsx             # Header bar & accessible hamburger menu
│   │   ├── ChatView.tsx           # Companion chat timeline & voice input
│   │   ├── UploadView.tsx         # Screenshot & chat log training hub
│   │   ├── BrainView.tsx          # Introspection dashboard & trait tuning
│   │   ├── FilesView.tsx          # File explorer & memory manager
│   │   └── ContextDrawer.tsx      # Real-time memory & telemetry inspector
│   ├── context/
│   │   └── AccessibilityContext.tsx # Theme and font scale manager
│   ├── services/
│   │   └── api.ts                 # Backend API service wrapper
│   ├── types/
│   │   └── index.ts               # Core TypeScript interfaces
│   ├── App.tsx                    # Main root component
│   └── index.css                  # Global styles, variables & themes
├── server.ts                      # Full-stack Express server + Vite middlewares
├── vite.config.ts                 # Vite bundler configuration
├── tsconfig.json                  # TypeScript configuration
└── package.json                   # Scripts and project dependencies
```

---

## 🔒 Privacy & Safety

- All daily conversations and learned memories are stored **locally** in the `./data/brain/` folder on your machine.
- No third-party analytics or external tracking scripts are included.
- Never commit your `.env` file containing your `GEMINI_API_KEY` to public repositories (it is pre-configured in `.gitignore`).

---

## 📄 License
MIT License. Feel free to use and modify for your own personal AI projects!
