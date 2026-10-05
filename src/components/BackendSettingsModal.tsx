import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  X, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Globe, 
  Terminal, 
  Copy, 
  Check, 
  Radio, 
  ArrowRight,
  ShieldCheck,
  Server,
  Zap,
  Activity,
  Trash2
} from 'lucide-react';
import { 
  getBackendUrl, 
  setBackendUrl, 
  clearBackendUrl, 
  getWsBase, 
  checkBackendConnection,
  testWebSocketHandshake,
  BackendStatusReport,
  normalizeBackendUrl,
  clearAllLocalStorage
} from '../utils/apiClient';
import { useModalFocusTrap } from '../hooks/useModalFocusTrap';

interface BackendSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendSettingsModal: React.FC<BackendSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const containerRef = useModalFocusTrap({ isOpen, onClose });
  const [inputUrl, setInputUrl] = useState<string>('');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [statusReport, setStatusReport] = useState<BackendStatusReport | null>(null);
  const [wsTestResult, setWsTestResult] = useState<{ tested: boolean; success: boolean; latencyMs?: number; message?: string } | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [hasSaved, setHasSaved] = useState<boolean>(false);
  const [storageCleared, setStorageCleared] = useState<boolean>(false);

  // Load current URL on modal open
  useEffect(() => {
    if (isOpen) {
      const current = getBackendUrl();
      setInputUrl(current);
      setHasSaved(false);
      setStorageCleared(false);
      // Run quick status check
      handleTestConnection(current);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleTestConnection = async (urlToTest?: string) => {
    const target = urlToTest || inputUrl;
    setIsTesting(true);
    setWsTestResult(null);

    try {
      const report = await checkBackendConnection(target);
      setStatusReport(report);

      // Also run brief WS handshake test if HTTP was reachable
      if (report.connected) {
        const wsRes = await testWebSocketHandshake(`${report.wsUrl}/ws/pose-detect`, 4000);
        setWsTestResult({
          tested: true,
          success: wsRes.success,
          latencyMs: wsRes.latencyMs,
          message: wsRes.message,
        });
      }
    } catch (err: any) {
      setStatusReport({
        connected: false,
        apiUrl: normalizeBackendUrl(target),
        wsUrl: getWsBase(target),
        message: err.message || 'Connection test failed',
        isNgrok: target.includes('ngrok'),
        testedAt: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAndApply = () => {
    if (!inputUrl.trim()) return;
    setBackendUrl(inputUrl);
    setHasSaved(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleResetDefault = () => {
    clearBackendUrl();
    const defaultUrl = 'http://localhost:8000';
    setInputUrl(defaultUrl);
    handleTestConnection(defaultUrl);
  };

  const handleClearLocalStorage = () => {
    clearAllLocalStorage();
    setStorageCleared(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(label);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  if (!isOpen) return null;

  const currentWs = getWsBase(inputUrl || 'http://localhost:8000');
  const isNgrokUrl = inputUrl.toLowerCase().includes('ngrok');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-950/70 backdrop-blur-md animate-fade-in overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="backend-settings-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        ref={containerRef}
        tabIndex={-1}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8 focus:outline-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 px-6 py-5 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-inner" aria-hidden="true">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="backend-settings-title" className="text-lg font-bold font-serif text-white tracking-wide">
                  Settings
                </h2>
                {statusReport?.connected ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Offline / Standalone
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Configure backend server endpoints and application preferences
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
            aria-label="Close settings modal"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* URL Input Section */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
              Backend Endpoint (Ngrok / HTTP / HTTPS)
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-stone-400 flex items-center pointer-events-none">
                <Globe className="w-4 h-4 text-emerald-600" />
              </div>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://xxxx-xx-xx-xx-xx.ngrok-free.app or http://localhost:8000"
                className="w-full pl-10 pr-24 py-3 bg-stone-50 hover:bg-stone-100/80 focus:bg-white border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 rounded-2xl text-xs sm:text-sm font-mono text-stone-800 transition outline-none"
              />
              <button
                type="button"
                onClick={() => handleTestConnection(inputUrl)}
                disabled={isTesting || !inputUrl.trim()}
                className="absolute right-2 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Connect</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-[11px] font-semibold text-stone-500">Quick Presets:</span>
              <button
                type="button"
                onClick={() => {
                  setInputUrl('http://localhost:8000');
                  handleTestConnection('http://localhost:8000');
                }}
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-mono transition cursor-pointer border border-stone-200"
              >
                localhost:8000
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!inputUrl.includes('ngrok-free.app')) {
                    setInputUrl('https://YOUR-SUBDOMAIN.ngrok-free.app');
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-medium transition cursor-pointer border border-emerald-200 flex items-center gap-1"
              >
                <Radio className="w-3 h-3 text-emerald-600" />
                Ngrok Tunnel
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefault}
              className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition cursor-pointer"
            >
              Reset URL
            </button>
            <button
              type="button"
              onClick={handleClearLocalStorage}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer flex items-center gap-1.5"
              title="Clears test accounts, session cache, and authentication tokens"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{storageCleared ? 'Cleared & Reloading...' : 'Clear Storage Cache'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndApply}
              disabled={!inputUrl.trim()}
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 text-white text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              {hasSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved & Applied!</span>
                </>
              ) : (
                <>
                  <span>Save & Connect</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
