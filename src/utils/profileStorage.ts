/**
 * Profile & session storage — API-first with localStorage fallback.
 */
import type { PracticeSession, UserProfile } from '../types';
import { apiGetMe, apiSaveSession, apiFetchSessions, getToken, apiUpdateProfile } from './apiClient';

const STORAGE_KEY_USER = 'asana_sense_user_profile_v2';
const STORAGE_KEY_SESSIONS = 'asana_sense_sessions_v2';

// ── Persistent Custom Display Name Registry ─────────────────────────────────

const STORAGE_KEY_CUSTOM_NAMES = 'asana_user_custom_names_v1';

export function getCustomNameRegistry(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_NAMES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setCustomDisplayName(email: string, name: string): void {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanName = (name || '').trim();
  if (!cleanEmail || !cleanName) return;
  try {
    const reg = getCustomNameRegistry();
    reg[cleanEmail] = cleanName;
    localStorage.setItem(STORAGE_KEY_CUSTOM_NAMES, JSON.stringify(reg));
  } catch (e) {
    console.warn('[profileStorage] Failed to save custom display name:', e);
  }
}

export function removeCustomDisplayName(email: string): void {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return;
  try {
    const reg = getCustomNameRegistry();
    delete reg[cleanEmail];
    localStorage.setItem(STORAGE_KEY_CUSTOM_NAMES, JSON.stringify(reg));
  } catch {
    // ignore
  }
}

export function applyCustomDisplayName(user: UserProfile | null): UserProfile | null {
  if (!user || !user.email) return user;
  const cleanEmail = user.email.trim().toLowerCase();
  const reg = getCustomNameRegistry();
  const customName = reg[cleanEmail];
  if (customName && customName.trim()) {
    const trimmed = customName.trim();
    const avatar = trimmed.slice(0, 2).toUpperCase();
    return {
      ...user,
      name: trimmed,
      display_name: trimmed,
      full_name: trimmed,
      avatarSeed: avatar,
      avatar_seed: avatar,
    };
  }
  return user;
}

// ── User Profile ─────────────────────────────────────────────────────────────

export function getStoredUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    const user = JSON.parse(raw);
    return applyCustomDisplayName(user);
  } catch {
    return null;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    const cleanProfile = applyCustomDisplayName(profile) || profile;
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(cleanProfile));
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
      const mergedUser = applyCustomDisplayName(data.user) || data.user;
      saveUserProfile(mergedUser); // sync to localStorage as cache
      return mergedUser;
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
  const current = getStoredUserProfile();
  const cleanEmail = (current?.email || '').trim().toLowerCase();

  if (updates.name && cleanEmail) {
    setCustomDisplayName(cleanEmail, updates.name.trim());
  }

  try {
    const data = await apiUpdateProfile(updates);
    if (data.success && data.user) {
      if (updates.name && cleanEmail) {
        setCustomDisplayName(cleanEmail, updates.name.trim());
      }
      const merged = applyCustomDisplayName(data.user) || data.user;
      saveUserProfile(merged);
      return merged;
    }
  } catch (e) {
    console.warn('API profile update failed:', e);
  }

  if (current) {
    const updated = applyCustomDisplayName({ ...current, ...updates }) || current;
    saveUserProfile(updated);
    return updated;
  }
  return null;
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export function getStoredSessions(): PracticeSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    
    // Deduplicate sessions by unique id
    const seen = new Set<string>();
    const unique: PracticeSession[] = [];
    for (const item of parsed) {
      if (!item) continue;
      const id = item.id || (item as any)._id || (item as any).start_time?.toString() || (item as any).startTime?.toString();
      if (id) {
        if (seen.has(id)) continue;
        seen.add(id);
      }
      unique.push(item);
    }
    return unique;
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

  const sessionId = session.id || ('session_' + Date.now());

  const normalizedSession: PracticeSession = {
    ...session,
    id: sessionId,
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

  // Save to localStorage immediately with de-duplication
  try {
    const current = getStoredSessions().filter((s) => (s.id || (s as any)._id) !== sessionId);
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

/**
 * Delete a session from localStorage and update user stats.
 */
export function deleteStoredSession(sessionId: string): PracticeSession[] {
  try {
    const current = getStoredSessions();
    const updated = current.filter((s) => (s.id || (s as any)._id) !== sessionId);
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updated));

    // Recalculate and update user stats
    const user = getStoredUserProfile();
    if (user) {
      const totalSess = updated.length;
      const totalDurationAll = updated.reduce((acc, s) => {
        const sec = s.totalDurationSeconds ?? (s as any).total_duration_seconds ?? 0;
        return acc + (isNaN(sec) ? 0 : sec);
      }, 0);
      const totalScoreAll = updated.reduce((acc, s) => {
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

    return updated;
  } catch (e) {
    console.error('Failed to delete session:', e);
    return getStoredSessions();
  }
}

// ── Logout & Account Deletion ─────────────────────────────────────────────

export function clearUserSessionData(): void {
  localStorage.removeItem(STORAGE_KEY_USER);
  localStorage.removeItem(STORAGE_KEY_SESSIONS);
  localStorage.removeItem('asana_user_answers');
}

export async function permanentlyDeleteUserAccount(): Promise<boolean> {
  try {
    const { apiDeleteAccount } = await import('./apiClient');
    await apiDeleteAccount();
  } catch (err) {
    console.warn('[Storage] Remote account deletion error:', err);
  }
  clearUserSessionData();
  const { clearToken } = await import('./apiClient');
  clearToken();
  sessionStorage.clear();
  return true;
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

  if (!Array.isArray(sessions)) return {};

  sessions.forEach((sess) => {
    if (!sess) return;
    const poses = sess.posesRecorded || (sess as any).poses_recorded || [];
    if (!Array.isArray(poses)) return;

    poses.forEach((pose: any) => {
      if (!pose) return;
      const id = pose.poseId || pose.pose_id;
      if (!id) return;

      const acc = Number(pose.accuracyScore ?? pose.accuracy_score ?? 0);
      const hold = Number(pose.bestHoldSeconds ?? pose.best_hold_seconds ?? pose.durationSeconds ?? pose.duration_seconds ?? 0);

      // Only count if practitioner actually held the pose for at least 3 seconds with valid alignment
      if (hold >= 3 && acc > 0) {
        if (!counts[id]) {
          counts[id] = { count: 0, bestAccuracy: 0 };
        }
        counts[id].count += 1;
        if (acc > counts[id].bestAccuracy) {
          counts[id].bestAccuracy = acc;
        }
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

