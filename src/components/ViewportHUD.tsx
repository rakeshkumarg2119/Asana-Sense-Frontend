import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sliders,
  X,
  Scan,
  Timer,
  Trophy,
  Sparkle,
  Sparkles,
  ShieldCheck,
  Play,
  Camera,
  Minus,
  Plus
} from 'lucide-react';
import type { YogaPose, PostureAnalysisResult, PoseDetectionResult } from '../types';

export interface ViewportHUDProps {
  currentPose: YogaPose | null;
  isPoseActive: boolean;
  cameraActive: boolean;
  videoFitMode: 'contain' | 'cover';
  modelPoseResult: PoseDetectionResult | null;
  postureAnalysis: PostureAnalysisResult;
  poseHoldSeconds: number;
  targetHoldDuration: number;
  manualTargetSeconds: number | null;
  bestHoldPerPose: Record<string, number>;
  personalBestToast: { poseName: string; seconds: number; prior: number } | null;
  aiCoachName: string;
  lastVoiceCommand?: string | null;
  showVoiceCmdTable: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  voiceTableScrollRef: React.RefObject<HTMLDivElement | null>;
  isPoseMatch: (predicted?: string | null, target?: string | null) => boolean;
  onSetVideoFitMode: (mode: 'contain' | 'cover') => void;
  onSetManualTargetSeconds: (sec: number | null) => void;
  onConfirmReadyAndStart: () => void;
  onStartCamera: () => void;
  onCloseVoiceTable: () => void;
}

