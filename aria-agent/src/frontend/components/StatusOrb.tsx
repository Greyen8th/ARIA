import React from 'react';

interface StatusOrbProps {
  status: 'idle' | 'thinking' | 'speaking' | 'listening' | 'error';
}

export const StatusOrb: React.FC<StatusOrbProps> = ({ status }) => {
  const getOrbStyle = () => {
    switch (status) {
      case 'thinking':
        return 'bg-purple-trap shadow-[0_0_30px_#bd00ff] animate-spin duration-700';
      case 'speaking':
        return 'bg-cyan-bio shadow-[0_0_40px_#00f3ff] animate-pulse';
      case 'listening':
        return 'bg-red-500 shadow-[0_0_30px_#ef4444] animate-bounce';
      case 'error':
        return 'bg-red-700 shadow-[0_0_20px_#b91c1c]';
      case 'idle':
      default:
        return 'bg-cyan-bio/50 shadow-[0_0_15px_#00f3ff] animate-pulse-slow';
    }
  };

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      {/* Outer Ring */}
      <div className="absolute inset-0 border-2 border-white/10 rounded-full animate-[spin_10s_linear_infinite]" />
      <div className="absolute inset-2 border border-white/5 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
      
      {/* Core */}
      <div className={`w-12 h-12 rounded-full transition-all duration-500 ${getOrbStyle()}`}>
        <div className="absolute inset-0 bg-white/20 rounded-full blur-sm" />
      </div>
      
      {/* Status Text Label */}
      <div className="absolute -bottom-8 text-[10px] uppercase tracking-widest text-white/50 font-mono">
        {status.toUpperCase()}
      </div>
    </div>
  );
};
