import React, { useState, useEffect, Suspense, useRef } from 'react';
import { MicButton } from './components/MicButton';
import routesList from './routes.json';
import { loadExternalComponent } from '../utils/DynamicLoader';
import { useAgent } from './AgentContext';

export const DynamicRouter = {
  Navigation: () => {
    const [routes, setRoutes] = useState<string[]>(routesList);

    useEffect(() => {
       // In dev mode with HMR, importing json might update automatically.
    }, []);

    return (
      <>
        {routes.map(route => (
          <button 
            key={route}
            onClick={() => window.location.hash = `#${route}`}
            className="block w-full text-left px-4 py-2 rounded hover:bg-white/5 text-gray-300 hover:text-white transition capitalize"
          >
            {route.replace(/-/g, ' ')}
          </button>
        ))}
      </>
    );
  },

  View: () => {
    const [currentHash, setCurrentHash] = useState(window.location.hash.slice(1) || 'chat');
    const [Component, setComponent] = useState<React.ComponentType | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Use Context for Global State
    const { status, lastMessage, sendMessage } = useAgent();
    
    // Chat State
    const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Sync last message from context to local chat
    useEffect(() => {
        if (lastMessage) {
            setMessages(prev => {
                // Prevent duplicate messages if re-render occurs
                if (prev[prev.length - 1]?.content !== lastMessage) {
                    return [...prev, { role: 'assistant', content: lastMessage }];
                }
                return prev;
            });
        }
    }, [lastMessage]);

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, status]); // Scroll also when status changes (e.g. thinking appears)

    const handleSendMessage = (text: string) => {
        if (!text.trim()) return;
        setMessages(prev => [...prev, { role: 'user', content: text }]);
        sendMessage(text);
        setInput('');
    };

    const handleMicResult = (text: string) => {
        handleSendMessage(text);
    };

    useEffect(() => {
      const handleHashChange = () => setCurrentHash(window.location.hash.slice(1) || 'chat');
      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    useEffect(() => {
      if (currentHash === 'chat') {
        setComponent(null);
        return;
      }

      const loadComponent = async () => {
        try {
            const ExternalComp = await loadExternalComponent(currentHash);
            if (ExternalComp) {
                setComponent(() => ExternalComp);
                setError(null);
                return;
            }

            const modules = import.meta.glob('./components/generated/*.tsx');
            const targetModule = modules[`./components/generated/${currentHash}.tsx`];

            if (targetModule) {
                const mod: any = await targetModule();
                setComponent(() => mod.default);
                setError(null);
            } else {
                setError(`Component not found: ${currentHash}`);
            }
        } catch (err) {
            console.error("Failed to load component:", err);
            setError(`Failed to load: ${currentHash}`);
        }
      };

      loadComponent();

    }, [currentHash]);

    if (currentHash === 'chat') {
      return (
        <div className="flex flex-col h-full bg-[#0a0a0f]">
          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
                    <div className="w-16 h-16 rounded-full border-2 border-cyan-500 flex items-center justify-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-cyan-500/20 animate-pulse"></div>
                    </div>
                    <p>ARIA Online. Awaiting Input.</p>
                </div>
            )}
            
            {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                        msg.role === 'user' 
                        ? 'bg-cyan-900/30 text-cyan-100 border border-cyan-500/30' 
                        : msg.role === 'system'
                        ? 'bg-red-900/20 text-red-400 text-sm border border-red-500/20'
                        : 'bg-[#1a1a20] text-gray-200 border border-white/10'
                    }`}>
                        <div className="whitespace-pre-wrap font-mono text-sm">{msg.content}</div>
                    </div>
                </div>
            ))}
            
            {status === 'thinking' && (
                <div className="flex justify-start">
                    <div className="bg-[#1a1a20] text-gray-400 p-3 rounded-lg border border-white/5 flex items-center gap-2">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce delay-150"></div>
                        <span className="text-xs ml-2">Processing...</span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-[#111116] border-t border-white/10 flex items-center gap-3">
            <MicButton onResult={handleMicResult} />
            
            <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(input)}
                placeholder="Type a command or use voice..."
                className="flex-1 bg-[#0a0a0f] border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition font-mono"
            />
            
            <button 
                onClick={() => handleSendMessage(input)}
                disabled={!input.trim()}
                className="p-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white transition"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      );
    }

    if (error) {
        return <div className="p-8 text-red-500 border border-red-500/20 rounded m-4 bg-red-500/10">{error}</div>;
    }

    return (
      <div className="flex-1 overflow-auto bg-[#0a0a0f] p-6">
        <Suspense fallback={<div className="text-blue-500">Loading UI...</div>}>
          {Component ? <Component /> : <div className="text-gray-500">Initializing View...</div>}
        </Suspense>
      </div>
    );
  }
};
