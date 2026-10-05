import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Mic, 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  UserPlus, 
  LogIn,
  Flame,
  Timer,
  Navigation,
  Eye,
  EyeOff,
  Bot
} from 'lucide-react';
import { UserProfile } from '../types';
import { AutoRotatingPoseCarousel } from './AutoRotatingPoseCarousel';

interface HeroSectionProps {
  userProfile: UserProfile | null;
  isInitialSignInAnimation?: boolean;
  onStartPractice: () => void;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onExplorePoses: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  userProfile,
  isInitialSignInAnimation = false,
  onStartPractice,
  onOpenAuth,
  onExplorePoses,
}) => {
  return (
    <section 
      id="main-content"
      tabIndex={-1}
      aria-label="Main Welcome Section"
      className="relative z-0 pt-6 sm:pt-8 pb-12 sm:pb-16 px-3.5 sm:px-8 lg:px-14 max-w-[1720px] w-full mx-auto overflow-hidden focus:outline-hidden"
    >
      {/* Decorative ambient background accents */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-100/50 rounded-full blur-3xl -z-10 pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-10 left-1/6 w-[450px] h-[450px] bg-teal-100/40 rounded-full blur-3xl -z-10 pointer-events-none" aria-hidden="true" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-center">
        {/* Left Column: Hero Copy & Actions */}
        <div className="lg:col-span-6 space-y-6 text-left">
          {/* Tagline Badge with Veda AI identity */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" aria-hidden="true" />
              <span>Veda AI • Yoga Biomechanics & Voice Vision Studio</span>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-serif font-black text-stone-900 tracking-tight leading-[1.1]">
            Align Your Asana With <span className="text-emerald-700 italic">Veda AI</span> Posture Corrections.
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-lg text-stone-600 max-w-2xl leading-relaxed">
            Guided by <strong>Veda AI</strong>, ASANA - SENSE tracks your joint alignment in real time across core yoga postures, corrects hazardous lumbar and knee compensations, listens to voice commands, and formulates Ayurvedic diet plans.
          </p>

          {/* Key Assurance Bullet Points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            <div className="flex items-center gap-2 text-xs font-medium text-stone-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>Camera & voice are never stored or recorded</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-stone-700">
              <Mic className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>Voice-controlled hands-free pose selection</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-stone-700">
              <Timer className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>Session timers & comprehensive post-session reports</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-stone-700">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>Encrypted private cloud profile vault</span>
            </div>
          </div>

          {/* Primary CTA Buttons + Animated Pointer Guide on Sign In */}
          <div className="pt-2">
            {isInitialSignInAnimation && userProfile && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="mb-3 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-400 text-stone-950 font-black text-xs shadow-xl border border-amber-300 animate-bounce"
              >
                <Sparkles className="w-4 h-4 text-stone-950 fill-stone-950 shrink-0" />
                <span>👇 Click Launch Posture Correction Session to start your live practice!</span>
              </motion.div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
              <button
                id="hero-start-session-btn"
                type="button"
                onClick={onStartPractice}
                aria-label="Launch Posture Correction Session"
                className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/15 cursor-pointer relative z-10 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${
                  isInitialSignInAnimation && userProfile ? 'ring-4 ring-amber-400 ring-offset-2 animate-pulse' : ''
                }`}
              >
                <Activity className="w-4 h-4" aria-hidden="true" />
                <span>Launch Posture Correction Session</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                id="hero-explore-poses-btn"
                type="button"
                onClick={onExplorePoses}
                aria-label="Explore 7 Yoga Postures"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-stone-50 active:scale-95 text-stone-800 font-semibold text-sm transition border border-stone-300 shadow-2xs cursor-pointer flex items-center justify-center focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                Explore 7 Yoga Postures
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Real-Time Biomechanics HUD Graphic */}
        <div className="lg:col-span-6 relative w-full">
          <AutoRotatingPoseCarousel />
        </div>
      </div>
    </section>
  );
};
