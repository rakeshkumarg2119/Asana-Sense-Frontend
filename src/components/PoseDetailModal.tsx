import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldAlert, CheckCircle2, Flame, Activity, ArrowRight, BookOpen, AlertTriangle } from 'lucide-react';
import { YogaPose } from '../types';
import { PoseVisualArtwork } from './PoseVisualArtwork';
import { useModalFocusTrap } from '../hooks/useModalFocusTrap';

interface PoseDetailModalProps {
  pose: YogaPose;
  onClose: () => void;
  onStartPractice: (pose: YogaPose) => void;
}

export const PoseDetailModal: React.FC<PoseDetailModalProps> = ({
  pose,
  onClose,
  onStartPractice,
}) => {
  const containerRef = useModalFocusTrap({ isOpen: !!pose, onClose });
  const [activeTab, setActiveTab] = useState<'biomechanics' | 'benefits' | 'cues'>('biomechanics');

  return (
    <div 
      id="pose-detail-modal" 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pose-detail-title"
    >
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        tabIndex={-1}
        className="bg-white rounded-2xl max-w-xl w-full max-h-[88vh] shadow-2xl border border-stone-200 relative flex flex-col overflow-hidden focus:outline-hidden"
      >
        {/* Sticky Header with Title and Close Button */}
        <div className="px-5 py-3.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center" aria-hidden="true">
              <BookOpen className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="pose-detail-title" className="text-base font-bold text-stone-900 leading-tight">{pose.name}</h2>
                <span className="text-xs text-emerald-700 font-serif italic font-medium">({pose.sanskritName})</span>
              </div>
              <p className="text-[11px] text-stone-500 flex items-center gap-2">
                <span className="font-semibold text-emerald-700">{pose.difficulty}</span>
                <span>•</span>
                <span>Hold Target: <strong className="font-mono text-stone-800">{pose.idealHoldDurationSeconds}s</strong></span>
              </p>
            </div>
          </div>

          <button
            id="close-pose-detail-modal-btn"
            type="button"
            onClick={onClose}
            aria-label="Close pose details modal"
            className="w-8 h-8 rounded-lg bg-stone-200/70 hover:bg-stone-300 text-stone-600 hover:text-stone-900 transition flex items-center justify-center cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation Tabs for Compact Visibility */}
        <div className="px-5 pt-3 pb-2 bg-stone-100/60 border-b border-stone-200 flex items-center gap-1.5 shrink-0" role="tablist" aria-label="Pose Details Tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'biomechanics'}
            onClick={() => setActiveTab('biomechanics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${
              activeTab === 'biomechanics'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Biomechanics & Contraindications</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'benefits'}
            onClick={() => setActiveTab('benefits')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${
              activeTab === 'benefits'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Target Benefits</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'cues'}
            onClick={() => setActiveTab('cues')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${
              activeTab === 'cues'
                ? 'bg-stone-800 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Checkpoints</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* Top Quick Overview Banner */}
          <div className="flex gap-4 items-center bg-stone-50 p-3 rounded-xl border border-stone-200/80">
            <div className="w-24 h-24 shrink-0 bg-stone-100 rounded-lg overflow-hidden border border-stone-200 flex items-center justify-center p-1">
              <PoseVisualArtwork poseId={pose.id} highlightJoints={true} />
            </div>
            <div className="flex-1 space-y-1.5">
              <p className="text-stone-700 leading-relaxed line-clamp-3">{pose.description}</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {pose.targetMuscles.map((muscle) => (
                  <span key={muscle} className="px-2 py-0.5 rounded bg-stone-200/80 text-stone-700 text-[10px] font-semibold">
                    {muscle}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Tab 1: Biomechanics & Contraindications */}
          {activeTab === 'biomechanics' && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold uppercase text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Wrong Posture Impacts & Anatomical Contraindications
              </div>
              <div className="space-y-2">
                {pose.wrongPostureImpacts.map((w, idx) => (
                  <div key={idx} className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 space-y-1">
                    <div className="font-bold text-amber-950 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-900 text-[10px] flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                      <span>{w.mistake}</span>
                    </div>
                    <p className="text-amber-900 text-[11px] leading-snug">
                      <strong>Anatomical Risk:</strong> {w.impact}
                    </p>
                    <p className="text-emerald-800 text-[11px] font-medium leading-snug bg-white/70 p-1.5 rounded-md border border-amber-200/60">
                      <strong>Correction:</strong> {w.correction}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Benefits & Muscles */}
          {activeTab === 'benefits' && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-emerald-900 font-bold uppercase text-[11px]">
                <Flame className="w-3.5 h-3.5 text-emerald-700" />
                Physiological & Therapeutic Benefits
              </div>
              <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 space-y-2">
                <ul className="space-y-2">
                  {pose.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-emerald-950 text-[11px] leading-snug">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Tab 3: Alignment Checkpoints */}
          {activeTab === 'cues' && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-stone-900 font-bold uppercase text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Step-by-Step Alignment Checkpoints
              </div>
              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-2">
                <ul className="space-y-2">
                  {pose.keyAlignmentCheckpoints.map((chk, i) => (
                    <li key={i} className="flex items-start gap-2 text-stone-800 text-[11px] leading-snug">
                      <span className="w-4 h-4 rounded-full bg-stone-200 text-stone-700 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{chk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-stone-200/80 hover:bg-stone-300 text-stone-700 text-xs font-semibold cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => onStartPractice(pose)}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          >
            <Activity className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Practice Pose Live</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
