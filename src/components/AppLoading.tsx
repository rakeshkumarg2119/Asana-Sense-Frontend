import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Activity } from 'lucide-react';
import { AsanaSenseLogo } from './AsanaSenseLogo';

interface AppLoadingProps {
  message?: string;
}

export const AppLoading: React.FC<AppLoadingProps> = ({
  message = 'Loading Veda AI Biomechanics Studio...',
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-[#070b12] text-stone-100 flex flex-col items-center justify-center p-6 select-none overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-teal-600/15 rounded-full blur-3xl animate-pulse pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center text-center space-y-6 max-w-sm w-full relative z-10"
      >
        {/* Animated Yoga / Logo Ring Container */}
        <div className="relative flex items-center justify-center">
          {/* Outer Pulsing Aura Ring */}
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="absolute -inset-4 rounded-full bg-gradient-to-r from-emerald-500/30 to-teal-500/30 blur-md"
          />

          {/* Concentric Rotating Geometry */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
            className="w-28 h-28 rounded-full border-2 border-dashed border-emerald-500/40 flex items-center justify-center"
          />

          {/* Center Logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-stone-900 border border-emerald-500/60 flex items-center justify-center shadow-xl shadow-emerald-950/80">
              <AsanaSenseLogo size="sm" showText={false} />
            </div>
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            <span>ASANA - SENSE</span>
          </div>
          <h3 className="text-lg font-serif font-bold text-white tracking-wide">
            {message}
          </h3>
          <p className="text-xs text-stone-400">
            Synchronizing biomechanical vision algorithms & posture sensors
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-stone-900 rounded-full h-1.5 overflow-hidden border border-stone-800">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.75, ease: 'easeInOut' }}
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
          />
        </div>
      </motion.div>
    </div>
  );
};
