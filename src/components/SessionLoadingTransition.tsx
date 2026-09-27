import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Activity, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  Flame, 
  HeartPulse, 
  Compass, 
  Layers,
  Cpu
} from 'lucide-react';

interface SessionLoadingTransitionProps {
  mode: 'launch' | 'exit';
  onComplete: () => void;
  targetPoseName?: string;
  customMessage?: string;
}

export const SessionLoadingTransition: React.FC<SessionLoadingTransitionProps> = ({
  mode,
  onComplete,
  targetPoseName,
  customMessage,
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const launchSteps = [
    { title: 'Initializing Veda Vision Engine', desc: 'Calibrating joint landmark neural detector' },
    { title: 'Structuring Biomechanical Grid', desc: targetPoseName ? `Optimizing geometry for ${targetPoseName}` : 'Configuring 8-Asana posture database' },
    { title: 'Activating Real-Time Voice Guide', desc: 'Starting hands-free speech recognition controller' },
    { title: 'Opening Sacred Practice Space', desc: 'All systems calibrated and ready' },
  ];

  const exitSteps = [
    { title: 'Finalizing Hold Telemetry', desc: 'Calculating joint stability and hold accuracy' },
    { title: 'Encrypting Session Records', desc: 'Securing practice statistics in private vault' },
    { title: 'Synthesizing Biomechanics Report', desc: customMessage || 'Formatting personalized Groq AI alignment insights' },
    { title: 'Returning to Sanctuary Dashboard', desc: 'Session saved safely' },
  ];

  const steps = mode === 'launch' ? launchSteps : exitSteps;

  useEffect(() => {
    const totalDuration = mode === 'launch' ? 1800 : 1500; // ms
    const intervalTime = 30;
    const increment = 100 / (totalDuration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            if (onCompleteRef.current) {
              onCompleteRef.current();
            }
          }, 150);
          return 100;
        }

        // Update step index based on progress quarters
        if (next < 25) setCurrentStepIndex(0);
        else if (next < 55) setCurrentStepIndex(1);
        else if (next < 85) setCurrentStepIndex(2);
        else setCurrentStepIndex(3);

        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [mode]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-stone-950 via-[#071318] to-stone-950 text-white p-6 overflow-hidden select-none"
    >
      {/* Background Animated Sacred Geometry Waves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.08, 1] }}
          transition={{ rotate: { repeat: Infinity, duration: 25, ease: "linear" }, scale: { repeat: Infinity, duration: 8, ease: "easeInOut" } }}
          className="absolute -top-1/4 -left-1/4 w-[150vw] h-[150vw] rounded-full border border-emerald-500/20 border-dashed"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 35, ease: "linear" }}
          className="absolute -top-1/4 -left-1/4 w-[150vw] h-[150vw] rounded-full border border-teal-400/10"
        />
      </div>

      {/* Floating Center Biomechanical Mandala */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full space-y-6">
        
        {/* Animated Concentric Rings & Mandala Core */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
          
          {/* Outer Pulsing Aura */}
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-emerald-500/15 blur-xl"
          />

          {/* Rotating Outer Ring with Dash Marks */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            className="absolute inset-1 rounded-full border-2 border-emerald-400/40 border-t-emerald-300 border-r-transparent"
          />

          {/* Counter-rotating Inner Compass Ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
            className="absolute inset-5 rounded-full border border-teal-300/30 border-b-teal-200 border-l-transparent"
          />

          {/* Dynamic 8-Point Posture Coordinate Dots */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
            <motion.div
              key={deg}
              animate={{ 
                scale: [1, 1.4, 1],
                opacity: [0.4, 1, 0.4] 
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2, 
                delay: i * 0.25,
                ease: "easeInOut" 
              }}
              className="absolute w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400"
              style={{
                transform: `rotate(${deg}deg) translate(62px) rotate(-${deg}deg)`,
              }}
            />
          ))}

          {/* Central Glowing Icon Node */}
          <motion.div
            animate={{ scale: [0.95, 1.05, 0.95] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center shadow-lg shadow-emerald-950 border border-emerald-400/40 relative z-10"
          >
            {mode === 'launch' ? (
              <Activity className="w-9 h-9 sm:w-10 sm:h-10 text-emerald-100 animate-pulse" />
            ) : (
              <ShieldCheck className="w-9 h-9 sm:w-10 sm:h-10 text-emerald-100" />
            )}
          </motion.div>
        </div>

        {/* Header & Status */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            <span>{mode === 'launch' ? 'VEDA AI VISION CALIBRATION' : 'SESSION TELEMETRY SYNC'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
            {mode === 'launch' ? (
              targetPoseName ? `Preparing ${targetPoseName}` : 'Entering Live Session'
            ) : (
              'Securing Practice Data'
            )}
          </h2>

          <p className="text-xs sm:text-sm text-stone-400 max-w-sm mx-auto h-5">
            {steps[currentStepIndex]?.desc || 'Calibrating posture telemetry...'}
          </p>
        </div>

        {/* Progress Bar & Numeric Percent */}
        <div className="w-full space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
            <span className="flex items-center gap-1.5 text-stone-300 font-sans">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              {steps[currentStepIndex]?.title}
            </span>
            <span className="font-bold">{Math.round(progress)}%</span>
          </div>

          <div className="w-full h-2 rounded-full bg-stone-800/90 border border-stone-700/60 overflow-hidden p-0.5 relative">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 shadow-xs shadow-emerald-400"
              style={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="grid grid-cols-4 gap-1.5 w-full pt-1">
          {steps.map((step, idx) => {
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div 
                key={step.title}
                className={`p-1.5 rounded-xl border text-[10px] text-center transition-all ${
                  isDone 
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' 
                    : isCurrent 
                    ? 'bg-stone-900 border-emerald-400 text-white ring-1 ring-emerald-500/40 shadow-xs' 
                    : 'bg-stone-900/40 border-stone-800 text-stone-500'
                }`}
              >
                <div className="truncate font-semibold">{step.title.split(' ')[0]}</div>
              </div>
            );
          })}
        </div>

      </div>
    </motion.div>
  );
};
