import React from 'react';

export const SynapseLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative w-24 h-24">
        {/* Central Core */}
        <div className="absolute inset-0 m-auto w-4 h-4 bg-white rounded-full animate-pulse shadow-[0_0_20px_rgba(255,255,255,0.8)]" />
        
        {/* Orbital Rings */}
        <svg className="w-full h-full animate-spin-slow" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(0, 243, 255, 0.3)" strokeWidth="1" strokeDasharray="60 40" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(147, 51, 234, 0.3)" strokeWidth="1" strokeDasharray="40 20" />
        </svg>

        {/* Orbiting Nodes */}
        <div className="absolute inset-0 animate-spin-reverse-slow">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-cyan-bio rounded-full shadow-[0_0_10px_rgba(0,243,255,0.8)]" />
        </div>
        <div className="absolute inset-0 animate-spin-slow" style={{ animationDuration: '4s' }}>
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-purple-trap rounded-full shadow-[0_0_10px_rgba(147,51,234,0.8)]" />
        </div>
      </div>
      
      {/* Text */}
      <div className="flex flex-col items-center gap-1">
          <span className="font-mono text-[10px] tracking-[0.4em] text-white/60 animate-pulse">ESTABLISHING NEURAL LINK</span>
          <div className="h-0.5 w-24 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-bio to-purple-trap animate-progress-indeterminate" />
          </div>
      </div>
    </div>
  );
};