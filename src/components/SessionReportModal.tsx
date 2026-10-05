import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  CheckCircle2, 
  Timer, 
  Flame, 
  ShieldCheck, 
  Sparkles, 
  X, 
  Lock, 
  TrendingUp, 
  Activity,
  ArrowRight,
  UserCheck,
  HeartPulse,
  RotateCcw,
  Compass,
  Eye,
  Check,
  Mail,
  FileText,
  TrendingDown,
  ChevronRight,
  Copy,
  Zap,
  Key,
  Utensils,
  Apple,
  RefreshCw,
  AlertTriangle,
  Droplets,
  Ban,
  Salad,
  Target,
  Loader2,
  EyeOff,
  Trash2
} from 'lucide-react';
import { PracticeSession, UserProfile } from '../types';
import { ALL_POSES } from '../data/yogaPoses';
import { getStoredSessions } from '../utils/profileStorage';
import { apiGenerateSessionReport, apiSendSessionEmail, getToken } from '../utils/apiClient';
import { useModalFocusTrap } from '../hooks/useModalFocusTrap';

// ── Defensive sanitizers ─────────────────────────────────────────────────────
// AI / heuristic engines sometimes return objects ({ title, description }) or nested arrays where the
// UI expects strings. Rendering those directly throws React Error #31 and blanks the screen, so every
// AI-provided value goes through these helpers before it reaches JSX.
const HEAD_KEYS = ['title', 'name', 'food', 'label', 'pose', 'poseName', 'area', 'focus'];
const BODY_KEYS = ['text', 'message', 'desc', 'description', 'tip', 'benefit', 'detail', 'details', 'reason', 'why', 'cue'];

const firstString = (obj: any, keys: string[]): string => {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  return '';
};

const safeText = (val: any, fallback: string = ''): string => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val.trim() || fallback;
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : fallback;
  if (typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) {
    const joined = val.map((v) => safeText(v)).filter(Boolean).join(', ');
    return joined || fallback;
  }
  if (typeof val === 'object') {
    const head = firstString(val, HEAD_KEYS);
    const body = firstString(val, BODY_KEYS);
    if (head && body) return `${head}: ${body}`;
    if (body) return body;
    if (head) return head;
    const flat = Object.values(val)
      .filter((v) => typeof v === 'string' || typeof v === 'number')
      .join(' · ');
    if (flat) return flat;
    return fallback;
  }
  return fallback;
};

const safeList = (arr: any, fallback: string[] = []): string[] => {
  let items: any[] = [];
  if (Array.isArray(arr)) items = arr;
  else if (typeof arr === 'string' && arr.trim()) items = [arr];
  else if (arr && typeof arr === 'object') items = Object.values(arr);
  const cleaned = items.map((item) => safeText(item)).filter(Boolean);
  return cleaned.length > 0 ? cleaned : fallback;
};

const safeNum = (val: any, fallback: number = 0): number => {
  const n = typeof val === 'number' ? val : parseFloat(val);
  return Number.isFinite(n) ? n : fallback;
};

