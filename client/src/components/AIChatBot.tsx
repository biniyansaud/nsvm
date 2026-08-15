import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Loader2,
  RefreshCw,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Bot,
  User as UserIcon,
  Radio,
  Settings2,
  Bookmark,
  CheckCircle2,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface Message {
  role: "user" | "model";
  text: string;
  modelUsed?: string;
  timestamp?: string;
}

type GeminiModel = "gemini-3.5-flash" | "gemini-3.1-pro-preview" | "gemini-3.1-flash-lite" | "gemini-3.1-flash-live-preview";
type RoleType = "assistant" | "admissions" | "tutor" | "counselor";

const CHAT_STORAGE_KEY = "nsvm_ai_chat_messages";

function formatMessage(text: string) {
  return text.split("\n").map((line, lineIndex) => (
    <p key={lineIndex} className={line ? "mb-2 last:mb-0" : "h-2"}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, partIndex) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={partIndex} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>
        ) : (
          part
        ),
      )}
    </p>
  ));
}

const DEFAULT_MESSAGE: Message = {
  role: "model",
  text: "Namaste! 🙏 Welcome to New Saraswati Vidya Mandir (NSVM). I am Saraswati AI, your academic & school guide. How can I help you today?",
};

export default function AIChatBot() {
  const { t, language } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "voice" | "settings">("chat");
  const [selectedModel, setSelectedModel] = useState<GeminiModel>("gemini-3.5-flash");
  const [selectedRole, setSelectedRole] = useState<RoleType>("assistant");

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = sessionStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage read error
    }
    return [DEFAULT_MESSAGE];
  });

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ttsEnabled, setTtsEnabled] = useState(false);

  // Live Voice Conversation State
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveListening, setLiveListening] = useState(false);
  const [liveSpeaking, setLiveSpeaking] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);

  // Web Speech API Voice Typing
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      speechSynthRef.current = window.speechSynthesis;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = language === "ne" ? "ne-NP" : "en-US";

      rec.onstart = () => setIsListening(true);
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputValue((prev) => prev + (prev ? " " : "") + transcript);
        }
      };
      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };
      rec.onend = () => setIsListening(false);

      recognitionRef.current = rec;
    }
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isOpen, activeTab]);

  const speakText = (text: string) => {
    if (!speechSynthRef.current || !ttsEnabled) return;
    speechSynthRef.current.cancel(); // Stop any previous speech
    const cleanText = text.replace(/[*_#`]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    speechSynthRef.current.speak(utterance);
  };

  const handleMicClick = () => {
    if (!isSpeechSupported) {
      setError("Voice search is not supported in this browser. Please try Chrome or Safari.");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setError(null);
      try {
        recognitionRef.current?.start();
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  const suggestions = [
    { label: "📚 Admissions 2082", query: "Are admissions open for 2082 BS? How do I apply?" },
    { label: "🧪 Available Streams", query: "What streams or courses are offered in Plus Two (+2)?" },
    { label: "🏆 Scholarships", query: "Does the school provide scholarships or fee waivers?" },
    { label: "🏫 School Facilities", query: "What facilities, labs, or libraries are available on campus?" },
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(1).map((m) => ({ role: m.role, text: m.text })),
          model: selectedModel,
          role: selectedRole,
        }),
      });

      if (!response.ok) throw new Error("Failed to connect to assistant");

      const data = await response.json();
      const replyText = data.reply || "I am here to assist you with New Saraswati Vidya Mandir.";

      const aiMessage: Message = {
        role: "model",
        text: replyText,
        modelUsed: data.model || selectedModel,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      const updatedMessages = [...newMessages, aiMessage];
      setMessages(updatedMessages);

      try {
        sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updatedMessages));
      } catch {
        // ignore storage error
      }

      if (ttsEnabled) {
        speakText(replyText);
      }
    } catch (err: any) {
      console.error("AI Chat Error:", err);
      setError("Unable to connect to assistant. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Start Live Voice Conversation (gemini-3.1-flash-live-preview)
  const toggleLiveVoiceSession = () => {
    if (isLiveActive) {
      setIsLiveActive(false);
      setLiveListening(false);
      setLiveSpeaking(false);
      if (speechSynthRef.current) speechSynthRef.current.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
      toast.info("Live voice conversation ended.");
    } else {
      setIsLiveActive(true);
      setLiveListening(true);
      setError(null);
      toast.success("Live Voice Conversation initialized with model gemini-3.1-flash-live-preview!");

      if (isSpeechSupported && recognitionRef.current) {
        try {
          recognitionRef.current.continuous = true;
          recognitionRef.current.onresult = async (event: any) => {
            const lastIndex = event.results.length - 1;
            const transcript = event.results[lastIndex][0].transcript;
            if (transcript) {
              setLiveTranscript(transcript);
              setLiveListening(false);
              setLiveSpeaking(true);

              // Query Gemini Live backend
              try {
                const res = await fetch("/api/chat", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    message: transcript,
                    history: messages.slice(1).map((m) => ({ role: m.role, text: m.text })),
                    model: "gemini-3.1-flash-live-preview",
                    role: selectedRole,
                  }),
                });
                const data = await res.json();
                const reply = data.reply || "Thank you for speaking. How else can I guide you?";

                setMessages((prev) => [
                  ...prev,
                  { role: "user", text: transcript },
                  { role: "model", text: reply, modelUsed: "gemini-3.1-flash-live-preview" },
                ]);

                // Voice Response
                if (speechSynthRef.current) {
                  speechSynthRef.current.cancel();
                  const utterance = new SpeechSynthesisUtterance(reply.replace(/[*_#`]/g, ""));
                  utterance.onend = () => {
                    setLiveSpeaking(false);
                    setLiveListening(true);
                  };
                  speechSynthRef.current.speak(utterance);
                } else {
                  setLiveSpeaking(false);
                  setLiveListening(true);
                }
              } catch (e) {
                setLiveSpeaking(false);
                setLiveListening(true);
              }
            }
          };
          recognitionRef.current.start();
        } catch (err) {
          console.error("Live voice start error:", err);
        }
      }
    }
  };

  const handleReset = () => {
    setMessages([DEFAULT_MESSAGE]);
    setError(null);
    try {
      sessionStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {
      // ignore storage error
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col items-start transition-all duration-300" id="ai-academic-assistant">
      {isOpen && (
        <div className="ai-chat-window w-[360px] sm:w-[410px] h-[560px] max-h-[calc(100vh-100px)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden mb-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          {/* Top Header */}
          <div className="bg-gradient-to-r from-[var(--brand-blue)] via-[#1c5392] to-[var(--brand-red)] p-3.5 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center border border-white/20">
                <Sparkles className="h-5 w-5 text-[var(--brand-yellow)] animate-pulse" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-[14px] leading-tight font-sans">Saraswati AI</h3>
                  <span className="text-[9px] bg-white/20 text-white px-1.5 py-0.5 rounded font-mono font-semibold">
                    {selectedModel.replace("gemini-", "").replace("-preview", "")}
                  </span>
                </div>
                <span className="text-[10px] text-white/80 font-bold tracking-wider uppercase block">
                  {selectedRole === "assistant" && "School Guide"}
                  {selectedRole === "admissions" && "Admissions Counselor"}
                  {selectedRole === "tutor" && "Science & Homework Tutor"}
                  {selectedRole === "counselor" && "Career Counselor"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setTtsEnabled(!ttsEnabled)}
                title={ttsEnabled ? "Mute Speech Output" : "Enable Voice Readout"}
                className={`p-1.5 rounded-lg transition ${
                  ttsEnabled ? "bg-white/20 text-amber-300" : "text-white/70 hover:text-white"
                }`}
              >
                {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              <button
                onClick={handleReset}
                title="Restart Conversation"
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mode Navigation Bar */}
          <div className="bg-slate-100 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between text-xs font-bold text-slate-600">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab("chat")}
                className={`px-3 py-1 rounded-lg transition ${
                  activeTab === "chat" ? "bg-white text-[var(--brand-blue)] shadow-sm font-extrabold" : "hover:text-slate-900"
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab("voice")}
                className={`px-3 py-1 rounded-lg flex items-center gap-1 transition ${
                  activeTab === "voice" ? "bg-white text-rose-600 shadow-sm font-extrabold" : "hover:text-slate-900"
                }`}
              >
                <Radio className="h-3.5 w-3.5 animate-pulse text-rose-500" />
                Live Voice
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`px-3 py-1 rounded-lg flex items-center gap-1 transition ${
                  activeTab === "settings" ? "bg-white text-teal-700 shadow-sm font-extrabold" : "hover:text-slate-900"
                }`}
              >
                <Settings2 className="h-3.5 w-3.5" />
                Config
              </button>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
              <span>Academic AI</span>
            </div>
          </div>

          {/* TAB 1: Chat Messages Thread */}
          {activeTab === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-slate-50/50 scrollbar-thin">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${
                      msg.role === "user" ? "items-end" : "items-start"
                    } animate-in fade-in duration-200`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400 font-medium">
                      {msg.role === "user" ? (
                        <span>You</span>
                      ) : (
                        <span className="flex items-center gap-1 text-[var(--brand-blue)] font-bold">
                          <Bot className="h-3 w-3" /> Saraswati AI
                        </span>
                      )}
                      {msg.timestamp && <span>• {msg.timestamp}</span>}
                    </div>
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed text-left shadow-sm ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-[var(--brand-blue)] to-[#1b508d] text-white rounded-br-none"
                          : "bg-white border border-slate-200/80 text-slate-800 rounded-bl-none"
                      }`}
                    >
                      {formatMessage(msg.text)}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 text-slate-500 text-xs pl-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--brand-blue)]" />
                    <span>Gemini is generating response...</span>
                  </div>
                )}

                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2 rounded-xl text-center font-medium">
                    {error}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestions */}
              {messages.length === 1 && (
                <div className="px-3.5 py-2.5 bg-white border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 text-left">
                    Suggested Quick Topics:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {suggestions.map((s) => (
                      <button
                        key={s.label}
                        onClick={() => handleSend(s.query)}
                        className="text-left text-[11px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1.5 transition"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend(inputValue)}
                  placeholder={isListening ? "Listening... Speak now!" : "Ask Saraswati AI..."}
                  className={`flex-1 border rounded-xl px-3.5 py-2 text-[13px] outline-none transition ${
                    isListening
                      ? "bg-rose-50 border-rose-300 placeholder-rose-400 text-rose-900 animate-pulse"
                      : "bg-slate-50 border-slate-200 focus:border-[var(--brand-blue)] focus:ring-2 focus:ring-blue-100 text-slate-800"
                  }`}
                />
                {isSpeechSupported && (
                  <button
                    type="button"
                    onClick={handleMicClick}
                    title={isListening ? "Stop listening" : "Voice input"}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
                      isListening ? "bg-rose-500 text-white animate-pulse" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                )}
                <button
                  onClick={() => handleSend(inputValue)}
                  disabled={!inputValue.trim() || isLoading}
                  className="w-9 h-9 rounded-xl bg-[var(--brand-blue)] hover:bg-[#154275] text-white flex items-center justify-center disabled:opacity-50 transition"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          )}

          {/* TAB 2: Live Voice Conversations */}
          {activeTab === "voice" && (
            <div className="flex-1 bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900 text-white p-6 flex flex-col items-center justify-between text-center">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold uppercase tracking-wider mb-3">
                  <Radio className="h-3.5 w-3.5 animate-ping text-rose-400" /> Live API Mode
                </span>
                <h4 className="text-lg font-extrabold tracking-tight">Gemini Live Voice Chat</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Model: <code className="text-amber-300 font-mono">gemini-3.1-flash-live-preview</code>
                </p>
              </div>

              {/* Central Voice Pulse Sphere */}
              <div className="my-6 relative flex items-center justify-center">
                {isLiveActive && (
                  <>
                    <div className="absolute w-36 h-36 rounded-full bg-rose-500/20 animate-ping" />
                    <div className="absolute w-28 h-28 rounded-full bg-rose-500/30 animate-pulse" />
                  </>
                )}
                <button
                  onClick={toggleLiveVoiceSession}
                  className={`relative w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-2xl transition duration-300 active:scale-95 border-2 ${
                    isLiveActive
                      ? "bg-rose-600 border-rose-300 text-white animate-pulse"
                      : "bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {isLiveActive ? (
                    <>
                      <MicOff className="h-8 w-8 mb-1" />
                      <span className="text-[10px] font-bold uppercase">End Live</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-8 w-8 mb-1 text-rose-400" />
                      <span className="text-[10px] font-bold uppercase">Start Live</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status and live transcript display */}
              <div className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Live Status:
                </span>
                <p className="text-xs font-semibold text-slate-200">
                  {isLiveActive
                    ? liveSpeaking
                      ? "🔊 Saraswati AI is speaking..."
                      : "🎙️ Listening... Speak naturally now!"
                    : "Tap 'Start Live' to initiate real-time hands-free voice conversation."}
                </p>
                {liveTranscript && (
                  <p className="text-[11px] text-amber-300 mt-2 italic bg-slate-900/60 p-2 rounded">
                    "{liveTranscript}"
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Model & Role Settings */}
          {activeTab === "settings" && (
            <div className="flex-1 p-4 bg-slate-50 text-left overflow-y-auto space-y-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Gemini Model Selection
                </label>
                <div className="space-y-2">
                  {[
                    {
                      id: "gemini-3.5-flash",
                      name: "gemini-3.5-flash",
                      desc: "Balanced & general purpose assistant for school information.",
                    },
                    {
                      id: "gemini-3.1-pro-preview",
                      name: "gemini-3.1-pro-preview",
                      desc: "High reasoning capacity for complex academic queries and career counseling.",
                    },
                    {
                      id: "gemini-3.1-flash-lite",
                      name: "gemini-3.1-flash-lite",
                      desc: "Ultra lightweight and fast response generation.",
                    },
                    {
                      id: "gemini-3.1-flash-live-preview",
                      name: "gemini-3.1-flash-live-preview",
                      desc: "Real-time streaming audio and voice conversations.",
                    },
                  ].map((m) => (
                    <div
                      key={m.id}
                      onClick={() => setSelectedModel(m.id as GeminiModel)}
                      className={`p-2.5 rounded-xl border transition cursor-pointer flex items-start justify-between ${
                        selectedModel === m.id
                          ? "bg-blue-50/80 border-[var(--brand-blue)] text-slate-900 shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <div>
                        <span className="font-mono text-xs font-bold block">{m.name}</span>
                        <span className="text-[11px] text-slate-500">{m.desc}</span>
                      </div>
                      {selectedModel === m.id && <CheckCircle2 className="h-4 w-4 text-[var(--brand-blue)] shrink-0 mt-0.5" />}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1.5">
                  System Instruction Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "assistant", label: "🏫 School Guide", desc: "General NSVM Info" },
                    { id: "admissions", label: "🎓 Admissions", desc: "Open 2082 & +2" },
                    { id: "tutor", label: "🔬 Science Tutor", desc: "Subjects & Homework" },
                    { id: "counselor", label: "💡 Career Guide", desc: "Stream Guidance" },
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRole(r.id as RoleType)}
                      className={`p-2 rounded-xl text-left border transition ${
                        selectedRole === r.id
                          ? "bg-teal-50 border-teal-600 text-teal-900 font-bold"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-xs block font-bold">{r.label}</span>
                      <span className="text-[10px] text-slate-500">{r.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-gradient-to-r from-[var(--brand-blue)] via-[#1c5392] to-[var(--brand-red)] text-white flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 relative group border-2 border-white/10"
        aria-label="Toggle Saraswati AI Assistant"
        style={{ minWidth: 64, minHeight: 64 }}
      >
        {isOpen ? (
          <X style={{ width: 32, height: 32 }} />
        ) : (
          <div className="relative">
            <MessageSquare style={{ width: 32, height: 32 }} className="animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--brand-yellow)] rounded-full border-2 border-white animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--brand-yellow)] rounded-full border-2 border-white" />
          </div>
        )}

        {!isOpen && (
          <span className="absolute left-16 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition duration-200 shadow-lg whitespace-nowrap">
            Saraswati AI Assistant
          </span>
        )}
      </button>
    </div>
  );
}
