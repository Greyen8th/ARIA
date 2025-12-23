import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Eye, Mic, Database, Command, Image as ImageIcon } from 'lucide-react';
import { useAgent } from '../../AgentContext';

interface CardProps {
  title: string;
  icon: React.ReactNode;
  value?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

const BentoCard = ({ title, icon, value, active, onClick, className }: CardProps) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`glass-panel p-6 rounded-3xl cursor-pointer transition-all duration-300 group relative overflow-hidden ${className}`}
  >
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-cyan-500/10 to-transparent`} />
    <div className="relative z-10 flex flex-col h-full justify-between">
      <div className="flex justify-between items-start">
        <div className={`p-2 rounded-full ${active ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/40'}`}>
          {icon}
        </div>
        {active && <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
      </div>
      <div>
        <div className="text-2xl font-mono font-light text-white mb-1">{value}</div>
        <div className="text-xs font-mono text-white/40 tracking-widest uppercase">{title}</div>
      </div>
    </div>
  </motion.div>
);

export const HomeDashboard = () => {
  const { status, metrics, sendMessage } = useAgent();
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mx-auto p-4">
      {/* CORE STATUS - Large Card */}
      <BentoCard 
        title="CORE STATUS" 
        icon={<Activity size={24} />} 
        value={status.toUpperCase()} 
        active={status !== 'idle'}
        className="col-span-2 md:col-span-2 row-span-2 min-h-[200px]"
      />
      
      {/* VISION MODULE */}
      <BentoCard 
        title="VISION" 
        icon={<Eye size={20} />} 
        value="READY"
        onClick={() => sendMessage('[CMD: SCREENSHOT]')}
        className="col-span-1"
      />
      
      {/* VOICE MODE */}
      <BentoCard 
        title="VOICE" 
        icon={<Mic size={20} />} 
        value="OFF"
        onClick={() => sendMessage('Attiva la modalità vocale')}
        className="col-span-1"
      />
      
      {/* MEMORY BANK */}
      <BentoCard 
        title="MEMORY" 
        icon={<Database size={20} />} 
        value={`${metrics.ram}%`}
        className="col-span-1"
      />
      
      {/* SYSTEM LOAD */}
      <BentoCard 
        title="CPU LOAD" 
        icon={<Command size={20} />} 
        value={`${metrics.cpu}%`}
        className="col-span-1"
      />
    </div>
  );
};
