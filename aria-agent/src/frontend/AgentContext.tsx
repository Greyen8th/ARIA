import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

type AgentStatus = 'idle' | 'thinking' | 'speaking' | 'listening' | 'error' | 'loading_model' | 'loading_tensors' | 'creating_context' | 'ready' | 'brain_missing';
type Language = 'en' | 'it';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AgentContextType {
  isConnected: boolean;
  status: AgentStatus;
  lastMessage: string | null;
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
  metrics: {
    cpu: number;
    ram: number;
    brain: string;
  };
  language: Language;
  setLanguage: (lang: Language) => void;
  retryBrainInit: () => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const AgentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const [metrics, setMetrics] = useState({ cpu: 0, ram: 0, brain: 'OFFLINE' });
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('aria_language') as Language) || 'en';
  });

  useEffect(() => {
    // Initial Connection
    connect();
    
    // Check connection status
    const interval = setInterval(() => {
        if (ws.current?.readyState === WebSocket.CLOSED) {
            connect();
        }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('aria_language', lang);
    
    // Notify Backend
    if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ 
            type: 'config', 
            config: { language: lang } 
        }));
    }
  };

  const connect = () => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    const socket = new WebSocket('ws://localhost:3847');
    
    socket.onopen = () => {
        console.log('[AgentContext] Connected');
        setIsConnected(true);
        setStatus('idle');
        
        // Send initial language config on connect
        socket.send(JSON.stringify({ 
            type: 'config', 
            config: { language: localStorage.getItem('aria_language') || 'en' } 
        }));
    };

    socket.onclose = () => {
        console.log('[AgentContext] Disconnected');
        setIsConnected(false);
        setStatus('error');
        ws.current = null;
    };

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'status') {
                // Map extended statuses to state
                if (data.status === 'thinking') setStatus('thinking');
                if (data.status === 'idle') setStatus('idle');
                if (data.status === 'loading_model') setStatus('loading_model');
                if (data.status === 'loading_tensors') setStatus('loading_tensors');
                if (data.status === 'creating_context') setStatus('creating_context');
                if (data.status === 'ready') setStatus('idle');
            }
            
            if (data.type === 'result') {
                setStatus('idle');
                setLastMessage(data.result);
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.result,
                    timestamp: Date.now()
                }]);
            }

            if (data.type === 'error') {
                // Check if it's a brain missing error
                if (data.error && (data.error.includes('brain_missing') || data.error.includes('Brain Error: brain_missing'))) {
                    setStatus('brain_missing');
                    console.warn('Neural Core missing - model download required');
                } else {
                    setStatus('error');
                    console.error('Agent Error:', data.error);
                    setTimeout(() => setStatus('idle'), 3000);
                }
            }
            
            // Handle Telemetry
            if (data.type === 'telemetry') {
                setMetrics(data.metrics);
            }
            
        } catch (e) {
            console.error('Failed to parse WS message', e);
        }
    };

    ws.current = socket;
  };

  const sendMessage = (text: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
        setStatus('thinking');

        // Add User Message immediately
        setMessages(prev => [...prev, {
            role: 'user',
            content: text,
            timestamp: Date.now()
        }]);

        ws.current.send(JSON.stringify({ type: 'execute', task: text }));
    } else {
        console.error('Cannot send message: WebSocket disconnected');
    }
  };

  const retryBrainInit = () => {
    // Reconnect to trigger brain initialization check
    if (ws.current) {
      ws.current.close();
    }
    setTimeout(() => {
      connect();
    }, 500);
  };

  return (
    <AgentContext.Provider value={{ isConnected, status, lastMessage, messages, sendMessage, metrics, language, setLanguage, retryBrainInit }}>
      {children}
    </AgentContext.Provider>
  );
};

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
};
