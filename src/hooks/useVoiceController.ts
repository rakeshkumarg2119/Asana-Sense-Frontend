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

export function useVoiceController(options: VoiceControlOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommandRecognized, setLastCommandRecognized] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const lastCommandTimeRef = useRef<number>(0);
  const lastCommandCategoryRef = useRef<string>('');

  const handleVoiceCommand = useCallback((spokenTextRaw: string) => {
    const spokenText = spokenTextRaw.toLowerCase().trim();
    const now = Date.now();

    const executeCmd = (categoryKey: string, label: string, callback?: () => void) => {
      // Debounce exact same command category within 1200ms
      if (categoryKey === lastCommandCategoryRef.current && now - lastCommandTimeRef.current < 1200) {
        return;
      }
      lastCommandCategoryRef.current = categoryKey;
      lastCommandTimeRef.current = now;
      setLastCommandRecognized(label);
      soundEngine.playVoiceAckChime();
      callback?.();
    };

    // 1. Finish / End Session Command (Top priority)
    if (
      spokenText.includes('finish session') ||
      spokenText.includes('finish practice') ||
      spokenText.includes('finish the session') ||
      spokenText.includes('end session') ||
      spokenText.includes('end practice') ||
      spokenText.includes('complete session') ||
      spokenText.includes('stop session') ||
      spokenText.includes('stop practice') ||
      spokenText === 'finish' ||
      spokenText === 'end session'
    ) {
      executeCmd('FINISH_SESSION', 'Command: Finish Session', optionsRef.current.onFinishSession);
      return;
    }

    // 2. Camera Disable / Turn Off Command
    if (
      spokenText.includes('turn off camera') ||
      spokenText.includes('turn off the camera') ||
      spokenText.includes('camera off') ||
      spokenText.includes('disable camera') ||
      spokenText.includes('stop camera') ||
      spokenText.includes('close camera') ||
      spokenText.includes('off camera')
    ) {
      executeCmd('DISABLE_CAMERA', 'Command: Turn Off Camera', optionsRef.current.onDisableCamera);
      return;
    }

    // 3. Camera Enable / Turn On Command
    if (
      spokenText.includes('turn on camera') ||
      spokenText.includes('turn on the camera') ||
      spokenText.includes('start camera') ||
      spokenText.includes('enable camera') ||
      spokenText.includes('open camera') ||
      spokenText.includes('camera on') ||
      spokenText.includes('access camera')
    ) {
      executeCmd('ENABLE_CAMERA', 'Command: Turn On Camera', optionsRef.current.onEnableCamera);
      return;
    }

    // 4. Close Voice Table Overlay
    if (
      spokenText.includes('close voice table') ||
      spokenText.includes('close voice commands') ||
      spokenText.includes('hide voice table') ||
      spokenText.includes('hide voice commands') ||
      spokenText === 'close voice'
    ) {
      executeCmd('CLOSE_VOICE_TABLE', 'Command: Close Voice Table', optionsRef.current.onCloseVoiceTable);
      return;
    }

    // 5. Close Pose Preview Card
    if (
      spokenText.includes('close preview') ||
      spokenText.includes('close pose preview') ||
      spokenText.includes('hide preview') ||
      spokenText === 'close preview'
    ) {
      executeCmd('CLOSE_PREVIEW', 'Command: Close Preview', optionsRef.current.onClosePreview);
      return;
    }

    // 6. Close Yoga Poses Drawer
    if (
      spokenText.includes('close yoga poses') ||
      spokenText.includes('close poses table') ||
      spokenText.includes('close poses') ||
      spokenText.includes('close pose table') ||
      spokenText.includes('hide yoga poses') ||
      spokenText.includes('hide poses') ||
      spokenText.includes('close pose drawer') ||
      spokenText.includes('close drawer')
    ) {
      executeCmd('CLOSE_POSES', 'Command: Close Yoga Poses', optionsRef.current.onCloseYogaPoses);
      return;
    }

    // 7. Scroll Commands (Supports: "scroll down", "scroll up", "scroll down poses", "scroll up poses", "scroll down voice", "scroll up voice", "scroll down table", "page down", "page up", "scroll down pose", etc.)
    const isScrollDown = 
      spokenText.includes('scroll down') || 
      spokenText.includes('scrolldown') ||
      spokenText.includes('scroll bottom') ||
      spokenText.includes('page down') ||
      spokenText.includes('down scroll') ||
      spokenText === 'down';

    const isScrollUp = 
      spokenText.includes('scroll up') || 
      spokenText.includes('scrollup') ||
      spokenText.includes('scroll top') ||
      spokenText.includes('page up') ||
      spokenText.includes('up scroll') ||
      spokenText === 'up';

    if (isScrollDown || isScrollUp) {
      const isVoiceTarget = 
        spokenText.includes('voice') || 
        spokenText.includes('command') || 
        spokenText.includes('overlay') ||
        spokenText.includes('floating');

      const isPoseTarget = 
        spokenText.includes('pose') || 
        spokenText.includes('poses') || 
        spokenText.includes('grid') || 
        spokenText.includes('shelf') || 
        spokenText.includes('drawer');

      if (isScrollDown) {
        if (isVoiceTarget) {
          executeCmd('SCROLL_DOWN_VOICE', 'Command: Scroll Down Voice Table', optionsRef.current.onScrollDownVoiceTable);
        } else if (isPoseTarget) {
          executeCmd('SCROLL_DOWN_POSES', 'Command: Scroll Down Poses', optionsRef.current.onScrollDownPoses);
        } else {
          executeCmd('SCROLL_DOWN_GENERIC', 'Command: Scroll Down', () => {
            optionsRef.current.onScrollDownVoiceTable?.();
            optionsRef.current.onScrollDownPoses?.();
          });
        }
        return;
      }

      if (isScrollUp) {
        if (isVoiceTarget) {
          executeCmd('SCROLL_UP_VOICE', 'Command: Scroll Up Voice Table', optionsRef.current.onScrollUpVoiceTable);
        } else if (isPoseTarget) {
          executeCmd('SCROLL_UP_POSES', 'Command: Scroll Up Poses', optionsRef.current.onScrollUpPoses);
        } else {
          executeCmd('SCROLL_UP_GENERIC', 'Command: Scroll Up', () => {
            optionsRef.current.onScrollUpVoiceTable?.();
            optionsRef.current.onScrollUpPoses?.();
          });
        }
        return;
      }
    }

    // 8. Open Voice Commands Table (Explicit OPEN - never toggles closed)
    if (
      spokenText.includes('open voice table') ||
      spokenText.includes('show voice table') ||
      spokenText.includes('open voice commands') ||
      spokenText.includes('show voice commands') ||
      spokenText.includes('voice commands table') ||
      spokenText === 'voice table' ||
      spokenText === 'open voice' ||
      spokenText === 'voice commands'
    ) {
      executeCmd('OPEN_VOICE_TABLE', 'Command: Open Voice Table', () => {
        if (optionsRef.current.onOpenVoiceTable) {
          optionsRef.current.onOpenVoiceTable();
        } else if (optionsRef.current.onToggleVoiceTable) {
          optionsRef.current.onToggleVoiceTable();
        }
      });
      return;
    }

    // 8b. Toggle Voice Commands Table
    if (
      spokenText.includes('toggle voice table') ||
      spokenText.includes('toggle voice commands')
    ) {
      executeCmd('TOGGLE_VOICE_TABLE', 'Command: Toggle Voice Table', optionsRef.current.onToggleVoiceTable);
      return;
    }

    // 9. Previous Pose Command
    if (
      spokenText.includes('previous pose') ||
      spokenText.includes('prev pose') ||
      spokenText.includes('switch to previous pose') ||
      spokenText.includes('go to previous pose') ||
      spokenText.includes('previous asana') ||
      spokenText.includes('go back') ||
      spokenText === 'previous'
    ) {
      executeCmd('PREV_POSE', 'Command: Previous Pose', optionsRef.current.onPrevPose);
      return;
    }

    // 10. Next Pose Command
    if (
      spokenText.includes('next pose') ||
      spokenText.includes('next asana') ||
      spokenText.includes('next posture') ||
      spokenText.includes('go to next pose') ||
      spokenText.includes('advance pose') ||
      spokenText === 'next'
    ) {
      executeCmd('NEXT_POSE', 'Command: Next Pose', optionsRef.current.onNextPose);
      return;
    }

    // 11. Switch to specific Pose Name (e.g. "switch to tree pose", "select warrior 2", etc.)
    for (const pose of YOGA_POSES) {
      for (const kw of pose.voiceKeywords) {
        if (
          spokenText.includes(`switch to ${kw}`) ||
          spokenText.includes(`select ${kw}`) ||
          spokenText.includes(`change to ${kw}`) ||
          spokenText.includes(`go to ${kw}`) ||
          spokenText.includes(kw)
        ) {
          executeCmd(`SELECT_POSE_${pose.id}`, `Switched to: ${pose.name}`, () => optionsRef.current.onSelectPose?.(pose.id));
          return;
        }
      }
    }

    // 12. Pause Commands
    if (
      spokenText.includes('pause pose') ||
      spokenText.includes('pause timer') ||
      spokenText.includes('pause session') ||
      spokenText.includes('pause monitoring') ||
      spokenText.includes('pause hold') ||
      spokenText.includes('freeze timer') ||
      spokenText.includes('freeze pose') ||
      spokenText === 'pause'
    ) {
      executeCmd('PAUSE', 'Command: Pause Pose & Timer', optionsRef.current.onPause);
      return;
    }

    // 13. Resume Commands
    if (
      spokenText.includes('resume pose') ||
      spokenText.includes('resume timer') ||
      spokenText.includes('resume session') ||
      spokenText.includes('continue pose') ||
      spokenText.includes('continue session') ||
      spokenText.includes('unpause') ||
      spokenText === 'resume' ||
      spokenText === 'continue'
    ) {
      executeCmd('RESUME', 'Command: Resume Pose & Timer', optionsRef.current.onResume);
      return;
    }

    // 14. Ready / Start command
    if (
      spokenText.includes('i am ready') ||
      spokenText.includes("i'm ready") ||
      spokenText.includes('ready') ||
      spokenText.includes('start pose') ||
      spokenText.includes('start monitoring') ||
      spokenText.includes('begin pose') ||
      spokenText.includes('start timer')
    ) {
      executeCmd('READY_START', 'Command: Ready / Start Monitoring', optionsRef.current.onReadyToStart);
      return;
    }

    // 15. Open 8 Yoga Poses Drawer Grid Command
    if (
      spokenText.includes('open yoga poses') ||
      spokenText.includes('open poses table') ||
      spokenText.includes('open poses') ||
      spokenText.includes('show yoga poses') ||
      spokenText.includes('show poses table') ||
      spokenText.includes('show poses') ||
      spokenText.includes('open pose drawer') ||
      spokenText.includes('show pose drawer') ||
      spokenText.includes('open drawer') ||
      spokenText === 'open poses' ||
      spokenText === 'poses table'
    ) {
      executeCmd('OPEN_POSES', 'Command: Open Poses', () => {
        if (optionsRef.current.onOpenYogaPoses) {
          optionsRef.current.onOpenYogaPoses();
        } else if (optionsRef.current.onOpenPoses) {
          optionsRef.current.onOpenPoses();
        }
      });
      return;
    }

    // 16. Preview Pose Command
    if (
      spokenText.includes('preview pose') ||
      spokenText.includes('show preview') ||
      spokenText.includes('pose preview') ||
      spokenText === 'preview'
    ) {
      executeCmd('PREVIEW_POSE', 'Command: Preview Pose', optionsRef.current.onPreviewPose);
      return;
    }

    // 17. Analyze Form Command
    if (
      spokenText.includes('analyze') ||
      spokenText.includes('check posture') ||
      spokenText.includes('feedback') ||
      spokenText.includes('check form')
    ) {
      executeCmd('ANALYZE_FORM', 'Command: Posture Analysis', optionsRef.current.onAnalyzeTrigger);
      return;
    }
  }, []);

  const safeStart = useCallback(() => {
    if (!recognitionRef.current || !isListeningRef.current) return;
    try {
      recognitionRef.current.start();
    } catch {
      // InvalidStateError occurs if recognition is transitioning or already running.
      // Retry safely after brief hardware release delay.
      setTimeout(() => {
        if (!isListeningRef.current || !recognitionRef.current) return;
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        setTimeout(() => {
          if (isListeningRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch {
              // ignore
            }
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
      setErrorMessage('Speech recognition is not natively supported in this browser window.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
        setErrorMessage(null);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setErrorMessage('Microphone access was blocked or denied. Please grant microphone permission in browser settings.');
          setIsListening(false);
          isListeningRef.current = false;
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('Speech recognition status:', event.error);
        }
      };

      recognition.onend = () => {
        // Continuous auto-restart when user is active
        if (isListeningRef.current) {
          setTimeout(() => {
            safeStart();
          }, 150);
        } else {
          setIsListening(false);
        }
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }

        const cleanText = currentTranscript.trim().toLowerCase();
        setTranscript(cleanText);

        // Command parsing
        if (cleanText) {
          handleVoiceCommand(cleanText);
        }
      };

      recognitionRef.current = recognition;
    } catch (e: any) {
      console.warn('Speech recognition setup:', e);
      setIsSupported(false);
    }

    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [handleVoiceCommand, safeStart]);

  const startListening = useCallback(async () => {
    setErrorMessage(null);

    // If already active, ensure process is running
    if (isListeningRef.current) {
      safeStart();
      return;
    }

    // Attempt proactive microphone prompt if available
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (err: any) {
      console.warn('Microphone permission request:', err);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setErrorMessage('Microphone permission is blocked. Please allow microphone in browser site settings.');
        return;
      }
    }

    if (!recognitionRef.current) {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setErrorMessage('Web Speech API is not supported in this browser. You can use standard button controls.');
        return;
      }
    }

    isListeningRef.current = true;
    setIsListening(true);
    safeStart();
  }, [safeStart]);

  const toggleListening = useCallback(async () => {
    setErrorMessage(null);

    // If currently listening, stop it
    if (isListening) {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    await startListening();
  }, [isListening, startListening]);

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

