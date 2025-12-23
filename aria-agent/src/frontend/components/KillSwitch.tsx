import React, { useState } from 'react';
import { StopCircle, AlertOctagon } from 'lucide-react';

interface KillSwitchProps {
  onStop: () => void;
  isActive: boolean;
}

export const KillSwitch: React.FC<KillSwitchProps> = ({ onStop, isActive }) => {
  const [confirming, setConfirming] = useState(false);

  const handleClick = () => {
    if (!isActive) return;

    if (confirming) {
      onStop();
      setConfirming(false);
    } else {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
    }
  };

  if (!isActive) return null;

  return (
    <button
      onClick={handleClick}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 shadow-lg ${
        confirming
          ? 'bg-red-600 text-white animate-pulse shadow-red-500/50'
          : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 hover:border-red-500/50'
      }`}
      title={confirming ? 'Click again to confirm STOP' : 'Emergency Stop'}
    >
      {confirming ? (
        <>
          <AlertOctagon className="w-5 h-5" />
          <span>CONFIRM STOP</span>
        </>
      ) : (
        <>
          <StopCircle className="w-5 h-5" />
          <span>STOP</span>
        </>
      )}
    </button>
  );
};

export const KillSwitchMinimal: React.FC<KillSwitchProps> = ({ onStop, isActive }) => {
  if (!isActive) return null;

  return (
    <button
      onClick={onStop}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-500/30 hover:bg-red-500 hover:scale-110 transition-all duration-200 active:scale-95"
      title="Emergency Stop"
    >
      <StopCircle className="w-7 h-7" />
    </button>
  );
};

export default KillSwitch;
