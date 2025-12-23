import React from 'react';
import { motion } from 'framer-motion';
import { useAgent } from '../../AgentContext';

export const NeuralBackground = () => {
  const { status } = useAgent();
  const isThinking = status === 'thinking' || status === 'loading_model';

  // Generate random particles
  const particles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 300 + 50,
    duration: Math.random() * 20 + 10,
  }));

  return (
    <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden bg-[#050505]">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full mix-blend-screen filter blur-[80px] opacity-10"
          style={{
            background: isThinking
              ? 'radial-gradient(circle, rgba(147,51,234,0.4) 0%, rgba(0,0,0,0) 70%)'
              : 'radial-gradient(circle, rgba(0,243,255,0.3) 0%, rgba(0,0,0,0) 70%)',
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            x: [0, Math.random() * 100 - 50, 0],
            y: [0, Math.random() * 100 - 50, 0],
            scale: isThinking ? [1, 1.5, 1] : [1, 1.2, 1],
          }}
          transition={{
            duration: isThinking ? p.duration / 2 : p.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-radial-gradient-vignette pointer-events-none" />
    </div>
  );
};
