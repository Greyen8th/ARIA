import React from 'react';
import { AgentProvider } from './AgentContext';
import { ChatInterface } from './components/Aether/ChatInterface';
import { NeuralBackground } from './components/Aether/NeuralBackground';
import { Header } from './components/Header';
import { CommandBar } from './components/Aether/CommandBar';
import { useAgent } from './AgentContext';

// --- SOLO CHAT LAYOUT ---
const ChatShell = () => {
  return (
    <div className="relative h-full w-full flex flex-col z-10">
       <Header />
       
       {/* MAIN CHAT AREA */}
       <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col relative overflow-hidden">
          <ChatInterface />
       </div>

       {/* FLOATING COMMAND BAR */}
       <div className="w-full max-w-2xl mx-auto px-6 pb-8 z-50">
          <CommandBar />
       </div>
    </div>
  );
};

// --- APP ROOT ---
const AppContent = () => {
  return (
    <div className="relative h-screen w-full bg-[#050505]/80 text-white overflow-hidden flex flex-col font-sans selection:bg-cyan-500/30 selection:text-white">
      {/* 1. Neural Background (Living Organism) */}
      <NeuralBackground />
      
      {/* 2. Glassmorphism Overlay (for vibrancy) */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60 pointer-events-none" />

      {/* 3. Main Interface */}
      <ChatShell />

      <div id="app-mounted" className="hidden">ARIA ONLINE</div>
    </div>
  );
};

function App() {
  return (
    <AgentProvider>
      <AppContent />
    </AgentProvider>
  );
}

export default App;
