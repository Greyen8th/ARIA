import React from 'react';
import { useAgent } from '../AgentContext';
import { BrainMonitor } from './BrainMonitor';

export const StatusPanel = () => {
  // Minimal version for sidebar icon
  return (
      <div className="w-8 h-8 flex items-center justify-center">
          <BrainMonitor />
      </div>
  );
};

export const ContextPanel = () => {
    return (
        <div className="h-full flex flex-col gap-4 p-4 font-mono text-xs text-white/60">
            {/* 
              <div className="bg-glass border border-white/10 p-3 rounded h-1/2 overflow-hidden relative">
                   ... (REMOVED FAKE LOGS) ...
              </div>
            */}
             <div className="bg-glass border border-white/10 p-3 rounded flex-1">
                 <h3 className="text-white/50 mb-2 uppercase tracking-widest border-b border-white/5 pb-1">Artifacts</h3>
                 <div className="text-center mt-10 opacity-30 text-[10px]">
                     No active artifacts
                 </div>
            </div>
        </div>
    );
}