export const ViewportHUD: React.FC<ViewportHUDProps> = ({
  currentPose,
  isPoseActive,
  cameraActive,
  videoFitMode,
  modelPoseResult,
  postureAnalysis,
  poseHoldSeconds,
  targetHoldDuration,
  manualTargetSeconds,
  bestHoldPerPose,
  personalBestToast,
  aiCoachName,
  lastVoiceCommand,
  showVoiceCmdTable,
  containerRef,
  voiceTableScrollRef,
  isPoseMatch,
  onSetVideoFitMode,
  onSetManualTargetSeconds,
  onConfirmReadyAndStart,
  onStartCamera,
  onCloseVoiceTable,
}) => {
  // SVG Circular Progress Geometry
  const holdProgressPercent = currentPose 
    ? Math.min(100, (poseHoldSeconds / targetHoldDuration) * 100)
    : 0;
  const circleRadius = 34;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference - (holdProgressPercent / 100) * circleCircumference;

  const hasRedJoint = Boolean(
    modelPoseResult?.has_red ||
    modelPoseResult?.joints?.some(
      (j) => j.status === 'critical' || (j.status as string) === 'red' || j.deviation >= 3.5
    ) ||
    (modelPoseResult && currentPose?.model_class_name && modelPoseResult.predicted_pose !== 'no_pose' &&
      !isPoseMatch(modelPoseResult.predicted_pose, currentPose.model_class_name))
  );

  return (
    <>
      {/* Movable Voice Commands Reference Table Floating Overlay */}
      <AnimatePresence>
        {showVoiceCmdTable && (
          <motion.div
            drag
            dragMomentum={false}
            dragConstraints={containerRef}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-12 left-3 z-40 bg-stone-900/95 border border-emerald-500/70 rounded-2xl p-2.5 shadow-2xl backdrop-blur-md text-white w-60 sm:w-64 cursor-grab active:cursor-grabbing pointer-events-auto"
          >
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-stone-700/80">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-bold text-emerald-300">Voice Commands (Movable)</span>
              </div>
              <button
                onClick={onCloseVoiceTable}
                className="w-5 h-5 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[9px] text-stone-300 mb-1.5">
              🖐️ <em>Drag box to move anywhere in camera viewport.</em>
            </p>

            <div ref={voiceTableScrollRef} className="max-h-56 overflow-y-auto pr-1 space-y-1.5 text-[10px] scrollbar-thin">
              <div className="rounded-lg bg-stone-950/90 p-2 border border-stone-800">
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block mb-0.5">🗣️ Exact Voice Commands</span>
                <div className="space-y-1 text-stone-200 font-mono text-[10px]">
                  <div>• <strong className="text-amber-300">"switch to [pose name]"</strong> → e.g. "switch to tree pose"</div>
                  <div>• <strong className="text-amber-300">"open poses"</strong> / <strong className="text-amber-300">"open poses table"</strong> → Open 8 Poses Grid</div>
                  <div>• <strong className="text-amber-300">"open voice table"</strong> → Toggle Voice Table Overlay</div>
                  <div>• <strong className="text-amber-300">"preview pose"</strong> → Selected Pose details</div>
                  <div>• <strong className="text-emerald-300">"turn on camera"</strong> / <strong className="text-emerald-300">"turn off camera"</strong></div>
                  <div>• <strong className="text-emerald-300">"next pose"</strong> / <strong className="text-emerald-300">"previous pose"</strong></div>
                  <div>• <strong className="text-emerald-300">"scroll down poses"</strong> / <strong className="text-emerald-300">"scroll up poses"</strong></div>
                  <div>• <strong className="text-emerald-300">"scroll down voice"</strong> / <strong className="text-emerald-300">"scroll up voice"</strong></div>
                  <div>• <strong className="text-emerald-300">"close pose table"</strong> / <strong className="text-emerald-300">"close voice table"</strong></div>
                  <div>• <strong className="text-emerald-300">"close preview"</strong> / <strong className="text-emerald-300">"finish session"</strong></div>
                  <div>• <strong className="text-emerald-300">"I'm ready"</strong> / <strong className="text-emerald-300">"Pause"</strong> / <strong className="text-emerald-300">"Resume"</strong></div>
                </div>
              </div>

              <div className="rounded-lg bg-stone-950/90 p-2 border border-stone-800">
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block mb-0.5">🧘 8 Asana Names</span>
                <div className="grid grid-cols-2 gap-0.5 text-[10px] font-mono text-stone-300">
                  <span>• "Warrior 3"</span>
                  <span>• "Tree Pose"</span>
                  <span>• "Triangle Pose"</span>
                  <span>• "Downward Dog"</span>
                  <span>• "Cobra Pose"</span>
                  <span>• "Bridge Pose"</span>
                  <span>• "Lotus Pose"</span>
                  <span>• "Child's Pose"</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY HUD CONTAINER */}
      <div className="absolute inset-0 pointer-events-none p-3 sm:p-4 flex flex-col justify-between z-20">
        
        {/* Top HUD Ribbon */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          {/* Accuracy Score Pill */}
          <div className="px-3 py-1.5 rounded-2xl bg-stone-950/85 backdrop-blur-md border border-emerald-500/50 text-xs font-mono text-emerald-300 flex items-center gap-2 shadow-lg">
            <span className={`w-2 h-2 rounded-full ${
              !isPoseActive
                ? 'bg-amber-400'
                : modelPoseResult?.is_correct
                ? 'bg-emerald-400 animate-ping'
                : hasRedJoint
                ? 'bg-rose-500'
                : 'bg-yellow-400'
            }`} />
            <span>Alignment:</span>
            <strong className="text-white text-sm font-black">
              {!isPoseActive
                ? 'Standby'
                : modelPoseResult?.is_correct
                ? '✓ Perfect (100%)'
                : modelPoseResult?.predicted_pose === 'no_pose'
                ? 'No Yoga Pose'
                : hasRedJoint
                ? `${postureAnalysis.score}% (Mistake 🔴)`
                : `${postureAnalysis.score}% (Holding - Adjust 🟡)`}
            </strong>
          </div>

          {/* Framing Fit Mode Badge Toggle Tag */}
          <button
            onClick={() => onSetVideoFitMode(videoFitMode === 'contain' ? 'cover' : 'contain')}
            className="px-3 py-1.5 rounded-2xl bg-stone-950/85 backdrop-blur-md border border-emerald-500/50 text-xs font-mono text-emerald-300 flex items-center gap-1.5 shadow-lg pointer-events-auto cursor-pointer hover:bg-stone-900/90 transition"
            title="Click to toggle Full Body Fit vs Wide Fill"
          >
            <Scan className="w-3.5 h-3.5 text-emerald-400" />
            <span>Framing: {videoFitMode === 'contain' ? 'Full Body Fit 🎯' : 'Fill View 🔍'}</span>
          </button>

          {/* POSE HOLD TIMER RING */}
          {currentPose && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-stone-950/90 backdrop-blur-md border border-emerald-500/40 rounded-2xl p-2.5 flex items-center gap-2.5 shadow-xl pointer-events-auto"
            >
              {/* SVG Circular Progress Ring */}
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r={circleRadius}
                    className="stroke-stone-800"
                    strokeWidth="5"
                    fill="transparent"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r={circleRadius}
                    className={`transition-all duration-500 ease-out ${
                      modelPoseResult?.is_correct
                        ? 'stroke-emerald-400'
                        : (modelPoseResult?.has_red || modelPoseResult?.joints?.some(j => j.status === 'critical' || j.deviation >= 3.5))
                        ? 'stroke-rose-500'
                        : 'stroke-yellow-400'
                    }`}
                    strokeWidth="5"
                    strokeDasharray={circleCircumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                {/* Center Hold Seconds */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-mono font-bold text-white leading-tight">
                    {poseHoldSeconds}s
                  </span>
                  <span className="text-[7px] text-emerald-300 font-mono">
                    /{targetHoldDuration}s
                  </span>
                </div>
              </div>

              {/* Hold Status Details & Personal Best Streak */}
              <div className="pr-1">
                <div className="flex items-center gap-1">
                  <Timer className="w-3 h-3 text-emerald-400" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                    Hold Streak
                  </span>
                </div>
                <span className="text-[11px] font-bold text-white block mt-0.5">
                  {!isPoseActive 
                    ? 'Waiting to Start' 
                    : modelPoseResult?.is_correct
                      ? 'All Joints Correct 🟢'
                      : modelPoseResult?.predicted_pose === 'no_pose'
                      ? 'Normal Pose (Paused) ⏸️'
                      : (modelPoseResult?.has_red || modelPoseResult?.joints?.some(j => j.status === 'critical' || j.deviation >= 3.5))
                      ? 'Mistake Detected 🔴'
                      : 'Holding Pose (Adjusting 🟡)'}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] text-amber-300 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40">
                    Beat Best: {bestHoldPerPose[currentPose.id] || 0}s
                  </span>
                  <span className="text-[9px] text-stone-400 font-medium">
                    Target: {targetHoldDuration}s
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* MANUAL TARGET HOLD DURATION CONTROLLER */}
          {currentPose && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-stone-950/90 backdrop-blur-md border border-stone-800 rounded-2xl p-2 flex items-center gap-2 shadow-xl pointer-events-auto"
            >
              <div className="flex items-center gap-1 pr-1 border-r border-stone-800">
                <Timer className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  Target:
                </span>
              </div>

              {/* Quick-Pick Presets: 15s, 30s, 45s, 60s */}
              <div className="flex items-center gap-1">
                {[15, 30, 45, 60].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => onSetManualTargetSeconds(sec)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer ${
                      targetHoldDuration === sec && (manualTargetSeconds === sec || (manualTargetSeconds === null && currentPose.idealHoldDurationSeconds === sec))
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>

              {/* Custom Number Stepper */}
              <div className="flex items-center bg-stone-900 border border-stone-700/80 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => onSetManualTargetSeconds(Math.max(5, targetHoldDuration - 5))}
                  className="p-1 hover:bg-stone-800 text-stone-300 hover:text-white rounded transition cursor-pointer"
                  title="Minus 5s"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <input
                  type="number"
                  min={5}
                  max={300}
                  value={targetHoldDuration}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 5 && val <= 300) {
                      onSetManualTargetSeconds(val);
                    }
                  }}
                  className="w-8 text-center bg-transparent text-emerald-300 font-mono font-bold text-[10px] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => onSetManualTargetSeconds(Math.min(300, targetHoldDuration + 5))}
                  className="p-1 hover:bg-stone-800 text-stone-300 hover:text-white rounded transition cursor-pointer"
                  title="Plus 5s"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>

              {/* Reset Button */}
              {manualTargetSeconds !== null && (
                <button
                  type="button"
                  onClick={() => onSetManualTargetSeconds(null)}
                  className="text-[9px] text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
                  title="Reset to Pose Default"
                >
                  Reset
                </button>
              )}
            </motion.div>
          )}
        </div>

        {/* CELEBRATION TOAST: NEW PERSONAL BEST STREAK */}
        <AnimatePresence>
          {personalBestToast && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className="self-center pointer-events-auto bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-600 border-2 border-amber-300 rounded-3xl p-3.5 text-center shadow-2xl max-w-md w-full my-2"
            >
              <div className="flex items-center justify-center gap-2 text-white font-black text-xs uppercase tracking-wider">
                <Trophy className="w-4 h-4 text-amber-200 fill-amber-300 animate-bounce" />
                <span>🎉 NEW PERSONAL BEST STREAK RECORD!</span>
              </div>
              <p className="text-xs font-bold text-amber-100 mt-1">
                {personalBestToast.poseName}: Held for <strong className="text-white text-sm">{personalBestToast.seconds} seconds</strong> (beat prior {personalBestToast.prior}s hold)!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ready Gate Floating Center Banner if Pose is Selected but Not Active */}
        {currentPose && !isPoseActive && (
          <div className="self-center pointer-events-auto bg-stone-950/95 backdrop-blur-md border border-emerald-500/60 rounded-3xl p-4 sm:p-5 text-center shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-300">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mx-auto mb-2 border border-emerald-500/30">
              <Sparkle className="w-5 h-5 animate-spin" />
            </div>
            <h4 className="text-base font-bold text-white">
              Ready to practice {currentPose.name}?
            </h4>
            <p className="text-xs text-stone-300 mt-1 mb-3">
              Target hold: <strong>{currentPose.idealHoldDurationSeconds} seconds</strong>. Click below or say <em>"I'm ready"</em> to start live posture tracking.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                onClick={onConfirmReadyAndStart}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>I'm Ready • Start {currentPose.name}</span>
              </button>

              {!cameraActive && (
                <button
                  onClick={onStartCamera}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border border-stone-700"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Turn On Camera</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bottom Row: Plain green text Veda AI above message box aligned to the right */}
        <div className="space-y-1.5 pointer-events-auto">
          {/* Plain green text Veda AI aligned to the right side */}
          <div className="flex justify-end pr-1">
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider select-none">
              Veda AI
            </span>
          </div>

          {/* AI Guidance Message Box */}
          <motion.div 
            key={postureAnalysis.keyCues[0] || 'guide'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-stone-950/95 via-[#0d1624]/95 to-stone-950/95 backdrop-blur-md border border-stone-700/80 rounded-2xl p-3 shadow-xl flex items-center justify-between gap-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  Posture Alignment Status • {postureAnalysis.alignmentStatus}
                </span>
              </div>
              <p className="text-xs text-stone-100 font-medium line-clamp-2 leading-snug">
                👉 {postureAnalysis.keyCues[0] || 'Select an asana and click Ready when in position.'}
              </p>
            </div>

            {/* Badges container: side-by-side in original place */}
            <div className="shrink-0 flex items-center gap-2">
              {lastVoiceCommand && (
                <span className="text-[10px] px-2.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/40 font-semibold flex items-center justify-center whitespace-nowrap">
                  {lastVoiceCommand}
                </span>
              )}
              <div className="bg-stone-900/90 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-[10px] text-emerald-300 font-semibold flex items-center gap-1.5 whitespace-nowrap">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Real-Time Biomechanics Active</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};
