import { useState, useEffect, useRef, useCallback } from 'react';
import { YOGA_POSES } from '../data/yogaPoses';
import { soundEngine } from '../utils/audioFeedback';

interface VoiceControlOptions {
  onSelectPose?: (poseId: string) => void;
  onStartSession?: () => void;
  onReadyToStart?: () => void;
  onEnableCamera?: () => void;
  onDisableCamera?: () => void;
  onOpenYogaPoses?: () => void;
  onCloseYogaPoses?: () => void;
  onOpenPoses?: () => void;
  onPreviewPose?: () => void;
  onClosePreview?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onTogglePause?: () => void;
  onNextPose?: () => void;
  onPrevPose?: () => void;
  onAnalyzeTrigger?: () => void;
  onFinishSession?: () => void;
  onOpenVoiceTable?: () => void;
  onCloseVoiceTable?: () => void;
  onToggleVoiceTable?: () => void;
  onScrollDownPoses?: () => void;
  onScrollUpPoses?: () => void;
  onScrollDownVoiceTable?: () => void;
  onScrollUpVoiceTable?: () => void;
}

// A phrase must stay unchanged this long (or become final) before it runs.
// Lets "scroll down" -> "scroll down voice table" resolve to the full phrase.
const COMMAND_STABLE_MS = 450;
// Results that START while the coach talks (or just after) are our own audio, not the user.
const ECHO_GUARD_MS = 1500;
const MAX_CONSECUTIVE_FAILURES = 6;

const has = (text: string, ...phrases: string[]) => phrases.some((p) => text.includes(p));
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9'\s]/g, ' ').replace(/\s+/g, ' ').trim();

type Timer = ReturnType<typeof setTimeout>;

const SPEECH_COMPAT_CACHE_KEY = 'asana_speech_api_supported';
const SPEECH_COMPAT_REASON_KEY = 'asana_speech_api_reason';

/**
 * Check browser Web Speech API compatibility.
 * Checks localStorage first for instant O(1) response on subsequent clicks.
 */
export function checkBrowserSpeechCompatibility(): { supported: boolean; reason?: string } {
  if (typeof window === 'undefined') {
    return { supported: false, reason: 'Server environment' };
  }

  // 1. Check cached test result in localStorage
  try {
    const cached = localStorage.getItem(SPEECH_COMPAT_CACHE_KEY);
    if (cached !== null) {
      if (cached === 'true') {
        return { supported: true };
      }
      const cachedReason =
        localStorage.getItem(SPEECH_COMPAT_REASON_KEY) ||
        'Voice commands are not supported in this browser.';
      return { supported: false, reason: cachedReason };
    }
  } catch {
    // Ignore localStorage access failures
  }

  // 2. Perform live browser compatibility test
  const isFirefox = typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent);
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    const reason = isFirefox
      ? 'Mozilla Firefox does not support the Web Speech API. Please use Google Chrome or Microsoft Edge for hands-free voice commands, or use the on-screen buttons.'
      : 'Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge for voice controls.';

    try {
      localStorage.setItem(SPEECH_COMPAT_CACHE_KEY, 'false');
      localStorage.setItem(SPEECH_COMPAT_REASON_KEY, reason);
    } catch {}
    return { supported: false, reason };
  }

  if (
    window.isSecureContext === false &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    const reason = 'Voice control requires a secure HTTPS connection or localhost.';
    try {
      localStorage.setItem(SPEECH_COMPAT_CACHE_KEY, 'false');
      localStorage.setItem(SPEECH_COMPAT_REASON_KEY, reason);
    } catch {}
    return { supported: false, reason };
  }

  // 3. Test passed - store in localStorage for future clicks
  try {
    localStorage.setItem(SPEECH_COMPAT_CACHE_KEY, 'true');
    localStorage.removeItem(SPEECH_COMPAT_REASON_KEY);
  } catch {}

  return { supported: true };
}

