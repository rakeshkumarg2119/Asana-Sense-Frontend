import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Activity, TrendingUp, Calendar, Zap } from 'lucide-react';
import { PracticeSession } from '../types';
import { aggregate30DayProgressTrends } from '../utils/progressAnalytics';

interface ProgressTrendsChartProps {
  sessions: PracticeSession[];
  userExperience?: string;
}

// Custom Tooltip component for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-stone-900/95 border border-emerald-500/40 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-xs text-stone-100 min-w-[150px] z-50">
        <div className="font-bold text-stone-300 border-b border-stone-800 pb-1 mb-1.5 flex items-center justify-between">
          <span>{data.fullDate}</span>
          <span className="text-[10px] text-stone-400 font-mono">Day {data.dayIndex}</span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between gap-3">
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" />
              Sessions:
            </span>
            <span className="font-mono font-bold text-white">
              {data.sessionCount} {data.sessionCount === 1 ? 'session' : 'sessions'}
            </span>
          </div>

          {data.totalMinutes > 0 && (
            <div className="flex items-center justify-between gap-3 text-stone-400 text-[11px]">
              <span>Duration:</span>
              <span className="font-mono text-stone-200">{data.totalMinutes} mins</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-0.5 border-t border-stone-800/80">
            <span className="text-teal-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
              Accuracy:
            </span>
            <span className="font-mono font-bold text-teal-300">
              {data.avgAccuracy}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const ProgressTrendsChart: React.FC<ProgressTrendsChartProps> = ({
  sessions,
  userExperience = 'Beginner',
}) => {
  const {
    trendData,
    totalSessions30d,
    totalMinutes30d,
    avgAccuracy30d,
    activeDaysCount,
    consistencyPercentage,
    accuracyTrendDelta,
  } = useMemo(() => {
    return aggregate30DayProgressTrends(sessions, userExperience);
  }, [sessions, userExperience]);

  // Determine max session count for left Y-axis domain
  const maxSessions = useMemo(() => {
    const highest = Math.max(...trendData.map((d) => d.sessionCount), 2);
    return Math.max(highest, 3);
  }, [trendData]);

  return (
    <div className="bg-stone-50/80 rounded-2xl p-3.5 border border-stone-200/90 shadow-2xs space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            30-Day Progress Trends
          </h4>
          <p className="text-[10px] text-stone-500 mt-0.5">
            Daily practice frequency & posture accuracy scores
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] font-medium text-stone-600">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2 rounded-xs bg-emerald-600 inline-block" />
            <span>Frequency (Sessions)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-teal-600 inline-block rounded-full" />
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 inline-block -ml-1.5" />
            <span>Accuracy (%)</span>
          </div>
        </div>
      </div>

      {/* 30-Day Summary Quick Metrics */}
      <div className="grid grid-cols-4 gap-1.5 text-center">
        <div className="bg-white p-2 rounded-xl border border-stone-200/70 shadow-2xs">
          <span className="text-[9px] text-stone-400 block font-semibold uppercase tracking-tight">Active Days</span>
          <span className="text-xs font-bold text-stone-900 font-mono">
            {activeDaysCount}/30
          </span>
        </div>

        <div className="bg-white p-2 rounded-xl border border-stone-200/70 shadow-2xs">
          <span className="text-[9px] text-stone-400 block font-semibold uppercase tracking-tight">Consistency</span>
          <span className="text-xs font-bold text-emerald-700 font-mono">
            {consistencyPercentage}%
          </span>
        </div>

        <div className="bg-white p-2 rounded-xl border border-stone-200/70 shadow-2xs">
          <span className="text-[9px] text-stone-400 block font-semibold uppercase tracking-tight">30d Avg Acc</span>
          <span className="text-xs font-bold text-teal-700 font-mono">
            {avgAccuracy30d}%
          </span>
        </div>

        <div className="bg-white p-2 rounded-xl border border-stone-200/70 shadow-2xs">
          <span className="text-[9px] text-stone-400 block font-semibold uppercase tracking-tight">Acc Trend</span>
          <span className={`text-xs font-bold font-mono flex items-center justify-center gap-0.5 ${
            accuracyTrendDelta >= 0 ? 'text-emerald-700' : 'text-amber-700'
          }`}>
            {accuracyTrendDelta >= 0 ? `+${accuracyTrendDelta}%` : `${accuracyTrendDelta}%`}
          </span>
        </div>
      </div>

      {/* Recharts Dual-Axis Combo Chart */}
      <div className="h-48 w-full select-none pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={trendData}
            margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
            
            {/* X-Axis: 30-Day Timeline */}
            <XAxis
              dataKey="displayDate"
              tickLine={false}
              axisLine={{ stroke: '#d6d3d1' }}
              tick={{ fill: '#78716c', fontSize: 9 }}
              interval={5}
            />

            {/* Left Y-Axis: Session Count Bar */}
            <YAxis
              yAxisId="sessions"
              orientation="left"
              domain={[0, maxSessions]}
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#059669', fontSize: 9, fontWeight: 'bold' }}
            />

            {/* Right Y-Axis: Accuracy % Line */}
            <YAxis
              yAxisId="accuracy"
              orientation="right"
              domain={[40, 100]}
              tickCount={4}
              tickLine={false}
              axisLine={false}
              unit="%"
              tick={{ fill: '#0d9488', fontSize: 9, fontWeight: 'bold' }}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Frequency Bars (Left Axis) */}
            <Bar
              yAxisId="sessions"
              dataKey="sessionCount"
              name="Sessions"
              radius={[3, 3, 0, 0]}
              maxBarSize={8}
            >
              {trendData.map((entry, index) => (
                <Cell
                  key={`bar-${index}`}
                  fill={entry.sessionCount > 0 ? '#059669' : '#e7e5e4'}
                  fillOpacity={entry.sessionCount > 0 ? 0.9 : 0.4}
                />
              ))}
            </Bar>

            {/* Accuracy Line Curve (Right Axis) */}
            <Line
              yAxisId="accuracy"
              type="monotone"
              dataKey="avgAccuracy"
              name="Accuracy"
              stroke="#0d9488"
              strokeWidth={2.5}
              dot={{ r: 2, fill: '#0d9488', strokeWidth: 1, stroke: '#ffffff' }}
              activeDot={{ r: 4.5, fill: '#0f766e', stroke: '#99f6e4', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
