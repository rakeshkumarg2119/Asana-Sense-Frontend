/**
 * Profile & session storage — API-first with localStorage fallback.
 */
import type { PracticeSession, UserProfile } from '../types';
import { apiGetMe, apiSaveSession, apiFetchSessions, getToken, apiUpdateProfile } from './apiClient';

const STORAGE_KEY_USER = 'asana_sense_user_profile_v2';
const STORAGE_KEY_SESSIONS = 'asana_sense_sessions_v2';

// ── User Profile ─────────────────────────────────────────────────────────────

export function getStoredUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile:', e);
  }
}

/**
 * Fetch user profile from API (JWT-authenticated).
 * Falls back to localStorage if API is unavailable.
 */
export async function fetchUserProfileFromAPI(): Promise<UserProfile | null> {
  const token = getToken();
  if (!token) return getStoredUserProfile();

  try {
    const data = await apiGetMe();
    if (data.success && data.user) {
      saveUserProfile(data.user); // sync to localStorage as cache
      return data.user;
    }
  } catch (e) {
    console.warn('API profile fetch failed, using cached:', e);
  }
  return getStoredUserProfile();
}

/**
 * Update profile on the API and sync to localStorage.
 */
export async function updateProfileOnAPI(updates: Record<string, any>): Promise<UserProfile | null> {
  try {
    const data = await apiUpdateProfile(updates);
    if (data.success && data.user) {
      saveUserProfile(data.user);
      return data.user;
    }
  } catch (e) {
    console.warn('API profile update failed:', e);
  }
  return null;
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export function getStoredSessions(): PracticeSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Save session to API and localStorage.
 */
export async function saveSessionRecord(session: PracticeSession): Promise<void> {
  // Normalize session to contain both camelCase and snake_case properties
  const startTime = session.startTime || (session as any).start_time || Date.now();
  const endTime = session.endTime || (session as any).end_time || Date.now();
  const totalDurationSeconds = session.totalDurationSeconds ?? (session as any).total_duration_seconds ?? 60;
  const overallAccuracy = session.overallAccuracy ?? (session as any).overall_accuracy ?? 90;
  const caloriesBurnedEst = session.caloriesBurnedEst ?? (session as any).calories_burned_est ?? Math.max(14, Math.round((totalDurationSeconds / 60) * 4.8));
  const rawPoses = session.posesRecorded || (session as any).poses_recorded || [];

  const normalizedPoses = rawPoses.map((p: any) => ({
    poseId: p.poseId || p.pose_id || 'pose',
    pose_id: p.poseId || p.pose_id || 'pose',
    poseName: p.poseName || p.pose_name || 'Yoga Pose',
    pose_name: p.poseName || p.pose_name || 'Yoga Pose',
    sanskritName: p.sanskritName || p.sanskrit_name || '',
    sanskrit_name: p.sanskritName || p.sanskrit_name || '',
    durationSeconds: p.durationSeconds ?? p.duration_seconds ?? 0,
    duration_seconds: p.durationSeconds ?? p.duration_seconds ?? 0,
    bestHoldSeconds: p.bestHoldSeconds ?? p.best_hold_seconds ?? 0,
    best_hold_seconds: p.bestHoldSeconds ?? p.best_hold_seconds ?? 0,
    attemptsCount: p.attemptsCount ?? p.attempts_count ?? 1,
    attempts_count: p.attemptsCount ?? p.attempts_count ?? 1,
    accuracyScore: p.accuracyScore ?? p.accuracy_score ?? 0,
    accuracy_score: p.accuracyScore ?? p.accuracy_score ?? 0,
    cuesReceived: p.cuesReceived || p.cues_received || [],
    cues_received: p.cuesReceived || p.cues_received || [],
    status: p.status || 'completed',
  }));

  const normalizedSession: PracticeSession = {
    ...session,
    id: session.id || ('session_' + Date.now()),
    startTime,
    start_time: startTime,
    endTime,
    end_time: endTime,
    totalDurationSeconds,
    total_duration_seconds: totalDurationSeconds,
    overallAccuracy,
    overall_accuracy: overallAccuracy,
    caloriesBurnedEst,
    calories_burned_est: caloriesBurnedEst,
    posesRecorded: normalizedPoses,
    poses_recorded: normalizedPoses,
    aiReport: session.aiReport || (session as any).ai_report || null,
    ai_report: session.aiReport || (session as any).ai_report || null,
  };

  // Save to localStorage immediately
  try {
    const current = getStoredSessions();
    current.unshift(normalizedSession);
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(current.slice(0, 30)));
  } catch (e) {
    console.error('Failed to save session locally:', e);
  }

  // Save to API (MongoDB via FastAPI)
  try {
    const apiPayloadPoses = normalizedPoses.map((p) => ({
      pose_id: p.pose_id,
      pose_name: p.pose_name,
      sanskrit_name: p.sanskrit_name,
      duration_seconds: p.duration_seconds,
      best_hold_seconds: p.best_hold_seconds,
      attempts_count: p.attempts_count,
      accuracy_score: p.accuracy_score,
      cues_received: p.cues_received,
      status: p.status as 'completed' | 'skipped' | 'practicing',
    }));

    await apiSaveSession({
      start_time: startTime,
      end_time: endTime,
      total_duration_seconds: totalDurationSeconds,
      poses_recorded: apiPayloadPoses,
      overall_accuracy: overallAccuracy,
      calories_burned_est: caloriesBurnedEst,
      ai_report: normalizedSession.aiReport,
    });
  } catch (e) {
    console.warn('API session save failed (saved locally in storage):', e);
  }

  // Update local user stats safely without NaN
  const user = getStoredUserProfile();
  if (user) {
    const allSessions = getStoredSessions();
    const totalSess = allSessions.length;
    const totalDurationAll = allSessions.reduce((acc, s) => {
      const sec = s.totalDurationSeconds ?? (s as any).total_duration_seconds ?? 0;
      return acc + (isNaN(sec) ? 0 : sec);
    }, 0);
    const totalScoreAll = allSessions.reduce((acc, s) => {
      const sc = s.overallAccuracy ?? (s as any).overall_accuracy ?? 0;
      return acc + (isNaN(sc) ? 0 : sc);
    }, 0);

    const totalMins = Math.round(totalDurationAll / 60);
    const avgScore = totalSess > 0 ? Math.round(totalScoreAll / totalSess) : 0;

    user.stats = {
      ...(user.stats || {}),
      total_sessions: totalSess,
      totalSessions: totalSess,
      total_minutes_practiced: totalMins,
      totalMinutesPracticed: totalMins,
      average_score: avgScore,
      averageScore: avgScore,
    };
    saveUserProfile(user);
  }
}

