import React from 'react';
import { useAgent } from '../AgentContext';

export const Header = () => {
  const { language, setLanguage } = useAgent();

  return (
    <div className="h-16 flex items-center justify-between px-8 absolute top-0 w-full z-50 bg-gradient-to-b from-obsidian/90 to-transparent pointer-events-none">
      {/* LEFT: MINIMAL BRAND */}
      <div className="flex items-center gap-4 pointer-events-auto">
        <span className="font-mono font-bold tracking-[0.3em] text-white/80 text-sm">ARIA</span>
      </div>

      {/* RIGHT: LANGUAGE TOGGLE (TEXT ONLY) */}
      <div className="flex items-center gap-6 pointer-events-auto">
        <button 
          onClick={() => setLanguage('en')}
          className={`text-[10px] font-bold tracking-widest transition-all ${
            language === 'en' ? 'text-cyan-bio' : 'text-white/20 hover:text-white/60'
          }`}
        >
          EN
        </button>
        
        <button 
          onClick={() => setLanguage('it')}
          className={`text-[10px] font-bold tracking-widest transition-all ${
            language === 'it' ? 'text-cyan-bio' : 'text-white/20 hover:text-white/60'
          }`}
        >
          IT
        </button>
      </div>
    </div>
  );
};
