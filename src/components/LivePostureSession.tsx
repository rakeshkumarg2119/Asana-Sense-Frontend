import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  CameraOff, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Sparkles, 
  Timer, 
  ChevronRight, 
  ChevronLeft, 
  Activity, 
  Award, 
  Lock,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Sliders,
  X,
  Columns,
  Grid,
  Maximize2,
  Scan,
  FileText,
  Info,
  ChevronDown,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Sparkle,
  Check,
  PanelRightClose,
  PanelRightOpen,
  ArrowRight,
  Upload,
  RefreshCw,
  AlertCircle,
  Image as ImageIcon,
  Monitor,
  Laptop,
  ArrowLeft,
  Volume2,
  VolumeX,
  Trophy,
  Key,
  Settings,
  Minus,
  Plus
} from 'lucide-react';
import { ALL_POSES } from '../data/yogaPoses';
import type { YogaPose, PostureAnalysisResult, SessionPoseRecord, PracticeSession, UserProfile, PoseDetectionResult } from '../types';
import { PoseVisualArtwork } from './PoseVisualArtwork';
import { useVoiceController } from '../hooks/useVoiceController';
import { usePoseLandmarker } from '../hooks/usePoseLandmarker';
import { soundEngine } from '../utils/audioFeedback';
import { AsanaSenseLogo } from './AsanaSenseLogo';
import { AmbientAudioPlayer } from './AmbientAudioPlayer';
import { PoseDrawer } from './PoseDrawer';
import { ViewportHUD } from './ViewportHUD';

interface LivePostureSessionProps {
  userProfile: UserProfile | null;
  onFinishSession: (session: PracticeSession) => void;
  onClose: () => void;
  onOpenAuth: () => void;
  onOpenSettings?: () => void;
  initialPoseId?: string;
  onNoPosesPracticed?: () => void;
}

const POSE_COLOR_PALETTES: Record<string, { ring: string; text: string; bg: string; border: string }> = {
  'tree-pose': {
    ring: 'from-emerald-400 to-teal-500',
    text: 'text-emerald-400',
    bg: 'bg-emerald-950/60',
    border: 'border-emerald-500/40',
  },
  'warrior': {
    ring: 'from-cyan-400 to-blue-500',
    text: 'text-cyan-400',
    bg: 'bg-cyan-950/60',
    border: 'border-cyan-500/40',
  },
  'warrior-3': {
    ring: 'from-cyan-400 to-blue-500',
    text: 'text-cyan-400',
    bg: 'bg-cyan-950/60',
    border: 'border-cyan-500/40',
  },
  'warrior-2': {
    ring: 'from-cyan-400 to-blue-500',
    text: 'text-cyan-400',
    bg: 'bg-cyan-950/60',
    border: 'border-cyan-500/40',
  },
  'downward-dog': {
    ring: 'from-indigo-400 to-purple-500',
    text: 'text-indigo-400',
    bg: 'bg-indigo-950/60',
    border: 'border-indigo-500/40',
  },
  'cobra-pose': {
    ring: 'from-amber-400 to-orange-500',
    text: 'text-amber-400',
    bg: 'bg-amber-950/60',
    border: 'border-amber-500/40',
  },
  'triangle-pose': {
    ring: 'from-fuchsia-400 to-rose-500',
    text: 'text-fuchsia-400',
    bg: 'bg-fuchsia-950/60',
    border: 'border-fuchsia-500/40',
  },
  'bridge-pose': {
    ring: 'from-teal-400 to-cyan-500',
    text: 'text-teal-400',
    bg: 'bg-teal-950/60',
    border: 'border-teal-500/40',
  },
  'lotus-pose': {
    ring: 'from-purple-400 to-indigo-500',
    text: 'text-purple-400',
    bg: 'bg-purple-950/60',
    border: 'border-purple-500/40',
  },
  'childs-pose': {
    ring: 'from-emerald-400 to-teal-400',
    text: 'text-emerald-400',
    bg: 'bg-emerald-950/60',
    border: 'border-emerald-500/40',
  },
};

// Format user name for natural spoken audio (avoids spelling letters or acronym pronunciation)
function formatSpokenName(rawName?: string | null): string {
  if (!rawName || !rawName.trim()) return 'Yogi';
  let clean = rawName.includes('@') ? rawName.split('@')[0] : rawName;
  clean = clean.replace(/^[0-9_.-]+|[0-9_.-]+$/g, '');
  clean = clean.replace(/[^a-zA-Z\s]/g, ' ').trim();
  const firstWord = clean.split(/\s+/)[0];
  if (!firstWord || firstWord.length < 2) return 'Yogi';
  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
}

function isPoseMatch(predicted?: string | null, target?: string | null): boolean {
  if (!predicted || !target) return false;
  if (predicted === target) return true;
  const map: Record<string, string> = {
    shoulder_stand: 'shoudler_stand',
    shoudler_stand: 'shoulder_stand',
    triangle: 'traingle',
    traingle: 'triangle',
  };
  return map[predicted] === target || map[target] === predicted;
}

