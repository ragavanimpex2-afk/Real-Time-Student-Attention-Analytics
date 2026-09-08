import React from 'react';
import { Play, Shield, EyeOff, Radio, ArrowRight, Clock, Activity, ChevronRight, Sparkles } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { SessionData } from '../types';

interface DashboardPageProps {
  sessions: SessionData[];
  onStartLive: () => void;
  onSelectSession: (session: SessionData) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  sessions,
  onStartLive,
  onSelectSession,
}) => {
  // Compute summary stats from local/mock sessions
  const totalSessions = sessions.length || 4;
  const avgScore = sessions.length > 0
    ? Math.round(sessions.reduce((acc, s) => acc + s.average_attention_score, 0) / sessions.length)
    : 74;
  const avgDurationMin = sessions.length > 0
    ? Math.round(sessions.reduce((acc, s) => acc + s.duration_sec, 0) / (sessions.length * 60))
    : 42;
  const totalDistractions = sessions.reduce((acc, s) => acc + s.distraction_events_count, 0) || 21;

  // Recent engagement trend constructed from sessions or curated progression
  const trendData = sessions.length > 0
    ? sessions.slice(0, 8).reverse().map((s, idx) => ({
        name: `S${idx + 1}`,
        value: Math.round(s.average_attention_score),
        sessionName: s.sessionName,
      }))
    : [
        { name: 'S1', value: 68 },
        { name: 'S2', value: 72 },
        { name: 'S3', value: 64 },
        { name: 'S4', value: 78 },
        { name: 'S5', value: 75 },
        { name: 'S6', value: 82 },
        { name: 'S7', value: 88 },
      ];

  return (
    <div id="dashboard-page" className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Page Header with Mobile Action Button */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">Dashboard</h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 sm:mt-1">
            Overview of your visual engagement sessions & telemetry.
          </p>
        </div>

        {/* Quick Launch Button on Mobile */}
        <button
          onClick={onStartLive}
          className="sm:hidden px-3.5 py-2 bg-blue-600 active:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[40px]"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>Start Live</span>
        </button>
      </div>

      {/* Top Metric Cards (Responsive 2-Col Grid on Mobile, 4-Col on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div
          id="metric-avg-score"
          className="bg-white rounded-xl sm:rounded-2xl border border-[#E2E8F0] p-3.5 sm:p-6 shadow-2xs flex flex-col justify-between"
        >
          <div className="text-[10px] sm:text-[11px] font-bold tracking-wider text-[#64748B] uppercase mb-1.5 sm:mb-2 truncate">
            AVG ATTENTION SCORE
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">{avgScore}</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-400">/100</span>
          </div>
        </div>

        <div
          id="metric-sessions"
          className="bg-white rounded-xl sm:rounded-2xl border border-[#E2E8F0] p-3.5 sm:p-6 shadow-2xs flex flex-col justify-between"
        >
          <div className="text-[10px] sm:text-[11px] font-bold tracking-wider text-[#64748B] uppercase mb-1.5 sm:mb-2 truncate">
            TOTAL SESSIONS
          </div>
          <div className="text-2xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">{totalSessions}</div>
        </div>

        <div
          id="metric-avg-duration"
          className="bg-white rounded-xl sm:rounded-2xl border border-[#E2E8F0] p-3.5 sm:p-6 shadow-2xs flex flex-col justify-between"
        >
          <div className="text-[10px] sm:text-[11px] font-bold tracking-wider text-[#64748B] uppercase mb-1.5 sm:mb-2 truncate">
            AVG DURATION
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">{avgDurationMin}</span>
            <span className="text-xs sm:text-base font-semibold text-[#0F172A]">min</span>
          </div>
        </div>

        <div
          id="metric-distractions"
          className="bg-white rounded-xl sm:rounded-2xl border border-[#E2E8F0] p-3.5 sm:p-6 shadow-2xs flex flex-col justify-between"
        >
          <div className="text-[10px] sm:text-[11px] font-bold tracking-wider text-[#64748B] uppercase mb-1.5 sm:mb-2 truncate">
            DISTRACTIONS
          </div>
          <div className="text-2xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">{totalDistractions}</div>
        </div>
      </div>

      {/* Middle Section: Recent Engagement Chart + System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left 2 Cols: Recent Engagement Sparkline Card */}
        <div
          id="recent-engagement-card"
          className="lg:col-span-2 bg-white rounded-xl sm:rounded-2xl border border-[#E2E8F0] p-4 sm:p-6 shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#0F172A]">Recent Engagement</h2>
              <p className="text-[11px] text-slate-500">Session attention score trajectory</p>
            </div>
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
              7-Day Trend
            </span>
          </div>
          <div className="h-36 sm:h-48 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <YAxis domain={[0, 100]} hide />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#0F172A] text-white px-2.5 py-1.5 rounded text-xs font-mono">
                          Score: {payload[0].value}/100
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2563EB"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#2563EB' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: System Status & Start Live Session CTA */}
        <div
          id="system-status-card"
          className="bg-white rounded-xl sm:rounded-2xl border border-[#E2E8F0] p-4 sm:p-6 shadow-2xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Shield className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm sm:text-base font-bold text-[#0F172A]">Edge System Status</h2>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex items-center gap-2.5 text-xs font-medium text-[#334155]">
                <span className="w-2 h-2 rounded-full bg-[#16A34A] shrink-0"></span>
                <span>Edge CV Processing Active</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-medium text-[#334155]">
                <span className="w-2 h-2 rounded-full bg-[#16A34A] shrink-0"></span>
                <span>Zero Video Frames Stored</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-medium text-[#334155]">
                <span className="w-2 h-2 rounded-full bg-[#16A34A] shrink-0"></span>
                <span>Anonymized Metrics Telemetry</span>
              </div>
            </div>
          </div>

          <button
            id="btn-dashboard-start-live"
            onClick={onStartLive}
            className="w-full mt-5 sm:mt-6 py-3 px-4 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start Live Session</span>
          </button>
        </div>
      </div>

      {/* Bottom Section: Recent Sessions */}
      <div
        id="recent-sessions-table-card"
        className="bg-white rounded-xl sm:rounded-2xl border border-[#E2E8F0] shadow-2xs overflow-hidden"
      >
        <div className="p-4 sm:p-6 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#0F172A]">Recent Sessions</h2>
            <p className="text-[11px] text-slate-500 sm:hidden">Tap any session for telemetry details</p>
          </div>
          <span className="text-xs text-[#64748B] font-medium hidden sm:inline">
            Click a row to view telemetry breakdown
          </span>
        </div>

        {/* Mobile View: High-Touch Cards List (< sm) */}
        <div className="sm:hidden divide-y divide-[#E2E8F0]">
          {sessions.map((session) => {
            const score = Math.round(session.average_attention_score);
            const scoreColor =
              score >= 75
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : score >= 50
                ? 'text-amber-700 bg-amber-50 border-amber-200'
                : 'text-red-700 bg-red-50 border-red-200';

            const durationText =
              Math.floor(session.duration_sec / 3600) > 0
                ? `${Math.floor(session.duration_sec / 3600)}h ${Math.floor(
                    (session.duration_sec % 3600) / 60
                  )}m`
                : `${Math.floor(session.duration_sec / 60)}m`;

            return (
              <div
                key={session.id}
                id={`mobile-session-card-${session.id}`}
                onClick={() => onSelectSession(session)}
                className="p-4 active:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer transition-colors min-h-[64px]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {session.sessionName}
                    </span>
                    {session.cohortClass && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                        {session.cohortClass}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                    <span>
                      {new Date(session.started_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span>•</span>
                    <span>{durationText}</span>
                    <span>•</span>
                    <span>{session.distraction_events_count} distractions</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-bold border ${scoreColor}`}
                  >
                    {score}%
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View: Comprehensive Data Table (>= sm) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6">Duration</th>
                <th className="py-3.5 px-6">Average Score</th>
                <th className="py-3.5 px-6">Distraction Events</th>
                <th className="py-3.5 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
              {sessions.map((session) => (
                <tr
                  key={session.id}
                  id={`session-row-${session.id}`}
                  onClick={() => onSelectSession(session)}
                  className="hover:bg-[#F8FAFC] cursor-pointer transition-colors group"
                >
                  <td className="py-4 px-6 font-medium">
                    <div>
                      {new Date(session.started_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                      ,{' '}
                      {new Date(session.started_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="text-xs text-[#64748B] font-normal">{session.sessionName}</div>
                  </td>
                  <td className="py-4 px-6 text-[#64748B]">
                    {Math.floor(session.duration_sec / 3600) > 0
                      ? `${Math.floor(session.duration_sec / 3600)}h ${Math.floor(
                          (session.duration_sec % 3600) / 60
                        )}m`
                      : `${Math.floor(session.duration_sec / 60)}m`}
                  </td>
                  <td className="py-4 px-6 font-bold text-[#0F172A]">
                    {session.average_attention_score}%
                  </td>
                  <td className="py-4 px-6 text-[#64748B]">{session.distraction_events_count}</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-[#F1F5F9] text-[#475569] uppercase">
                      Processed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
