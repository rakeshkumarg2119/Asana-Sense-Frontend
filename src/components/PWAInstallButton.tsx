import React, { useState } from 'react';
import { Download, Smartphone, X, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`install-app-btn relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200/80 text-stone-700 text-[11px] font-semibold transition cursor-pointer border border-stone-200 shadow-2xs group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${className}`}
        title="Install ASANA - SENSE on this device"
        aria-label="Install ASANA - SENSE App"
      >
        <Download className="w-3.5 h-3.5 text-stone-600 group-hover:translate-y-0.5 transition duration-200" aria-hidden="true" />
        <span className="font-medium text-stone-700 hidden sm:inline">Install</span>
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
          className={`install-app-btn relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200/80 text-stone-700 text-[11px] font-semibold transition cursor-pointer border border-stone-200 shadow-2xs group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${className}`}
          title="Install on iPhone / iPad"
          aria-label="Install on iPhone or iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-stone-600" aria-hidden="true" />
          <span className="font-medium text-stone-700 hidden sm:inline">Install</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-3xl bg-stone-900 border border-stone-700 p-6 shadow-2xl text-stone-100 relative">
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-white transition cursor-pointer"
                aria-label="Close install instructions"
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
