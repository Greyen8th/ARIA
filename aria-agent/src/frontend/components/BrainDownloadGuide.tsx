import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FolderOpen, RefreshCw, ExternalLink } from 'lucide-react';

interface BrainDownloadGuideProps {
  onRetry: () => void;
}

export const BrainDownloadGuide: React.FC<BrainDownloadGuideProps> = ({ onRetry }) => {
  const [isChecking, setIsChecking] = useState(false);

  const DOWNLOAD_URL = 'https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf';
  const MODEL_SIZE = '2.0 GB';

  const handleOpenFolder = async () => {
    if (window.electronAPI?.openModelsFolder) {
      await window.electronAPI.openModelsFolder();
    } else {
      alert('Models folder: aria-agent/resources/models/');
    }
  };

  const handleDownloadClick = () => {
    window.open(DOWNLOAD_URL, '_blank');
  };

  const handleRetry = async () => {
    setIsChecking(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    onRetry();
    setIsChecking(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-8"
    >
      <div className="max-w-2xl w-full space-y-8">
        {/* Neural Core Offline Indicator */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 border border-orange-500/40 animate-pulse"></div>
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <Download className="w-4 h-4 text-black" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-mono tracking-[0.3em] text-orange-400">
            NEURAL CORE OFFLINE
          </h1>
          <p className="text-sm text-gray-400 font-mono tracking-wide">
            AI model required for system operation
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur-md">
          <div className="space-y-2">
            <h2 className="text-lg font-mono text-white/90">Download Required</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              ARIA requires a local AI model to function. This is a one-time download that enables
              all neural capabilities while keeping everything private on your device.
            </p>
          </div>

          <div className="flex items-center justify-between py-3 px-4 bg-white/5 rounded-lg border border-white/10">
            <div className="space-y-1">
              <p className="text-xs font-mono text-gray-500 tracking-wider">MODEL</p>
              <p className="text-sm font-mono text-white">ARIA Neural Engine</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-xs font-mono text-gray-500 tracking-wider">SIZE</p>
              <p className="text-sm font-mono text-orange-400">{MODEL_SIZE}</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-4">
          <div className="flex items-start gap-3 text-sm">
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-cyan-400 font-mono text-xs">1</span>
            </div>
            <div className="space-y-2 flex-1">
              <p className="text-gray-300">Download the AI model from HuggingFace</p>
              <button
                onClick={handleDownloadClick}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 rounded-lg text-cyan-200 font-mono text-xs tracking-wider transition-all duration-200 group"
              >
                <Download className="w-4 h-4 group-hover:animate-bounce" />
                DOWNLOAD MODEL
                <ExternalLink className="w-3 h-3 opacity-50" />
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3 text-sm">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-purple-400 font-mono text-xs">2</span>
            </div>
            <div className="space-y-2 flex-1">
              <p className="text-gray-300">Place the downloaded file in the models folder</p>
              <button
                onClick={handleOpenFolder}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 rounded-lg text-purple-200 font-mono text-xs tracking-wider transition-all duration-200"
              >
                <FolderOpen className="w-4 h-4" />
                OPEN MODELS FOLDER
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3 text-sm">
            <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="green-cyan-400 font-mono text-xs">3</span>
            </div>
            <div className="space-y-2 flex-1">
              <p className="text-gray-300">Verify the neural core is detected</p>
              <button
                onClick={handleRetry}
                disabled={isChecking}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded-lg text-green-200 font-mono text-xs tracking-wider transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                {isChecking ? 'CHECKING...' : 'CHECK AGAIN'}
              </button>
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="text-center">
          <p className="text-xs text-gray-500 font-mono">
            All processing happens locally on your device • Zero data sent to external servers
          </p>
        </div>
      </div>
    </motion.div>
  );
};
