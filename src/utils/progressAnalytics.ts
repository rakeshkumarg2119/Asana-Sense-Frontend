/**
 * 30-Day Progress Trends Aggregator for AsanaSense
 * Groups recorded user practice sessions into 30 daily buckets for Recharts.
 */
import { PracticeSession } from '../types';

export interface DailyTrendPoint {
  dateKey: string;         // 'YYYY-MM-DD'
  displayDate: string;     // 'Oct 2'
  fullDate: string;        // 'Oct 2, 2026'
  dayIndex: number;        // 1..30
  sessionCount: number;    // Number of sessions on this day
  avgAccuracy: number;     // Average accuracy score percentage (0-100)
  totalMinutes: number;    // Total practice minutes
  hasActivity: boolean;    // Whether user practiced on this day
}

export interface ProgressTrendsSummary {
  trendData: DailyTrendPoint[];
  totalSessions30d: number;
  totalMinutes30d: number;
  avgAccuracy30d: number;
  activeDaysCount: number;
  consistencyPercentage: number;
  accuracyTrendDelta: number; // e.g. +6% improvement over the 30-day span
}

/**
 * Format timestamp into YYYY-MM-DD key for grouping
 */
function toDateKey(timestamp: number | string | Date): string {
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Generates the last 30 consecutive calendar date slots ending today.
 */
export function generateLast30DaysSlots(): { dateKey: string; displayDate: string; fullDate: string; dayIndex: number }[] {
  const slots = [];
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateKey = toDateKey(d);
    const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const fullDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    slots.push({
      dateKey,
      displayDate,
      fullDate,
      dayIndex: 30 - i,
    });
  }

  return slots;
}


export interface ProgressTrendsSummary {
  trendData: DailyTrendPoint[];
  totalSessions30d: number;
  totalMinutes30d: number;
  avgAccuracy30d: number;
  activeDaysCount: number;
  consistencyPercentage: number;
  accuracyTrendDelta: number;
  hasData: boolean;
}

/**
 * Aggregates user's stored practice sessions into 30 daily buckets for Recharts.
 * Honest aggregation: returns zero/empty state when no sessions have been recorded.
 */
export function aggregate30DayProgressTrends(
  sessions: PracticeSession[],
  _userExperience: string = 'Beginner'
): ProgressTrendsSummary {
  const slots = generateLast30DaysSlots();
  const slotMap = new Map<string, { sessions: number; scores: number[]; durationSec: number }>();

  // Initialize slot map
  slots.forEach((s) => {
    slotMap.set(s.dateKey, { sessions: 0, scores: [], durationSec: 0 });
  });

  // Filter sessions from the last 30 days
  const thirtyDaysAgoTime = Date.now() - 30 * 24 * 60 * 60 * 1000;
  let realSessionsInWindowCount = 0;

  if (Array.isArray(sessions)) {
    sessions.forEach((s) => {
      if (!s) return;
      const rawTime = s.startTime ?? (s as any).start_time ?? (s as any).createdAt ?? (s as any).created_at;
      const timestamp = typeof rawTime === 'number' ? rawTime : rawTime ? new Date(rawTime).getTime() : null;
      
      if (timestamp && timestamp >= thirtyDaysAgoTime) {
        const key = toDateKey(timestamp);
        if (slotMap.has(key)) {
          realSessionsInWindowCount++;
          const entry = slotMap.get(key)!;
          entry.sessions += 1;
          
          const accuracy = Number(s.overallAccuracy ?? (s as any).overall_accuracy ?? 0);
          if (!isNaN(accuracy) && accuracy > 0) {
            entry.scores.push(accuracy);
          }
          
          const duration = Number(s.totalDurationSeconds ?? (s as any).total_duration_seconds ?? 0);
          if (!isNaN(duration) && duration > 0) {
            entry.durationSec += duration;
          }
        }
      }
    });
  }

  // If user has NO recorded sessions in the window: return clean honest empty summary
  if (realSessionsInWindowCount === 0) {
    const emptyTrendData: DailyTrendPoint[] = slots.map((slot) => ({
      dateKey: slot.dateKey,
      displayDate: slot.displayDate,
      fullDate: slot.fullDate,
      dayIndex: slot.dayIndex,
      sessionCount: 0,
      avgAccuracy: 0,
      totalMinutes: 0,
      hasActivity: false,
    }));

    return {
      trendData: emptyTrendData,
      totalSessions30d: 0,
      totalMinutes30d: 0,
      avgAccuracy30d: 0,
      activeDaysCount: 0,
      consistencyPercentage: 0,
      accuracyTrendDelta: 0,
      hasData: false,
    };
  }

  // Compile from real recorded sessions
  let lastKnownAccuracy = 0;
  const trendData: DailyTrendPoint[] = slots.map((slot) => {
    const data = slotMap.get(slot.dateKey) || { sessions: 0, scores: [], durationSec: 0 };
    const hasActivity = data.sessions > 0;
    
    let avgAcc = 0;
    if (data.scores.length > 0) {
      avgAcc = Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length);
      lastKnownAccuracy = avgAcc;
    } else if (hasActivity) {
      avgAcc = lastKnownAccuracy;
    }

    return {
      dateKey: slot.dateKey,
      displayDate: slot.displayDate,
      fullDate: slot.fullDate,
      dayIndex: slot.dayIndex,
      sessionCount: data.sessions,
      avgAccuracy: avgAcc,
      totalMinutes: Math.round(data.durationSec / 60),
      hasActivity,
    };
  });

  const activeDays = trendData.filter((t) => t.hasActivity).length;
  const totalSess = trendData.reduce((acc, t) => acc + t.sessionCount, 0);
  const totalMins = trendData.reduce((acc, t) => acc + t.totalMinutes, 0);
  const activePoints = trendData.filter((t) => t.hasActivity && t.avgAccuracy > 0);
  const avgScore = activePoints.length > 0
    ? Math.round(activePoints.reduce((acc, t) => acc + t.avgAccuracy, 0) / activePoints.length)
    : 0;

  const firstHalf = trendData.slice(0, 15).filter((t) => t.hasActivity && t.avgAccuracy > 0);
  const secondHalf = trendData.slice(15).filter((t) => t.hasActivity && t.avgAccuracy > 0);
  const firstAvg = firstHalf.length ? firstHalf.reduce((a, b) => a + b.avgAccuracy, 0) / firstHalf.length : 0;
  const secondAvg = secondHalf.length ? secondHalf.reduce((a, b) => a + b.avgAccuracy, 0) / secondHalf.length : 0;
  const delta = (firstHalf.length > 0 && secondHalf.length > 0) ? Math.round(secondAvg - firstAvg) : 0;

  return {
    trendData,
    totalSessions30d: totalSess,
    totalMinutes30d: totalMins,
    avgAccuracy30d: avgScore,
    activeDaysCount: activeDays,
    consistencyPercentage: Math.round((activeDays / 30) * 100),
    accuracyTrendDelta: delta,
    hasData: true,
  };
}
