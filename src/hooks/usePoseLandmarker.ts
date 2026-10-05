/**
 * MediaPipe WASM Pose Landmarker hook.
 * - Loads @mediapipe/tasks-vision PoseLandmarker in browser
 * - Runs on each video frame, extracts 33 landmarks
 * - Sends landmarks over WebSocket to FastAPI backend
 * - Receives per-joint correctness and draws skeleton
 * - Provides voice feedback for corrections
 */
import React, { useState, useEffect, useRef } from 'react';
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

interface UsePoseLandmarkerOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  targetPose: string | null; // model class name e.g. 'tree', 'triangle', 'shoulder_stand'
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
  const isWaitingForResponseRef = useRef<boolean>(false);
  const lastSpokenCorrectionRef = useRef<string>('');
  const isActiveRef = useRef(isActive);
  const targetPoseRef = useRef(targetPose);
  const voiceEnabledRef = useRef(voiceEnabled);
  const reconnectAttemptRef = useRef<number>(0);
  const reconnectTimerRef = useRef<any>(null);

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
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.3,
          minPosePresenceConfidence: 0.3,
          minTrackingConfidence: 0.3,
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

  // ── WebSocket Connection with Exponential Backoff ──────────────────────────
  useEffect(() => {
    if (!isActive) {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    function scheduleReconnect() {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      const delays = [1000, 2000, 4000, 8000, 10000];
      const delay = delays[Math.min(reconnectAttemptRef.current, delays.length - 1)];
      reconnectAttemptRef.current++;
      reconnectTimerRef.current = setTimeout(() => {
        if (isActiveRef.current) connect();
      }, delay);
    }

    function connect() {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);

      const ws = createPoseWebSocket(
        (result: PoseDetectionResult) => {
          isWaitingForResponseRef.current = false;
          setLatestResult(result);
          onPoseResult?.(result);

          // Voice speech feedback
          if (
            voiceEnabledRef.current &&
            result.correction_message &&
            !result.is_correct &&
            result.predicted_pose !== 'no_pose' &&
            !result.pose_mismatch
          ) {
            if (lastSpokenCorrectionRef.current !== result.correction_message) {
              lastSpokenCorrectionRef.current = result.correction_message;
              soundEngine.speak(result.correction_message);
            }
          } else if (result.is_correct) {
            lastSpokenCorrectionRef.current = '';
          }
        },
        () => {
          setIsConnected(false);
          isWaitingForResponseRef.current = false;
          scheduleReconnect();
        },
        () => {
          setIsConnected(false);
          isWaitingForResponseRef.current = false;
          // Notify disconnected to stop timer
          onPoseResult?.({
            predicted_pose: 'no_pose',
            confidence: 0,
            target_pose: targetPoseRef.current || '',
            is_correct: false,
            has_red: false,
            has_yellow: false,
            joints: [],
            pose_mismatch: false,
            pose_detected: false,
            reference_available: false,
            timer_action: 'stop',
            correction_message: 'Reconnecting to posture analysis server...',
          });
          scheduleReconnect();
        }
      );

      ws.onopen = () => {
        reconnectAttemptRef.current = 0;
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
      reconnectAttemptRef.current = 0;
      connect();
    };

    window.addEventListener('asana_backend_changed', handleBackendChange);

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      window.removeEventListener('asana_backend_changed', handleBackendChange);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setIsConnected(false);
      }
    };
  }, [isActive]);

  const latestResultRef = useRef<PoseDetectionResult | null>(latestResult);
  latestResultRef.current = latestResult;

  const lastRenderTimeRef = useRef<number>(0);

  // ── Frame Processing Loop (Throttled to 30 FPS render, 10-15 FPS send) ──────
  useEffect(() => {
    if (!isActive || isLoading) return;

    const processFrame = () => {
      const now = performance.now();
      // Cap local render loop at ~30 FPS (33ms interval)
      if (now - lastRenderTimeRef.current < 33) {
        animFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }
      lastRenderTimeRef.current = now;

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
        const result = landmarker.detectForVideo(video, now);

        if (result.landmarks && result.landmarks.length > 0) {
          const landmarks = result.landmarks[0];

          // Draw skeleton with joint colors from latest backend result
          drawSkeleton(ctx, landmarks, canvas.width, canvas.height, latestResultRef.current);

          // 3. Sending frames: Exactly 33 [x, y], raw 0 to 1, throttle to 10-15 FPS, skip if response pending
          const timeSinceLastSend = now - lastSendTimeRef.current;
          const isReadyToSend = !isWaitingForResponseRef.current || timeSinceLastSend > 400;

          if (
            targetPoseRef.current &&
            wsRef.current?.readyState === WebSocket.OPEN &&
            timeSinceLastSend >= 66 &&
            isReadyToSend
          ) {
            lastSendTimeRef.current = now;
            isWaitingForResponseRef.current = true;
            // Send exactly 33 [x, y] raw unmirrored coordinates
            const lm2d = landmarks.map((l) => [l.x, l.y]);
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
  }, [isActive, isLoading]);

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
  // 4. Joint coloring by index
  const statusByIndex = new Map((poseResult?.joints || []).map((j) => [j.index, j.status]));

  const colorFor = (i: number): string => {
    if (!poseResult || !poseResult.pose_detected || poseResult.pose_mismatch) return '#9ca3af'; // gray
    const s = statusByIndex.get(i);
    return s === 'critical' ? '#ef4444' : s === 'warning' ? '#facc15' : s === 'correct' ? '#22c55e' : '#9ca3af';
  };

  const isMismatchedOrNotDetected = !poseResult || !poseResult.pose_detected || poseResult.pose_mismatch;

  // Draw connections first
  for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
    if (startIdx >= landmarks.length || endIdx >= landmarks.length) continue;

    const startLm = landmarks[startIdx];
    const endLm = landmarks[endIdx];

    const c1 = colorFor(startIdx);
    const c2 = colorFor(endIdx);

    let lineColor = 'rgba(34, 197, 94, 0.85)';
    if (isMismatchedOrNotDetected) {
      lineColor = 'rgba(156, 163, 175, 0.7)'; // gray
    } else if (c1 === '#ef4444' || c2 === '#ef4444') {
      lineColor = 'rgba(239, 68, 68, 0.9)'; // red line
    } else if (c1 === '#facc15' || c2 === '#facc15') {
      lineColor = 'rgba(250, 204, 21, 0.85)'; // yellow line
    }

    const x1 = startLm.x * width;
    const y1 = startLm.y * height;
    const x2 = endLm.x * width;
    const y2 = endLm.y * height;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = (lineColor === 'rgba(239, 68, 68, 0.9)') ? 4 : 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // Draw joints
  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];
    const px = lm.x * width;
    const py = lm.y * height;
    const color = colorFor(i);
    const radius = color === '#ef4444' ? 7 : color === '#facc15' ? 6 : 5;

    // Outer glow for status joints
    if (color !== '#9ca3af') {
      ctx.beginPath();
      ctx.arc(px, py, radius + 2, 0, 2 * Math.PI);
      ctx.fillStyle = color === '#ef4444' ? 'rgba(239, 68, 68, 0.4)' : color === '#facc15' ? 'rgba(250, 204, 21, 0.3)' : 'rgba(34, 197, 94, 0.3)';
      ctx.fill();
    }

    // Joint circle
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}