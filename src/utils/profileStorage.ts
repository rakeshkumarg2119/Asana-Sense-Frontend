import { PracticeSession, UserProfile } from '../types';

const STORAGE_KEY_USER = 'asana_sense_user_profile_v1';
const STORAGE_KEY_SESSIONS = 'asana_sense_sessions_v1';

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

export function createInitialAccount(name: string, email: string): UserProfile {
  const encKey = 'AES256-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-ENCRYPTED';
  const profile: UserProfile = {
    id: 'user_' + Date.now(),
    name,
    email,
    isAccountActive: true,
    avatarSeed: name.slice(0, 2).toUpperCase(),
    encryptionKeyHash: encKey,
    memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    hasCompletedOnboarding: false,
    stats: {
      totalSessions: 0,
      totalMinutesPracticed: 0,
      averageScore: 0,
      favoritePose: 'Tree Pose (Vrikshasana)',
    },
  };
  saveUserProfile(profile);
  return profile;
}

export function createTestAccount(): UserProfile {
  const encKey = 'AES256-DEMO-TEST-KEY-ENCRYPTED';
  const profile: UserProfile = {
    id: 'user_test_demo',
    name: 'Maya Chen (Test Yogi)',
    email: 'test@asanasense.com',
    isAccountActive: true,
    avatarSeed: 'MC',
    encryptionKeyHash: encKey,
    memberSince: 'Aug 2026',
    hasCompletedOnboarding: true,
    ageCategory: '26-40',
    experienceLevel: 'Intermediate',
    stats: {
      totalSessions: 6,
      totalMinutesPracticed: 48,
      averageScore: 92,
      favoritePose: 'Warrior II (Virabhadrasana II)',
    },
    bmiData: {
      weightKg: 64,
      heightCm: 170,
      age: 29,
      gender: 'Female',
      bmiValue: 22.1,
      bmiCategory: 'Normal weight (Optimal)',
      dietaryPreference: 'Sattvic (Ayurvedic Plant-Based)',
      calculatedAt: new Date().toLocaleDateString(),
    },
  };
  saveUserProfile(profile);
  return profile;
}

export function getStoredSessions(): PracticeSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveSessionRecord(session: PracticeSession): void {
  try {
    const current = getStoredSessions();
    current.unshift(session);
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(current.slice(0, 30)));

    // Update user stats
    const user = getStoredUserProfile();
    if (user) {
      const totalSess = current.length;
      const totalMins = Math.round(current.reduce((acc, s) => acc + s.totalDurationSeconds, 0) / 60);
      const avgScore = Math.round(current.reduce((acc, s) => acc + s.overallAccuracy, 0) / totalSess);
      user.stats.totalSessions = totalSess;
      user.stats.totalMinutesPracticed = totalMins;
      user.stats.averageScore = avgScore;
      saveUserProfile(user);
    }
  } catch (e) {
    console.error('Failed to save session:', e);
  }
}

export function clearUserSessionData(): void {
  localStorage.removeItem(STORAGE_KEY_USER);
  localStorage.removeItem(STORAGE_KEY_SESSIONS);
}

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
    sess.posesRecorded.forEach((pose) => {
      if (!counts[pose.poseId]) {
        counts[pose.poseId] = { count: 0, bestAccuracy: 0 };
      }
      counts[pose.poseId].count += 1;
      if (pose.accuracyScore > counts[pose.poseId].bestAccuracy) {
        counts[pose.poseId].bestAccuracy = pose.accuracyScore;
      }
    });
  });

  const result: Record<string, PoseMasteryInfo> = {};
  const allPoseIds = [
    'tree-pose',
    'warrior-2',
    'downward-dog',
    'cobra-pose',
    'triangle-pose',
    'bridge-pose',
    'lotus-pose',
    'childs-pose',
  ];

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
