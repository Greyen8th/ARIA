import React, { useEffect, useRef } from 'react';
import { useAgent } from '../../AgentContext';

export const Stream = () => {
  const { lastMessage, status } = useAgent();
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // In a real app, we'd keep a history array here or in Context.
  // For this minimal version, we'll just show the latest interaction or a history from Context if available.
  // Assuming Context might need an update to expose full history, but let's check AgentContext again.
  // AgentContext exposes `lastMessage`. Let's use a local history for now to simulate the stream.
  
  const [history, setHistory] = React.useState<{role: 'user' | 'ai', content: string}[]>([]);

  // Capture user messages (we need to hook into sendMessage or listen to an event, 
  // but since we can't easily hook into sendMessage from here without changing Context,
  // we will rely on the fact that `lastMessage` updates when AI responds. 
  // Ideally, AgentContext should provide `messages` array.
  // For this "Invisible Tech" demo, let's just show the AI's last response floating.)

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto flex flex-col justify-end pb-8 px-8 overflow-y-auto no-scrollbar mask-image-gradient">
      {/* We only show the latest significant output for that "Oracle" feel */}
      
      {lastMessage && (
        <div className="animate-fade-in-up">
            <div className="font-mono text-[10px] text-cyan-bio/50 mb-2 tracking-widest uppercase">
                Aria Response System
            </div>
            <div className="text-lg md:text-xl text-white/90 font-light leading-relaxed whitespace-pre-wrap">
                {lastMessage}
            </div>
        </div>
      )}

      {status === 'thinking' && (
          <div className="mt-4 font-mono text-xs text-white/30 animate-pulse">
              PROCESSING...
          </div>
      )}
      
      <div ref={bottomRef} />
    </div>
  );
};