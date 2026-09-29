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

interface BackendSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendSettingsModal: React.FC<BackendSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-950/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 px-6 py-5 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-inner">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-serif text-white tracking-wide">
                  Python Backend & Ngrok Bridge
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
                Connect seamlessly with your local or cloud Python FastAPI / MediaPipe server
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* URL Input Section */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
              Python Backend Endpoint (Ngrok / HTTP / HTTPS)
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

          {/* Status & Diagnostic Card */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition ${
            statusReport?.connected 
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
              : 'bg-stone-50 border-stone-200 text-stone-800'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  statusReport?.connected 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'bg-stone-200 text-stone-500'
                }`}>
                  {statusReport?.connected ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <WifiOff className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold flex items-center gap-2">
                    {statusReport?.connected ? 'Python Backend Active & Verified' : 'Status Check & Bridge Diagnostics'}
                    {statusReport?.latencyMs !== undefined && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/80 border border-stone-200 text-stone-600">
                        {statusReport.latencyMs} ms
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-stone-600 mt-0.5">
                    {statusReport?.message || 'Click "Connect" to probe the Python server endpoints'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleTestConnection(inputUrl)}
                disabled={isTesting}
                className="p-1.5 rounded-lg hover:bg-white text-stone-500 hover:text-stone-800 transition cursor-pointer"
                title="Re-test status"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Detailed Endpoints Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4 pt-3 border-t border-stone-200/80 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-white border border-stone-200 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] font-sans font-semibold text-stone-500 mb-1">
                  <span>REST API Route</span>
                  <span className={statusReport?.connected ? 'text-emerald-700' : 'text-stone-400'}>
                    {statusReport?.httpStatus ? `HTTP ${statusReport.httpStatus}` : 'Untested'}
                  </span>
                </div>
                <div className="text-[11px] text-stone-800 truncate" title={statusReport?.apiUrl || inputUrl}>
                  {statusReport?.apiUrl || inputUrl || 'http://localhost:8000'}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-stone-200 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] font-sans font-semibold text-stone-500 mb-1">
                  <span>Live Pose WebSocket</span>
                  <span className={wsTestResult?.success ? 'text-emerald-700 font-bold' : 'text-stone-400'}>
                    {wsTestResult?.success ? 'WS Ready' : 'Auto /ws/pose-detect'}
                  </span>
                </div>
                <div className="text-[11px] text-stone-800 truncate" title={`${currentWs}/ws/pose-detect`}>
                  {currentWs}/ws/pose-detect
                </div>
              </div>
            </div>

            {statusReport?.serverInfo && (
              <div className="mt-2.5 text-[11px] text-stone-500 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-stone-400" />
                <span>Detected: <strong>{statusReport.serverInfo}</strong></span>
              </div>
            )}

            {statusReport?.fixTip && (
              <div className="mt-3 p-3 rounded-xl bg-amber-100/90 border border-amber-300 text-amber-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="font-bold text-amber-950">Quick Tip:</div>
                  <div className="font-mono text-[11px] text-amber-900 leading-relaxed">{statusReport.fixTip}</div>
                </div>
              </div>
            )}
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