// Escape AI text before injecting into the printable HTML report
const esc = (val: any): string =>
  safeText(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Uniform accessors over camelCase / snake_case pose records
const poseNameOf = (p: any): string => safeText(p?.poseName ?? p?.pose_name, 'Yoga Pose');
const sanskritOf = (p: any): string => safeText(p?.sanskritName ?? p?.sanskrit_name);
const totalHoldOf = (p: any): number => safeNum(p?.durationSeconds ?? p?.duration_seconds, 0);
const bestHoldOf = (p: any): number =>
  safeNum(p?.bestHoldSeconds ?? p?.best_hold_seconds, 0) || totalHoldOf(p);
const accuracyOf = (p: any): number => Math.round(safeNum(p?.accuracyScore ?? p?.accuracy_score, 0));

interface PoseImprovementView {
  poseName: string;
  currentStatus: string;
  tips: string[];
  safetyCue: string;
  bestHold: number;
  accuracy: number;
  targetHold: number;
}

interface NutritionView {
  immediatePostWorkout: string[];
  dailyStaminaFoods: string[];
  foodsToAvoid: string[];
  hydrationTip: string;
  dietSummary: string;
}

const DEFAULT_NUTRITION: NutritionView = {
  immediatePostWorkout: [
    'Tender coconut water or lemon water with a pinch of pink salt: replaces electrolytes lost through sweat.',
    'Sprouted moong salad, paneer, curd or a plant-protein smoothie (15-25 g protein): rebuilds worked muscle fibres.',
    'Banana or dates with a handful of soaked almonds: quick glycogen refill with magnesium for cramp prevention.',
  ],
  dailyStaminaFoods: [
    'Soaked almonds, walnuts, flax and sesame seeds: healthy fats and calcium for joint and bone support.',
    'Ragi, jowar or bajra millets: slow-release complex carbs for steady energy.',
    'Leafy greens (palak, moringa, methi): iron and magnesium for muscle recovery.',
    'Turmeric with black pepper in warm milk or water: natural anti-inflammatory support.',
  ],
  foodsToAvoid: [
    'Refined sugar and sugary drinks: energy spikes followed by a crash.',
    'Deep-fried and heavily processed foods within 2 hours of practice: heaviness and sluggishness.',
    'Large heavy meals right before practice: discomfort in twists, folds and inversions.',
  ],
  hydrationTip: 'Sip 400-500 ml of water over the 30 minutes after practice, and keep water intake steady through the day.',
  dietSummary: 'Favour light, whole, mostly plant-based meals: protein after practice, slow carbs for stamina, and plenty of water.',
};

interface SessionReportModalProps {
  session: PracticeSession;
  userProfile: UserProfile | null;
  onClose: () => void;
  onOpenAuth: () => void;
  onRestartPractice: () => void;
  onReturnToSession?: () => void;
  onExitToDashboard?: () => void;
  previousSession?: PracticeSession | null;
  isHistoryView?: boolean;
}

interface CooldownStretch {
  id: string;
  name: string;
  sanskritName: string;
  targetMuscles: string[];
  durationSeconds: number;
  instructions: string;
  benefit: string;
}

const ALL_COOLDOWN_STRETCHES: CooldownStretch[] = [
  {
    id: 'figure-four',
    name: 'Reclined Figure-Four Stretch',
    sanskritName: 'Supta Kapotasana Release',
    targetMuscles: ['Glutes', 'Hip Flexors', 'Piriformis'],
    durationSeconds: 30,
    instructions: 'Lie on your back, cross right ankle over left knee, and gently draw left thigh toward chest with deep belly breaths.',
    benefit: 'Relieves deep hip tension and decompresses the sacroiliac joint after standing balances.',
  },
  {
    id: 'spinal-twist',
    name: 'Seated Gentle Spinal Twist',
    sanskritName: 'Ardha Matsyendrasana Cooldown',
    targetMuscles: ['Spine', 'Erector Spinae', 'Obliques'],
    durationSeconds: 30,
    instructions: 'Sit tall, cross right foot over left thigh, place right hand behind you, and gently rotate gaze over right shoulder.',
    benefit: 'Neutralizes the vertebral column and resets spinal rotators after backbends and lateral stretches.',
  },
  {
    id: 'shoulder-thread',
    name: 'Thread-the-Needle Shoulder Release',
    sanskritName: 'Parsva Balasana',
    targetMuscles: ['Shoulders', 'Rhomboids', 'Upper Back'],
    durationSeconds: 30,
    instructions: 'From hands and knees, slide right arm under torso until shoulder rests gently on the mat. Breathe into upper back.',
    benefit: 'Releases deltoid and scapular tension developed during Downward Dog and Warrior holds.',
  },
  {
    id: 'forward-fold-recovery',
    name: 'Soft-Knee Ragdoll Forward Fold',
    sanskritName: 'Uttanasana Recovery',
    targetMuscles: ['Hamstrings', 'Lower Back', 'Calves'],
    durationSeconds: 30,
    instructions: 'Stand with feet hip-width, soften knees generously, hold opposite elbows, and let torso dangle freely with gravity.',
    benefit: 'Decompresses lumbar vertebrae and stretches posterior chain without strain.',
  },
  {
    id: 'sphinx-decompression',
    name: 'Sphinx Gentle Decompression',
    sanskritName: 'Salamba Bhujangasana Rest',
    targetMuscles: ['Abdominals', 'Pectorals', 'Spine'],
    durationSeconds: 40,
    instructions: 'Lie on stomach with forearms parallel on mat, elbows under shoulders. Gently draw chest forward without squeezing neck.',
    benefit: 'Restores natural lumbar lordosis and opens diaphragm for post-practice parasympathetic nervous reset.',
  },
  {
    id: 'quad-flexor-release',
    name: 'Side-Lying Quad & Psoas Release',
    sanskritName: 'Anantasana Variation',
    targetMuscles: ['Quadriceps', 'Hip Flexors', 'Knees'],
    durationSeconds: 30,
    instructions: 'Lie on left side, clasp right ankle, gently draw heel toward glutes while keeping pelvis tucked forward.',
    benefit: 'Alleviates posterior chain and hamstring tightness after Warrior III and Tree Pose holds.',
  },
];

export const SessionReportModal: React.FC<SessionReportModalProps> = ({
  session,
  userProfile,
  onClose,
  onOpenAuth,
  onRestartPractice,
  onReturnToSession,
  onExitToDashboard,
  previousSession: previousSessionProp,
  isHistoryView = false,
}) => {
  const exitingRef = useRef(false);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);

  // Focus trapping and Escape key management
  const containerRef = useModalFocusTrap({
    isOpen: !!session,
    onClose: isHistoryView ? onClose : () => setShowCloseConfirmation(true),
  });

  // Every way of leaving the report (X, footer, backdrop, Escape, Exit to Dashboard) funnels here
  const handleExit = useCallback(() => {
    if (isHistoryView) {
      onClose();
      return;
    }
    if (exitingRef.current) return;
    exitingRef.current = true;
    if (onExitToDashboard) onExitToDashboard();
    else onClose();
  }, [isHistoryView, onExitToDashboard, onClose]);

  // Real recorded poses only (no fabricated fallback data)
  const recordedPoses = useMemo(() => {
    const list = session.posesRecorded || (session as any).poses_recorded || [];
    return Array.isArray(list) ? list.filter(Boolean) : [];
  }, [session]);

  // Find previous session for comparison (from prop or localStorage)
  const priorSession = useMemo(() => {
    if (previousSessionProp) return previousSessionProp;
    const all = getStoredSessions();
    return all.find((s) => s.id !== session.id) || null;
  }, [previousSessionProp, session.id]);

  // Calculate live comparison stats between this session and prior session
  const comparisonMetrics = useMemo(() => {
    const currentScore = Math.round(safeNum(session.overallAccuracy ?? (session as any).overall_accuracy, 0));
    const prevRaw = priorSession ? (priorSession.overallAccuracy ?? (priorSession as any).overall_accuracy) : undefined;
    const prevScore = prevRaw !== undefined && prevRaw !== null && Number.isFinite(Number(prevRaw)) ? Math.round(Number(prevRaw)) : null;
    const scoreDiff = prevScore !== null ? currentScore - prevScore : null;

    const currentDuration = safeNum(session.totalDurationSeconds ?? (session as any).total_duration_seconds, 0);
    const prevDuration = priorSession ? (priorSession.totalDurationSeconds ?? (priorSession as any).total_duration_seconds ?? null) : null;
    const durationDiff = prevDuration !== null ? currentDuration - prevDuration : null;

    // Check for identical pose match between sessions
    let matchedPoseText = '';
    const prevPoses = priorSession ? (priorSession.posesRecorded || (priorSession as any).poses_recorded || []) : [];
    
    for (const cp of recordedPoses) {
      const cId = cp.poseId || cp.pose_id;
      const matched = Array.isArray(prevPoses) ? prevPoses.find((p: any) => (p?.poseId || p?.pose_id) === cId) : null;
      if (matched) {
        const cHold = totalHoldOf(cp);
        const pHold = totalHoldOf(matched);
        const cAcc = accuracyOf(cp);
        const pAcc = accuracyOf(matched);
        const hDiff = cHold - pHold;
        const aDiff = cAcc - pAcc;
        const pName = poseNameOf(cp);

        matchedPoseText = `In your previous session with ${pName}, you held for ${pHold}s with ${pAcc}% accuracy. Today you achieved ${cHold}s (${hDiff >= 0 ? '+' : ''}${hDiff}s) with ${cAcc}% accuracy (${aDiff >= 0 ? '+' : ''}${aDiff}%)!`;
        break;
      }
    }

    return {
      currentScore,
      prevScore,
      scoreDiff,
      currentDuration,
      prevDuration,
      durationDiff,
      matchedPoseText,
    };
  }, [session, priorSession, recordedPoses]);

  const savedReport = session.aiReport || (session as any).ai_report || null;

  // Baseline report built from the user's real telemetry; replaced as soon as the AI report arrives
  const baselineReport = useMemo(() => {
    const topPose = recordedPoses[0];
    return {
      overallScore: comparisonMetrics.currentScore,
      flexibilityIndex: comparisonMetrics.currentScore >= 90 ? 'Exceptional Steadiness' : comparisonMetrics.currentScore >= 75 ? 'Proficient Alignment' : 'Developing Form',
      coreStabilityScore: Math.max(0, Math.min(100, comparisonMetrics.currentScore - 3)),
      boostingMessage: recordedPoses.length > 0
        ? `Great work on the mat today! You practiced ${recordedPoses.map(poseNameOf).join(', ')}. Every focused hold builds deeper stability and body awareness.`
        : 'Every session on the mat counts. Hold a pose a little longer next time to unlock detailed telemetry.',
      comparisonWithPrevious: comparisonMetrics.matchedPoseText || (
        comparisonMetrics.prevScore !== null
          ? `Overall alignment moved from ${comparisonMetrics.prevScore}% to ${comparisonMetrics.currentScore}% (${comparisonMetrics.scoreDiff! >= 0 ? '+' : ''}${comparisonMetrics.scoreDiff}%).`
          : `Baseline session recorded at ${comparisonMetrics.currentScore}% accuracy. Future sessions will track your hold growth.`
      ),
      keyStrengths: recordedPoses.slice(0, 3).map((p: any) =>
        `${poseNameOf(p)}: best hold ${bestHoldOf(p)}s at ${accuracyOf(p)}% joint alignment.`
      ),
      priorityGrowthAreas: topPose
        ? recordedPoses.slice(0, 3).map((p: any) => `Refine alignment in ${poseNameOf(p)} and extend the hold beyond ${bestHoldOf(p)}s with steady breathing.`)
        : [],
      masterTeacherNote: 'Consistency creates mastery. The steadiness you cultivate in each hold carries into your posture and daily vitality.',
      recommendedNextPoses: [],
      aiProvider: 'Veda AI Biomechanics Engine',
    };
  }, [recordedPoses, comparisonMetrics]);

  const [aiReport, setAiReport] = useState<any>(savedReport || baselineReport);
  const [isLoadingReport, setIsLoadingReport] = useState(!savedReport);
  const [reportNotice, setReportNotice] = useState('');
  const reportRequestRef = useRef(0);

  const [copiedSummary, setCopiedSummary] = useState(false);

  // Generate (or regenerate) the AI report via the backend API
  const generateReport = useCallback(async () => {
    const requestId = ++reportRequestRef.current;
    setIsLoadingReport(true);
    setReportNotice('');
    try {
      const res = await apiGenerateSessionReport({
        sessionData: session,
        previousSessionData: priorSession,
      });
      if (requestId !== reportRequestRef.current) return;
      if (res?.success && res.data && typeof res.data === 'object') {
        setAiReport(res.data);
      } else {
        setReportNotice('FastAPI server down. Unable to fetch remote AI report.');
      }
    } catch (err) {
      console.warn('[SessionReportModal] report generation failed:', err);
      if (requestId === reportRequestRef.current) {
        setReportNotice('FastAPI server down. Unable to fetch remote AI report.');
      }
    } finally {
      if (requestId === reportRequestRef.current) setIsLoadingReport(false);
    }
  }, [session, priorSession]);

  // Fetch report on open (skip when the session already carries a saved report)
  useEffect(() => {
    if (!savedReport) {
      generateReport();
    }
    return () => {
      reportRequestRef.current++; // ignore late responses after unmount
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]);

  // Escape key: closes report directly if in history view, else triggers confirmation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (isHistoryView) {
        onClose();
      } else {
        setShowCloseConfirmation(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHistoryView, onClose]);

  // Normalized, always-renderable view of the AI report
  const view = useMemo(() => {
    const r = aiReport && typeof aiReport === 'object' ? aiReport : {};

    // Pose-by-pose improvements: AI-provided, else built from real telemetry + local pose knowledge
    const rawImprovements: any[] = Array.isArray(r.poseImprovements)
      ? r.poseImprovements
      : r.poseImprovements && typeof r.poseImprovements === 'object'
      ? Object.values(r.poseImprovements)
      : [];

    const telemetryFor = (name: string) =>
      recordedPoses.find((p: any) => poseNameOf(p).toLowerCase() === name.toLowerCase()) ||
      recordedPoses.find((p: any) => name.toLowerCase().includes(poseNameOf(p).toLowerCase()) || poseNameOf(p).toLowerCase().includes(name.toLowerCase()));

    const poseKnowledgeFor = (rec: any) =>
      ALL_POSES.find((pp) => pp.id === (rec?.poseId || rec?.pose_id)) ||
      ALL_POSES.find((pp) => pp.name.toLowerCase() === poseNameOf(rec).toLowerCase());

    let poseImprovements: PoseImprovementView[] = rawImprovements
      .filter((it) => it && (typeof it === 'object' || typeof it === 'string'))
      .map((it: any): PoseImprovementView => {
        const name = safeText(typeof it === 'string' ? it : it.poseName ?? it.pose ?? it.name, 'Yoga Pose');
        const rec = telemetryFor(name);
        const knowledge = rec ? poseKnowledgeFor(rec) : ALL_POSES.find((pp) => pp.name.toLowerCase() === name.toLowerCase());
        return {
          poseName: name,
          currentStatus: safeText(it?.currentStatus ?? it?.status, rec ? `Held ${bestHoldOf(rec)}s at ${accuracyOf(rec)}% alignment.` : ''),
          tips: safeList(it?.actionableTips ?? it?.tips ?? it?.improvements),
          safetyCue: safeText(it?.jointSafetyCue ?? it?.safetyCue ?? it?.safety),
          bestHold: rec ? bestHoldOf(rec) : 0,
          accuracy: rec ? accuracyOf(rec) : 0,
          targetHold: safeNum(knowledge?.idealHoldDurationSeconds ?? (knowledge as any)?.ideal_hold_duration_seconds, 0),
        };
      })
      .filter((it) => it.tips.length > 0 || it.currentStatus);

    if (poseImprovements.length === 0) {
      poseImprovements = recordedPoses.map((rec: any): PoseImprovementView => {
        const knowledge = poseKnowledgeFor(rec);
        const impacts: any[] = (knowledge?.wrongPostureImpacts || (knowledge as any)?.wrong_posture_impacts || []) as any[];
        const checkpoints: string[] = (knowledge?.keyAlignmentCheckpoints || (knowledge as any)?.key_alignment_checkpoints || []) as string[];
        const cues = safeList(rec?.cuesReceived ?? rec?.cues_received);
        const tips = [
          ...impacts.slice(0, 3).map((im) => `${safeText(im?.correction)} (avoids: ${safeText(im?.mistake).toLowerCase()})`),
          ...cues.slice(0, 1),
        ].filter((t) => t && !t.startsWith(' ('));
        return {
          poseName: poseNameOf(rec),
          currentStatus: `Best hold ${bestHoldOf(rec)}s (${totalHoldOf(rec)}s total) at ${accuracyOf(rec)}% alignment.`,
          tips: tips.length > 0 ? tips : checkpoints.slice(0, 3).map((c) => `Check: ${c}`),
          safetyCue: impacts[0] ? `${safeText(impacts[0].mistake)}: ${safeText(impacts[0].impact)}` : '',
          bestHold: bestHoldOf(rec),
          accuracy: accuracyOf(rec),
          targetHold: safeNum(knowledge?.idealHoldDurationSeconds ?? (knowledge as any)?.ideal_hold_duration_seconds, 0),
        };
      });
    }

    // Nutrition: AI-provided else the general sattvic guide
    const n = r.fitnessNutrition && typeof r.fitnessNutrition === 'object' ? r.fitnessNutrition : null;
    const nutrition: NutritionView = {
      immediatePostWorkout: safeList(n?.immediatePostWorkout, DEFAULT_NUTRITION.immediatePostWorkout),
      dailyStaminaFoods: safeList(n?.dailyStaminaFoods, DEFAULT_NUTRITION.dailyStaminaFoods),
      foodsToAvoid: safeList(n?.foodsToAvoid, DEFAULT_NUTRITION.foodsToAvoid),
      hydrationTip: safeText(n?.hydrationTip, DEFAULT_NUTRITION.hydrationTip),
      dietSummary: safeText(n?.dietSummary, DEFAULT_NUTRITION.dietSummary),
    };

    return {
      overallScore: Math.round(safeNum(r.overallScore, comparisonMetrics.currentScore)),
      coreStabilityScore: Math.round(safeNum(r.coreStabilityScore, baselineReport.coreStabilityScore)),
      boostingMessage: safeText(r.boostingMessage, baselineReport.boostingMessage),
      comparison: safeText(r.comparisonWithPrevious, baselineReport.comparisonWithPrevious),
      masterNote: safeText(r.masterTeacherNote, baselineReport.masterTeacherNote),
      provider: safeText(r.aiProvider, 'Veda AI Biomechanics Engine'),
      strengths: safeList(r.keyStrengths, baselineReport.keyStrengths),
      growthAreas: safeList(r.priorityGrowthAreas, baselineReport.priorityGrowthAreas),
      nextPoses: safeList(r.recommendedNextPoses),
      poseImprovements,
      nutrition,
      hasAiNutrition: Boolean(n),
    };
  }, [aiReport, recordedPoses, comparisonMetrics, baselineReport]);

  const safeStrengths = view.strengths;
  const safeGrowthAreas = view.growthAreas;
  const safeRecommendedPoses = view.nextPoses;

  // Dynamically calculate 3 custom recovery stretches based on muscles engaged in the session
  const suggestedStretches = useMemo(() => {
    const practicedPoseIds = new Set(recordedPoses.map((p: any) => p.poseId || p.pose_id));
    const engagedMuscles: string[] = [];

    ALL_POSES.forEach((pose) => {
      if (practicedPoseIds.has(pose.id)) {
        const mList = pose.targetMuscles || (pose as any).target_muscles || [];
        if (Array.isArray(mList)) {
          engagedMuscles.push(...mList);
        }
      }
    });

    const muscleText = engagedMuscles.join(' ').toLowerCase();

    const scored = ALL_COOLDOWN_STRETCHES.map((stretch) => {
      let score = 0;
      (stretch.targetMuscles || []).forEach((m) => {
        if (muscleText.includes(m.toLowerCase())) score += 2;
      });
      return { stretch, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).map((s) => s.stretch);
  }, [recordedPoses]);

  const formatSec = (sec: number) => {
    const total = Math.max(0, Math.round(safeNum(sec, 0)));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}m ${s}s`;
  };

  const overallAccuracy = view.overallScore;
  const coreScore = view.coreStabilityScore;
  const totalSeconds = Math.max(
    0,
    safeNum(session.totalDurationSeconds ?? (session as any).total_duration_seconds, 0) ||
      recordedPoses.reduce((acc: number, p: any) => acc + totalHoldOf(p), 0)
  );
  const caloriesBurned = Math.round(
    safeNum(session.caloriesBurnedEst ?? (session as any).calories_burned_est, 0) || (totalSeconds / 60) * 4.8
  );
  // Math.max on an empty list would be -Infinity, so always seed with 0
  const longestHold = Math.max(0, ...recordedPoses.map((p: any) => bestHoldOf(p)));

  // Generate plain text / markdown formatted session report
  const generateReportText = () => {
    const dateStr = new Date(session.startTime || (session as any).start_time || Date.now()).toLocaleString();
    const bullets = (list: string[]) => list.map((t, i) => `${i + 1}. ${t}`).join('\n');
    const dash = (list: string[]) => list.map((t) => `   - ${t}`).join('\n');
    return `=====================================================
ASANA - SENSE YOGA BIOMECHANICS MASTER REPORT
=====================================================
Certified Date: ${dateStr}
User: ${userProfile ? userProfile.name : 'Yoga Practitioner'}
Target Email: ${userProfile?.email || 'N/A'}
AI Intelligence Engine: ${view.provider}

--- CORE PERFORMANCE METRICS ---
• Overall Biomechanical Alignment: ${overallAccuracy}%
• Core Stability & Steadiness: ${coreScore}/100
• Total Active Hold Duration: ${formatSec(totalSeconds)}
• Estimated Calories Burned: ${caloriesBurned} kcal

--- AI BOOSTING MESSAGE ---
"${view.boostingMessage}"

--- COMPARISON WITH PREVIOUS SESSION ---
${view.comparison}

--- WHERE YOU IMPROVED MOST ---
${bullets(safeStrengths) || 'No pose holds recorded.'}

--- PRIORITY AREAS NEEDING IMPROVEMENT (GROWTH TARGETS) ---
${bullets(safeGrowthAreas) || 'No growth targets yet.'}

--- POSES PRACTICED BREAKDOWN ---
${recordedPoses.map((p: any, i: number) => `${i + 1}. ${poseNameOf(p)} (${sanskritOf(p)}) - Best Hold: ${bestHoldOf(p)}s | Accuracy: ${accuracyOf(p)}%`).join('\n') || 'No poses recorded.'}

--- HOW TO IMPROVE YOUR POSES ---
${view.poseImprovements.map((pi) => `${pi.poseName}: ${pi.currentStatus}\n${dash(pi.tips)}${pi.safetyCue ? `\n   ! Joint safety: ${pi.safetyCue}` : ''}`).join('\n\n') || 'Practice a pose to receive tailored cues.'}

--- FITNESS & YOGIC NUTRITION ---
Right after practice:
${dash(view.nutrition.immediatePostWorkout)}
Daily stamina foods:
${dash(view.nutrition.dailyStaminaFoods)}
Foods to avoid:
${dash(view.nutrition.foodsToAvoid)}
Hydration: ${view.nutrition.hydrationTip}
Summary: ${view.nutrition.dietSummary}

--- MASTER YOGA COACH SYNTHESIS ---
"${view.masterNote}"
${safeRecommendedPoses.length > 0 ? `\n--- RECOMMENDED NEXT ASANAS ---\n${safeRecommendedPoses.join(', ')}\n` : ''}
=====================================================
Generated securely by ASANA - SENSE AI Vision Studio
=====================================================`;
  };

  // Direct PDF Download Handler
  const handleDownloadPDF = () => {
    const dateStr = new Date(session.startTime || (session as any).start_time || Date.now()).toLocaleString();
    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>ASANA-SENSE Yoga Biomechanics Report - ${esc(userProfile ? userProfile.name : 'Practitioner')}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1c1917; padding: 36px; line-height: 1.6; background-color: #ffffff; }
            .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 18px; margin-bottom: 24px; }
            .title { font-size: 26px; font-weight: 800; color: #065f46; margin: 0; letter-spacing: 1px; }
            .subtitle { font-size: 14px; color: #059669; font-weight: 600; margin-top: 4px; }
            .meta { font-size: 12px; color: #57534e; margin-top: 8px; }
            .boosting-box { background: linear-gradient(135deg, #ecfdf5, #f0fdf4); border: 2px solid #34d399; padding: 18px; border-radius: 12px; margin-bottom: 22px; color: #064e3b; font-size: 14px; font-weight: 600; }
            .section-title { font-size: 16px; font-weight: 700; color: #065f46; border-left: 4px solid #059669; padding-left: 10px; margin-top: 24px; margin-bottom: 12px; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
            .card { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 10px; text-align: center; }
            .stat-value { font-size: 22px; font-weight: 800; color: #047857; }
            .stat-label { font-size: 11px; color: #065f46; font-weight: 600; margin-top: 2px; }
            ul { padding-left: 20px; margin: 0; }
            li { margin-bottom: 8px; font-size: 13px; color: #292524; }
            .synthesis-box { background: #fafaf9; border: 1px solid #e7e5e4; padding: 14px; border-radius: 10px; font-style: italic; font-size: 13px; }
            .pose-card { border: 1px solid #e7e5e4; border-radius: 10px; padding: 10px 14px; margin-bottom: 10px; page-break-inside: avoid; }
            .muted { color: #57534e; font-size: 12px; }
            .safety { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 6px 10px; font-size: 12px; color: #92400e; margin-top: 6px; }
            .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #e7e5e4; text-align: center; font-size: 11px; color: #78716c; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">ASANA - SENSE</h1>
            <div class="subtitle">Yoga Biomechanics Master Progress Report (Veda AI Engine)</div>
            <div class="meta">
              Date: <strong>${dateStr}</strong> | Yogi: <strong>${esc(userProfile ? userProfile.name : 'Practitioner')}</strong> | Vault ID: <strong>${((userProfile as any)?.encryptionKeyHash || userProfile?.id || 'VAULT-SECURE').slice(0, 10)}</strong>
            </div>
          </div>

          <div class="boosting-box">
            🚀 <strong>Master Coach Boosting Message:</strong><br/>
            "${esc(view.boostingMessage)}"
            <div style="margin-top: 8px; font-size: 12px; color: #047857; font-weight: normal;">
              <strong>Session Progress Comparison:</strong> ${esc(view.comparison)}
            </div>
          </div>

          <div class="section-title">Core Performance Metrics</div>
          <div class="grid">
            <div class="card">
              <div class="stat-value">${overallAccuracy}%</div>
              <div class="stat-label">Alignment Accuracy</div>
            </div>
            <div class="card">
              <div class="stat-value">${coreScore}/100</div>
              <div class="stat-label">Core Steadiness</div>
            </div>
            <div class="card">
              <div class="stat-value">${formatSec(totalSeconds)}</div>
              <div class="stat-label">Hold Duration</div>
            </div>
            <div class="card">
              <div class="stat-value">${caloriesBurned} kcal</div>
              <div class="stat-label">Calories Burned</div>
            </div>
          </div>

          <div class="section-title">Poses Practiced Breakdown</div>
          <ul>
            ${recordedPoses.map((p: any) => `<li><strong>${esc(poseNameOf(p))}</strong> (${esc(sanskritOf(p))}) — Best Hold: ${bestHoldOf(p)}s | Alignment Score: ${accuracyOf(p)}%</li>`).join('') || '<li>No pose holds were recorded.</li>'}
          </ul>

          <div class="section-title">Key Postural Strengths Observed</div>
          <ul>
            ${safeStrengths.map((s) => `<li><strong>✓</strong> ${esc(s)}</li>`).join('')}
          </ul>

          <div class="section-title">Priority Areas To Improve (Next Session)</div>
          <ul>
            ${safeGrowthAreas.map((a) => `<li><strong>💡</strong> ${esc(a)}</li>`).join('')}
          </ul>

          <div class="section-title">How To Improve Your Poses</div>
          ${view.poseImprovements.map((pi) => `
            <div class="pose-card">
              <strong>${esc(pi.poseName)}</strong> <span class="muted">${esc(pi.currentStatus)}</span>
              <ul>${pi.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
              ${pi.safetyCue ? `<div class="safety">⚠ Joint safety: ${esc(pi.safetyCue)}</div>` : ''}
            </div>`).join('') || '<p class="muted">Practice a pose to receive tailored cues.</p>'}

          <div class="section-title">Fitness &amp; Yogic Nutrition</div>
          <strong>Right after practice</strong>
          <ul>${view.nutrition.immediatePostWorkout.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          <strong>Daily stamina foods</strong>
          <ul>${view.nutrition.dailyStaminaFoods.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          <strong>Foods to avoid</strong>
          <ul>${view.nutrition.foodsToAvoid.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          <p><strong>Hydration:</strong> ${esc(view.nutrition.hydrationTip)}</p>
          <p class="muted">${esc(view.nutrition.dietSummary)}</p>

          <div class="section-title">Master Teacher Guidance</div>
          <div class="synthesis-box">
            "${esc(view.masterNote)}"
          </div>

          <div class="footer">
            Generated securely by ASANA - SENSE AI Vision Studio. PDF Certified Document.
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportHTML);
      printWindow.document.close();
    } else {
      // Fallback if popup blocker intercepted print window
      handleCopySummary();
    }
  };

  // Copy Summary to Clipboard
  const handleCopySummary = () => {
    navigator.clipboard.writeText(generateReportText());
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Automated SMTP Backend Email Dispatcher
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [emailStatusMsg, setEmailStatusMsg] = useState<string>('');

  const handleSendBackendEmail = async () => {
    if (recordedPoses.length === 0) {
      setEmailStatus('error');
      setEmailStatusMsg('No poses were recorded in this session. Email cannot be sent.');
      setTimeout(() => setEmailStatus('idle'), 5000);
      return;
    }

    const targetEmail = userProfile?.email;
    if (!targetEmail) {
      setEmailStatus('error');
      setEmailStatusMsg('Please sign in or update your profile email to receive reports.');
      setTimeout(() => setEmailStatus('idle'), 4000);
      return;
    }

    setEmailStatus('sending');
    setEmailStatusMsg('');
    try {
      const res = await apiSendSessionEmail({
        sessionData: session,
        aiReport: aiReport,
        to_email: targetEmail,
      });

      if (res?.success) {
        setEmailStatus('sent');
        setEmailStatusMsg(`Report emailed to ${targetEmail}`);
        setTimeout(() => setEmailStatus('idle'), 5000);
      } else {
        setEmailStatus('error');
        setEmailStatusMsg(res?.message || 'FastAPI backend mail service error.');
        setTimeout(() => setEmailStatus('idle'), 5000);
      }
    } catch (err: any) {
      console.warn('[SessionReportModal] Mail dispatch failed:', err);
      setEmailStatus('error');
      setEmailStatusMsg(err?.message || 'Unable to connect to email service.');
      setTimeout(() => setEmailStatus('idle'), 5000);
    }
  };

  const providerBadge = view.provider || 'Veda AI Biomechanics Engine';

  return (
    <div 
      id="session-report-modal" 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          if (isHistoryView) {
            onClose();
          } else {
            setShowCloseConfirmation(true);
          }
        }
      }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-stone-950/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-report-title"
    >
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        tabIndex={-1}
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col p-5 sm:p-7 shadow-2xl border border-stone-200 relative overflow-hidden focus:outline-hidden"
      >
        {/* Sticky Header with Title, Email Status & Close Button */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs" aria-hidden="true">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                  Practice Certified
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                  {providerBadge}
                </span>
              </div>
              <h2 id="session-report-title" className="text-xl sm:text-2xl font-serif font-bold text-stone-900 leading-tight">
                Yoga Biomechanics Master Report
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (isHistoryView) {
                onClose();
              } else {
                setShowCloseConfirmation(true);
              }
            }}
            aria-label="Close Report"
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 transition flex items-center justify-center cursor-pointer shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-5 scrollbar-thin scrollbar-thumb-stone-200">
          
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 text-center">
              <span className="text-[11px] text-stone-500 block">Overall Alignment</span>
              <span className="text-2xl font-bold text-emerald-700">{overallAccuracy}%</span>
              <span className="text-[9px] text-stone-400 block">AI Vision Accuracy</span>
            </div>

            <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 text-center">
              <span className="text-[11px] text-stone-500 block">Practice Time</span>
              <span className="text-2xl font-bold text-stone-900">{formatSec(totalSeconds)}</span>
              <span className="text-[9px] text-stone-400 block">Active Holds</span>
            </div>

            <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 text-center">
              <span className="text-[11px] text-stone-500 block">Core Stability</span>
              <span className="text-2xl font-bold text-teal-700">{coreScore}/100</span>
              <span className="text-[9px] text-stone-400 block">Neuromuscular</span>
            </div>

            <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-100 text-center">
              <span className="text-[11px] text-emerald-700 block">Calories Burned</span>
              <span className="text-2xl font-bold text-emerald-900">{caloriesBurned} kcal</span>
              <span className="text-[9px] text-emerald-600 block">Metabolic Estimate</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* VEDA AI BOOSTING MESSAGE & HUMAN PROGRESS COMPARISON CARD                 */}
          {/* ========================================================================= */}
          <div className="bg-gradient-to-br from-emerald-900 via-teal-950 to-stone-950 rounded-2xl p-4 sm:p-5 text-white border border-emerald-500/40 shadow-lg space-y-3.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/25 text-emerald-300 flex items-center justify-center border border-emerald-400/40">
                  <Sparkles className="w-4 h-4 text-emerald-300 animate-spin" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide text-white">
                    Veda AI Personalized Coaching & Progress
                  </h3>
                  <p className="text-[11px] text-emerald-300">
                    Human-understandable posture evaluation & encouragement
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 flex items-center gap-1">
                  🚀 {comparisonMetrics.scoreDiff !== null ? `${comparisonMetrics.scoreDiff >= 0 ? `+${comparisonMetrics.scoreDiff}%` : `${comparisonMetrics.scoreDiff}%`} Alignment` : 'Baseline Established'}
                </span>
                <button
                  id="regenerate-ai-report-btn"
                  type="button"
                  disabled={isLoadingReport}
                  onClick={() => generateReport()}
                  className="px-2.5 py-1 rounded-full bg-stone-900/70 hover:bg-stone-800 disabled:opacity-60 text-emerald-200 text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1 cursor-pointer transition"
                  title="Regenerate this report with the latest AI engine"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingReport ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
              </div>
            </div>

            {isLoadingReport && (
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-[11px] text-emerald-200 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-300 shrink-0" />
                <span>Veda AI is analysing your real pose telemetry...</span>
              </div>
            )}
            {!isLoadingReport && reportNotice && (
              <div className="p-2.5 rounded-xl bg-amber-950/50 border border-amber-500/30 text-[11px] text-amber-200 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>{reportNotice}</span>
              </div>
            )}

            {/* Boosting Message Box */}
            <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/30 text-emerald-50 text-xs sm:text-sm leading-relaxed font-sans">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                💬 Master Coach Boosting Message:
              </span>
              "{view.boostingMessage}"
            </div>

            {/* Session-over-Session Comparison */}
            <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 text-xs text-stone-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 block mb-1">
                📊 Session Comparison & Growth:
              </span>
              <p className="leading-relaxed">
                {view.comparison}
              </p>
            </div>

            {/* Comparison Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-stone-900/90 p-2.5 rounded-xl border border-stone-800">
                <span className="text-[10px] text-stone-400 block">Posture Efficiency</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-lg font-bold text-emerald-400">{overallAccuracy}%</span>
                  <span className="text-[10px] text-emerald-300 font-semibold">
                    {comparisonMetrics.scoreDiff !== null ? (comparisonMetrics.scoreDiff >= 0 ? `+${comparisonMetrics.scoreDiff}%` : `${comparisonMetrics.scoreDiff}%`) : 'Baseline'}
                  </span>
                </div>
                <span className="text-[9px] text-stone-500 block">
                  {comparisonMetrics.prevScore !== null ? `vs ${comparisonMetrics.prevScore}% last session` : 'First practice session'}
                </span>
              </div>

              <div className="bg-stone-900/90 p-2.5 rounded-xl border border-stone-800">
                <span className="text-[10px] text-stone-400 block">Core Steadiness</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-lg font-bold text-teal-300">{coreScore}/100</span>
                  <span className="text-[10px] text-teal-300 font-semibold">Solid</span>
                </div>
                <span className="text-[9px] text-stone-500 block">Neuromuscular stability</span>
              </div>

              <div className="bg-stone-900/90 p-2.5 rounded-xl border border-stone-800">
                <span className="text-[10px] text-stone-400 block">Longest Continuous Hold</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-lg font-bold text-emerald-400">
                    {longestHold}s
                  </span>
                  <span className="text-[10px] text-emerald-300 font-semibold">Streak</span>
                </div>
                <span className="text-[9px] text-stone-500 block">Balance stamina</span>
              </div>

              <div className="bg-stone-900/90 p-2.5 rounded-xl border border-stone-800">
                <span className="text-[10px] text-stone-400 block">Practice Volume</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-lg font-bold text-amber-300">{formatSec(totalSeconds)}</span>
                  <span className="text-[10px] text-amber-300 font-semibold">Today</span>
                </div>
                <span className="text-[9px] text-stone-500 block">Active mat time</span>
              </div>
            </div>

            {/* Dynamic Real Strengths vs Real Growth Targets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Where User Improved Most */}
              <div className="bg-emerald-950/60 p-3 rounded-xl border border-emerald-500/30">
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  What You Did Great (Key Strengths)
                </h4>
                <ul className="text-xs text-stone-200 space-y-1.5">
                  {safeStrengths.length === 0 && (
                    <li className="text-stone-400">Hold a pose steadily to unlock personalised strengths.</li>
                  )}
                  {safeStrengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">{idx + 1}.</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* How To Improve Next Time (Human Language) */}
              <div className="bg-amber-950/40 p-3 rounded-xl border border-amber-500/30">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  How To Improve For Next Time
                </h4>
                <ul className="text-xs text-stone-200 space-y-1.5">
                  {safeGrowthAreas.length === 0 && (
                    <li className="text-stone-400">Growth targets appear once a pose hold is recorded.</li>
                  )}
                  {safeGrowthAreas.map((area, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-400 font-bold">{idx + 1}.</span>
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* HOW TO IMPROVE YOUR POSES (pose-by-pose, real telemetry)                  */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">How to Improve Your Poses</h3>
                <p className="text-[11px] text-stone-500">Specific cues for each pose you practiced today</p>
              </div>
            </div>

            {view.poseImprovements.length === 0 ? (
              <p className="text-xs text-stone-500 bg-stone-50 border border-stone-100 rounded-xl p-3">
                No pose holds were recorded in this session. Start a pose and hold it to receive tailored alignment cues.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {view.poseImprovements.map((pi, idx) => (
                  <div key={`${pi.poseName}-${idx}`} className="rounded-xl border border-stone-200 bg-stone-50/60 p-3 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-stone-900 leading-snug">{pi.poseName}</h4>
                      {pi.accuracy > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold shrink-0">
                          {pi.accuracy}%
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
                      {pi.bestHold > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800">
                          Best hold {pi.bestHold}s
                        </span>
                      )}
                      {pi.targetHold > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-800">
                          Goal {pi.targetHold}s
                        </span>
                      )}
                    </div>

                    {pi.currentStatus && <p className="text-[11px] text-stone-600 leading-relaxed">{pi.currentStatus}</p>}

                    {pi.tips.length > 0 && (
                      <ul className="space-y-1.5">
                        {pi.tips.map((tip, ti) => (
                          <li key={ti} className="flex items-start gap-1.5 text-[11px] text-stone-700 leading-relaxed">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {pi.safetyCue && (
                      <div className="mt-auto p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span><strong>Joint safety:</strong> {pi.safetyCue}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* FITNESS & YOGIC NUTRITION FUELING GUIDE                                   */}
          {/* ========================================================================= */}
          <div className="bg-gradient-to-br from-lime-50 via-emerald-50/70 to-stone-50 rounded-2xl p-4 border border-emerald-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Salad className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950">Fitness &amp; Yogic Nutrition</h3>
                  <p className="text-[11px] text-emerald-800">Fuel your recovery, stamina and flexibility</p>
                </div>
              </div>
              {!view.hasAiNutrition && (
                <span className="px-2 py-0.5 rounded-full bg-white text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                  General guide
                </span>
              )}
            </div>

            {view.nutrition.dietSummary && (
              <p className="text-xs text-emerald-950 leading-relaxed bg-white/70 border border-emerald-100 rounded-xl p-3">
                {view.nutrition.dietSummary}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div className="bg-white rounded-xl p-3 border border-emerald-100">
                <h4 className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <Apple className="w-3.5 h-3.5" /> Right After Practice
                </h4>
                <ul className="space-y-1.5 text-[11px] text-stone-700 leading-relaxed">
                  {view.nutrition.immediatePostWorkout.map((t, i) => (
                    <li key={i} className="flex items-start gap-1.5"><span className="text-emerald-600 font-bold">•</span><span>{t}</span></li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-xl p-3 border border-emerald-100">
                <h4 className="text-[11px] font-bold text-teal-800 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5" /> Daily Stamina Foods
                </h4>
                <ul className="space-y-1.5 text-[11px] text-stone-700 leading-relaxed">
                  {view.nutrition.dailyStaminaFoods.map((t, i) => (
                    <li key={i} className="flex items-start gap-1.5"><span className="text-teal-600 font-bold">•</span><span>{t}</span></li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-xl p-3 border border-rose-100">
                <h4 className="text-[11px] font-bold text-rose-800 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <Ban className="w-3.5 h-3.5" /> Foods To Avoid
                </h4>
                <ul className="space-y-1.5 text-[11px] text-stone-700 leading-relaxed">
                  {view.nutrition.foodsToAvoid.map((t, i) => (
                    <li key={i} className="flex items-start gap-1.5"><span className="text-rose-500 font-bold">•</span><span>{t}</span></li>
                  ))}
                </ul>
              </div>
            </div>

            {view.nutrition.hydrationTip && (
              <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-[11px] text-sky-900 flex items-start gap-2">
                <Droplets className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span><strong>Hydration:</strong> {view.nutrition.hydrationTip}</span>
              </div>
            )}
          </div>



          {/* ========================================================================= */}
          {/* DYNAMIC POST-SESSION STRETCHES SECTION (Suggested Stretches)              */}
          {/* ========================================================================= */}
          <div className="bg-gradient-to-br from-teal-50/80 via-emerald-50/50 to-stone-50 rounded-2xl p-4 border border-teal-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-teal-950">
                    3 Quick Post-Session Recovery Stretches
                  </h3>
                  <p className="text-[11px] text-teal-800">
                    Tailored cooldown based on the specific muscle groups engaged in your completed routine
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                ~2 Mins Cooldown
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {suggestedStretches.map((stretch, idx) => (
                <div 
                  key={stretch.id} 
                  className="bg-white rounded-xl p-3 border border-teal-100 shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono">
                        ⏱️ {stretch.durationSeconds}s
                      </span>
                    </div>
                    <h4 className="font-bold text-stone-900 text-xs leading-snug">{stretch.name}</h4>
                    <p className="text-[10px] text-stone-400 font-serif italic mb-1.5">{stretch.sanskritName}</p>
                    <p className="text-[11px] text-stone-600 leading-relaxed mb-2">
                      {stretch.instructions}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-stone-100">
                    <span className="text-[9px] font-bold text-teal-700 uppercase block mb-1">Target Muscles:</span>
                    <div className="flex flex-wrap gap-1">
                      {stretch.targetMuscles.map((m) => (
                        <span key={m} className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 text-[9px] font-medium">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Poses Practiced Timing Breakdown (Real Telemetry) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2.5 flex items-center gap-1.5">
              <Timer className="w-4 h-4 text-emerald-600" />
              Pose Hold & Streak Telemetry (Your Real Data)
            </h3>
            <div className="space-y-1.5">
              {recordedPoses.length === 0 && (
                <p className="text-xs text-stone-500 bg-stone-50 border border-stone-100 rounded-xl p-3">
                  No pose holds were recorded in this session. Hold a pose steadily to see real telemetry here.
                </p>
              )}
              {recordedPoses.map((pose: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-xs flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-stone-900">{poseNameOf(pose)}</span>
                      <span className="text-stone-400 font-serif italic ml-1.5">
                        {sanskritOf(pose) ? `(${sanskritOf(pose)})` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-mono text-[11px] font-bold">
                      🏆 Best Hold: {bestHoldOf(pose)}s
                    </span>
                    <span className="text-stone-600 font-mono text-[11px]">
                      Total: {totalHoldOf(pose)}s
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                      {accuracyOf(pose)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Master Yoga Coach Insights */}
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-emerald-900 text-white">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                Veda AI Master Coach Synthesis
              </span>
              <p className="text-xs text-emerald-50 leading-relaxed font-serif italic">
                "{view.masterNote}"
              </p>
            </div>

            {safeRecommendedPoses.length > 0 && (
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block mb-1.5">Recommended Next Asanas</span>
                <div className="flex flex-wrap gap-1.5">
                  {safeRecommendedPoses.map((name, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full bg-white border border-stone-200 text-[11px] font-medium text-stone-700">{name}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Account Encrypted Status Banner (Safe from undefined crashes) */}
          {userProfile ? (
            <div className="p-3 rounded-2xl bg-stone-100 border border-stone-200/80 flex items-center justify-between text-xs text-stone-700">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>
                  Report saved & encrypted to <strong>{userProfile.name}</strong>'s private profile.
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                {((userProfile as any)?.encryptionKeyHash || userProfile?.id || 'VAULT-SECURE').slice(0, 10)}...
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-indigo-950">
              <div className="flex items-start gap-2">
                <UserCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Save this session & unlock badge tracking</span>
                  <span className="text-indigo-800 text-[11px]">
                    Create a free account to permanently save this report to your private cloud vault.
                  </span>
                </div>
              </div>
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shrink-0 cursor-pointer shadow-xs"
              >
                Sign Up / Sign In
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions (Download PDF Report / Send Email / Copy / Restart / Exit) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="download-pdf-report-btn"
              onClick={handleDownloadPDF}
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Download Certified PDF Report"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-300" />
              Download PDF Report
            </button>

            <button
              id="send-email-report-btn"
              type="button"
              disabled={emailStatus === 'sending'}
              onClick={handleSendBackendEmail}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                emailStatus === 'sent'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : emailStatus === 'error'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}
              title={userProfile?.email ? `Send report to ${userProfile.email}` : 'Send to your email'}
            >
              {emailStatus === 'sending' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              ) : emailStatus === 'sent' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Mail className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>
                {emailStatus === 'sending'
                  ? 'Sending Mail...'
                  : emailStatus === 'sent'
                  ? 'Email Sent!'
                  : emailStatus === 'error'
                  ? 'Retry Email'
                  : 'Email Report'}
              </span>
            </button>

            <button
              onClick={handleCopySummary}
              className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSummary ? 'Copied Text' : 'Copy Text'}
            </button>

            {emailStatusMsg && (
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                emailStatus === 'sent' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {emailStatusMsg}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="practice-again-btn"
              type="button"
              onClick={onRestartPractice}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs transition cursor-pointer"
            >
              Practice Again
            </button>
            {isHistoryView ? (
              <button
                id="close-report-modal-btn"
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition cursor-pointer"
              >
                Close Report
              </button>
            ) : (
              <>
                <button
                  id="close-report-modal-btn"
                  type="button"
                  onClick={() => setShowCloseConfirmation(true)}
                  className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold text-xs transition cursor-pointer"
                >
                  Close Report
                </button>
                <button
                  id="exit-to-dashboard-btn"
                  type="button"
                  onClick={handleExit}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition cursor-pointer"
                >
                  Exit to Dashboard
                </button>
              </>
            )}
          </div>
        </div>

        {/* Exit / Return Confirmation Dialog Overlay (Only when finishing an active live session) */}
        <AnimatePresence>
          {!isHistoryView && showCloseConfirmation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200 text-center space-y-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <Award className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-serif font-bold text-stone-900">
                    Close Posture Report?
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Would you like to return to your active yoga session, or exit to the main dashboard?
                  </p>
                </div>

                {/* The 2 Choice Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    id="return-to-session-btn"
                    type="button"
                    onClick={() => {
                      setShowCloseConfirmation(false);
                      if (onReturnToSession) {
                        onReturnToSession();
                      } else {
                        onClose();
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition cursor-pointer shadow-md shadow-emerald-900/15"
                  >
                    Return to Session
                  </button>
                  <button
                    id="exit-to-dashboard-btn"
                    type="button"
                    onClick={() => {
                      setShowCloseConfirmation(false);
                      if (onExitToDashboard) {
                        onExitToDashboard();
                      } else {
                        onClose();
                        onRestartPractice();
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition cursor-pointer"
                  >
                    Exit to Dashboard
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};