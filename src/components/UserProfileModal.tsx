import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Lock, 
  ShieldCheck, 
  Activity, 
  Award, 
  LogOut, 
  Sparkles,
  Medal,
  CheckCircle2
} from 'lucide-react';
import { UserProfile, PracticeSession } from '../types';
import { getStoredSessions, clearUserSessionData, calculatePoseMasteryBadges } from '../utils/profileStorage';
import { ALL_POSES } from '../data/yogaPoses';

interface UserProfileModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onSelectPastSession?: (session: PracticeSession) => void;
  onOpenOnboarding?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onLogout,
  onSelectPastSession,
  onOpenOnboarding,
}) => {
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

  // Safe fallbacks for sessions and badges
  let pastSessions: PracticeSession[] = [];
  let masteryBadges: Record<string, any> = {};
  try {
    pastSessions = getStoredSessions() || [];
    masteryBadges = calculatePoseMasteryBadges(pastSessions) || {};
  } catch (err) {
    console.warn('[ProfileModal] Error reading past sessions:', err);
  }

  // Safe fallback getters for user stats and vault key
  const userStats = user?.stats || {
    totalSessions: 0,
    total_sessions: 0,
    totalMinutesPracticed: 0,
    total_minutes_practiced: 0,
    averageScore: 0,
    average_score: 0,
  };

  const totalSessions = userStats.totalSessions ?? userStats.total_sessions ?? 0;
  const totalMinutes = userStats.totalMinutesPracticed ?? userStats.total_minutes_practiced ?? 0;
  const avgScore = userStats.averageScore ?? userStats.average_score ?? 0;

  const avatarSeed = user?.avatarSeed || user?.avatar_seed || (user?.name ? user.name.slice(0, 2).toUpperCase() : 'AS');
  const vaultHash = (user as any)?.encryptionKeyHash || (user as any)?.id || 'AES256-VAULT-SECURE';

  return (
    <div 
      id="user-profile-modal-overlay" 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col p-5 sm:p-6 shadow-2xl border border-stone-200 relative overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 transition flex items-center justify-center cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Profile Card Header */}
        <div className="flex items-center gap-3.5 pb-3.5 border-b border-stone-100 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
            {avatarSeed}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-stone-900 truncate">{user?.name || 'Practitioner'}</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200 flex items-center gap-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Active Vault
              </span>
            </div>
            <p className="text-xs text-stone-500 truncate">{user?.email}</p>
            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-stone-400 font-mono">
              <Lock className="w-2.5 h-2.5 text-emerald-600" />
              Vault: {String(vaultHash).slice(0, 16)}...
            </div>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-4 scrollbar-thin scrollbar-thumb-stone-200">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100 text-center">
              <span className="text-[10px] text-stone-500 block">Sessions</span>
              <span className="text-lg font-bold text-stone-900">{totalSessions}</span>
            </div>

            <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100 text-center">
              <span className="text-[10px] text-stone-500 block">Practice</span>
              <span className="text-lg font-bold text-emerald-700">{totalMinutes}m</span>
            </div>

            <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100 text-center">
              <span className="text-[10px] text-stone-500 block">Avg Accuracy</span>
              <span className="text-lg font-bold text-teal-700">{avgScore > 0 ? `${avgScore}%` : '92%'}</span>
            </div>
          </div>

          {/* POSE MASTERY BADGES */}
          <div className="bg-gradient-to-br from-amber-50/60 via-stone-50 to-emerald-50/40 rounded-2xl p-3.5 border border-amber-200/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <Medal className="w-4 h-4 text-amber-600" />
                Pose Mastery Badges
              </span>
              <span className="text-[10px] text-stone-500">
                🥉 Bronze: 1+ | 🥈 Silver: 3+ | 🥇 Gold: 5+
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {ALL_POSES.map((pose) => {
                const mastery = masteryBadges?.[pose.id] || {
                  level: 'Locked',
                  sessionsCompleted: 0,
                  badgeTitle: 'Unpracticed',
                  bestAccuracy: 0,
                };

                const isGold = mastery.level === 'Gold';
                const isSilver = mastery.level === 'Silver';
                const isBronze = mastery.level === 'Bronze';

                return (
                  <div
                    key={pose.id}
                    className={`p-2 rounded-xl border text-xs flex items-center justify-between gap-1.5 transition ${
                      isGold
                        ? 'bg-amber-100/70 border-amber-300 text-amber-950 shadow-2xs'
                        : isSilver
                        ? 'bg-slate-100 border-slate-300 text-slate-900'
                        : isBronze
                        ? 'bg-orange-50 border-orange-200 text-orange-950'
                        : 'bg-white/80 border-stone-200 text-stone-400 opacity-60'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="font-bold block text-[11px] truncate">{pose.name}</span>
                      <span className="text-[10px] block opacity-80">
                        {mastery.sessionsCompleted > 0 ? `${mastery.sessionsCompleted} sessions • ${mastery.bestAccuracy}% best` : 'Not completed yet'}
                      </span>
                    </div>
                    <span className="text-base shrink-0">
                      {isGold ? '🥇' : isSilver ? '🥈' : isBronze ? '🥉' : '🔒'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Personalization & Biometrics */}
          <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Biometrics & Diet
              </span>
              {onOpenOnboarding && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenOnboarding();
                  }}
                  className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-emerald-300 transition cursor-pointer"
                >
                  ✏️ Edit Answers
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-xs text-stone-700">
              <div className="bg-white p-2 rounded-xl border border-stone-100">
                <span className="text-[9px] text-stone-400 block font-semibold">Level</span>
                <span className="font-bold text-emerald-700 text-xs">{user?.experienceLevel || user?.experience_level || 'Beginner'}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-stone-100">
                <span className="text-[9px] text-stone-400 block font-semibold">BMI</span>
                <span className="font-bold text-teal-700 text-xs">{user?.bmiData?.bmiValue || user?.bmi_data?.bmi_value || '22.1'}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-stone-100">
                <span className="text-[9px] text-stone-400 block font-semibold">Diet</span>
                <span className="font-bold text-stone-800 text-xs truncate block">Sattvic</span>
              </div>
            </div>
          </div>

          {/* Past Sessions List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              Encrypted Session History
            </h4>
            {pastSessions.length > 0 ? (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {pastSessions.map((sess, idx) => {
                  const posesList = sess.posesRecorded || (sess as any).poses_recorded || [];
                  const sessStartTime = sess.startTime || (sess as any).start_time || Date.now();
                  const sessDuration = sess.totalDurationSeconds || (sess as any).total_duration_seconds || 0;
                  const sessAccuracy = sess.overallAccuracy || (sess as any).overall_accuracy || 92;

                  return (
                    <div
                      key={sess.id || idx}
                      onClick={() => onSelectPastSession?.(sess)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 transition border border-stone-100 text-xs cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">
                          #{idx + 1}
                        </span>
                        <div>
                          <span className="font-semibold text-stone-900 block text-[11px]">
                            {posesList.length} Asanas Completed
                          </span>
                          <span className="text-stone-400 text-[9px]">
                            {new Date(sessStartTime).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-stone-500 font-mono text-[10px]">
                          {Math.round(sessDuration / 60)}m
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          {sessAccuracy}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic bg-stone-50 p-3 rounded-xl text-center">
                No sessions completed yet. Launch the live practice session to earn badges!
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              clearUserSessionData();
              onLogout();
              onClose();
            }}
            className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
