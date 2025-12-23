import React, { useState, useEffect } from 'react';

interface MicButtonProps {
  onResult: (text: string) => void;
}

export const MicButton: React.FC<MicButtonProps> = ({ onResult }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Inizializza l'API nativa del browser/Electron
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false; // Si ferma quando smetti di parlare
      rec.lang = 'it-IT';     // Imposta Italiano
      rec.interimResults = false;

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log("Speech Result:", transcript);
        onResult(transcript); // Invia il testo alla chat
        setIsListening(false);
      };

      rec.onerror = (event: any) => {
        console.error("Errore microfono:", event.error);
        setError("Mic Error: " + event.error);
        setIsListening(false);
        setTimeout(() => setError(null), 3000);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    } else {
        console.warn("SpeechRecognition API not available in this browser/environment.");
        setError("Speech API not supported");
    }
  }, [onResult]);

  const toggleMic = () => {
    if (!recognition) {
        if (error) return; // Already showing error
        alert("Microfono non supportato in questo ambiente (serve Chrome o Electron configurato).");
        return;
    }
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
        setError(null);
        // Feedback sonoro stile Jarvis (Opzionale)
        // const audio = new Audio('/sounds/mic-on.mp3'); 
        // audio.play().catch(() => {});
      } catch (err) {
        console.error("Failed to start recognition:", err);
      }
    }
  };

  return (
    <div className="relative inline-block">
        {error && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-900/80 text-red-200 text-xs px-2 py-1 rounded">
                {error}
            </div>
        )}
        <button
        onClick={toggleMic}
        className={`p-3 rounded-full transition-all flex items-center justify-center shadow-lg ${
            isListening 
            ? 'bg-red-500 animate-pulse text-white shadow-red-500/50' 
            : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30'
        }`}
        title={isListening ? "Sto ascoltando..." : "Parla con Aria"}
        >
        {isListening ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
        ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
        )}
        </button>
    </div>
  );
};
