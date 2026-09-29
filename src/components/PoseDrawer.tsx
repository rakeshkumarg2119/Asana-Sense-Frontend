import React from 'react';
import { motion } from 'motion/react';
import {
  Sliders,
  Grid,
  X,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  AlertTriangle,
  Play
} from 'lucide-react';
import { ALL_POSES } from '../data/yogaPoses';
import type { YogaPose, SessionPoseRecord } from '../types';
import { PoseVisualArtwork } from './PoseVisualArtwork';

export interface PoseDrawerProps {
  isDrawerOpen: boolean;
  splitPercent: number;
  drawerShelfMode: 'grid' | 'card';
  activeCardTab: 'all' | 'pros' | 'cons';
  referenceDisplayMode: 'photo' | 'artwork';
  selectedPoseIndex: number | null;
  currentPose: YogaPose | null;
  poseTheme: { ring: string; text: string; bg: string; border: string };
  poseRecords: Record<string, SessionPoseRecord>;
  isPoseActive: boolean;
  poseGridScrollRef: React.RefObject<HTMLDivElement | null>;
  onCloseDrawer: () => void;
  onSetDrawerShelfMode: (mode: 'grid' | 'card') => void;
  onSetActiveCardTab: (tab: 'all' | 'pros' | 'cons') => void;
  onSetReferenceDisplayMode: (mode: 'photo' | 'artwork') => void;
  onSelectPose: (index: number) => void;
  onConfirmReadyAndStart: () => void;
}

