import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { PersonaState, ChatMessage } from '../types';
import { api } from '../services/api';

interface ChatViewProps {
  persona: PersonaState | null;
  onOpenContextInspector: () => void;
  onUpdateExecutionStats: (memories: string[], latency: number, tokens: number, thoughts: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  availableDates: string[];
  refreshDateList: () => void;
  reloadTrigger?: number;
}

export const ChatView: React.FC<ChatViewProps> = ({
  persona,
  onOpenContextInspector,
  onUpdateExecutionStats,
  selectedDate,
  setSelectedDate,
  availableDates,
  refreshDateList,
  reloadTrigger = 0,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeTypingText, setActiveTypingText] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load existing session logs for the selected date
  const loadDateSession = async (dateStr: string) => {
    try {
      const res = await api.getFileContent(`${dateStr}/session.json`);
      if (res.success && res.content) {
        const parsed = JSON.parse(res.content);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
          return;
        }
      }
    } catch {
      // Session does not exist yet or empty
    }
    // If empty, show a warm greeting
    setMessages([
      {
        timestamp: new Date().toISOString(),
        speaker: 'Companion',
        text: `Hey! Main yahan hoon. Aaj ka din kaisa raha tumhara? ${
          persona?.nicknames?.forUser?.[0] ? `Kuch share karo ${persona.nicknames.forUser[0]}!` : 'Kuch share karo na?'
        }`,
      },
    ]);
  };

