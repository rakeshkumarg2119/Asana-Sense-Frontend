import React, { useState, useEffect } from 'react';
import { 
  Cookie, 
  ShieldCheck, 
  Settings2, 
  X, 
  Check, 
  Info, 
  Volume2, 
  Activity, 
  Lock 
} from 'lucide-react';
import { 
  getCookieConsent, 
  saveCookieConsent, 
  CookieConsentPreferences 
} from '../utils/apiClient';

export const CookieConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState<boolean>(false);
  const [functionalEnabled, setFunctionalEnabled] = useState<boolean>(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState<boolean>(true);

  useEffect(() => {
    const existing = getCookieConsent();
    if (!existing || !existing.hasConsented) {
      // Delay slightly for smooth page entry
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 700);
      return () => clearTimeout(timer);
    } else {
      setFunctionalEnabled(existing.functional);
      setAnalyticsEnabled(existing.analytics);
    }
  }, []);

  // Listen for global event from Footer to open preferences
  useEffect(() => {
    const handleOpenEvent = () => {
      const current = getCookieConsent();
      if (current) {
        setFunctionalEnabled(current.functional);
        setAnalyticsEnabled(current.analytics);
      }
      setShowPreferencesModal(true);
    };

    window.addEventListener('open-cookie-preferences', handleOpenEvent);
    return () => window.removeEventListener('open-cookie-preferences', handleOpenEvent);
  }, []);

  const handleAcceptAll = () => {
    saveCookieConsent({ functional: true, analytics: true });
    setIsVisible(false);
    setShowPreferencesModal(false);
  };

  const handleEssentialOnly = () => {
    saveCookieConsent({ functional: false, analytics: false });
    setIsVisible(false);
    setShowPreferencesModal(false);
  };

  const handleSaveCustomPreferences = () => {
    saveCookieConsent({
      functional: functionalEnabled,
      analytics: analyticsEnabled,
    });
    setIsVisible(false);
    setShowPreferencesModal(false);
  };

  return (
    <>
      {/* Floating Bottom Banner */}
      {isVisible && !showPreferencesModal && (
        <aside
          aria-label="Cookie and Storage Consent"
          className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-6 md:max-w-4xl md:mx-auto z-40 bg-stone-900/95 backdrop-blur-md text-stone-100 p-4 sm:p-5 rounded-3xl shadow-2xl border border-stone-800 animate-slide-up flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3.5 flex-1">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <Cookie className="w-5 h-5" />
            </div>
            <div className="text-xs text-stone-300 leading-relaxed font-sans pr-2">
              <p>
                We use essential cookies to make our site work. With your consent, we may also use non-essential cookies to improve user experience and analyze website traffic. By clicking “Accept,” you agree to our website&apos;s cookie use as described in our Cookie Policy. You can change your cookie settings at any time by clicking “Preferences.”
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
            <button
              type="button"
              onClick={() => setShowPreferencesModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-300 hover:text-white hover:bg-stone-800 transition cursor-pointer border border-stone-700"
            >
              Preferences
            </button>
            <button
              type="button"
              onClick={handleEssentialOnly}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-300 hover:text-white hover:bg-stone-800 transition cursor-pointer border border-stone-700"
            >
              Essential Only
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm cursor-pointer"
            >
              Accept
            </button>
          </div>
        </aside>
      )}

      {/* Preferences Modal */}
      {showPreferencesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-md animate-fade-in">
          <div 
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base leading-tight">Cookie & Storage Preferences</h3>
                  <p className="text-xs text-stone-300">Customize how AsanaSense stores your session data</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPreferencesModal(false)}
                className="p-1.5 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto text-stone-700">
              {/* Category 1: Essential Cookies */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-stone-900">Strictly Essential Storage</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Always Active
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Required for core authentication (JWT passkeys), backend bridge connection URLs, and active session safety. These cannot be switched off.
                  </p>
                </div>
                <div className="p-1.5 text-stone-400 shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
              </div>

              {/* Category 2: Functional & Audio Preferences */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-bold text-stone-900">Functional & Soundscapes</span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Remembers your ambient sound frequencies (528 Hz, Himalayan rain), voice trainer cues, and camera device preferences.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFunctionalEnabled(!functionalEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative p-0.5 shrink-0 ${
                    functionalEnabled ? 'bg-emerald-600' : 'bg-stone-300'
                  }`}
                >
                  <div 
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      functionalEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Category 3: Analytics & Telemetry */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-stone-900">Performance Telemetry</span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Collects anonymous posture detection frame-rate (FPS) and latency telemetry to optimize AI pose alignment stability.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative p-0.5 shrink-0 ${
                    analyticsEnabled ? 'bg-emerald-600' : 'bg-stone-300'
                  }`}
                >
                  <div 
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      analyticsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleEssentialOnly}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-200 transition cursor-pointer"
              >
                Reject Non-Essential
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveCustomPreferences}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition cursor-pointer"
                >
                  Save Preferences
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept All</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
