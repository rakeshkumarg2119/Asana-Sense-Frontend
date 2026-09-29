import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, CheckCircle2, ShieldCheck } from 'lucide-react';

interface WelcomeToastProps {
  name: string;
  email: string;
  onClose: () => void;
}

export const WelcomeToast: React.FC<WelcomeToastProps> = ({ name, email, onClose }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-6 right-6 z-50 max-w-md w-[calc(100vw-3rem)] sm:w-auto"
      >
        <div className="bg-stone-900/95 text-stone-100 p-4 sm:p-5 rounded-3xl shadow-2xl border border-emerald-500/30 backdrop-blur-xl flex items-start gap-3.5 relative overflow-hidden">
          {/* Subtle glowing ambient pulse */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Icon Badge */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 text-white">
            <Sparkles className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 pr-2 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Account Created
              </span>
            </div>
            
            <h4 className="text-sm sm:text-base font-serif font-bold text-white tracking-wide">
              Welcome to Asana Sense, {name || 'Practitioner'}!
            </h4>
            
            <p className="text-xs text-stone-300 leading-relaxed font-sans">
              Your mindful yoga & AI biomechanics journey begins now.
              {email && (
                <span className="block text-[11px] text-stone-400 mt-0.5 truncate">
                  Registered as <strong className="text-emerald-300 font-mono font-normal">{email}</strong>
                </span>
              )}
            </p>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close welcome notification"
            className="text-stone-400 hover:text-white p-1 rounded-xl hover:bg-white/10 transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
