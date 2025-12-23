import React, { useState, useRef, useEffect } from 'react';
import { useAgent } from '../../AgentContext';
import { Paperclip, Monitor, Mic, SendHorizontal } from 'lucide-react';

export const CommandBar = () => {
  const { sendMessage, status } = useAgent();
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    sendMessage(input);
    setInput('');
  };

  // Auto-focus on idle
  useEffect(() => {
    if (status === 'idle' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [status]);

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative group">
        {/* Glass Container - Floating Spaceship Aesthetic */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-2xl rounded-full border border-white/10 transition-all duration-300 group-hover:bg-black/50 group-focus-within:border-cyan-500/30 group-focus-within:shadow-[0_0_40px_rgba(0,243,255,0.15)]" />
        
        <div className="relative flex items-center px-2 py-2">
            {/* Left Actions (Tools) */}
            <div className="flex items-center gap-1 pr-2">
                <button 
                  type="button" 
                  onClick={() => sendMessage('[CMD: SCREENSHOT]')}
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

            {/* Input Field */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter directive..."
              className="flex-1 bg-transparent px-4 py-3 text-white font-mono text-lg placeholder-white/20 focus:outline-none tracking-wide"
              disabled={status === 'thinking'}
            />
            
            {/* Right Actions (Mic / Send) */}
            <div className="flex items-center gap-1 pl-2">
                <button 
                  type="button" 
                  className={`p-3 rounded-full transition-all ${status === 'listening' ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
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
      
      {/* Status Hint */}
      <div className="absolute -bottom-6 left-0 w-full text-center">
        <span className="text-[10px] font-mono text-white/20 tracking-[0.2em] uppercase">
          {status === 'thinking' ? 'NEURAL ENGINE ACTIVE' : 'SECURE CHANNEL ESTABLISHED'}
        </span>
      </div>
    </div>
  );
};