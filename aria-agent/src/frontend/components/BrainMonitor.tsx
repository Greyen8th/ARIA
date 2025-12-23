import React from 'react';
import { useAgent } from '../AgentContext';

export const BrainMonitor = () => {
  const { metrics, status } = useAgent();
  const isOnline = metrics.brain === 'ONLINE';

  // Minimal Icon Version
  return (
    <div className="relative w-8 h-8 flex items-center justify-center group cursor-help">
       {/* Pulse Ring */}
       <div className={`absolute inset-0 rounded-full border border-cyan-bio/30 ${status === 'thinking' ? 'animate-ping' : 'opacity-0'}`} />
       
       {/* Core Dot */}
       <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
           status === 'thinking' ? 'bg-purple-trap shadow-[0_0_10px_#bd00ff]' : 
           isOnline ? 'bg-cyan-bio shadow-[0_0_5px_#00f3ff]' : 'bg-red-500'
       }`} />

       {/* Tooltip on Hover */}
       <div className="absolute left-10 bg-obsidian border border-white/10 px-2 py-1 rounded text-[9px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
           CORTEX: {isOnline ? 'ONLINE' : 'OFFLINE'}
       </div>
    </div>
  );
};
