import React from 'react';
import { AgentProvider } from './AgentContext';
import { ChatInterface } from './components/Aether/ChatInterface';
import { NeuralBackground } from './components/Aether/NeuralBackground';
import { Header } from './components/Header';
import { CommandBar } from './components/Aether/CommandBar';
import { useAgent } from './AgentContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BrainDownloadGuide } from './components/BrainDownloadGuide';
import { ConsentModal, useConsent } from './components/ConsentModal';
import { KillSwitch } from './components/KillSwitch';

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

const AppContent = () => {
  const { status, retryBrainInit, stopExecution, isExecuting } = useAgent();
  const { hasConsented, grantConsent, revokeConsent } = useConsent();

  if (hasConsented === null) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasConsented) {
    return (
      <ConsentModal
        onAccept={grantConsent}
        onDecline={() => {
          window.close();
          document.body.innerHTML = '<div style="display:flex;height:100vh;align-items:center;justify-content:center;background:#000;color:#666;font-family:system-ui;">Access Denied. Close this window.</div>';
        }}
      />
    );
  }

  return (
    <div className="relative h-screen w-full bg-[#050505]/80 text-white overflow-hidden flex flex-col font-sans selection:bg-cyan-500/30 selection:text-white">
      <NeuralBackground />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60 pointer-events-none" />

      <ChatShell />

      {status === 'brain_missing' && (
        <BrainDownloadGuide onRetry={retryBrainInit} />
      )}

      <KillSwitch onStop={stopExecution} isActive={isExecuting} />

      <div id="app-mounted" className="hidden">ARIA ONLINE</div>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AgentProvider>
        <AppContent />
      </AgentProvider>
    </ErrorBoundary>
  );
}

export default App;
