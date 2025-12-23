import React, { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, Eye, MousePointer, Download, Terminal, Monitor, Paperclip, Mic, SendHorizontal, StopCircle } from 'lucide-react';

type Status = 'idle' | 'thinking' | 'speaking' | 'listening';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const CONSENT_KEY = 'aria_preview_consent';

const DEMO_RESPONSES = [
  "Analisi completata. Ho identificato 3 potenziali ottimizzazioni nel tuo workflow.",
  "Scansione del sistema in corso... Tutti i parametri sono nella norma.",
  "Ho eseguito il task richiesto. I file sono stati organizzati nella cartella specificata.",
  "Connessione ai servizi esterni stabilita. Pronto per l'integrazione.",
  "Report generato con successo. Vuoi che lo esporti in formato PDF?",
];

const NeuralBackground = ({ isThinking }: { isThinking: boolean }) => {
  const particles = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 300 + 100,
    delay: Math.random() * 5,
  }));

  return (
    <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden bg-[#050505]">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute rounded-full mix-blend-screen filter blur-[80px] animate-float ${
            isThinking ? 'opacity-20' : 'opacity-10'
          }`}
          style={{
            background: isThinking
              ? 'radial-gradient(circle, rgba(147,51,234,0.5) 0%, rgba(0,0,0,0) 70%)'
              : 'radial-gradient(circle, rgba(0,243,255,0.4) 0%, rgba(0,0,0,0) 70%)',
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: isThinking ? '8s' : '15s',
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/50 to-black pointer-events-none" />
    </div>
  );
};

const Core = ({ status }: { status: Status }) => {
  const isThinking = status === 'thinking';

  return (
    <div className="relative flex flex-col items-center justify-center pointer-events-none select-none">
      <div className="relative flex items-center justify-center">
        <div
          className={`absolute w-96 h-96 rounded-full blur-[100px] transition-all duration-[3000ms] ${
            isThinking ? 'bg-purple-500/10 scale-150' : 'bg-cyan-500/5 scale-100'
          }`}
        />

        <div
          className={`w-4 h-4 rounded-full transition-all duration-1000 ease-in-out ${
            isThinking ? 'bg-purple-400 animate-pulse-core scale-125' : 'bg-white scale-100'
          }`}
          style={{
            boxShadow: isThinking
              ? '0 0 60px rgba(147, 51, 234, 0.8), 0 0 30px rgba(147, 51, 234, 0.4)'
              : '0 0 40px rgba(255, 255, 255, 0.4), 0 0 20px rgba(0, 243, 255, 0.3)'
          }}
        />

        <div
          className={`absolute w-64 h-64 border border-white/5 rounded-full ${
            isThinking ? 'animate-spin-fast' : 'animate-spin-slow'
          }`}
        />
      </div>
    </div>
  );
};

const ConsentModal = ({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) => {
  const [understood, setUnderstood] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl">
      <div className="max-w-2xl w-full mx-4 bg-gradient-to-b from-gray-900 to-black border border-cyan-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10 animate-fade-in">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30">
              <Shield className="w-7 h-7 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">ARIA System Access</h1>
              <p className="text-gray-400 text-sm">Full Control Authorization Required</p>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-200 font-medium text-sm">Important Notice</p>
                <p className="text-amber-200/70 text-xs mt-1">
                  ARIA is an autonomous AI agent with full system access. Only use on systems you own and control.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <h3 className="text-white font-medium text-sm uppercase tracking-wider opacity-60 mb-4">Capabilities</h3>

            {[
              { icon: Eye, title: 'Screen Vision', desc: 'Can capture and analyze your screen content' },
              { icon: MousePointer, title: 'Mouse & Keyboard Control', desc: 'Can move mouse, click, and type on your behalf' },
              { icon: Terminal, title: 'System Commands', desc: 'Can execute terminal commands and AppleScript' },
              { icon: Download, title: 'File & Network Access', desc: 'Can read, write files and download from internet' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <item.icon className="w-5 h-5 text-cyan-400" />
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{item.title}</p>
                  <p className="text-gray-500 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <label className="flex items-start gap-3 p-4 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors mb-6">
            <input
              type="checkbox"
              checked={understood}
              onChange={(e) => setUnderstood(e.target.checked)}
              className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 mt-0.5 accent-cyan-500"
            />
            <span className="text-gray-300 text-sm">
              I understand that ARIA has full control over my Mac and I accept responsibility for its actions.
            </span>
          </label>

          <div className="flex gap-3">
            <button
              onClick={onDecline}
              className="flex-1 py-3 px-6 rounded-xl bg-gray-800 text-gray-400 font-medium hover:bg-gray-700 hover:text-white transition-all border border-gray-700"
            >
              Decline
            </button>
            <button
              onClick={onAccept}
              disabled={!understood}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all ${
                understood
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 shadow-lg shadow-cyan-500/20'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'
              }`}
            >
              Accept & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Header = ({ language, setLanguage }: { language: 'en' | 'it'; setLanguage: (l: 'en' | 'it') => void }) => {
  return (
    <div className="h-16 flex items-center justify-between px-8 absolute top-0 w-full z-50 bg-gradient-to-b from-black/80 to-transparent">
      <div className="flex items-center gap-4">
        <span className="font-mono font-bold tracking-[0.3em] text-white/80 text-sm">ARIA</span>
        <span className="text-xs text-cyan-500/50 font-mono">PREVIEW MODE</span>
      </div>

      <div className="flex items-center gap-6">
        {(['en', 'it'] as const).map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`text-[10px] font-bold tracking-widest transition-all ${
              language === lang ? 'text-cyan-400' : 'text-white/20 hover:text-white/60'
            }`}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
};

const ChatInterface = ({ messages, status }: { messages: ChatMessage[]; status: Status }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  return (
    <div className="relative flex-1 flex flex-col w-full h-full overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-60 animate-fade-in">
            <div className="scale-150">
              <Core status={status} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-mono tracking-[0.3em] text-white/80">ARIA ONLINE</h1>
              <p className="text-xs font-mono text-cyan-500/50 tracking-widest">SYSTEM READY - WAITING FOR INPUT</p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex animate-slide-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <div
              className={`max-w-[85%] px-6 py-4 rounded-2xl backdrop-blur-md border ${
                msg.role === 'user'
                  ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-50 rounded-tr-none'
                  : 'bg-white/5 border-white/10 text-gray-200 rounded-tl-none shadow-lg'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans text-lg leading-relaxed">
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {status === 'thinking' && (
          <div className="flex justify-start animate-fade-in">
            <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 rounded-tl-none flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CommandBar = ({ onSend, status }: { onSend: (text: string) => void; status: Status }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  useEffect(() => {
    if (status === 'idle' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [status]);

  return (
    <div className="w-full relative">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-2xl rounded-full border border-white/10 transition-all duration-300 group-hover:bg-black/50 group-focus-within:border-cyan-500/30 group-focus-within:shadow-[0_0_40px_rgba(0,243,255,0.15)]" />

        <div className="relative flex items-center px-2 py-2">
          <div className="flex items-center gap-1 pr-2">
            <button
              type="button"
              className="p-3 rounded-full text-white/40 hover:text-cyan-400 hover:bg-white/5 transition-all"
              title="Vision Analysis"
            >
              <Monitor size={20} />
            </button>
            <button
              type="button"
              className="p-3 rounded-full text-white/40 hover:text-cyan-400 hover:bg-white/5 transition-all"
              title="Attach File"
            >
              <Paperclip size={20} />
            </button>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter directive..."
            className="flex-1 bg-transparent px-4 py-3 text-white font-mono text-lg placeholder-white/20 focus:outline-none tracking-wide"
            disabled={status === 'thinking'}
          />

          <div className="flex items-center gap-1 pl-2">
            <button
              type="button"
              className="p-3 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-all"
            >
              <Mic size={20} />
            </button>

            {input.trim() && (
              <button
                type="submit"
                className="p-3 rounded-full bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-all animate-fade-in"
              >
                <SendHorizontal size={20} />
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="absolute -bottom-6 left-0 w-full text-center">
        <span className="text-[10px] font-mono text-white/20 tracking-[0.2em] uppercase">
          {status === 'thinking' ? 'NEURAL ENGINE ACTIVE' : 'SECURE CHANNEL ESTABLISHED'}
        </span>
      </div>
    </div>
  );
};

const KillSwitch = ({ onStop, isActive }: { onStop: () => void; isActive: boolean }) => {
  if (!isActive) return null;

  return (
    <button
      onClick={onStop}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 hover:border-red-500/50 transition-all shadow-lg"
      title="Emergency Stop"
    >
      <StopCircle className="w-5 h-5" />
      <span>STOP</span>
    </button>
  );
};

function App() {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);
  const [language, setLanguage] = useState<'en' | 'it'>('en');
  const [status, setStatus] = useState<Status>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    setHasConsented(consent === 'true');
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    setHasConsented(true);
  };

  const handleDecline = () => {
    setHasConsented(false);
  };

  const handleSend = (text: string) => {
    setMessages((prev) => [...prev, { role: 'user', content: text, timestamp: Date.now() }]);
    setStatus('thinking');

    setTimeout(() => {
      const response = DEMO_RESPONSES[Math.floor(Math.random() * DEMO_RESPONSES.length)];
      setMessages((prev) => [...prev, { role: 'assistant', content: response, timestamp: Date.now() }]);
      setStatus('idle');
    }, 2000 + Math.random() * 1500);
  };

  const handleStop = () => {
    setStatus('idle');
    setMessages((prev) => [...prev, { role: 'assistant', content: '[SYSTEM] Execution stopped.', timestamp: Date.now() }]);
  };

  if (hasConsented === null) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasConsented) {
    return <ConsentModal onAccept={handleAccept} onDecline={handleDecline} />;
  }

  return (
    <div className="relative h-screen w-full bg-[#050505]/80 text-white overflow-hidden flex flex-col font-sans selection:bg-cyan-500/30 selection:text-white">
      <NeuralBackground isThinking={status === 'thinking'} />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60 pointer-events-none" />

      <div className="relative h-full w-full flex flex-col z-10">
        <Header language={language} setLanguage={setLanguage} />

        <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col relative overflow-hidden pt-16">
          <ChatInterface messages={messages} status={status} />
        </div>

        <div className="w-full max-w-2xl mx-auto px-6 pb-8 z-50">
          <CommandBar onSend={handleSend} status={status} />
        </div>
      </div>

      <KillSwitch onStop={handleStop} isActive={status === 'thinking'} />
    </div>
  );
}

export default App;