  useEffect(() => {
    refreshDateList();
    loadDateSession(selectedDate);
  }, [selectedDate, reloadTrigger]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTypingText]);

  // Speech Recognition Setup (Web Speech API)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN'; // Hinglish friendly

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInputText(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Speech recognition error:', e);
      }
    }
  };

  // Text to Speech playback
  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    // Pick best voice
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find((v) => v.lang.includes('hi') || v.lang.includes('IN'));
    if (hindiVoice) utterance.voice = hindiVoice;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Send message handler with typewriter effect
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    setInputText('');
    const userMsg: ChatMessage = {
      timestamp: new Date().toISOString(),
      speaker: 'User',
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await api.sendChat(text, selectedDate);
      if (res.success) {
        onUpdateExecutionStats(
          res.retrievedMemories,
          res.latencyMs,
          res.tokens,
          res.thoughtReflection
        );

        // Typewriter effect simulation for real-time natural feel
        const fullReply = res.reply;
        let currentIdx = 0;
        setActiveTypingText('');

        const interval = setInterval(() => {
          currentIdx += Math.floor(Math.random() * 4) + 2;
          if (currentIdx >= fullReply.length) {
            clearInterval(interval);
            setActiveTypingText(null);
            const companionMsg: ChatMessage = {
              timestamp: new Date().toISOString(),
              speaker: 'Companion',
              text: fullReply,
              retrievedMemories: res.retrievedMemories,
              latencyMs: res.latencyMs,
              thoughtReflection: res.thoughtReflection,
            };
            setMessages((prev) => [...prev, companionMsg]);
            refreshDateList();
          } else {
            setActiveTypingText(fullReply.slice(0, currentIdx));
          }
        }, 15);
      }
    } catch (err: any) {
      console.error('Chat send error:', err);
      let humanMsg = 'thoda connection issue ho gaya tha, please ek baar dobara send karo na?';
      const raw = err?.message || '';
      if (raw.includes('429') || raw.includes('quota') || raw.includes('RESOURCE_EXHAUSTED')) {
        humanMsg = 'Gemini free-tier rate limit active hai temporary. Aap thodi der baad dobara baat kar sakte hain ya Training Hub me dataset check kar sakte hain!';
      }
      const errorMsg: ChatMessage = {
        timestamp: new Date().toISOString(),
        speaker: 'Companion',
        text: `Sorry yaar, ${humanMsg}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] bg-[var(--app-bg,#0E0D10)] text-[var(--text-main,#EDE8EE)]">

      {/* Message Timeline */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4">
        {messages.map((msg, index) => {
          const isUser = msg.speaker === 'User';
          const time = msg.timestamp ? msg.timestamp.slice(11, 16) : '';

          return (
            <div
              key={index}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-3xl mx-auto w-full`}
            >
              <div
                className={`group relative rounded-2xl px-5 py-3.5 max-w-[88%] md:max-w-[78%] transition-all ${
                  isUser
                    ? 'bg-rose-600 light:bg-rose-600 text-white shadow-sm rounded-br-sm'
                    : 'bg-[#18151D] light:bg-white text-white light:text-slate-900 border border-white/[0.1] light:border-slate-300 shadow-md rounded-bl-sm'
                }`}
              >
                {/* Speaker indicator for screen readers */}
                <span className="sr-only">{isUser ? 'You said:' : `${persona?.name || 'Companion'} said:`}</span>

                {/* Message Text with high contrast and readable line-height */}
                <div className="text-base md:text-lg leading-relaxed whitespace-pre-wrap break-words font-medium">
                  {msg.text}
                </div>

                {/* Footer metadata & actions */}
                <div
                  className={`flex items-center gap-2 mt-2 text-xs font-mono font-medium ${
                    isUser ? 'text-rose-100 justify-end' : 'text-neutral-300 light:text-slate-600 justify-between'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{time}</span>
                    {!isUser && msg.latencyMs && (
                      <span className="hidden sm:inline text-neutral-400 light:text-slate-500">
                        · {msg.latencyMs}ms
                      </span>
                    )}
                  </div>

                  {!isUser && (
                    <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => speakText(msg.text)}
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center p-1.5 rounded-lg hover:bg-white/[0.1] light:hover:bg-slate-100 text-neutral-300 light:text-slate-700 hover:text-rose-300 light:hover:text-rose-600 transition-colors"
                        title="Listen via Text-to-Speech"
                        aria-label="Listen to message audio"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Retrieved memory tag indicator with strong contrast */}
                {!isUser && msg.retrievedMemories && msg.retrievedMemories.length > 0 && (
                  <div className="mt-2.5 pt-2.5 border-t border-white/[0.08] light:border-slate-200 text-xs text-amber-300 light:text-amber-800 font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 light:text-amber-600 shrink-0" />
                    <span className="truncate">
                      Recalled: {msg.retrievedMemories[0]}
                    </span>
                    {msg.retrievedMemories.length > 1 && (
                      <span className="text-neutral-400 light:text-slate-500 font-mono text-[11px]">
                        +{msg.retrievedMemories.length - 1} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live typewriter / typing indicator */}
        {activeTypingText && (
          <div className="flex flex-col items-start max-w-3xl mx-auto w-full animate-in fade-in">
            <div className="bg-[#18151D] light:bg-white text-white light:text-slate-900 border border-white/[0.1] light:border-slate-300 rounded-2xl rounded-bl-sm px-5 py-3.5 max-w-[88%] md:max-w-[78%] shadow-md">
              <div className="text-base md:text-lg leading-relaxed whitespace-pre-wrap font-medium">
                {activeTypingText}
                <span className="inline-block w-2 h-4 ml-1 bg-rose-500 animate-pulse align-middle" />
              </div>
            </div>
          </div>
        )}

        {isLoading && !activeTypingText && (
          <div className="flex items-center gap-2 text-sm text-neutral-300 light:text-slate-600 max-w-3xl mx-auto w-full pl-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-bounce" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-bounce delay-100" />
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-bounce delay-200" />
            <span className="font-mono font-medium">
              {persona?.name || 'Companion'} is typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer with >=48px ergonomic touch targets */}
      <div className="px-4 md:px-8 py-3.5 bg-[#141217] light:bg-white border-t border-white/[0.08] light:border-slate-300 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-end gap-3">
          {/* Voice Input Button (min 48px) */}
          <button
            onClick={toggleListening}
            className={`min-h-[48px] min-w-[48px] p-3 rounded-xl border flex items-center justify-center transition-all ${
              isListening
                ? 'bg-rose-500/20 light:bg-rose-100 text-rose-400 light:text-rose-700 border-rose-500/60 animate-pulse'
                : 'bg-white/[0.04] light:bg-slate-100 text-neutral-300 light:text-slate-700 border-white/[0.1] light:border-slate-300 hover:text-white light:hover:text-black hover:bg-white/[0.08] light:hover:bg-slate-200'
            }`}
            title={isListening ? 'Listening (Click to stop)' : 'Speak in Hinglish / English'}
            aria-label={isListening ? 'Stop voice recording' : 'Start voice recording in Hinglish or English'}
          >
            {isListening ? <Mic className="w-5 h-5 text-rose-400 light:text-rose-600" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Text Area Input */}
          <div className="flex-1 relative rounded-xl bg-white/[0.04] light:bg-slate-100 border border-white/[0.1] light:border-slate-300 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/30 transition-all">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Baat karo ${persona?.name || 'Noor'} se... (Press Enter to send, Shift+Enter for new line)`}
              rows={1}
              className="w-full bg-transparent px-4 py-3 text-base text-white light:text-slate-900 placeholder-neutral-400 light:placeholder-slate-500 focus:outline-none resize-none max-h-36 min-h-[48px]"
              aria-label="Message input for AI companion"
            />
          </div>

          {/* Send Button (min 48px) */}
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputText.trim()}
            className="min-h-[48px] min-w-[48px] p-3 rounded-xl bg-rose-600 hover:bg-rose-500 light:bg-rose-600 light:hover:bg-rose-700 text-white font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-rose-600/25 flex items-center justify-center"
            title="Send Message"
            aria-label="Send message to AI companion"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
