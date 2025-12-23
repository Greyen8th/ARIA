import React, { useEffect, useState } from 'react';
import { useAgent } from '../../AgentContext';

export const LiquidBackground = () => {
  const { status } = useAgent();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((p) => p + 1);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const isThinking = status === 'thinking' || status === 'loading_model';

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden -z-10 bg-black">
      {/* Mesh Gradient 1 */}
      <div 
        className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-20 transition-all duration-[3000ms] ease-in-out"
        style={{
          background: 'radial-gradient(circle, rgba(0,243,255,1) 0%, rgba(0,0,0,0) 70%)',
          transform: `translate(${Math.sin(phase * 0.01) * 50}px, ${Math.cos(phase * 0.01) * 50}px) scale(${isThinking ? 1.2 : 1})`
        }}
      />

      {/* Mesh Gradient 2 */}
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full blur-[140px] opacity-15 transition-all duration-[3000ms] ease-in-out"
        style={{
          background: 'radial-gradient(circle, rgba(147,51,234,1) 0%, rgba(0,0,0,0) 70%)',
          transform: `translate(${Math.cos(phase * 0.015) * 60}px, ${Math.sin(phase * 0.015) * 60}px) scale(${isThinking ? 1.3 : 1})`
        }}
      />

      {/* Mesh Gradient 3 (Central Pulse) */}
      <div 
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full blur-[100px] transition-all duration-1000 ${
          isThinking ? 'opacity-30 scale-125' : 'opacity-10 scale-100'
        }`}
        style={{
            background: isThinking 
                ? 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(0,243,255,0) 70%)'
                : 'radial-gradient(circle, rgba(0,243,255,0.5) 0%, rgba(0,0,0,0) 70%)'
        }}
      />
      
      {/* Noise Overlay for Texture */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" 
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} 
      />
    </div>
  );
};