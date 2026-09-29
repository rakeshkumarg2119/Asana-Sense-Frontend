/**
 * MediaPipe WASM Pose Landmarker hook.
 * - Loads @mediapipe/tasks-vision PoseLandmarker in browser
 * - Runs on each video frame, extracts 33 landmarks
 * - Sends landmarks over WebSocket to FastAPI backend
 * - Receives per-joint correctness and draws green/yellow skeleton
 * - Provides voice feedback for corrections
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { RefObject } from 'react';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { createPoseWebSocket, sendLandmarks } from '../utils/apiClient';
import { soundEngine } from '../utils/audioFeedback';
import type { PoseDetectionResult, JointStatus } from '../types';

// Standard 33 MediaPipe pose joint connections
const POSE_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10], [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
  [17, 19], [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  [11, 23], [12, 24], [23, 24], [23, 25], [24, 26], [25, 27], [26, 28],
  [27, 29], [28, 30], [29, 31], [30, 32], [27, 31], [28, 32]
];

// Key joints we care about for color feedback (indices from backend)
const KEY_JOINT_SET = new Set([11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32]);

interface UsePoseLandmarkerOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  targetPose: string | null; // model class name e.g. 'tree', 'warrior'
  isActive: boolean; // only process when active
  voiceEnabled: boolean;
  onPoseResult?: (result: PoseDetectionResult) => void;
}

export function usePoseLandmarker({
  videoRef,
  canvasRef,
  targetPose,
  isActive,
  voiceEnabled,
  onPoseResult,
}: UsePoseLandmarkerOptions) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestResult, setLatestResult] = useState<PoseDetectionResult | null>(null);

  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastSendTimeRef = useRef<number>(0);
  const lastCorrectionTimeRef = useRef<number>(0);
  const lastSpokenCorrectionRef = useRef<string>('');
  const isActiveRef = useRef(isActive);
  const targetPoseRef = useRef(targetPose);
  const voiceEnabledRef = useRef(voiceEnabled);

  // Keep refs in sync
  isActiveRef.current = isActive;
  targetPoseRef.current = targetPose;
  voiceEnabledRef.current = voiceEnabled;

  // ── Initialize MediaPipe PoseLandmarker ────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function initLandmarker() {
      try {
        setIsLoading(true);
        setError(null);

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        if (!cancelled) {
          landmarkerRef.current = landmarker;
          setIsLoading(false);
          console.log('[MediaPipe] PoseLandmarker loaded successfully');
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error('[MediaPipe] Failed to load:', e);
          setError(e.message || 'Failed to load pose detection model');
          setIsLoading(false);
        }
      }
    }

    initLandmarker();

    return () => {
      cancelled = true;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, []);

  // ── WebSocket Connection ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) {
      // Close WS when not active
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    function connect() {
      const ws = createPoseWebSocket(
        (data: any) => {
          if (data.type === 'pose_result') {
            const result = data as PoseDetectionResult;
            setLatestResult(result);
            onPoseResult?.(result);

            // Voice correction: only speak ONCE when a new wrong pose correction is issued!
            // Do NOT repeat continuously every 3 seconds while user is holding or adjusting form.
            if (
              voiceEnabledRef.current &&
              result.correction_message &&
              !result.is_correct &&
              result.predicted_pose !== 'no_pose'
            ) {
              if (lastSpokenCorrectionRef.current !== result.correction_message) {
                lastSpokenCorrectionRef.current = result.correction_message;
                soundEngine.speak(result.correction_message);
              }
            } else if (result.is_correct) {
              lastSpokenCorrectionRef.current = '';
            }
          }
        },
        () => {
          setIsConnected(false);
          // Auto-reconnect after 2 seconds
          setTimeout(() => {
            if (isActiveRef.current) connect();
          }, 2000);
        },
        () => {
          setIsConnected(false);
        }
      );

      ws.onopen = () => {
        setIsConnected(true);
        console.log('[WS] Connected to backend');
      };

      wsRef.current = ws;
    }

    connect();

    const handleBackendChange = () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      connect();
    };

    window.addEventListener('asana_backend_changed', handleBackendChange);

    return () => {
      window.removeEventListener('asana_backend_changed', handleBackendChange);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setIsConnected(false);
      }
    };
  }, [isActive]);

  // ── Frame Processing Loop ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive || isLoading) return;

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;

      if (!video || !canvas || !landmarker || video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // Match canvas to video dimensions
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      try {
        const now = performance.now();
        const result = landmarker.detectForVideo(video, now);

        if (result.landmarks && result.landmarks.length > 0) {
          const landmarks = result.landmarks[0];

          // Draw skeleton with joint colors from latest backend result
          drawSkeleton(ctx, landmarks, canvas.width, canvas.height, latestResult);

          // Send landmarks to backend via WebSocket (throttle to ~10 FPS)
          if (
            targetPoseRef.current &&
            wsRef.current?.readyState === WebSocket.OPEN &&
            now - lastSendTimeRef.current > 100
          ) {
            lastSendTimeRef.current = now;
            const lm2d = landmarks.map(l => [l.x, l.y]);
            sendLandmarks(wsRef.current, targetPoseRef.current, lm2d);
          }
        }
      } catch (e) {
        // Silently handle frame processing errors
      }

      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    animFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isActive, isLoading, latestResult]);

  return {
    isLoading,
    error,
    isConnected,
    latestResult,
  };
}


// ── Skeleton Drawing ─────────────────────────────────────────────────────────

interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number,
  poseResult: PoseDetectionResult | null,
) {
  // Build a map of joint index → status from the backend result
  const jointMap = new Map<number, JointStatus>();
  if (poseResult?.joints) {
    for (const j of poseResult.joints) {
      jointMap.set(j.index, j);
    }
  }

  const isAllCorrect = poseResult?.is_correct ?? false;

  // Visual cues: Green (correct), Yellow (warning / timer continues), Red (critical mistake / timer stops)
  const GREEN = 'rgba(34, 197, 94, 0.9)';        // correct
  const YELLOW = 'rgba(250, 204, 21, 0.9)';       // warning / minor misalignment
  const RED = 'rgba(239, 68, 68, 0.95)';          // critical mistake / severe misalignment
  const GREEN_LINE = 'rgba(34, 197, 94, 0.6)';
  const YELLOW_LINE = 'rgba(250, 204, 21, 0.65)';
  const RED_LINE = 'rgba(239, 68, 68, 0.8)';
  const DEFAULT_LINE = 'rgba(200, 200, 200, 0.4)';
  const DEFAULT_DOT = 'rgba(200, 200, 200, 0.6)';

  // Helper to categorize joint severity
  const getSeverity = (j?: JointStatus): 'correct' | 'warning' | 'critical' => {
    if (!j) return 'correct';
    if (j.status === 'critical' || (j.status as string) === 'red' || j.deviation >= 3.5) return 'critical';
    if (j.status === 'warning' || j.status === 'misaligned' || j.deviation >= 2.0) return 'warning';
    return 'correct';
  };

  // Draw connections first (underneath joints)
  for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
    if (startIdx >= landmarks.length || endIdx >= landmarks.length) continue;

    const startLm = landmarks[startIdx];
    const endLm = landmarks[endIdx];

    // Determine connection color based on both endpoints
    const startSev = getSeverity(jointMap.get(startIdx));
    const endSev = getSeverity(jointMap.get(endIdx));

    let lineColor = DEFAULT_LINE;
    if (poseResult) {
      if (startSev === 'critical' || endSev === 'critical') {
        lineColor = RED_LINE;
      } else if (startSev === 'warning' || endSev === 'warning') {
        lineColor = YELLOW_LINE;
      } else if (isAllCorrect || (startSev === 'correct' && endSev === 'correct')) {
        lineColor = GREEN_LINE;
      } else if (KEY_JOINT_SET.has(startIdx) || KEY_JOINT_SET.has(endIdx)) {
        lineColor = GREEN_LINE;
      }
    }

    const x1 = startLm.x * width;
    const y1 = startLm.y * height;
    const x2 = endLm.x * width;
    const y2 = endLm.y * height;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = (lineColor === RED_LINE) ? 4 : 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // Draw joints
  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];
    const px = lm.x * width;
    const py = lm.y * height;

    // Determine joint color
    let fillColor = DEFAULT_DOT;
    let radius = 4;
    let glowColor = '';

    if (poseResult) {
      const jStatus = jointMap.get(i);
      const sev = getSeverity(jStatus);

      if (isAllCorrect) {
        fillColor = GREEN;
        radius = KEY_JOINT_SET.has(i) ? 6 : 4;
      } else if (sev === 'critical') {
        fillColor = RED;
        radius = 8;
        glowColor = 'rgba(239, 68, 68, 0.4)';
      } else if (sev === 'warning') {
        fillColor = YELLOW;
        radius = 7;
        glowColor = 'rgba(250, 204, 21, 0.3)';
      } else if (KEY_JOINT_SET.has(i)) {
        fillColor = GREEN;
        radius = 5;
      }
    }

    // Draw glow for warning or critical joints
    if (glowColor) {
      ctx.beginPath();
      ctx.arc(px, py, radius + 4, 0, 2 * Math.PI);
      ctx.fillStyle = glowColor;
      ctx.fill();
    }

    // Draw joint circle
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, 2 * Math.PI);
    ctx.fillStyle = fillColor;
    ctx.fill();

    // White border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Draw correction label on canvas
  if (poseResult && !isAllCorrect && poseResult.correction_message && poseResult.predicted_pose !== 'no_pose') {
    const hasCritical = poseResult.has_red || Array.from(jointMap.values()).some(j => getSeverity(j) === 'critical');
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.roundRect(10, height - 50, Math.min(width - 20, 520), 38, 8);
    ctx.fill();
    ctx.fillStyle = hasCritical ? RED : YELLOW;
    ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${hasCritical ? '✕' : '⚠'} ${poseResult.correction_message}`, 18, height - 26);
    ctx.restore();
  }

  // Draw "ALL CORRECT" indicator
  if (poseResult && isAllCorrect) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.roundRect(10, height - 50, 220, 38, 8);
    ctx.fill();
    ctx.fillStyle = GREEN;
    ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('✓ Perfect Form — Hold Steady!', 18, height - 26);
    ctx.restore();
  }
}