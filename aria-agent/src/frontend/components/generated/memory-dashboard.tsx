import React, { useState, useEffect } from 'react';

export default function MemoryDashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs?limit=50');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const clearMemory = async () => {
    if (!confirm('Are you sure you want to wipe all memory?')) return;
    await fetch('/api/clear', { method: 'POST' });
    fetchLogs();
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-400">Memory Matrix</h2>
        <div className="space-x-2">
            <button 
                onClick={fetchLogs}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded transition text-sm"
            >
                Refresh
            </button>
            <button 
                onClick={clearMemory}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded transition text-sm"
            >
                Wipe Memory
            </button>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
            <div className="text-center py-10 text-gray-500">Scanning neural pathways...</div>
        ) : logs.length === 0 ? (
            <div className="text-center py-10 text-gray-500">Memory banks empty.</div>
        ) : (
            logs.map((log, i) => (
                <div key={i} className="bg-[#111116] border border-white/5 p-4 rounded hover:border-blue-500/30 transition group">
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${log.success ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {log.success ? 'SUCCESS' : 'FAILURE'}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                            {new Date(log.timestamp).toLocaleString()}
                        </span>
                    </div>
                    <div className="text-sm text-gray-300 font-medium mb-2">
                        {log.task}
                    </div>
                    <div className="space-y-1">
                        {log.steps.map((step: any, j: number) => (
                            <div key={j} className="text-xs font-mono text-gray-500 pl-2 border-l border-white/10">
                                <span className="text-blue-400">{step.action.tool}</span>
                                <span className="mx-2">→</span>
                                <span className="truncate inline-block max-w-[300px] align-bottom opacity-50">
                                    {JSON.stringify(step.action.params)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
}
