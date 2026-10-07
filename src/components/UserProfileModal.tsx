import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Lock, 
  ShieldCheck, 
  Activity, 
  Award, 
  LogOut, 
  Sparkles, 
  Medal, 
  CheckCircle2, 
  Trash2, 
  AlertTriangle, 
  Edit2, 
  Check,
  Loader2,
  UserX,
  ShieldAlert
} from 'lucide-react';
import { UserProfile, PracticeSession } from '../types';
import { 
  getStoredSessions, 
  fetchSessionsFromAPI,
  deleteStoredSession, 
  clearUserSessionData, 
  calculatePoseMasteryBadges, 
  saveUserProfile,
  setCustomDisplayName,
  permanentlyDeleteUserAccount
} from '../utils/profileStorage';
import { updateProfileOnAPI } from '../utils/apiClient';
import { ALL_POSES } from '../data/yogaPoses';
import { useModalFocusTrap } from '../hooks/useModalFocusTrap';
import { ProgressTrendsChart } from './ProgressTrendsChart';

interface UserProfileModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onSelectPastSession?: (session: PracticeSession) => void;
  onOpenOnboarding?: () => void;
  onUpdateUser?: (updated: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onLogout,
  onSelectPastSession,
  onOpenOnboarding,
  onUpdateUser,
}) => {
  const containerRef = useModalFocusTrap({ isOpen, onClose });
  const [pastSessions, setPastSessions] = useState<PracticeSession[]>([]);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  
  // Display Name Editing State
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || 'Practitioner');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSaveFeedback, setNameSaveFeedback] = useState(false);

  // Permanent Account Deletion State & Confirmation Dialog
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Sync sessions and name on modal open or user prop changes
  useEffect(() => {
    if (isOpen) {
      // 1. Instantly display whatever is in storage
      try {
        const rawSessions = getStoredSessions() || [];
        const seen = new Set<string>();
        const unique = rawSessions.filter((s) => {
          const id = s.id || (s as any)._id || (s as any).start_time?.toString() || (s as any).startTime?.toString();
          if (id) {
            if (seen.has(id)) return false;
            seen.add(id);
          }
          return true;
        });
        setPastSessions(unique);
      } catch (err) {
        console.warn('[ProfileModal] Error reading past sessions:', err);
      }

      // 2. Fetch live session history from MongoDB backend
      fetchSessionsFromAPI().then((liveSessions) => {
        if (Array.isArray(liveSessions) && liveSessions.length > 0) {
          const seen = new Set<string>();
          const unique = liveSessions.filter((s) => {
            const id = s.id || (s as any)._id || (s as any).start_time?.toString() || (s as any).startTime?.toString();
            if (id) {
              if (seen.has(id)) return false;
              seen.add(id);
            }
            return true;
          });
          setPastSessions(unique);
        }
      }).catch((err) => {
        console.warn('[ProfileModal] Remote sessions fetch notice:', err);
      });

      setDeletingSessionId(null);
      setEditedName(user?.name || 'Practitioner');
      setIsEditingName(false);
      setShowDeleteAccountModal(false);
    }
  }, [isOpen, user?.name]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (showDeleteAccountModal) {
          setShowDeleteAccountModal(false);
        } else if (isEditingName) {
          setIsEditingName(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isEditingName, showDeleteAccountModal, onClose]);

  if (!isOpen) return null;

  // Calculate live badges directly from current sessions
  const masteryBadges = calculatePoseMasteryBadges(pastSessions) || {};

  // Compute live metrics directly from pastSessions state
  const totalSessions = pastSessions.length;
  const totalMinutes = Math.round(
    pastSessions.reduce((acc, s) => {
      const sec = Number(s.totalDurationSeconds ?? (s as any).total_duration_seconds ?? 0);
      return acc + (isNaN(sec) ? 0 : sec);
    }, 0) / 60
  );
  const avgScore = totalSessions > 0
    ? Math.round(
        pastSessions.reduce((acc, s) => {
          const sc = Number(s.overallAccuracy ?? (s as any).overall_accuracy ?? 0);
          return acc + (isNaN(sc) ? 0 : sc);
        }, 0) / totalSessions
      )
    : 0;

  const currentDisplayName = user?.name?.trim() || 'Practitioner';
  const avatarSeed = user?.avatarSeed || user?.avatar_seed || currentDisplayName.slice(0, 2).toUpperCase();
  const vaultHash = (user as any)?.encryptionKeyHash || (user as any)?.id || 'AES256-VAULT-SECURE';

  // Handle Delete Single Session
  const handleDeleteSession = (sessId: string) => {
    const updated = deleteStoredSession(sessId);
    setPastSessions(updated);
    setDeletingSessionId(null);

    // Compute updated profile stats
    const updatedTotalSess = updated.length;
    const updatedTotalMins = Math.round(
      updated.reduce((acc, s) => acc + Number(s.totalDurationSeconds ?? (s as any).total_duration_seconds ?? 0), 0) / 60
    );
    const updatedAvgScore = updatedTotalSess > 0
      ? Math.round(
          updated.reduce((acc, s) => acc + Number(s.overallAccuracy ?? (s as any).overall_accuracy ?? 0), 0) / updatedTotalSess
        )
      : 0;

    const updatedUser: UserProfile = {
      ...user,
      stats: {
        ...(user.stats || {}),
        totalSessions: updatedTotalSess,
        total_sessions: updatedTotalSess,
        totalMinutesPracticed: updatedTotalMins,
        total_minutes_practiced: updatedTotalMins,
        averageScore: updatedAvgScore,
        average_score: updatedAvgScore,
      },
    };

    saveUserProfile(updatedUser);
    onUpdateUser?.(updatedUser);
  };

  // Handle Save Display Name
  const handleSaveName = async () => {
    const trimmed = editedName.trim();
    if (!trimmed) return;

    setIsSavingName(true);
    if (user?.email) {
      setCustomDisplayName(user.email, trimmed);
    }
    const newAvatar = trimmed.slice(0, 2).toUpperCase();
    const updatedUser: UserProfile = {
      ...user,
      name: trimmed,
      display_name: trimmed,
      full_name: trimmed,
      avatarSeed: newAvatar,
      avatar_seed: newAvatar,
    };

    // Immediately persist to localStorage and notify app
    saveUserProfile(updatedUser);
    onUpdateUser?.(updatedUser);

    // Sync to API
    try {
      await updateProfileOnAPI({ name: trimmed });
      setNameSaveFeedback(true);
      setTimeout(() => setNameSaveFeedback(false), 2000);
    } catch (err) {
      console.warn('[ProfileModal] Failed to sync name to API:', err);
    } finally {
      setIsSavingName(false);
      setIsEditingName(false);
    }
  };

  // Handle Permanent Account Deletion
  const handleConfirmPermanentAccountDeletion = async () => {
    setIsDeletingAccount(true);
    try {
      await permanentlyDeleteUserAccount();
      onLogout();
      onClose();
    } catch (err) {
      console.error('[ProfileModal] Account deletion error:', err);
      // Ensure local state is wiped even if remote API fails
      clearUserSessionData();
      onLogout();
      onClose();
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteAccountModal(false);
    }
  };

  return (
    <div 
      id="user-profile-modal-overlay" 
      onClick={(e) => {
        if (e.target === e.currentTarget && !showDeleteAccountModal) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-profile-modal-title"
    >
      <motion.div
        ref={containerRef}
        tabIndex={-1}
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl max-w-lg w-full max-h-[88vh] flex flex-col p-5 sm:p-6 shadow-2xl border border-stone-200 relative overflow-hidden focus:outline-hidden"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close user profile modal"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 transition flex items-center justify-center cursor-pointer z-10 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Profile Card Header */}
        <div className="flex items-center gap-3.5 pb-3.5 border-b border-stone-100 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
            {avatarSeed}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {isEditingName ? (
                <div className="flex items-center gap-1.5 my-0.5">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                    autoFocus
                    maxLength={32}
                    placeholder="Enter display name"
                    className="px-2.5 py-1 text-sm font-bold text-stone-900 border-2 border-emerald-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={handleSaveName}
                    disabled={isSavingName || !editedName.trim()}
                    className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer disabled:opacity-50 flex items-center justify-center shadow-xs"
                    title="Save Display Name"
                  >
                    {isSavingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditedName(user?.name || 'Practitioner');
                      setIsEditingName(false);
                    }}
                    className="p-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 transition cursor-pointer flex items-center justify-center"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="text-lg font-bold text-stone-900 truncate">
                    {currentDisplayName}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditedName(currentDisplayName);
                      setIsEditingName(true);
                    }}
                    className="p-1 text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition cursor-pointer"
                    title="Edit display name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {nameSaveFeedback && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 animate-in fade-in">
                      <Check className="w-3 h-3" /> Saved
                    </span>
                  )}
                </div>
              )}
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
          {/* Quick Metrics Grid - Calculated Live from pastSessions */}
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
              <span className="text-lg font-bold text-teal-700">{avgScore > 0 ? `${avgScore}%` : '0%'}</span>
            </div>
          </div>

          {/* 30-DAY PROGRESS TRENDS CHART (RECHARTS DUAL-AXIS COMBO) */}
          <ProgressTrendsChart 
            sessions={pastSessions} 
            userExperience={user?.experienceLevel || user?.experience_level} 
          />

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
                <span className="text-[9px] text-stone-400 block font-semibold">Age Bracket</span>
                <span className="font-bold text-stone-800 text-xs">
                  {user.ageCategory || user.age_category || '26-40'}
                </span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-stone-100">
                <span className="text-[9px] text-stone-400 block font-semibold">Experience</span>
                <span className="font-bold text-stone-800 text-xs">
                  {user.experienceLevel || user.experience_level || 'Beginner'}
                </span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-stone-100">
                <span className="text-[9px] text-stone-400 block font-semibold">Diet</span>
                <span className="font-bold text-stone-800 text-xs truncate block">
                  {user.bmiData?.dietaryPreference || user.bmiData?.dietary_preference || 'Sattvic'}
                </span>
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
                  const sessId = sess.id || (sess as any)._id || `sess-${idx}`;
                  const isDeleting = deletingSessionId === sessId;
                  const posesList = sess.posesRecorded || (sess as any).poses_recorded || [];
                  const sessStartTime = sess.startTime || (sess as any).start_time || Date.now();
                  const sessDuration = sess.totalDurationSeconds || (sess as any).total_duration_seconds || 0;
                  const sessAccuracy = sess.overallAccuracy || (sess as any).overall_accuracy || 92;

                  if (isDeleting) {
                    return (
                      <div
                        key={`${sessId}-${idx}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs flex items-center justify-between gap-2 transition animate-in fade-in"
                      >
                        <div className="flex items-center gap-1.5 text-rose-900 font-medium text-[11px] min-w-0">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span className="truncate">Delete #{idx + 1} permanently?</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(sessId);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-[10px] transition cursor-pointer shadow-2xs"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingSessionId(null);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 font-medium text-[10px] transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={`${sessId}-${idx}`}
                      onClick={() => onSelectPastSession?.(sess)}
                      className="group flex items-center justify-between p-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 transition border border-stone-100 text-xs cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="font-semibold text-stone-900 block text-[11px] truncate">
                            {posesList.length} {posesList.length === 1 ? 'Asana' : 'Asanas'} Completed
                          </span>
                          <span className="text-stone-400 text-[9px]">
                            {new Date(sessStartTime).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-stone-500 font-mono text-[10px]">
                          {Math.round(sessDuration / 60)}m
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          {sessAccuracy}%
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingSessionId(sessId);
                          }}
                          title="Delete session report"
                          className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition opacity-70 group-hover:opacity-100 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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

          {/* Danger Zone: Permanent Account Deletion Option */}
          <div className="pt-2 border-t border-stone-100">
            <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200/80 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-xs font-bold text-rose-900 block">
                  Account Management
                </span>
                <span className="text-[10px] text-rose-700 block truncate">
                  Permanently erase account, biometric vault & session history
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteAccountModal(true)}
                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-100 border border-rose-300 text-rose-700 hover:text-rose-900 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0 shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete Account</span>
              </button>
            </div>
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
          <span className="text-[10px] text-stone-400">AES-256 Encrypted Profile</span>
        </div>

        {/* Permanent Account Deletion Confirmation Modal Overlay */}
        <AnimatePresence>
          {showDeleteAccountModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 10 }}
                className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-rose-200 text-center space-y-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
                  <ShieldAlert className="w-6 h-6 text-rose-600" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900">
                    Delete Account Permanently?
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    This action will permanently purge your profile (<strong>{user?.email}</strong>), {pastSessions.length} session telemetry reports, and personalized yogic nutrition plans.
                  </p>
                  <p className="text-[11px] font-semibold text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-200">
                    ⚠️ This action is irreversible. All data will be permanently wiped.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDeleteAccountModal(false)}
                    disabled={isDeletingAccount}
                    className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPermanentAccountDeletion}
                    disabled={isDeletingAccount}
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs transition cursor-pointer shadow-md shadow-rose-900/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isDeletingAccount ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <span>Yes, Delete Account</span>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
