import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Sparkles, Activity, ShieldAlert, ArrowUpRight, Flame, Lock } from 'lucide-react';
import { ALL_POSES } from '../data/yogaPoses';
import { YogaPose, UserProfile } from '../types';
import { PoseVisualArtwork } from './PoseVisualArtwork';

interface PoseCarouselProps {
  userProfile?: UserProfile | null;
  onSelectPoseForPractice: (pose: YogaPose) => void;
  onViewPoseDetails: (pose: YogaPose) => void;
  onOpenAuth?: () => void;
}

export const PoseCarousel: React.FC<PoseCarouselProps> = ({
  userProfile,
  onSelectPoseForPractice,
  onViewPoseDetails,
  onOpenAuth,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [viewMode, setViewMode] = useState<'skeleton' | 'image'>('skeleton');
  const totalPoses = ALL_POSES.length;

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalPoses);
    }, 4200);
    return () => clearInterval(interval);
  }, [isPaused, totalPoses]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + totalPoses) % totalPoses);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % totalPoses);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    }
  };

  const activePose = ALL_POSES[activeIndex];

  return (
    <section 
      id="pose-carousel-showcase" 
      className="relative py-12 sm:py-16 px-3.5 sm:px-8 lg:px-14 max-w-[1720px] w-full mx-auto overflow-hidden focus:outline-hidden"
      role="region"
      aria-roledescription="carousel"
      aria-label="Curated Yoga Posture Spectrum"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            Master Pose Spectrum • Biomechanical Library
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
            Curated Posture Spectrum
          </h2>
          <p className="text-stone-600 text-sm sm:text-base mt-1 max-w-2xl">
            Explore 8 master postures engineered with biomechanical alignment markers, wrong posture impact warnings, and real-time AI accuracy tracking. <span className="text-xs text-stone-400 block sm:inline">(Use ← / → keys to navigate)</span>
          </p>
        </div>

        {/* Carousel Navigation Controls */}
        <div className="flex items-center gap-3 self-start md:self-end">
          <button
            id="carousel-prev-button"
            type="button"
            onClick={handlePrev}
            aria-label="Previous pose (Left Arrow)"
            className="w-10 h-10 rounded-full border border-stone-200 bg-white hover:bg-stone-50 hover:border-emerald-400 active:scale-95 transition flex items-center justify-center text-stone-700 shadow-sm cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <div className="text-xs font-medium text-stone-500 tabular-nums px-2" aria-live="polite">
            <span className="text-stone-900 font-bold text-sm">{activeIndex + 1}</span> / {totalPoses}
          </div>
          <button
            id="carousel-next-button"
            type="button"
            onClick={handleNext}
            aria-label="Next pose (Right Arrow)"
            className="w-10 h-10 rounded-full border border-stone-200 bg-white hover:bg-stone-50 hover:border-emerald-400 active:scale-95 transition flex items-center justify-center text-stone-700 shadow-sm cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          >
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Main Spotlight Showcase */}
      <div 
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-stretch bg-gradient-to-br from-stone-50 via-white to-emerald-50/40 p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-lg"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Left Side: Artwork & Visual Vector */}
        <div className="lg:col-span-5 flex flex-col justify-between items-center relative min-h-[340px] bg-white rounded-2xl p-6 border border-stone-100 shadow-inner">
          <div className="w-full flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                activePose.difficulty === 'Beginner' ? 'bg-emerald-100 text-emerald-800' :
                activePose.difficulty === 'Intermediate' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
              }`}>
                {activePose.difficulty}
              </span>
              {activePose.isCoreInteractive && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-xs font-medium flex items-center gap-1 shadow-sm">
                  <Activity className="w-3 h-3 animate-pulse" />
                  Live AI Ready
                </span>
              )}
            </div>

            {/* View Mode Tags: Image vs Skeleton Toggle */}
            <div className="flex bg-stone-100 p-0.5 rounded-lg text-xs font-semibold shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('skeleton')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer text-[11px] ${
                  viewMode === 'skeleton'
                    ? 'bg-purple-600 text-white font-bold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Skeleton
              </button>
              <button
                type="button"
                onClick={() => setViewMode('image')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer text-[11px] ${
                  viewMode === 'image'
                    ? 'bg-emerald-700 text-white font-bold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Image
              </button>
            </div>
          </div>

          <div className="w-full max-w-[300px] h-[260px] flex items-center justify-center my-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePose.id + '-' + viewMode}
                initial={{ opacity: 0, scale: 0.92, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="w-full h-full flex items-center justify-center"
              >
                <PoseVisualArtwork 
                  poseId={activePose.id} 
                  highlightJoints={true} 
                  viewMode={viewMode}
                  imageUrl={activePose.imageUrl}
                  poseName={activePose.name}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="w-full mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Ideal Hold: <strong className="text-stone-800">{activePose.idealHoldDurationSeconds}s</strong></span>
            <span>Category: <strong className="text-stone-800">{activePose.category}</strong></span>
          </div>
        </div>

        {/* Right Side: Detailed Info, Benefits, and Danger Impacts */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePose.id + '-details'}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35 }}
              className="space-y-4"
            >
              <div>
                <p className="text-emerald-700 font-serif italic text-sm font-medium tracking-wide">
                  {activePose.sanskritName}
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold text-stone-900">
                  {activePose.name}
                </h3>
                <p className="text-stone-600 text-sm mt-1 leading-relaxed">
                  {activePose.description}
                </p>
              </div>

              {/* Muscles Targeted Pills */}
              <div>
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-1.5">
                  Muscles Activated
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activePose.targetMuscles.map((muscle) => (
                    <span key={muscle} className="px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-700 text-xs font-medium">
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>

              {/* Key Benefits Spotlight */}
              <div className="bg-emerald-50/60 rounded-xl p-3.5 border border-emerald-100/80">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wide mb-1">
                  <Flame className="w-3.5 h-3.5 text-emerald-600" />
                  Physiological Benefits
                </span>
                <ul className="text-xs text-emerald-950 space-y-1">
                  {activePose.benefits.slice(0, 2).map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Wrong Posture Impact Highlight */}
              {activePose.wrongPostureImpacts.length > 0 && (
                <div className="bg-amber-50/70 rounded-xl p-3.5 border border-amber-200/80">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wide mb-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    Wrong Posture Impact (Avoid Misalignment)
                  </span>
                  <p className="text-xs text-amber-950 leading-relaxed font-medium">
                    ⚠️ <strong>{activePose.wrongPostureImpacts[0].mistake}:</strong> {activePose.wrongPostureImpacts[0].impact}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Action CTAs */}
          <div className="pt-5 mt-4 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center gap-3 w-full">
            <button
              id={`practice-pose-${activePose.id}`}
              type="button"
              onClick={() => onSelectPoseForPractice(activePose)}
              aria-label={`Practice ${activePose.name} with AI Vision Feedback`}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <Activity className="w-4 h-4" aria-hidden="true" />
              <span>Practice with AI Vision Feedback</span>
            </button>
            <button
              id={`view-details-${activePose.id}`}
              type="button"
              onClick={() => {
                if (!userProfile) {
                  onOpenAuth?.();
                } else {
                  onViewPoseDetails(activePose);
                }
              }}
              aria-label={`View full biomechanics and contraindications for ${activePose.name}`}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-stone-50 active:scale-95 text-stone-800 font-semibold text-sm transition border border-stone-300 shadow-2xs cursor-pointer flex items-center justify-center gap-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <span>Full Biomechanics & Contraindications</span>
              <ArrowUpRight className="w-4 h-4 text-stone-600" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Mini 8-Pose Thumbnail Ribbon */}
      <div className="mt-6 grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3" role="tablist" aria-label="Yoga Poses Navigation">
        {ALL_POSES.map((pose, idx) => {
          const isCurrent = idx === activeIndex;
          return (
            <button
              key={pose.id}
              id={`thumb-pose-${pose.id}`}
              type="button"
              role="tab"
              aria-selected={isCurrent}
              aria-label={`${pose.name} (${pose.sanskritName})`}
              onClick={() => setActiveIndex(idx)}
              className={`p-2 rounded-xl text-left transition border flex flex-col items-center justify-center text-center cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${
                isCurrent
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-105 ring-2 ring-emerald-600 ring-offset-2'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-emerald-300 hover:bg-stone-50'
              }`}
            >
              <span className="text-xs font-bold leading-tight line-clamp-1">{pose.name}</span>
              <span className={`text-[10px] truncate max-w-full font-serif italic ${isCurrent ? 'text-emerald-100' : 'text-stone-400'}`}>
                {pose.sanskritName}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
