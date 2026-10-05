import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Monitor, Laptop, X, Volume2, Sparkles, Compass, AlertCircle } from 'lucide-react';
import { soundEngine } from '../utils/audioFeedback';

interface MobileDesktopNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPoseName?: string;
}

export const MobileDesktopNoticeModal: React.FC<MobileDesktopNoticeModalProps> = ({
  isOpen,
  onClose,
  targetPoseName,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const voiceMessage =
    "We are currently working on mobile adjustments. Thank you for your patience! For the best posture biomechanics and camera tracking experience, please open Asana Sense on your PC or desktop.";

  const playVoiceGuidance = () => {
    try {
      setIsPlayingAudio(true);
      soundEngine.playChime(528, 1.2);
      setTimeout(() => {
        soundEngine.speak(voiceMessage, { force: true });
      }, 350);

      // Auto-reset pulse indicator after estimated duration
      setTimeout(() => {
        setIsPlayingAudio(false);
      }, 7000);
    } catch (e) {
      console.warn('[MobileNoticeModal] Audio playback failed:', e);
      setIsPlayingAudio(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      playVoiceGuidance();
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="mobile-desktop-notice-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-notice-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative overflow-hidden text-center"
        >
          {/* Top Decorative Amber/Emerald Gradient Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close mobile advice dialog"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 transition flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Visual Icon Badge */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 shadow-inner mb-4 relative">
            <Laptop className="w-8 h-8 text-amber-600" />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Monitor className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Heading */}
          <h3 id="mobile-notice-title" className="text-xl font-bold text-stone-900 tracking-tight mb-2">
            Desktop Experience Recommended
          </h3>

          {/* Voice Cue Status Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold mb-4">
            <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-bounce text-emerald-600' : 'text-emerald-500'}`} />
            <span>{isPlayingAudio ? 'Speaking Voice Guidance...' : 'Voice Advice Enabled'}</span>
            <button
              type="button"
              onClick={playVoiceGuidance}
              className="ml-1 text-[11px] underline text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
            >
              Replay
            </button>
          </div>

          {/* Polite Message Body */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 text-left space-y-2 mb-5">
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
              We are currently working on mobile adjustments for optimal full-body AI vision. <span className="font-semibold text-stone-900">Thank you for your patience!</span>
            </p>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              For the most accurate real-time joint biomechanics, voice cues, and camera tracking, please open <span className="font-semibold text-emerald-800">Asana Sense</span> on your <span className="font-semibold text-stone-900">PC or Laptop</span>.
            </p>
            {targetPoseName && (
              <div className="pt-2 border-t border-stone-200/60 flex items-center gap-1.5 text-xs text-stone-500">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Selected Asana: <strong className="text-stone-800">{targetPoseName}</strong></span>
              </div>
            )}
          </div>

          {/* Action Button: Explore Library (No proceed to session on mobile) */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Asana Library on Mobile</span>
            </button>
            <p className="text-[11px] text-stone-400">
              Bookmark this URL and open on your computer to practice live.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
