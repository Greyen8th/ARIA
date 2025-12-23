import React, { useEffect, useState } from 'react';
import { useAgent } from '../../AgentContext';

export const Core = () => {
  const { status } = useAgent();
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(0.5);
  const [loadingText, setLoadingText] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Reset text
    setLoadingText(null);

    if (status === 'thinking') {
      interval = setInterval(() => {
        setScale(s => s === 1 ? 1.2 : 1);
        setOpacity(o => o === 0.5 ? 0.8 : 0.5);
      }, 800);
    } else if (status === 'speaking') {
      interval = setInterval(() => {
        setScale(1 + Math.random() * 0.3);
        setOpacity(0.6 + Math.random() * 0.4);
      }, 100);
    } else if (['loading_model', 'loading_tensors', 'creating_context'].includes(status)) {
       // Loading States
       setLoadingText(status.replace('_', ' ').toUpperCase());
       interval = setInterval(() => {
         setScale(s => s === 1 ? 1.1 : 1);
         setOpacity(0.4);
       }, 500);
    } else {
      interval = setInterval(() => {
        setScale(s => s === 1 ? 1.05 : 1);
        setOpacity(o => o === 0.5 ? 0.6 : 0.5);
      }, 3000);
    }

    return () => clearInterval(interval);
  }, [status]);

  return (
    <div className="relative flex flex-col items-center justify-center pointer-events-none select-none">
      <div className="relative flex items-center justify-center">
          {/* Outer Glow (Ambient) */}
          <div 
            className={`absolute w-96 h-96 rounded-full blur-[100px] transition-all duration-[3000ms] ${
                loadingText ? 'bg-purple-trap/10' : 'bg-cyan-bio/5'
            }`}
            style={{ transform: `scale(${scale * 1.5})`, opacity: opacity * 0.5 }}
          />
          
          {/* Core Light */}
          <div 
            className={`w-4 h-4 rounded-full shadow-[0_0_50px_rgba(255,255,255,0.8)] transition-all duration-1000 ease-in-out ${
                loadingText ? 'bg-purple-trap' : 'bg-white'
            }`}
            style={{ 
              transform: `scale(${scale})`, 
              opacity: status === 'idle' ? 0.8 : 1,
              boxShadow: status === 'thinking' 
                ? '0 0 60px rgba(0, 243, 255, 0.8), 0 0 30px rgba(0, 243, 255, 0.4)' 
                : loadingText 
                  ? '0 0 40px rgba(189, 0, 255, 0.6)'
                  : '0 0 40px rgba(255, 255, 255, 0.4)'
            }}
          />
          
          {/* Orbital Ring (Subtle) */}
          <div 
            className="absolute w-64 h-64 border border-white/5 rounded-full animate-spin-slow"
            style={{ animationDuration: loadingText ? '5s' : '20s' }}
          />
      </div>

      {/* Loading Status Text */}
      {loadingText && (
          <div className="absolute top-full mt-8 font-mono text-[10px] tracking-[0.3em] text-white/30 animate-pulse">
              {loadingText}...
          </div>
      )}
    </div>
  );
};