import React, { useState } from 'react';
import {
  Calendar,
  Filter,
  Lock,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  TrendingUp,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  YAxis,
  XAxis,
  Tooltip,
} from 'recharts';
import { SessionData } from '../types';

interface SessionHistoryPageProps {
  sessions: SessionData[];
  onSelectSession: (session: SessionData) => void;
}

export const SessionHistoryPage: React.FC<SessionHistoryPageProps> = ({
  sessions,
  onSelectSession,
}) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    sessions[0]?.id || 'sess_psy101_01'
  );
  const [dateFilter, setDateFilter] = useState('Last 7 Days');
  const [classFilter, setClassFilter] = useState('All Classes');

  const selectedSession =
    sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  const handleExportCSV = (session: SessionData) => {
    const headers = 'Timestamp,TimeOffsetSec,AttentionScore,FacePresent,GazeDirection,IsDistracted\n';
    const rows = session.timeline
      .map(
        (t) =>
          `${t.timestamp},${t.timeOffsetSec},${t.attention_score},${t.face_present},${t.gaze_direction},${t.is_distracted}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `anonymized_telemetry_${session.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="session-history-page" className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
            Session History
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Archived attention metrics and analytics from previous local processing sessions.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="appearance-none bg-white border border-[#E2E8F0] rounded-lg px-4 py-2 pr-9 text-xs font-semibold text-[#0F172A] shadow-2xs focus:outline-hidden focus:border-blue-600 cursor-pointer"
            >
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Semester</option>
              <option>All Time</option>
            </select>
            <Calendar className="w-3.5 h-3.5 text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="appearance-none bg-white border border-[#E2E8F0] rounded-lg px-4 py-2 pr-9 text-xs font-semibold text-[#0F172A] shadow-2xs focus:outline-hidden focus:border-blue-600 cursor-pointer"
            >
              <option>All Classes</option>
              <option>PSY-101</option>
              <option>CS-340</option>
              <option>BIO-201</option>
              <option>CS-101</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Grid Layout: History Table (Left) + Detail Drawer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table Column (8 cols) */}
        <div
          id="history-table-container"
          className="lg:col-span-8 bg-white rounded-xl border border-[#E2E8F0] shadow-2xs overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3.5 px-5">Date/Time</th>
                  <th className="py-3.5 px-5">Session Name</th>
                  <th className="py-3.5 px-4">Cohort/Class</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-5">Privacy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
                {sessions.map((session) => {
                  const isSelected = selectedSession?.id === session.id;
                  return (
                    <tr
                      key={session.id}
                      id={`history-row-${session.id}`}
                      onClick={() => setSelectedSessionId(session.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#EFF6FF] border-l-4 border-l-[#2563EB]'
                          : 'hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <td className="py-4 px-5 font-medium whitespace-nowrap text-xs">
                        {new Date(session.started_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                        ,{' '}
                        {new Date(session.started_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-4 px-5 font-semibold text-xs text-[#0F172A]">
                        {session.sessionName}
                      </td>
                      <td className="py-4 px-4 text-xs font-mono text-[#64748B]">
                        {session.cohortClass}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                            session.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {session.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-[#64748B]">
                        {Math.floor(session.duration_sec / 3600) > 0
                          ? `${Math.floor(session.duration_sec / 3600)}h ${Math.floor(
                              (session.duration_sec % 3600) / 60
                            )}m`
                          : `${Math.floor(session.duration_sec / 60)}m ${
                              session.duration_sec % 60
                            }s`}
                      </td>
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1.5 text-xs text-[#64748B]">
                          <Lock className="w-3.5 h-3.5 text-[#94A3B8]" />
                          <span>{session.privacy_mode}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer (Matching Image 6) */}
          <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
            <span>Showing 1-4 of 128 sessions</span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 rounded border border-[#E2E8F0] hover:bg-[#F8FAFC] font-semibold text-[#0F172A] disabled:opacity-50">
                Prev
              </button>
              <button className="px-3 py-1.5 rounded border border-[#E2E8F0] hover:bg-[#F8FAFC] font-semibold text-[#0F172A]">
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Right Detail Card Drawer (4 cols, Matching Image 6 Right Drawer) */}
        {selectedSession && (
          <div
            id="session-detail-drawer"
            className="lg:col-span-4 bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-2xs space-y-6"
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#0F172A] leading-snug">
                  {selectedSession.sessionName}
                </h3>
                <button
                  onClick={() => onSelectSession(selectedSession)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                >
                  <span>Open</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-[#64748B] mt-1 font-mono">
                {new Date(selectedSession.started_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                • {selectedSession.cohortClass}
              </p>
            </div>

            {/* Dual Score Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] p-4">
                <div className="text-[10px] font-bold tracking-wider text-[#64748B] uppercase">
                  AVG ATTENTION
                </div>
                <div className="text-3xl font-bold text-[#0F172A] mt-1">
                  {selectedSession.average_attention_score.toFixed(1)}
                </div>
              </div>

              <div className="bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] p-4">
                <div className="text-[10px] font-bold tracking-wider text-[#64748B] uppercase">
                  PEAK ATTENTION
                </div>
                <div className="text-3xl font-bold text-[#0F172A] mt-1">
                  {selectedSession.peak_attention_score.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Attention Over Time Sparkline */}
            <div>
              <div className="text-[10px] font-bold tracking-wider text-[#64748B] uppercase mb-2">
                ATTENTION OVER TIME
              </div>
              <div className="h-32 w-full bg-[#F8FAFC] rounded-lg p-2 border border-[#E2E8F0]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedSession.timeline}>
                    <YAxis domain={[0, 100]} hide />
                    <Line
                      type="monotone"
                      dataKey="attention_score"
                      stroke="#2563EB"
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-[#94A3B8] mt-1">
                <span>0m</span>
                <span>{Math.floor(selectedSession.duration_sec / 120)}m</span>
                <span>{Math.floor(selectedSession.duration_sec / 60)}m</span>
              </div>
            </div>

            {/* Session Metadata Key-Value List */}
            <div className="pt-4 border-t border-[#E2E8F0] space-y-3 text-xs">
              <div className="text-[10px] font-bold tracking-wider text-[#64748B] uppercase">
                SESSION METADATA
              </div>

              <div className="flex justify-between text-[#334155]">
                <span className="text-[#64748B]">Duration:</span>
                <span className="font-semibold">
                  {Math.floor(selectedSession.duration_sec / 60)}m {selectedSession.duration_sec % 60}s
                </span>
              </div>

              <div className="flex justify-between text-[#334155]">
                <span className="text-[#64748B]">Participants:</span>
                <span className="font-semibold">24 Detected</span>
              </div>

              <div className="flex justify-between text-[#334155]">
                <span className="text-[#64748B]">Privacy:</span>
                <span className="font-semibold">{selectedSession.privacy_mode}</span>
              </div>

              <div className="flex justify-between text-[#334155]">
                <span className="text-[#64748B]">Status:</span>
                <span className="font-semibold text-emerald-700 capitalize">
                  {selectedSession.status}
                </span>
              </div>

              <div className="flex justify-between items-center text-[#334155] pt-1">
                <span className="text-[#64748B]">Data Export:</span>
                <button
                  onClick={() => handleExportCSV(selectedSession)}
                  className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>CSV</span>
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