export const LivePostureSession: React.FC<LivePostureSessionProps> = ({
  userProfile,
  onFinishSession,
  onClose,
  onOpenAuth,
  onOpenSettings,
  initialPoseId,
  onNoPosesPracticed,
}) => {
  // Determine time-of-day greeting
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return { text: 'Good Morning', icon: Sunrise };
    if (hour >= 12 && hour < 17) return { text: 'Good Afternoon', icon: Sun };
    return { text: 'Good Evening', icon: Sunset };
  };

  const greetingInfo = getTimeGreeting();
  const userName = userProfile?.name || 'Yogi';
  const spokenUserName = formatSpokenName(userProfile?.name);
  const fullGreeting = `${greetingInfo.text}, ${spokenUserName}! Are you ready to boost your day by doing yoga?`;

  // Pose selection state: starts as null by default so user manually selects or speaks the pose!
  const [selectedPoseIndex, setSelectedPoseIndex] = useState<number | null>(() => {
    if (initialPoseId) {
      const idx = ALL_POSES.findIndex((p) => p.id === initialPoseId);
      return idx >= 0 ? idx : null;
    }
    return null;
  });

  // Active posture monitoring state: only starts when user is explicitly ready!
  const [isPoseActive, setIsPoseActive] = useState<boolean>(false);

  const currentPose = selectedPoseIndex !== null ? ALL_POSES[selectedPoseIndex] : null;
  const poseTheme = currentPose ? (POSE_COLOR_PALETTES[currentPose.id] || POSE_COLOR_PALETTES['tree-pose']) : POSE_COLOR_PALETTES['tree-pose'];

  // Yoga Pose Drawer state (Right Side, equally spaced with Camera on Left, adjustable size)
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [splitPercent, setSplitPercent] = useState<number>(50); // 50% left, 50% right by default
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  
  // Drawer view mode: 'grid' (2x4 shelves table) or 'card' (focused Pose Image with Pros & Cons)
  const [drawerShelfMode, setDrawerShelfMode] = useState<'grid' | 'card'>('grid');
  const [activeCardTab, setActiveCardTab] = useState<'all' | 'pros' | 'cons'>('all');
  const [referenceDisplayMode, setReferenceDisplayMode] = useState<'photo' | 'artwork'>('photo');

  // Exit Confirmation Dialog
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Mobile Screen Restriction State
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  const [dismissMobileWarning, setDismissMobileWarning] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Audio / Speech Coaching & Mute State
  const [voiceSpeechEnabled, setVoiceSpeechEnabled] = useState(true);

  useEffect(() => {
    soundEngine.setMuted(!voiceSpeechEnabled);
  }, [voiceSpeechEnabled]);

  // Play initial greeting or mobile screen warning upon entering session (Single authoritative speech call)
  useEffect(() => {
    const greetingTimer = setTimeout(() => {
      if (voiceSpeechEnabled) {
        if (isMobileScreen && !dismissMobileWarning) {
          soundEngine.speak('Please use a desktop or laptop for a better experience of ASANA - SENSE live session. We are expecting you to come back soon!');
        } else {
          soundEngine.speak(fullGreeting);
        }
      }
    }, 700);
    return () => clearTimeout(greetingTimer);
  }, [isMobileScreen, dismissMobileWarning, voiceSpeechEnabled, fullGreeting]);

  // Camera & Stream state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);
  const [videoFitMode, setVideoFitMode] = useState<'contain' | 'cover'>('contain');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Movable Voice Commands Reference Table State
  const [showVoiceCmdTable, setShowVoiceCmdTable] = useState(false);
  const isDraggingTabRef = useRef(false);

  // Session Timers & Hold (Timer only ticks when isPoseActive is true; open-ended session duration)
  const [poseHoldSeconds, setPoseHoldSeconds] = useState(0);
  const [bestHoldPerPose, setBestHoldPerPose] = useState<Record<string, number>>({});
  const [attemptsPerPose, setAttemptsPerPose] = useState<Record<string, number>>({});
  const [personalBestToast, setPersonalBestToast] = useState<{ poseName: string; seconds: number; prior: number } | null>(null);
  const [totalSessionSeconds, setTotalSessionSeconds] = useState(0);
  const [sessionStartTime] = useState(Date.now());
  const [poseRecords, setPoseRecords] = useState<Record<string, SessionPoseRecord>>({});

  // Manual Target Hold Duration Control (seconds) - null defaults to pose recommended hold
  const [manualTargetSeconds, setManualTargetSeconds] = useState<number | null>(null);
  const targetHoldDuration = manualTargetSeconds ?? (currentPose?.idealHoldDurationSeconds || 30);

  // AI Master Guide Identity (Veda AI Exclusively)
  const aiCoachName = 'Veda AI';

  // AI Posture Feedback State
  const [postureAnalysis, setPostureAnalysis] = useState<PostureAnalysisResult>({
    score: 93,
    alignmentStatus: 'Awaiting Pose Start',
    keyCues: [
      'Select any Asana from the shelf to begin.',
      'Ground evenly and prepare your space.',
      'Click Ready when you are in position.',
    ],
    wrongPostureImpacts: [],
    benefitsTargeted: [],
    encouragingFeedback: 'Welcome. Select a posture to begin your biomechanical session.',
  });

  // Canvas for MediaPipe WASM skeleton rendering
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Real-time pose detection model state from WebSocket
  const [modelPoseResult, setModelPoseResult] = useState<PoseDetectionResult | null>(null);

  // Hook up MediaPipe WASM client + WebSocket pipeline to FastAPI backend
  const { isConnected: isModelWsConnected } = usePoseLandmarker({
    videoRef,
    canvasRef,
    targetPose: currentPose?.model_class_name || null,
    isActive: isPoseActive && cameraActive,
    voiceEnabled: voiceSpeechEnabled,
    onPoseResult: (result) => {
      setModelPoseResult(result);

      const hasCriticalJoint = Boolean(
        result.has_red ||
        result.joints?.some(j => j.status === 'critical' || (j.status as string) === 'red' || j.deviation >= 3.5) ||
        (result.predicted_pose !== 'no_pose' && currentPose?.model_class_name && !isPoseMatch(result.predicted_pose, currentPose.model_class_name))
      );
      const hasWarningJoint = Boolean(
        result.has_yellow ||
        result.joints?.some(j => (j.status === 'warning' || j.status === 'misaligned') && j.deviation < 3.5)
      );

      if (result.is_correct) {
        setPostureAnalysis((prev) => ({
          ...prev,
          score: Math.round(Math.max(92, result.confidence * 100)),
          alignmentStatus: 'All Joints Perfect (Aligned)',
          encouragingFeedback: `Great form! Holding ${currentPose?.name || 'pose'} accurately.`,
          keyCues: [`Holding ${currentPose?.name || 'pose'} with excellent form. Keep steady!`],
        }));
      } else if (result.predicted_pose === 'no_pose') {
        setPostureAnalysis((prev) => ({
          ...prev,
          alignmentStatus: 'Step into Frame / Normal Posture',
          encouragingFeedback: 'Take your yoga position. Timer will start when posture is detected.',
          keyCues: ['Step into frame and assume posture.'],
        }));
      } else if (hasCriticalJoint) {
        // Red: Mistake detected
        const msg = result.correction_message || 'Joint alignment mistake detected.';
        setPostureAnalysis((prev) => ({
          ...prev,
          score: Math.round(Math.max(45, result.confidence * 65)),
          alignmentStatus: 'Mistake Detected (Red)',
          encouragingFeedback: msg,
          keyCues: [msg],
        }));
      } else if (hasWarningJoint || result.correction_message) {
        // Yellow: Warning / Minor adjustment - timer does not stop!
        const msg = result.correction_message || 'Minor adjustment needed; maintain your balance.';
        setPostureAnalysis((prev) => ({
          ...prev,
          score: Math.round(Math.max(78, result.confidence * 90)),
          alignmentStatus: 'Minor Adjustment (Holding - Yellow)',
          encouragingFeedback: msg,
          keyCues: [msg],
        }));
      }
    },
  });

  // Uploaded / Simulated test pose image state
  const [uploadedPoseImage, setUploadedPoseImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const poseGridScrollRef = useRef<HTMLDivElement | null>(null);
  const voiceTableScrollRef = useRef<HTMLDivElement | null>(null);

  // Voice controller handlers
  const voiceController = useVoiceController({
    onSelectPose: (poseId) => {
      const idx = ALL_POSES.findIndex((p) => p.id === poseId);
      if (idx >= 0) {
        handleSelectPose(idx);
      }
    },
    onOpenVoiceTable: () => {
      setShowVoiceCmdTable(true);
      soundEngine.playChime(600, 0.5);
      if (voiceSpeechEnabled) {
        soundEngine.speak('Opening voice commands table.');
      }
    },
    onToggleVoiceTable: () => {
      setShowVoiceCmdTable((prev) => !prev);
      soundEngine.playChime(600, 0.5);
      if (voiceSpeechEnabled) {
        soundEngine.speak('Toggling voice commands table.');
      }
    },
    onCloseVoiceTable: () => {
      setShowVoiceCmdTable(false);
      if (voiceSpeechEnabled) {
        soundEngine.speak('Closing voice commands table.');
      }
    },
    onOpenYogaPoses: () => {
      setIsDrawerOpen(true);
      setDrawerShelfMode('grid');
      soundEngine.playChime(528, 0.6);
      if (voiceSpeechEnabled) {
        soundEngine.speak('Opening yoga poses table.');
      }
    },
    onCloseYogaPoses: () => {
      setIsDrawerOpen(false);
      if (voiceSpeechEnabled) {
        soundEngine.speak('Closing poses table.');
      }
    },
    onPreviewPose: () => {
      if (currentPose) {
        setIsDrawerOpen(true);
        setDrawerShelfMode('card');
        setReferenceDisplayMode('photo');
        soundEngine.playChime(528, 0.6);
        if (voiceSpeechEnabled) {
          soundEngine.speak(`Displaying preview for ${currentPose.name}.`);
        }
      }
    },
    onClosePreview: () => {
      setDrawerShelfMode('grid');
      if (voiceSpeechEnabled) {
        soundEngine.speak('Closing pose preview.');
      }
    },
    onReadyToStart: () => {
      handleConfirmReadyAndStart();
    },
    onEnableCamera: () => {
      if (!cameraActive) {
        startCamera();
      }
    },
    onDisableCamera: () => {
      stopCamera();
      if (voiceSpeechEnabled) {
        soundEngine.speak('Camera turned off.');
      }
    },
    onNextPose: () => {
      const nextIdx = selectedPoseIndex !== null && selectedPoseIndex < ALL_POSES.length - 1 ? selectedPoseIndex + 1 : 0;
      const nextPoseName = ALL_POSES[nextIdx]?.name || 'Next Pose';
      voiceController.setLastCommandRecognized(`Next Pose: ${nextPoseName}`);
      handleNextPose();
    },
    onPrevPose: () => handlePrevPose(),
    onScrollDownPoses: () => {
      setIsDrawerOpen(true);
      const performScroll = () => {
        const el = poseGridScrollRef.current;
        if (el) {
          try {
            el.scrollBy({ top: 260, behavior: 'smooth' });
          } catch {
            el.scrollTop += 260;
          }
          // Fallback if scrollBy wasn't applied
          setTimeout(() => {
            if (el.scrollTop === 0) el.scrollTop += 260;
          }, 80);
        }
      };
      [0, 60, 180, 320].forEach((delay) => setTimeout(performScroll, delay));
    },
    onScrollUpPoses: () => {
      setIsDrawerOpen(true);
      const performScroll = () => {
        const el = poseGridScrollRef.current;
        if (el) {
          try {
            el.scrollBy({ top: -260, behavior: 'smooth' });
          } catch {
            el.scrollTop -= 260;
          }
        }
      };
      [0, 60, 180, 320].forEach((delay) => setTimeout(performScroll, delay));
    },
    onScrollDownVoiceTable: () => {
      setShowVoiceCmdTable(true);
      const performScroll = () => {
        const el = voiceTableScrollRef.current;
        if (el) {
          try {
            el.scrollBy({ top: 160, behavior: 'smooth' });
          } catch {
            el.scrollTop += 160;
          }
        }
      };
      [0, 60, 180, 320].forEach((delay) => setTimeout(performScroll, delay));
    },
    onScrollUpVoiceTable: () => {
      setShowVoiceCmdTable(true);
      const performScroll = () => {
        const el = voiceTableScrollRef.current;
        if (el) {
          try {
            el.scrollBy({ top: -160, behavior: 'smooth' });
          } catch {
            el.scrollTop -= 160;
          }
        }
      };
      [0, 60, 180, 320].forEach((delay) => setTimeout(performScroll, delay));
    },
    onPause: () => {
      setIsPoseActive(false);
      soundEngine.playChime(400, 0.5);
      if (voiceSpeechEnabled) {
        soundEngine.speak('Pose hold paused.');
      }
    },
    onResume: () => {
      setIsPoseActive(true);
      soundEngine.playChime(528, 0.5);
      if (voiceSpeechEnabled) {
        soundEngine.speak('Resuming pose hold.');
      }
    },
    onFinishSession: () => handleCompleteSession(),
  });

  // Robust Camera initialization with multi-tier fallback
  const startCamera = async () => {
    try {
      setCameraPermissionError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Web camera API is not supported in this browser environment.');
      }

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        });
      } catch (firstErr) {
        console.warn('Initial camera constraint attempt fallback to standard video:', firstErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      if (stream) {
        streamRef.current = stream;
        setCameraActive(true);
        setCameraPermissionError(null);
        if (voiceSpeechEnabled) {
          soundEngine.speak('Camera active. Ready for vision monitoring.');
        }

        // Auto-enable & recover voice commands when camera stream is opened
        setTimeout(() => {
          voiceController.startListening();
        }, 300);
      }
    } catch (err: any) {
      console.warn('Camera access fallback notice:', err);
      const isDenied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      const isNotFound = err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError';
      const msg = isDenied
        ? 'Camera permission was blocked. Allow camera access in browser settings.'
        : isNotFound
        ? 'No webcam device found. Please connect a webcam.'
        : 'Camera could not be started: ' + (err?.message || 'Access restricted.');
      setCameraPermissionError(msg);
      setCameraActive(false);
    }
  };

  // Ensure stream is assigned to video element immediately whenever camera is active and element mounts
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch((playErr) => console.warn('Video element play error:', playErr));
      }
    }
  }, [cameraActive, videoRef.current]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
          track.enabled = false;
        } catch (err) {
          console.warn('Track stop notice:', err);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
        videoRef.current.pause();
      } catch (err) {
        console.warn('Video pause notice:', err);
      }
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Timers: Continuous total session timer + pose hold timer when active
  useEffect(() => {
    const sessionInterval = setInterval(() => {
      setTotalSessionSeconds((prev) => {
        const next = prev + 1;
        // 60-minute safety limit auto-complete
        if (next >= 3600) {
          handleCompleteSession();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(sessionInterval);
  }, []);

  // Model-driven Pose Hold Timer:
  // Timer runs when user is in the pose and NO RED joint/mistake is detected.
  // Even if there is a yellow warning, the timer does NOT stop! It keeps running until a red is detected.
  useEffect(() => {
    if (!isPoseActive || selectedPoseIndex === null) return;

    const pose = ALL_POSES[selectedPoseIndex];
    if (!pose) return;

    // Check if red is detected (severe mistake or wrong pose)
    const hasRedJoint = Boolean(
      modelPoseResult?.has_red ||
      modelPoseResult?.joints?.some(
        (j) => j.status === 'critical' || (j.status as string) === 'red' || j.deviation >= 3.5
      ) ||
      (modelPoseResult && modelPoseResult.predicted_pose !== 'no_pose' && pose.model_class_name &&
        !isPoseMatch(modelPoseResult.predicted_pose, pose.model_class_name))
    );

    // If red is detected, or no pose detected at all while holding
    const isRedOrIdle = !modelPoseResult || modelPoseResult.predicted_pose === 'no_pose' || hasRedJoint;

    if (isRedOrIdle) {
      // If user had an active streak and made a RED mistake, update best time and reset
      if (poseHoldSeconds > 0) {
        setBestHoldPerPose((prev) => {
          const prevBest = prev[pose.id] || 0;
          if (poseHoldSeconds > prevBest) {
            setPersonalBestToast({
              poseName: pose.name,
              seconds: poseHoldSeconds,
              prior: prevBest,
            });
            if (voiceSpeechEnabled) {
              soundEngine.speak(`Streak stopped at ${poseHoldSeconds} seconds. New personal best set!`);
            }
            return { ...prev, [pose.id]: poseHoldSeconds };
          } else {
            if (voiceSpeechEnabled) {
              soundEngine.speak(`Mistake made. You held for ${poseHoldSeconds} seconds. Your best is ${prevBest} seconds.`);
            }
            return prev;
          }
        });
        setPoseHoldSeconds(0);
      }
      return;
    }

    // When NOT red (i.e. all correct green OR minor warning yellow), tick hold seconds every 1000ms!
    const interval = setInterval(() => {
      setPoseHoldSeconds((prevStreak) => {
        const nextStreak = prevStreak + 1;

        setBestHoldPerPose((prevBestMap) => {
          const currentBest = prevBestMap[pose.id] || 0;
          if (nextStreak > currentBest) {
            if (currentBest > 0 && nextStreak === currentBest + 1) {
              setPersonalBestToast({
                poseName: pose.name,
                seconds: nextStreak,
                prior: currentBest,
              });
              if (voiceSpeechEnabled) {
                soundEngine.playChime(880, 0.4);
              }
            }
            return { ...prevBestMap, [pose.id]: nextStreak };
          }
          return prevBestMap;
        });

        return nextStreak;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPoseActive, selectedPoseIndex, modelPoseResult, voiceSpeechEnabled, poseHoldSeconds]);

  // Handle Pose Selection (manual click or voice selection) - sets pose but waits for user to be ready!
  const handleSelectPose = (idx: number, isNextPose = false) => {
    const newPose = ALL_POSES[idx];
    if (!newPose) return;

    const isSamePose = selectedPoseIndex === idx;

    // Record previous pose metrics if active
    if (currentPose && isPoseActive && poseHoldSeconds > 0 && !isSamePose) {
      setPoseRecords((prev) => ({
        ...prev,
        [currentPose.id]: {
          poseId: currentPose.id,
          poseName: currentPose.name,
          sanskritName: currentPose.sanskritName,
          durationSeconds: (prev[currentPose.id]?.durationSeconds || 0) + poseHoldSeconds,
          bestHoldSeconds: Math.max(prev[currentPose.id]?.bestHoldSeconds || 0, bestHoldPerPose[currentPose.id] || poseHoldSeconds),
          attemptsCount: (prev[currentPose.id]?.attemptsCount || 0) + 1,
          accuracyScore: postureAnalysis.score || 92,
          cuesReceived: postureAnalysis.keyCues || [],
          status: 'completed',
        },
      }));
    }

    setSelectedPoseIndex(idx);
    setIsPoseActive(false); // Wait until user is ready!
    setPoseHoldSeconds(0);
    setDrawerShelfMode('card');
    soundEngine.playChime(528, 1);

    // Track attempt count
    setAttemptsPerPose((prev) => ({
      ...prev,
      [newPose.id]: (prev[newPose.id] || 0) + 1,
    }));

    setPostureAnalysis({
      score: 93,
      alignmentStatus: 'Ready Check: ' + newPose.name,
      keyCues: newPose.keyAlignmentCheckpoints.slice(0, 3),
      wrongPostureImpacts: newPose.wrongPostureImpacts.map((w) => `${w.mistake}: ${w.impact}`),
      benefitsTargeted: newPose.benefits.slice(0, 2),
      encouragingFeedback: `Selected ${newPose.name}. Click 'I'm Ready' or say 'Ready' when you are in position to begin.`,
    });

    if (voiceSpeechEnabled && !isSamePose) {
      const notice = isNextPose 
        ? `Next pose: ${newPose.name}. Click Ready when in position.`
        : `Selected ${newPose.name}. Click Ready when in position.`;
      soundEngine.speak(notice);
    }
  };

  // User confirms ready: start camera if needed, start timer, start AI monitoring
  const handleConfirmReadyAndStart = () => {
    if (selectedPoseIndex === null) {
      handleSelectPose(0);
      return;
    }

    const pose = ALL_POSES[selectedPoseIndex];
    if (!pose) return;

    if (!cameraActive) {
      startCamera();
    }

    setIsPoseActive(true);
    soundEngine.playChime(440, 1.5);
    
    if (voiceSpeechEnabled) {
      soundEngine.speak(`Starting ${pose.name}. Hold steady for ${pose.idealHoldDurationSeconds} seconds.`);
    }

    setPostureAnalysis((prev) => ({
      ...prev,
      alignmentStatus: 'Posture Form Active',
      encouragingFeedback: `Holding ${pose.name}. Focus on ${pose.keyAlignmentCheckpoints[0] || 'steady alignment'}.`,
    }));
  };

  // Next pose switches to next and announces exact next pose name!
  const handleNextPose = () => {
    if (selectedPoseIndex === null) {
      handleSelectPose(0, true);
      return;
    }

    if (selectedPoseIndex < ALL_POSES.length - 1) {
      handleSelectPose(selectedPoseIndex + 1, true);
    } else {
      handleCompleteSession();
    }
  };

  // Prev pose switches to prev and waits until user is ready!
  const handlePrevPose = () => {
    if (selectedPoseIndex !== null && selectedPoseIndex > 0) {
      handleSelectPose(selectedPoseIndex - 1);
    }
  };

  const handleCompleteSession = () => {
    soundEngine.playChime(528, 2.5);
    stopCamera();

    let finalRecordsMap = { ...poseRecords };
    // Only record currentPose if it was actually held for at least 3 seconds
    if (currentPose && (poseHoldSeconds >= 3 || (poseRecords[currentPose.id]?.durationSeconds || 0) >= 3)) {
      const existing = poseRecords[currentPose.id];
      const bestHold = Math.max(
        existing?.bestHoldSeconds || 0,
        bestHoldPerPose[currentPose.id] || poseHoldSeconds
      );
      finalRecordsMap[currentPose.id] = {
        poseId: currentPose.id,
        pose_id: currentPose.id,
        poseName: currentPose.name,
        pose_name: currentPose.name,
        sanskritName: currentPose.sanskritName || '',
        sanskrit_name: currentPose.sanskritName || '',
        durationSeconds: (existing?.durationSeconds || 0) + poseHoldSeconds,
        duration_seconds: (existing?.durationSeconds || 0) + poseHoldSeconds,
        bestHoldSeconds: bestHold,
        best_hold_seconds: bestHold,
        attemptsCount: (existing?.attemptsCount || 0) + (attemptsPerPose[currentPose.id] || 1),
        attempts_count: (existing?.attemptsCount || 0) + (attemptsPerPose[currentPose.id] || 1),
        accuracyScore: postureAnalysis.score || 92,
        accuracy_score: postureAnalysis.score || 92,
        cuesReceived: postureAnalysis.keyCues || [],
        cues_received: postureAnalysis.keyCues || [],
        status: 'completed',
      };
    }

    // Filter strictly to poses where practitioner held for at least 3 seconds
    const finalRecords: SessionPoseRecord[] = Object.values(finalRecordsMap).filter(
      (r) => (Number(r.durationSeconds || (r as any).duration_seconds || 0) >= 3 || Number(r.bestHoldSeconds || (r as any).best_hold_seconds || 0) >= 3)
    );

    // If no poses were held, do NOT generate a false report!
    if (finalRecords.length === 0) {
      if (onNoPosesPracticed) {
        onNoPosesPracticed();
      } else {
        onClose();
      }
      return;
    }

    const avgScore = Math.round(
      finalRecords.reduce((acc, r) => acc + (r.accuracyScore || (r as any).accuracy_score || 0), 0) / finalRecords.length
    );

    const totalSeconds = totalSessionSeconds > 0 
      ? totalSessionSeconds 
      : finalRecords.reduce((acc, r) => acc + (r.durationSeconds || (r as any).duration_seconds || 0), 0) || poseHoldSeconds;

    const sessionPoses: SessionPoseRecord[] = finalRecords;

    const sessionData: PracticeSession = {
      id: 'session_' + Date.now(),
      startTime: sessionStartTime,
      start_time: sessionStartTime,
      endTime: Date.now(),
      end_time: Date.now(),
      totalDurationSeconds: totalSeconds,
      total_duration_seconds: totalSeconds,
      posesRecorded: sessionPoses,
      poses_recorded: sessionPoses,
      overallAccuracy: avgScore,
      overall_accuracy: avgScore,
      caloriesBurnedEst: Math.max(0, Math.round((totalSeconds / 60) * 4.8)),
      calories_burned_est: Math.max(0, Math.round((totalSeconds / 60) * 4.8)),
    };

    onFinishSession(sessionData);
  };

  // Names of the poses actually practiced so far (finished holds + the pose currently being held)
  const practicedPoseNames: string[] = (() => {
    const names: string[] = [];
    Object.values(poseRecords).forEach((r: any) => {
      const n = r?.poseName || r?.pose_name;
      if (n && !names.includes(n)) names.push(n);
    });
    if (currentPose && (isPoseActive || poseHoldSeconds > 0) && !names.includes(currentPose.name)) {
      names.push(currentPose.name);
    }
    return names;
  })();

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const holdProgressPercent = currentPose 
    ? Math.min(100, (poseHoldSeconds / targetHoldDuration) * 100)
    : 0;

  // SVG Circular Progress Geometry
  const circleRadius = 34;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference - (holdProgressPercent / 100) * circleCircumference;

  // Split ratio calculations & mouse drag events
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleMouseDownSplitter = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSplit(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSplit || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const percentage = (relativeX / rect.width) * 100;
      const clamped = Math.max(25, Math.min(75, Math.round(percentage)));
      setSplitPercent(clamped);
    };

    const handleMouseUp = () => {
      if (isDraggingSplit) {
        setIsDraggingSplit(false);
      }
    };

    if (isDraggingSplit) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSplit]);

  const GreetingIcon = greetingInfo.icon;

  return (
    <div 
      id="live-posture-session-view" 
      className="min-h-[780px] h-[92vh] max-h-screen bg-[#070b12] text-stone-100 flex flex-col relative overflow-hidden selection:bg-emerald-500 selection:text-white"
    >
      {/* Ambient Visual Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[550px] h-[550px] bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* ========================================================================= */}
      {/* TOP HEADER & SESSION STATUS BAR                                           */}
      {/* ========================================================================= */}
      <header className="px-3 sm:px-5 py-2.5 bg-stone-900/95 border-b border-stone-800/80 backdrop-blur-xl flex flex-wrap items-center justify-between gap-2 shrink-0 z-40 shadow-lg">
        {/* Brand & Pose / Session State */}
        <div className="flex items-center gap-3">
          <div onClick={() => setShowExitConfirm(true)} className="cursor-pointer">
            <AsanaSenseLogo size="sm" textColor="text-white" showText={false} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-white text-sm sm:text-base tracking-wide flex items-center gap-1.5">
                <span>ASANA - SENSE</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                  LIVE STUDIO
                </span>
              </h1>
            </div>
            <p className="text-xs text-stone-400 flex items-center gap-1.5">
              {currentPose ? (
                <>
                  <span className={`font-semibold ${poseTheme.text}`}>{currentPose.name}</span>
                  <span className="text-stone-600">•</span>
                  <span className="font-serif italic text-stone-300">{currentPose.sanskritName}</span>
                  {isPoseActive ? (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold animate-pulse">
                      Active Hold
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold">
                      Waiting to Start
                    </span>
                  )}
                </>
              ) : (
                <span className="text-emerald-400 font-medium">Select an Asana to begin</span>
              )}
            </p>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* AI Master Coach Badge - Veda AI Exclusively */}
          <div className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-950 to-teal-950 border border-emerald-500/50 text-xs text-emerald-300 font-bold flex items-center gap-1.5 shadow-xs">
            <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Veda AI</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">Engine</span>
          </div>

          {/* Total Session Time */}
          <div className="px-2.5 py-1.5 rounded-xl bg-stone-800/90 border border-stone-700/80 text-xs flex items-center gap-1.5 shadow-xs">
            <Timer className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-stone-400 hidden sm:inline">Session:</span>
            <span className="font-mono font-bold text-white">{formatTime(totalSessionSeconds)}</span>
          </div>

          {/* Manual Split Adjusters */}
          {isDrawerOpen && (
            <div className="hidden md:flex items-center bg-stone-800/90 p-0.5 rounded-xl border border-stone-700 text-[11px]">
              <button
                onClick={() => setSplitPercent(50)}
                className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                  splitPercent === 50 ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-400 hover:text-stone-200'
                }`}
                title="50:50 Split"
              >
                <Columns className="w-3 h-3" />
                <span>50:50</span>
              </button>
              <button
                onClick={() => setSplitPercent(60)}
                className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                  splitPercent === 60 ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-400 hover:text-stone-200'
                }`}
                title="60:40 Split"
              >
                60:40
              </button>
              <button
                onClick={() => setSplitPercent(40)}
                className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                  splitPercent === 40 ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-400 hover:text-stone-200'
                }`}
                title="40:60 Split"
              >
                40:60
              </button>
            </div>
          )}

          {/* Dedicated Voice Audio Spoken Feedback Mute / Unmute Toggle */}
          <button
            id="voice-audio-mute-toggle-btn"
            type="button"
            onClick={() => {
              const nextVal = !voiceSpeechEnabled;
              setVoiceSpeechEnabled(nextVal);
              soundEngine.setMuted(!nextVal);
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs select-none ${
              voiceSpeechEnabled
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60 hover:border-emerald-400'
                : 'bg-amber-950/80 text-amber-300 border-amber-500/60 hover:bg-amber-900/80'
            }`}
            title={
              voiceSpeechEnabled
                ? 'Voice Audio Feedback: ON (Click to Mute Spoken Feedback)'
                : 'Voice Audio Feedback: MUTED (Click to Enable Spoken Feedback)'
            }
          >
            {voiceSpeechEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            )}
            <span className="hidden sm:inline font-medium">
              {voiceSpeechEnabled ? 'Voice Audio: On' : 'Voice Audio: Muted'}
            </span>
          </button>

          {/* Ambient Meditative Music Soundscapes & Custom Audio Player */}
          <AmbientAudioPlayer />

          {/* Dedicated Voice-Command Toggle Switch (Auto Opens Movable Commands Table) */}
          <div className="relative">
            <button
              id="voice-control-toggle-btn"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                voiceController.toggleListening();
                setShowVoiceCmdTable(!showVoiceCmdTable);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs select-none ${
                voiceController.isListening || showVoiceCmdTable
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/80 ring-2 ring-emerald-500/40 shadow-emerald-950/40'
                  : voiceController.errorMessage
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/60'
                  : 'bg-stone-800/90 text-stone-300 border-stone-700 hover:bg-stone-700/90 hover:text-white'
              }`}
              title={
                voiceController.errorMessage ||
                "Voice Commands: Say 'open poses', 'preview', 'Warrior 3', 'ready', 'pause', 'resume'"
              }
            >
              {/* Pulsing Visual Status Indicator */}
              <span className="relative flex h-2.5 w-2.5">
                {voiceController.isListening && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  voiceController.isListening
                    ? 'bg-emerald-400'
                    : voiceController.errorMessage
                    ? 'bg-amber-400'
                    : 'bg-stone-500'
                }`} />
              </span>

              {voiceController.isListening ? (
                <Mic className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
              ) : (
                <MicOff className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              )}

              <span className="hidden sm:inline font-medium">
                {voiceController.isListening ? 'Voice Active' : 'Voice Cmd'}
              </span>
            </button>

            {/* Error / Permission Tooltip Badge */}
            {voiceController.errorMessage && !voiceController.isListening && (
              <div className="absolute top-full left-0 mt-1 z-40 w-48 p-2 rounded-xl bg-stone-900/95 border border-amber-500/40 text-[10px] text-amber-200 shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-1 font-bold text-amber-300 mb-0.5">
                  <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Mic Permission Needed</span>
                </div>
                <span>{voiceController.errorMessage}</span>
              </div>
            )}
          </div>

          {/* Toggle Right Pose Drawer Button */}
          <button
            id="toggle-drawer-top-btn"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
              isDrawerOpen
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
            }`}
          >
            {isDrawerOpen ? <PanelRightClose className="w-3.5 h-3.5 text-emerald-400" /> : <PanelRightOpen className="w-3.5 h-3.5 text-emerald-400" />}
            <span>Poses (8)</span>
          </button>

          {/* Finish & Generate Report */}
          <button
            id="finish-session-btn"
            onClick={handleCompleteSession}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-900/60 ring-1 ring-emerald-300/40 cursor-pointer"
            title={
              practicedPoseNames.length > 0
                ? `Generate your AI report for: ${practicedPoseNames.join(', ')}`
                : 'Finish the session and view your AI report'
            }
          >
            <Award className="w-4 h-4" />
            <span>Finish &amp; View AI Report</span>
            {practicedPoseNames.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-mono leading-none">
                {practicedPoseNames.length} {practicedPoseNames.length === 1 ? 'pose' : 'poses'}
              </span>
            )}
          </button>

          {/* Exit Button */}
          <button
            onClick={() => setShowExitConfirm(true)}
            className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 text-xs font-medium transition cursor-pointer"
          >
            Exit
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN EXPANDED WORKSPACE (Increased Stage Height h-[88vh] / min-h-[750px]) */}
      {/* ========================================================================= */}
      <div 
        ref={containerRef}
        className={`flex-1 w-full mx-auto p-2.5 sm:p-4 flex flex-col lg:flex-row gap-0 items-stretch relative z-10 overflow-hidden min-h-[700px] ${
          isDraggingSplit ? 'select-none cursor-col-resize' : ''
        }`}
      >
        
        {/* ======================================================================= */}
        {/* LEFT AREA: LIVE WEBCAM & READY ONBOARDING STAGE                         */}
        {/* ======================================================================= */}
        <div 
          style={{ width: isDrawerOpen && window.innerWidth >= 1024 ? `${splitPercent}%` : '100%' }}
          className="flex flex-col space-y-2.5 min-w-0 transition-[width] duration-75 lg:pr-2.5 h-full justify-between"
        >
          
          {/* Viewport Card */}
          <div className="relative flex-1 min-h-[480px] bg-stone-950 rounded-3xl overflow-hidden border border-stone-800/90 shadow-2xl flex items-center justify-center group/viewport">
            {/* Ambient Border Glow */}
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${poseTheme.ring} opacity-20 group-hover/viewport:opacity-30 blur-xs transition duration-500`} />

            {/* Live Camera Video Feed or Greeting State */}
            {cameraActive ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full ${videoFitMode === 'contain' ? 'object-contain bg-black' : 'object-cover bg-black'} transform -scale-x-100 relative z-10 transition-all duration-300`}
                />
                <canvas
                  ref={canvasRef}
                  className={`absolute inset-0 w-full h-full ${videoFitMode === 'contain' ? 'object-contain' : 'object-cover'} transform -scale-x-100 pointer-events-none z-15`}
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-stone-950 via-[#0a121e] to-stone-950 relative z-10 text-center">
                {currentPose ? (
                  <div className="w-48 h-48 relative flex items-center justify-center my-2">
                    <PoseVisualArtwork poseId={currentPose.id} highlightJoints={true} />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-3 shadow-lg">
                    <GreetingIcon className="w-10 h-10 text-emerald-300" />
                  </div>
                )}

                {/* Personalized Greeting Card on Stage */}
                <div className="max-w-md bg-stone-900/90 backdrop-blur-md p-4 rounded-2xl border border-stone-800 space-y-2 shadow-xl">
                  <div className="flex items-center justify-between gap-2 border-b border-stone-800 pb-2">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                      <GreetingIcon className="w-4 h-4" />
                      <span>{greetingInfo.text}, {userName}!</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-stone-950 border border-stone-800 text-[10px] text-stone-400 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span>Camera: Offline</span>
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-white">
                    Are you ready to boost your day by doing yoga?
                  </h3>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    {currentPose 
                      ? `You selected ${currentPose.name}. Click 'I'm Ready' below or speak voice commands to enable camera and start the posture timer.`
                      : 'Choose any of the 8 asanas from the drawer on the right (or say "Warrior 3" / "Tree Pose") to get started!'}
                  </p>

                  {/* Camera Notice / Fallback helper if error */}
                  {cameraPermissionError && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-200 text-xs flex flex-col items-center gap-2">
                      <div className="flex items-center gap-1.5 font-semibold text-amber-300 text-left w-full">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[11px]">{cameraPermissionError}</span>
                      </div>
                      <div className="flex items-center gap-2 w-full justify-end">
                        <button
                          onClick={startCamera}
                          className="px-2.5 py-1 rounded-lg bg-amber-900/80 hover:bg-amber-800 text-amber-200 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" /> Retry Camera
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Viewport HUD: Accuracy, Hold Timer Ring, Manual Duration, Personal Best Celebration, Ready Prompt & AI Guidance */}
            <ViewportHUD
              currentPose={currentPose}
              isPoseActive={isPoseActive}
              cameraActive={cameraActive}
              videoFitMode={videoFitMode}
              modelPoseResult={modelPoseResult}
              postureAnalysis={postureAnalysis}
              poseHoldSeconds={poseHoldSeconds}
              targetHoldDuration={targetHoldDuration}
              manualTargetSeconds={manualTargetSeconds}
              bestHoldPerPose={bestHoldPerPose}
              personalBestToast={personalBestToast}
              aiCoachName={aiCoachName}
              lastVoiceCommand={voiceController.lastCommandRecognized}
              showVoiceCmdTable={showVoiceCmdTable}
              containerRef={containerRef}
              voiceTableScrollRef={voiceTableScrollRef}
              isPoseMatch={isPoseMatch}
              onSetVideoFitMode={setVideoFitMode}
              onSetManualTargetSeconds={setManualTargetSeconds}
              onConfirmReadyAndStart={handleConfirmReadyAndStart}
              onStartCamera={startCamera}
              onCloseVoiceTable={() => setShowVoiceCmdTable(false)}
            />
          </div>

          {/* Action Bar (Camera Toggle, Full-Body Framing, Start/Pause, Analyze Form, Prev/Next) */}
          <div className="bg-stone-900/90 rounded-2xl p-2.5 sm:p-3 border border-stone-800 flex flex-wrap items-center justify-between gap-2 shadow-lg shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Ready / Play / Pause Toggle Button */}
              {currentPose && (
                <button
                  onClick={() => isPoseActive ? setIsPoseActive(false) : handleConfirmReadyAndStart()}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
                    isPoseActive 
                      ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                  }`}
                >
                  {isPoseActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                  <span>{isPoseActive ? 'Pause Pose' : `Ready • Start ${currentPose.name}`}</span>
                </button>
              )}

              {/* Camera Toggle */}
              <button
                onClick={cameraActive ? stopCamera : startCamera}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-stone-800 to-stone-700 hover:from-stone-700 hover:to-stone-600 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-stone-600 shadow-sm"
              >
                {cameraActive ? <CameraOff className="w-3.5 h-3.5 text-rose-400" /> : <Camera className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{cameraActive ? 'Camera Off' : 'Camera On'}</span>
              </button>

              {/* Full Body Fit Framing Toggle */}
              <button
                onClick={() => setVideoFitMode(videoFitMode === 'contain' ? 'cover' : 'contain')}
                className={`px-2.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                  videoFitMode === 'contain'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                    : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                }`}
                title="Toggle Full Body Fit vs Wide Fill"
              >
                <Scan className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{videoFitMode === 'contain' ? 'Full Body Fit' : 'Fill View'}</span>
              </button>

            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPose}
                disabled={selectedPoseIndex === null || selectedPoseIndex === 0}
                className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>

              <span className="text-xs text-stone-400 font-mono px-1">
                {selectedPoseIndex !== null ? `${selectedPoseIndex + 1}/${ALL_POSES.length}` : '0/8'}
              </span>

              <button
                onClick={handleNextPose}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <span>
                  {selectedPoseIndex === null
                    ? 'Start Pose'
                    : selectedPoseIndex === ALL_POSES.length - 1
                    ? 'Finish Practice'
                    : `Next: ${ALL_POSES[selectedPoseIndex + 1]?.name}`}
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Split Resizer Handle (Desktop) */}
        {isDrawerOpen && (
          <div
            onMouseDown={handleMouseDownSplitter}
            className="hidden lg:flex flex-col items-center justify-center w-3 hover:w-3.5 -mx-1 z-30 cursor-col-resize group transition-all"
            title="Drag to dynamically resize camera and drawer width"
          >
            <div className={`w-1 group-hover:w-1.5 h-24 rounded-full transition-all duration-200 ${
              isDraggingSplit ? 'bg-emerald-400 shadow-md shadow-emerald-500/50' : 'bg-stone-700 group-hover:bg-emerald-500'
            }`} />
          </div>
        )}

        {/* ======================================================================= */}
        {/* RIGHT AREA: YOGA POSE DRAWER / DOCKED VOICE COMMANDS TABLE               */}
        {/* ======================================================================= */}
        <AnimatePresence mode="wait">
          {isDrawerOpen ? (
            <PoseDrawer
              isDrawerOpen={isDrawerOpen}
              splitPercent={splitPercent}
              drawerShelfMode={drawerShelfMode}
              activeCardTab={activeCardTab}
              referenceDisplayMode={referenceDisplayMode}
              selectedPoseIndex={selectedPoseIndex}
              currentPose={currentPose}
              poseTheme={poseTheme}
              poseRecords={poseRecords}
              isPoseActive={isPoseActive}
              poseGridScrollRef={poseGridScrollRef}
              onCloseDrawer={() => setIsDrawerOpen(false)}
              onSetDrawerShelfMode={setDrawerShelfMode}
              onSetActiveCardTab={setActiveCardTab}
              onSetReferenceDisplayMode={setReferenceDisplayMode}
              onSelectPose={handleSelectPose}
              onConfirmReadyAndStart={handleConfirmReadyAndStart}
            />
          ) : showVoiceCmdTable ? (
            <motion.div
              key="voice-cmd-side-table"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{ width: window.innerWidth >= 1024 ? `${100 - splitPercent}%` : '100%' }}
              className="flex flex-col space-y-2.5 min-w-0 transition-[width] duration-75 lg:pl-2.5 h-full min-h-0 relative z-30 pointer-events-auto"
            >
              <div className="bg-stone-900/95 rounded-3xl p-3.5 sm:p-4 border border-emerald-500/60 shadow-2xl flex flex-col h-full min-h-0 overflow-hidden backdrop-blur-md">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-800 shrink-0 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30 shrink-0">
                      <Mic className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="truncate">
                      <h2 className="text-xs font-bold text-emerald-300 uppercase tracking-wider truncate">
                        Voice Commands Table
                      </h2>
                      <p className="text-[10px] text-stone-400 truncate">
                        Hands-free pose & session controls
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setIsDrawerOpen(true)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 transition cursor-pointer border border-emerald-400/50"
                      title="Open 8 Poses Table"
                    >
                      <PanelRightOpen className="w-3 h-3" />
                      <span>Poses (8)</span>
                    </button>
                    <button
                      onClick={() => setShowVoiceCmdTable(false)}
                      className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition cursor-pointer"
                      title="Close Voice Commands Table"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Commands Content */}
                <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-3 scrollbar-thin scrollbar-thumb-stone-700 text-xs">
                  <div className="rounded-2xl bg-stone-950/90 p-3 border border-emerald-500/30">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">🗣️ Key Voice Actions</span>
                    <div className="space-y-1.5 text-stone-200 font-mono text-[11px]">
                      <div className="flex items-center justify-between bg-stone-900/80 px-2 py-1 rounded border border-stone-800">
                        <span>• <strong className="text-amber-300">"open voice table"</strong></span>
                        <span className="text-[10px] text-stone-400 font-sans">Toggle voice table</span>
                      </div>
                      <div className="flex items-center justify-between bg-stone-900/80 px-2 py-1 rounded border border-stone-800">
                        <span>• <strong className="text-amber-300">"next pose"</strong></span>
                        <span className="text-[10px] text-stone-400 font-sans">Advance to next pose</span>
                      </div>
                      <div className="flex items-center justify-between bg-stone-900/80 px-2 py-1 rounded border border-stone-800">
                        <span>• <strong className="text-amber-300">"open poses"</strong></span>
                        <span className="text-[10px] text-stone-400 font-sans">Open 8 Poses drawer</span>
                      </div>
                      <div className="flex items-center justify-between bg-stone-900/80 px-2 py-1 rounded border border-stone-800">
                        <span>• <strong className="text-amber-300">"preview"</strong></span>
                        <span className="text-[10px] text-stone-400 font-sans">Show pose details</span>
                      </div>
                      <div className="flex items-center justify-between bg-stone-900/80 px-2 py-1 rounded border border-stone-800">
                        <span>• <strong className="text-emerald-300">"I'm ready" / "Start"</strong></span>
                        <span className="text-[10px] text-stone-400 font-sans">Start hold timer</span>
                      </div>
                      <div className="flex items-center justify-between bg-stone-900/80 px-2 py-1 rounded border border-stone-800">
                        <span>• <strong className="text-emerald-300">"Pause pose" / "Resume"</strong></span>
                        <span className="text-[10px] text-stone-400 font-sans">Pause/resume practice</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-stone-950/90 p-3 border border-stone-800">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1.5">🧘 8 Asana Direct Commands</span>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-stone-300">
                      <div className="bg-stone-900/80 px-2 py-1 rounded border border-stone-800">• "Warrior 3"</div>
                      <div className="bg-stone-900/80 px-2 py-1 rounded border border-stone-800">• "Tree Pose"</div>
                      <div className="bg-stone-900/80 px-2 py-1 rounded border border-stone-800">• "Triangle Pose"</div>
                      <div className="bg-stone-900/80 px-2 py-1 rounded border border-stone-800">• "Downward Dog"</div>
                      <div className="bg-stone-900/80 px-2 py-1 rounded border border-stone-800">• "Crescent Lunge"</div>
                      <div className="bg-stone-900/80 px-2 py-1 rounded border border-stone-800">• "Bridge Pose"</div>
                      <div className="bg-stone-900/80 px-2 py-1 rounded border border-stone-800">• "Cobbler Pose"</div>
                      <div className="bg-stone-900/80 px-2 py-1 rounded border border-stone-800">• "Corpse Pose"</div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-stone-950/90 p-3 border border-stone-800">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1.5">🎥 Framing & Session Commands</span>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-stone-300">
                      <div className="bg-stone-900/80 px-2 py-1 rounded border border-stone-800">• "Turn on camera"</div>
                      <div className="bg-stone-900/80 px-2 py-1 rounded border border-stone-800">• "Full body fit"</div>
                      <div className="bg-stone-900/80 px-2 py-1 rounded border border-stone-800">• "Fill view"</div>
                      <div className="bg-stone-900/80 px-2 py-1 rounded border border-stone-800">• "Next pose"</div>
                      <div className="bg-stone-900/80 px-2 py-1 rounded border border-stone-800">• "Analyze form"</div>
                      <div className="bg-stone-900/80 px-2 py-1 rounded border border-stone-800">• "Finish session"</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Closed Drawer Re-Open Tab Handle (Movable in space) */}
        {!isDrawerOpen && !showVoiceCmdTable && (
          <motion.button
            drag
            dragMomentum={false}
            dragConstraints={containerRef}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onDragStart={() => {
              isDraggingTabRef.current = true;
            }}
            onDragEnd={() => {
              setTimeout(() => {
                isDraggingTabRef.current = false;
              }, 150);
            }}
            onClick={() => {
              if (!isDraggingTabRef.current) {
                setIsDrawerOpen(true);
              }
            }}
            className="absolute top-6 right-3 z-30 px-3.5 py-2 rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-700 hover:from-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-2xl border border-emerald-400/50 cursor-grab active:cursor-grabbing select-none"
            title="Drag to reposition anywhere in space • Click to open Yoga Poses drawer"
          >
            <span className="text-[11px] bg-emerald-950/70 px-1 py-0.5 rounded border border-emerald-400/40">🖐️ Movable</span>
            <PanelRightOpen className="w-4 h-4" />
            <span>Yoga Pose Drawer (8 Poses) ◀</span>
          </motion.button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MOBILE SCREEN RESTRICTION MODAL                                           */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isMobileScreen && !dismissMobileWarning && (
          <div className="fixed inset-0 z-50 bg-[#070b12]/95 backdrop-blur-xl text-white p-5 flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="max-w-md w-full bg-stone-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl relative overflow-hidden"
            >
              {/* Background ambient glow */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
                <Laptop className="w-8 h-8 text-emerald-300" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Desktop PC / Laptop Recommended</span>
                </div>
                <h2 className="text-xl font-serif font-bold text-white leading-snug">
                  Use PC or Laptop for a Better User Experience
                </h2>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Real-time posture tracking & joint alignment vision require wider desktop camera view.
                </p>
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-[11px] text-emerald-200 font-medium">
                  We are actively developing the mobile view experience. Thank you for your patience! This feature will be coming soon.
                </div>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  onClick={() => {
                    stopCamera();
                    onClose();
                  }}
                  className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition cursor-pointer shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Home Dashboard</span>
                </button>

                <button
                  onClick={() => setDismissMobileWarning(true)}
                  className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition cursor-pointer"
                >
                  Preview Mobile Mode Anyway
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* EXIT CONFIRMATION MODAL                                                   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-stone-900 border border-stone-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Exit Yoga Studio?</h3>
                <p className="text-xs text-stone-400 mt-1">
                  Do you want to finish and generate your practice summary report, or discard current session progress?
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={handleCompleteSession}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-md"
                >
                  Finish & Save Session Summary
                </button>
                <button
                  onClick={() => {
                    stopCamera();
                    onClose();
                  }}
                  className="w-full py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-rose-300 text-xs font-semibold transition cursor-pointer"
                >
                  Discard & Exit to Home
                </button>
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="w-full py-1.5 text-stone-400 hover:text-white text-xs font-medium cursor-pointer"
                >
                  Continue Practicing
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};