export function useVoiceController(options: VoiceControlOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommandRecognized, setLastCommandRecognized] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const failuresRef = useRef(0);
  const restartTimerRef = useRef<Timer | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const lastCommandTimeRef = useRef<number>(0);
  const lastCommandCategoryRef = useRef<string>('');

  /** Returns true when the text matched a command (even if debounced). */
  const handleVoiceCommand = useCallback((spokenTextRaw: string): boolean => {
    const spokenText = spokenTextRaw.toLowerCase().trim();
    const now = Date.now();
    const o = () => optionsRef.current;

    const executeCmd = (categoryKey: string, label: string, callback?: () => void): true => {
      // Same command twice within 1.2 s = duplicate
      if (categoryKey === lastCommandCategoryRef.current && now - lastCommandTimeRef.current < 1200) {
        return true;
      }
      lastCommandCategoryRef.current = categoryKey;
      lastCommandTimeRef.current = now;
      setLastCommandRecognized(label);
      soundEngine.playVoiceAckChime();
      callback?.();
      return true;
    };

    // 1. Finish session
    if (
      has(spokenText, 'finish session', 'finish practice', 'finish the session', 'end session',
        'end practice', 'complete session', 'stop session', 'stop practice') ||
      spokenText === 'finish'
    ) {
      return executeCmd('FINISH_SESSION', 'Command: Finish Session', o().onFinishSession);
    }

    // 2. Camera off
    if (has(spokenText, 'turn off camera', 'turn off the camera', 'camera off', 'disable camera',
      'stop camera', 'close camera', 'off camera')) {
      return executeCmd('DISABLE_CAMERA', 'Command: Turn Off Camera', o().onDisableCamera);
    }

    // 3. Camera on
    if (has(spokenText, 'turn on camera', 'turn on the camera', 'start camera', 'enable camera',
      'open camera', 'camera on', 'access camera')) {
      return executeCmd('ENABLE_CAMERA', 'Command: Turn On Camera', o().onEnableCamera);
    }

    // 4. Close voice table
    if (has(spokenText, 'close voice table', 'close voice commands', 'hide voice table',
      'hide voice commands') || spokenText === 'close voice') {
      return executeCmd('CLOSE_VOICE_TABLE', 'Command: Close Voice Table', o().onCloseVoiceTable);
    }

    // 5. Close preview
    if (has(spokenText, 'close preview', 'close pose preview', 'hide preview')) {
      return executeCmd('CLOSE_PREVIEW', 'Command: Close Preview', o().onClosePreview);
    }

    // 6. Close poses drawer
    if (has(spokenText, 'close yoga poses', 'close poses table', 'close poses', 'close pose table',
      'hide yoga poses', 'hide poses', 'close pose drawer', 'close drawer')) {
      return executeCmd('CLOSE_POSES', 'Command: Close Yoga Poses', o().onCloseYogaPoses);
    }

    // 7. Scroll
    const isScrollDown =
      has(spokenText, 'scroll down', 'scrolldown', 'scroll bottom', 'page down', 'down scroll') ||
      spokenText === 'down';
    const isScrollUp =
      has(spokenText, 'scroll up', 'scrollup', 'scroll top', 'page up', 'up scroll') ||
      spokenText === 'up';

    if (isScrollDown || isScrollUp) {
      const isVoiceTarget = has(spokenText, 'voice', 'command', 'overlay', 'floating');
      const isPoseTarget = has(spokenText, 'pose', 'poses', 'grid', 'shelf', 'drawer');

      if (isScrollDown) {
        if (isVoiceTarget) return executeCmd('SCROLL_DOWN_VOICE', 'Command: Scroll Down Voice Table', o().onScrollDownVoiceTable);
        if (isPoseTarget) return executeCmd('SCROLL_DOWN_POSES', 'Command: Scroll Down Poses', o().onScrollDownPoses);
        return executeCmd('SCROLL_DOWN_GENERIC', 'Command: Scroll Down', () => {
          o().onScrollDownVoiceTable?.();
          o().onScrollDownPoses?.();
        });
      }
      if (isVoiceTarget) return executeCmd('SCROLL_UP_VOICE', 'Command: Scroll Up Voice Table', o().onScrollUpVoiceTable);
      if (isPoseTarget) return executeCmd('SCROLL_UP_POSES', 'Command: Scroll Up Poses', o().onScrollUpPoses);
      return executeCmd('SCROLL_UP_GENERIC', 'Command: Scroll Up', () => {
        o().onScrollUpVoiceTable?.();
        o().onScrollUpPoses?.();
      });
    }

    // 8. Open voice table (never toggles closed)
    if (
      has(spokenText, 'open voice table', 'show voice table', 'open voice commands',
        'show voice commands', 'voice commands table') ||
      spokenText === 'voice table' || spokenText === 'open voice' || spokenText === 'voice commands'
    ) {
      return executeCmd('OPEN_VOICE_TABLE', 'Command: Open Voice Table', () => {
        if (o().onOpenVoiceTable) o().onOpenVoiceTable?.();
        else o().onToggleVoiceTable?.();
      });
    }

    // 8b. Toggle voice table
    if (has(spokenText, 'toggle voice table', 'toggle voice commands')) {
      return executeCmd('TOGGLE_VOICE_TABLE', 'Command: Toggle Voice Table', o().onToggleVoiceTable);
    }

    // 9. Previous pose
    if (has(spokenText, 'previous pose', 'prev pose', 'switch to previous pose', 'go to previous pose',
      'previous asana', 'go back') || spokenText === 'previous') {
      return executeCmd('PREV_POSE', 'Command: Previous Pose', o().onPrevPose);
    }

    // 10. Next pose
    if (has(spokenText, 'next pose', 'next asana', 'next posture', 'go to next pose', 'advance pose') ||
      spokenText === 'next') {
      return executeCmd('NEXT_POSE', 'Command: Next Pose', o().onNextPose);
    }

    // 11. Explicit "switch to / select / change to / go to <pose>"
    for (const pose of YOGA_POSES) {
      for (const rawKw of pose.voiceKeywords) {
        const kw = rawKw.toLowerCase();
        if (new RegExp(`\\b(switch to|select|change to|go to)\\s+${esc(kw)}\\b`).test(spokenText)) {
          return executeCmd(`SELECT_POSE_${pose.id}`, `Switched to: ${pose.name}`, () => o().onSelectPose?.(pose.id));
        }
      }
    }

    // 12. Pause
    if (has(spokenText, 'pause pose', 'pause timer', 'pause session', 'pause monitoring', 'pause hold',
      'freeze timer', 'freeze pose') || spokenText === 'pause') {
      return executeCmd('PAUSE', 'Command: Pause Pose & Timer', o().onPause);
    }

    // 13. Resume
    if (has(spokenText, 'resume pose', 'resume timer', 'resume session', 'continue pose',
      'continue session', 'unpause') || spokenText === 'resume' || spokenText === 'continue') {
      return executeCmd('RESUME', 'Command: Resume Pose & Timer', o().onResume);
    }

    // 14. Ready / start (whole word: "already" must NOT trigger)
    if (/\bready\b/.test(spokenText) ||
      has(spokenText, 'start pose', 'start monitoring', 'begin pose', 'start timer')) {
      return executeCmd('READY_START', 'Command: Ready / Start Monitoring', o().onReadyToStart);
    }

    // 15. Open poses drawer
    if (has(spokenText, 'open yoga poses', 'open poses table', 'open poses', 'show yoga poses',
      'show poses table', 'show poses', 'open pose drawer', 'show pose drawer', 'open drawer') ||
      spokenText === 'poses table') {
      return executeCmd('OPEN_POSES', 'Command: Open Poses', () => {
        if (o().onOpenYogaPoses) o().onOpenYogaPoses?.();
        else o().onOpenPoses?.();
      });
    }

    // 16. Preview
    if (has(spokenText, 'preview pose', 'show preview', 'pose preview') || spokenText === 'preview') {
      return executeCmd('PREVIEW_POSE', 'Command: Preview Pose', o().onPreviewPose);
    }

    // 17. Analyze
    if (has(spokenText, 'analyze', 'check posture', 'feedback', 'check form')) {
      return executeCmd('ANALYZE_FORM', 'Command: Posture Analysis', o().onAnalyzeTrigger);
    }

    // 18. Bare pose name ("tree pose") - last, so it never hijacks real commands
    for (const pose of YOGA_POSES) {
      for (const rawKw of pose.voiceKeywords) {
        if (new RegExp(`\\b${esc(rawKw.toLowerCase())}\\b`).test(spokenText)) {
          return executeCmd(`SELECT_POSE_${pose.id}`, `Switched to: ${pose.name}`, () => o().onSelectPose?.(pose.id));
        }
      }
    }

    return false;
  }, []);

  const clearRestartTimer = () => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  };

  const halt = useCallback((message: string | null) => {
    isListeningRef.current = false;
    clearRestartTimer();
    setIsListening(false);
    if (message) setErrorMessage(message);
  }, []);

  const safeStart = useCallback(() => {
    if (!recognitionRef.current || !isListeningRef.current) return;
    try {
      recognitionRef.current.start();
    } catch {
      // InvalidStateError: already running / transitioning. Stop, then retry once.
      setTimeout(() => {
        if (!isListeningRef.current || !recognitionRef.current) return;
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
        setTimeout(() => {
          if (isListeningRef.current && recognitionRef.current) {
            try { recognitionRef.current.start(); } catch { /* ignore */ }
          }
        }, 200);
      }, 200);
    }
  }, []);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    // Per-recognition-session bookkeeping (result indexes restart at 0 each session)
    let handled = new Set<number>();
    let echoIdx = new Set<number>();
    let pending = new Map<number, Timer>();
    const resetSession = () => {
      pending.forEach((t) => clearTimeout(t));
      pending = new Map();
      handled = new Set();
      echoIdx = new Set();
    };

    const isSelfEcho = (text: string): boolean => {
      if (soundEngine.isSpeaking()) return true;
      const since = soundEngine.msSinceSpeechEnded();
      if (since < ECHO_GUARD_MS) return true;
      if (since < 8000) {
        const heard = norm(text);
        const said = norm(soundEngine.getLastSpoken());
        if (heard.length >= 6 && said.includes(heard)) return true;
      }
      return false;
    };

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        resetSession();
        setIsListening(true);
        isListeningRef.current = true;
        setErrorMessage(null);
      };

      recognition.onerror = (event: any) => {
        const err = event?.error;
        if (err === 'not-allowed' || err === 'service-not-allowed') {
          halt('Microphone access was blocked. Allow the microphone in browser site settings.');
        } else if (err === 'audio-capture') {
          halt('No microphone found.');
        } else if (err === 'language-not-supported') {
          halt('Speech language not supported by this browser.');
        } else if (err === 'network') {
          failuresRef.current += 1;
          setErrorMessage('Speech service unreachable. Needs internet, HTTPS or localhost, and Chrome/Edge (Brave blocks it).');
        } else if (err !== 'no-speech' && err !== 'aborted') {
          failuresRef.current += 1;
          console.warn('Speech recognition error:', err);
        }
      };

      recognition.onend = () => {
        resetSession();
        if (!isListeningRef.current) {
          setIsListening(false);
          return;
        }
        if (failuresRef.current >= MAX_CONSECUTIVE_FAILURES) {
          halt('Voice control stopped after repeated errors. Check mic, internet and browser, then press the mic button again.');
          return;
        }
        // Back off on repeated failures instead of hammering start()
        const delay = Math.min(150 * 2 ** failuresRef.current, 5000);
        clearRestartTimer();
        restartTimerRef.current = setTimeout(safeStart, delay);
      };

      const processResult = (idx: number, text: string, isFinal: boolean) => {
        if (handled.has(idx) || echoIdx.has(idx)) return;
        const t = pending.get(idx);
        if (t) clearTimeout(t);

        const run = () => {
          pending.delete(idx);
          if (handled.has(idx) || echoIdx.has(idx)) return;
          if (handleVoiceCommand(text) || isFinal) handled.add(idx);
        };

        if (isFinal) run();
        else pending.set(idx, setTimeout(run, COMMAND_STABLE_MS));
      };

      recognition.onresult = (event: any) => {
        failuresRef.current = 0; // real audio is flowing
        let latest = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text: string = (event.results[i][0].transcript || '').toLowerCase().trim();
          if (!text) continue;
          latest = text;

          // First time we see this result: decide once whether it is our own voice.
          if (!handled.has(i) && !echoIdx.has(i) && !pending.has(i) && isSelfEcho(text)) {
            echoIdx.add(i);
            continue;
          }
          if (echoIdx.has(i)) continue;

          processResult(i, text, Boolean(event.results[i].isFinal));
        }
        if (latest) setTranscript(latest);
      };

      recognitionRef.current = recognition;
    } catch (e: any) {
      console.warn('Speech recognition setup:', e);
      setIsSupported(false);
    }

    return () => {
      isListeningRef.current = false;
      clearRestartTimer();
      resetSession();
      const r = recognitionRef.current;
      if (r) {
        r.onend = null;
        r.onresult = null;
        r.onerror = null;
        try { r.abort(); } catch { /* ignore */ }
        recognitionRef.current = null;
      }
    };
  }, [handleVoiceCommand, safeStart, halt]);

  const startListening = useCallback(async () => {
    setErrorMessage(null);

    if (isListeningRef.current) {
      safeStart();
      return;
    }

    // 1. Run cached compatibility test on browser
    const compat = checkBrowserSpeechCompatibility();
    if (!compat.supported) {
      const msg =
        compat.reason ||
        'Web Speech Recognition is not supported in this browser. Please use Chrome or Edge.';
      setErrorMessage(msg);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('asana_toast', {
            detail: { message: msg },
          })
        );
      }
      return;
    }

    // 2. Proactive microphone permission check
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setErrorMessage('Microphone permission is blocked. Allow the microphone in browser site settings.');
        return;
      }
      console.warn('Microphone permission request:', err);
    }

    if (!recognitionRef.current) {
      setErrorMessage('Speech recognition is not available in this browser. Use Chrome or Edge.');
      return;
    }

    failuresRef.current = 0;
    isListeningRef.current = true;
    setIsListening(true);
    safeStart();
  }, [safeStart]);

  const toggleListening = useCallback(async () => {
    setErrorMessage(null);

    if (isListeningRef.current) {
      isListeningRef.current = false;
      clearRestartTimer();
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
      setIsListening(false);
      return;
    }

    await startListening();
  }, [startListening]);

  return {
    isListening,
    transcript,
    lastCommandRecognized,
    setLastCommandRecognized,
    isSupported,
    errorMessage,
    startListening,
    toggleListening,
  };
}