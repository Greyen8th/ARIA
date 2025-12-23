import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgent } from '../../AgentContext';
import { Core } from './Core';

export const ChatInterface = () => {
  const { messages, status } = useAgent();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  return (
    <div className="relative flex-1 flex flex-col w-full h-full overflow-hidden">
      {/* SCROLLABLE MESSAGE AREA */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto no-scrollbar px-6 py-4 space-y-6 mask-image-linear-fade"
      >
        <AnimatePresence initial={false}>
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-60"
            >
              <div className="scale-150">
                <Core />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-mono tracking-[0.3em] text-white/80">ARIA ONLINE</h1>
                <p className="text-xs font-mono text-cyan-500/50 tracking-widest">SYSTEM READY • WAITING FOR INPUT</p>
              </div>
            </motion.div>
          )}

          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
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
            </motion.div>
          ))}
          
          {/* THINKING INDICATOR (In-Stream) */}
          {(status === 'thinking' || status === 'loading_model') && (
             <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
             >
                <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 rounded-tl-none flex items-center gap-2">
                   <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                   <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                   <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};