export const PoseDrawer: React.FC<PoseDrawerProps> = ({
  isDrawerOpen: _isDrawerOpen,
  splitPercent,
  drawerShelfMode,
  activeCardTab,
  referenceDisplayMode,
  selectedPoseIndex,
  currentPose,
  poseTheme,
  poseRecords,
  isPoseActive,
  poseGridScrollRef,
  onCloseDrawer,
  onSetDrawerShelfMode,
  onSetActiveCardTab,
  onSetReferenceDisplayMode,
  onSelectPose,
  onConfirmReadyAndStart,
}) => {
  return (
    <motion.div
      key="yoga-pose-drawer"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{ width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${100 - splitPercent}%` : '100%' }}
      className="flex flex-col space-y-2.5 min-w-0 transition-[width] duration-75 lg:pl-2.5 h-full min-h-0 relative z-30 pointer-events-auto"
    >
      {/* Drawer Main Container */}
      <div className="bg-stone-900/95 rounded-3xl p-3.5 sm:p-4 border border-stone-800 shadow-2xl flex flex-col h-full min-h-0 overflow-hidden">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800 shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <Sliders className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider truncate">
                Yoga Pose (8 Poses)
              </h2>
              <p className="text-[10px] text-stone-400 truncate">
                {drawerShelfMode === 'grid' ? '8 Asanas Shelves (2×4 Table Grid)' : `${currentPose?.name || 'Select Asana'} • Pros & Cons`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Switch between Full 2x4 Grid and Shrunken/Card Mode */}
            <button
              onClick={() => onSetDrawerShelfMode(drawerShelfMode === 'grid' ? 'card' : 'grid')}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border ${
                drawerShelfMode === 'grid'
                  ? 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                  : 'bg-emerald-600/90 text-white border-emerald-500 hover:bg-emerald-500 shadow-xs'
              }`}
              title={drawerShelfMode === 'grid' ? 'Collapse table into Focused Pose Details' : 'Expand back to 2×4 Grid'}
            >
              <Grid className="w-3 h-3" />
              <span>{drawerShelfMode === 'grid' ? 'Focus Pose Details' : '2×4 Grid'}</span>
            </button>

            <button
              onClick={onCloseDrawer}
              className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition cursor-pointer"
              title="Hide Yoga Pose Drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Drawer Content */}
        <div ref={poseGridScrollRef} className="flex-1 overflow-y-auto pr-1 py-3 space-y-4 scrollbar-thin scrollbar-thumb-stone-700">
          
          {/* CASE 1: FULL 2×4 GRID TABLE VIEW */}
          {drawerShelfMode === 'grid' ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Select Asana From 2×4 Shelves (Click to Select):
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {ALL_POSES.map((pose, idx) => {
                  const isSelected = idx === selectedPoseIndex;
                  const isDone = (poseRecords[pose.id]?.durationSeconds || 0) > 0;

                  return (
                    <motion.button
                      key={pose.id}
                      onClick={() => onSelectPose(idx)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between relative group ${
                        isSelected
                          ? `bg-stone-800/90 border-emerald-500 ring-2 ring-emerald-400 shadow-md`
                          : 'bg-stone-950/80 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-stone-950 mb-2 relative">
                        <img
                          src={pose.imageUrl}
                          alt={pose.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          referrerPolicy="no-referrer"
                        />
                        {isDone && (
                          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold shadow-xs">
                            ✓
                          </span>
                        )}
                      </div>

                      <div>
                        <span className={`text-[11px] font-bold block truncate leading-tight ${isSelected ? 'text-emerald-300' : 'text-stone-200'}`}>
                          {pose.name}
                        </span>
                        <span className="text-[9px] text-stone-400 font-serif italic block truncate">
                          {pose.sanskritName}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* CASE 2: CLEAN DETAIL-ONLY VIEW (POSE IMAGE + PROS & CONS) */
            currentPose ? (
              <div className="space-y-4">
                <div className="bg-stone-950/90 rounded-2xl p-4 border border-stone-800 space-y-3.5">
                  {/* Header & Tabs */}
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <div>
                      <span className={`text-[10px] font-bold font-serif italic ${poseTheme.text}`}>
                        {currentPose.sanskritName}
                      </span>
                      <h3 className="text-base font-bold text-white leading-tight">
                        {currentPose.name}
                      </h3>
                    </div>

                    {/* Tabs: All / Pros / Cons */}
                    <div className="flex items-center bg-stone-900 p-0.5 rounded-lg border border-stone-800 text-[10px]">
                      <button
                        onClick={() => onSetActiveCardTab('all')}
                        className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                          activeCardTab === 'all' ? 'bg-emerald-700 text-white' : 'text-stone-400 hover:text-white'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => onSetActiveCardTab('pros')}
                        className={`px-2 py-0.5 rounded font-bold transition cursor-pointer flex items-center gap-0.5 ${
                          activeCardTab === 'pros' ? 'bg-emerald-600 text-white' : 'text-emerald-400 hover:text-emerald-300'
                        }`}
                      >
                        <ThumbsUp className="w-2.5 h-2.5" /> Pros
                      </button>
                      <button
                        onClick={() => onSetActiveCardTab('cons')}
                        className={`px-2 py-0.5 rounded font-bold transition cursor-pointer flex items-center gap-0.5 ${
                          activeCardTab === 'cons' ? 'bg-rose-700 text-white' : 'text-rose-400 hover:text-rose-300'
                        }`}
                      >
                        <ThumbsDown className="w-2.5 h-2.5" /> Cons
                      </button>
                    </div>
                  </div>

                  {/* Pose Image Reference */}
                  <div className="aspect-[16/10] w-full rounded-xl overflow-hidden bg-stone-900 border border-stone-800 relative">
                    {referenceDisplayMode === 'photo' ? (
                      <img
                        src={currentPose.imageUrl}
                        alt={currentPose.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-3">
                        <PoseVisualArtwork poseId={currentPose.id} highlightJoints={true} />
                      </div>
                    )}

                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-lg bg-stone-950/80 text-[9px] text-stone-200 font-semibold backdrop-blur-xs">
                      Hold: {currentPose.idealHoldDurationSeconds}s
                    </div>

                    <button
                      onClick={() => onSetReferenceDisplayMode(referenceDisplayMode === 'photo' ? 'artwork' : 'photo')}
                      className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-lg bg-stone-950/80 text-[9px] text-stone-300 hover:text-white backdrop-blur-xs cursor-pointer border border-stone-700"
                    >
                      {referenceDisplayMode === 'photo' ? '⚡ Skeleton' : '📷 Photo'}
                    </button>
                  </div>

                  {/* Start Pose Button Inside Drawer for quick activation */}
                  {!isPoseActive && (
                    <button
                      onClick={onConfirmReadyAndStart}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>I'm Ready • Start {currentPose.name}</span>
                    </button>
                  )}

                  {/* PROS (Benefits & Target Muscles) */}
                  {(activeCardTab === 'all' || activeCardTab === 'pros') && (
                    <div className="bg-emerald-950/50 border border-emerald-600/40 rounded-xl p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-emerald-400 font-bold text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" /> PROS: Benefits & Muscles
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                          Positive
                        </span>
                      </div>
                      <ul className="text-stone-200 text-[11px] space-y-1.5">
                        {currentPose.benefits.map((b, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="pt-1.5 border-t border-emerald-800/40 flex flex-wrap gap-1">
                        {currentPose.targetMuscles.map((m) => (
                          <span key={m} className="px-2 py-0.5 rounded bg-stone-900 text-stone-300 text-[9px]">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CONS (Wrong Posture Impacts & Danger Zones) */}
                  {(activeCardTab === 'all' || activeCardTab === 'cons') && (
                    <div className="bg-rose-950/50 border border-rose-600/40 rounded-xl p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-rose-400 font-bold text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <ThumbsDown className="w-3.5 h-3.5 text-rose-400" /> CONS: Mistakes & Risks
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">
                          Harmful Errors
                        </span>
                      </div>
                      <div className="space-y-2">
                        {currentPose.wrongPostureImpacts.map((w, i) => (
                          <div key={i} className="bg-stone-950/80 p-2.5 rounded-lg border border-rose-900/40 text-[10px] space-y-1">
                            <p className="text-rose-200 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                              {w.mistake}
                            </p>
                            <p className="text-rose-300/80"><strong>Risk:</strong> {w.impact}</p>
                            <p className="text-emerald-300"><strong>Correction:</strong> {w.correction}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-stone-400 text-xs">
                Click on any pose from the 2×4 grid to view details.
              </div>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
};