/**
 * Fetch sessions from API with localStorage fallback.
 */
export async function fetchSessionsFromAPI(): Promise<PracticeSession[]> {
  try {
    const sessions = await apiFetchSessions();
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions.slice(0, 30)));
      return sessions;
    }
  } catch (e) {
    console.warn('API sessions fetch failed, using cached:', e);
  }
  return getStoredSessions();
}

// ── Logout ───────────────────────────────────────────────────────────────────

export function clearUserSessionData(): void {
  localStorage.removeItem(STORAGE_KEY_USER);
  localStorage.removeItem(STORAGE_KEY_SESSIONS);
}

// ── Pose Mastery Badges ──────────────────────────────────────────────────────

export interface PoseMasteryInfo {
  poseId: string;
  sessionsCompleted: number;
  bestAccuracy: number;
  level: 'Locked' | 'Bronze' | 'Silver' | 'Gold';
  badgeTitle: string;
  nextMilestone: number;
}

export function calculatePoseMasteryBadges(sessions: PracticeSession[]): Record<string, PoseMasteryInfo> {
  const counts: Record<string, { count: number; bestAccuracy: number }> = {};

  sessions.forEach((sess) => {
    sess.poses_recorded.forEach((pose) => {
      if (!counts[pose.pose_id]) {
        counts[pose.pose_id] = { count: 0, bestAccuracy: 0 };
      }
      counts[pose.pose_id].count += 1;
      if (pose.accuracy_score > counts[pose.pose_id].bestAccuracy) {
        counts[pose.pose_id].bestAccuracy = pose.accuracy_score;
      }
    });
  });

  const result: Record<string, PoseMasteryInfo> = {};
  const allPoseIds = ['chair', 'cobra', 'dog', 'shoulder_stand', 'triangle', 'tree', 'warrior'];

  allPoseIds.forEach((id) => {
    const data = counts[id] || { count: 0, bestAccuracy: 0 };
    let level: 'Locked' | 'Bronze' | 'Silver' | 'Gold' = 'Locked';
    let badgeTitle = 'Unpracticed';
    let nextMilestone = 1;

    if (data.count >= 5) {
      level = 'Gold';
      badgeTitle = '🥇 Gold Master';
      nextMilestone = 5;
    } else if (data.count >= 3) {
      level = 'Silver';
      badgeTitle = '🥈 Silver Practitioner';
      nextMilestone = 5;
    } else if (data.count >= 1) {
      level = 'Bronze';
      badgeTitle = '🥉 Bronze Initiate';
      nextMilestone = 3;
    }

    result[id] = {
      poseId: id,
      sessionsCompleted: data.count,
      bestAccuracy: data.bestAccuracy || 0,
      level,
      badgeTitle,
      nextMilestone,
    };
  });

  return result;
}
