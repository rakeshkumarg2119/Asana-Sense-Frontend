import React, { useState } from 'react';
import { Download, Sparkles, X, Smartphone, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/30 transition-all cursor-pointer border border-emerald-400/30 hover:scale-[1.02] active:scale-[0.98] ${className}`}
        title="Install ASANA - SENSE as Desktop / Mobile App"
      >
        <Download className="w-3.5 h-3.5 text-emerald-100" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 border border-stone-700 transition cursor-pointer ${className}`}
          title="Install on iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-3xl bg-stone-900 border border-stone-700 p-6 shadow-2xl text-stone-100 relative">
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-serif font-bold text-white mb-2">Install on iPhone / iPad</h3>
              <p className="text-xs text-stone-300 leading-relaxed space-y-2 mb-4">
                1. Tap the <strong>Share</strong> icon in the Safari bottom toolbar.<br />
                2. Scroll down and tap <strong>Add to Home Screen</strong> (➕).<br />
                3. Launch <strong>ASANA - SENSE</strong> directly from your home screen with zero browser bars!
              </p>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
