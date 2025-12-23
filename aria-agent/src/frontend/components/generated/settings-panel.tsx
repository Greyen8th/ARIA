import React, { useState, useEffect } from 'react';

export default function SettingsPanel() {
  const [model, setModel] = useState('llama3.2:3b');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    fetch('/api/status').then(r => r.json()).then(setStatus);
  }, []);

  const handleSave = () => {
    // In a real app, this would post to an endpoint
    alert('Settings saved (Simulation)');
  };

  const pullModel = async () => {
    const newModel = prompt("Enter model name (e.g. deepseek-coder:6.7b):");
    if (!newModel) return;
    
    alert(`Pulling ${newModel}... check server logs.`);
    await fetch('/api/pull-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: newModel })
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-purple-400">System Configuration</h2>
      
      {/* AI Core Settings */}
      <div className="bg-[#111116] border border-white/5 p-6 rounded-lg space-y-6">
        <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            AI Core
        </h3>
        
        <div className="grid gap-4">
            <div>
                <label className="block text-sm text-gray-400 mb-2">Active Model</label>
                <div className="flex gap-2">
                    <select 
                        value={model} 
                        onChange={e => setModel(e.target.value)}
                        className="flex-1 bg-black/30 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 outline-none"
                    >
                        {status?.availableModels?.models?.map((m: any) => (
                            <option key={m.name} value={m.name}>{m.name}</option>
                        )) || <option>Loading...</option>}
                    </select>
                    <button 
                        onClick={pullModel}
                        className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded text-sm"
                    >
                        Download New
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-sm text-gray-400 mb-2">Context Window</label>
                <input 
                    type="range" 
                    min="2048" 
                    max="32768" 
                    step="1024"
                    defaultValue="8192"
                    className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>2k</span>
                    <span>8k (Default)</span>
                    <span>32k</span>
                </div>
            </div>
        </div>
      </div>

      {/* Voice Settings */}
      <div className="bg-[#111116] border border-white/5 p-6 rounded-lg space-y-6">
        <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Voice Engine (JARVIS)
        </h3>
        
        <div className="flex items-center justify-between">
            <div>
                <div className="text-sm font-medium">Voice Feedback</div>
                <div className="text-xs text-gray-500">Speak responses aloud</div>
            </div>
            <button 
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`w-12 h-6 rounded-full transition relative ${voiceEnabled ? 'bg-blue-500' : 'bg-gray-700'}`}
            >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${voiceEnabled ? 'left-7' : 'left-1'}`} />
            </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-lg space-y-6">
        <h3 className="text-lg font-medium text-red-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Evolution Protocol
        </h3>
        
        <p className="text-sm text-gray-400">
            Forcing evolution will trigger a self-analysis cycle and may result in code rewriting.
        </p>

        <button className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded font-medium transition">
            INITIATE SELF-IMPROVEMENT CYCLE
        </button>
      </div>

    </div>
  );
}
