import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Eye, MousePointer, Download, Terminal, X } from 'lucide-react';

interface ConsentModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

const CONSENT_KEY = 'aria_user_consent_v1';

export const useConsent = () => {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    setHasConsented(consent === 'true');
  }, []);

  const grantConsent = () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    setHasConsented(true);
  };

  const revokeConsent = () => {
    localStorage.removeItem(CONSENT_KEY);
    setHasConsented(false);
  };

  return { hasConsented, grantConsent, revokeConsent };
};

export const ConsentModal: React.FC<ConsentModalProps> = ({ onAccept, onDecline }) => {
  const [understood, setUnderstood] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl">
      <div className="max-w-2xl w-full mx-4 bg-gradient-to-b from-gray-900 to-black border border-cyan-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30">
              <Shield className="w-7 h-7 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">ARIA System Access</h1>
              <p className="text-gray-400 text-sm">Full Control Authorization Required</p>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-200 font-medium text-sm">Important Notice</p>
                <p className="text-amber-200/70 text-xs mt-1">
                  ARIA is an autonomous AI agent with full system access. Only use on systems you own and control.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <h3 className="text-white font-medium text-sm uppercase tracking-wider opacity-60 mb-4">Capabilities</h3>

            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <Eye className="w-5 h-5 text-cyan-400" />
              <div className="flex-1">
                <p className="text-white text-sm font-medium">Screen Vision</p>
                <p className="text-gray-500 text-xs">Can capture and analyze your screen content</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <MousePointer className="w-5 h-5 text-cyan-400" />
              <div className="flex-1">
                <p className="text-white text-sm font-medium">Mouse & Keyboard Control</p>
                <p className="text-gray-500 text-xs">Can move mouse, click, and type on your behalf</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <Terminal className="w-5 h-5 text-cyan-400" />
              <div className="flex-1">
                <p className="text-white text-sm font-medium">System Commands</p>
                <p className="text-gray-500 text-xs">Can execute terminal commands and AppleScript</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <Download className="w-5 h-5 text-cyan-400" />
              <div className="flex-1">
                <p className="text-white text-sm font-medium">File & Network Access</p>
                <p className="text-gray-500 text-xs">Can read, write files and download from internet</p>
              </div>
            </div>
          </div>

          <label className="flex items-start gap-3 p-4 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors mb-6">
            <input
              type="checkbox"
              checked={understood}
              onChange={(e) => setUnderstood(e.target.checked)}
              className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 mt-0.5"
            />
            <span className="text-gray-300 text-sm">
              I understand that ARIA has full control over my Mac and I accept responsibility for its actions.
              I will only use ARIA on systems I own.
            </span>
          </label>

          <div className="flex gap-3">
            <button
              onClick={onDecline}
              className="flex-1 py-3 px-6 rounded-xl bg-gray-800 text-gray-400 font-medium hover:bg-gray-700 hover:text-white transition-all border border-gray-700"
            >
              Decline
            </button>
            <button
              onClick={onAccept}
              disabled={!understood}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all ${
                understood
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 shadow-lg shadow-cyan-500/20'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'
              }`}
            >
              Accept & Continue
            </button>
          </div>

          <p className="text-center text-gray-600 text-xs mt-4">
            You can revoke this consent at any time in Settings
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConsentModal;
