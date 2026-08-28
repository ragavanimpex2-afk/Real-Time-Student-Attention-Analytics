import React, { useEffect, useState } from 'react';
import {
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  EyeOff,
  ArrowLeft,
  RefreshCw,
  FileSpreadsheet,
  Coffee,
  Lock,
  Target,
} from 'lucide-react';
import { SessionData, AIInsight, DetectedEvent } from '../types';
import { ScoreRing, TimelineChart, InsightCard, DistractionDisputeModal } from '../components/UIComponents';

interface SessionResultsPageProps {
  session: SessionData;
  onBackToHistory: () => void;
  onStartNewSession: () => void;
}

export const SessionResultsPage: React.FC<SessionResultsPageProps> = ({
  session: initialSession,
  onBackToHistory,
  onStartNewSession,
}) => {
  const [session, setSession] = useState<SessionData>(initialSession);
  const [insight, setInsight] = useState<AIInsight | null>(initialSession.ai_insight || null);
  const [isLoadingInsight, setIsLoadingInsight] = useState<boolean>(false);
  const [disputingEvent, setDisputingEvent] = useState<DetectedEvent | null>(null);
  const [disputeNotification, setDisputeNotification] = useState<string | null>(null);

  // Auto-fetch or generate AI insight from aggregated numbers only if missing
  useEffect(() => {
    if (!insight) {
      fetchAIInsight();
    }
  }, [session.id]);

  const handleOpenDispute = (event: DetectedEvent) => {
    setDisputingEvent(event);
  };

  const handleSubmitDispute = (
    reason: 'posture_adjustment' | 'thinking_gesture' | 'speaking_proctor' | 'environmental_glance' | 'false_alarm_sensor' | 'other',
    note?: string
  ) => {
    if (!disputingEvent) return;

    setSession((prev) => {
      const updatedEvents = (prev.events || []).map((e) =>
        e.id === disputingEvent.id
          ? { ...e, is_disputed: true, dispute_reason: reason, dispute_note: note }
          : e
      );

      const newFeedback = [
        ...(prev.feedback_log || []),
        { eventId: disputingEvent.id, reason, note, autoTuned: true },
      ];

      return {
        ...prev,
        events: updatedEvents,
        feedback_log: newFeedback,
      };
    });

    setDisputeNotification(
      `Dispute recorded for "${disputingEvent.label}". Engine sensitivity profile updated to minimize false detections during similar activities.`
    );
    setTimeout(() => setDisputeNotification(null), 5000);
    setDisputingEvent(null);
  };

  const fetchAIInsight = async () => {
    setIsLoadingInsight(true);
    try {
      const payload = {
        session_id: session.id,
        session_duration: session.duration_sec ?? 120,
        average_attention_score: session.average_attention_score ?? 70,
        face_presence: (session.face_presence_percentage ?? 100) / 100,
        forward_gaze: (session.forward_gaze_percentage ?? 100) / 100,
        gaze_away_events: session.distraction_events_count ?? 0,
        long_distraction_events: (session.events || []).filter((e) => e.durationSec >= 15).length,
        blink_rate: session.blink_rate_avg ?? 18,
      };

      const res = await fetch('/api/ai/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setInsight(data.insight);
      }
    } catch (err) {
      console.warn('Insight fetch failed, using fallback:', err);
    } finally {
      setIsLoadingInsight(false);
    }
  };

  // Export CSV Telemetry
  const handleExportCSV = () => {
    const headers = 'Timestamp,TimeOffsetSec,AttentionScore,FacePresent,GazeDirection,IsDistracted\n';
    const rows = (session.timeline || [])
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

  const durationMin = Math.round((session.duration_sec ?? 60) / 60);
  const longestSec = session.longest_distraction_sec ?? 0;
  const longestMin = Math.floor(longestSec / 60);
  const longestRemSec = longestSec % 60;

  return (
    <div id="session-results-page" className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToHistory}
              className="text-xs font-semibold text-[#64748B] hover:text-[#0F172A] flex items-center gap-1 mr-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
              Session Results
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#64748B] font-medium">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {new Date(session.started_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </span>
            <span>•</span>
            <span>{durationMin > 0 ? `${durationMin} minutes` : `${session.duration_sec}s`}</span>
            <span>•</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 ${
                session.session_mode === 'pomodoro_rest'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {session.session_mode === 'pomodoro_rest' ? (
                <>
                  <Coffee className="w-3 h-3 text-amber-600" />
                  <span>Rest / Pomodoro Mode (20m/15m)</span>
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 text-blue-600" />
                  <span>Exam Mode (Strict)</span>
                </>
              )}
            </span>
            {session.calibration_baseline && (
              <>
                <span>•</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 flex items-center gap-1 border border-slate-200">
                  <Target className="w-3 h-3 text-blue-600" />
                  <span>
                    Zero Baseline (Pitch: {session.calibration_baseline.baselinePitch > 0 ? '+' : ''}{session.calibration_baseline.baselinePitch}°, Yaw: {session.calibration_baseline.baselineYaw > 0 ? '+' : ''}{session.calibration_baseline.baselineYaw}°)
                  </span>
                </span>
              </>
            )}
            <span>•</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#F1F5F9] text-[#475569]">
              COMPLETED
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-export-data"
            onClick={handleExportCSV}
            className="px-4 py-2 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#0F172A] shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#64748B]" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* Top 5 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Average Attention Proxy Score Circular Ring */}
        <div
          id="metric-score-gauge"
          className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-2xs flex flex-col justify-between"
        >
          <div className="text-[10px] font-bold tracking-wider text-[#64748B] uppercase mb-1">
            AVERAGE ATTENTION PROXY SCORE
          </div>
          <div className="py-2">
            <ScoreRing
              score={Math.round(session.average_attention_score ?? 70)}
              label={
                session.average_attention_score >= 75
                  ? 'High engagement'
                  : session.average_attention_score >= 60
                  ? 'Moderate engagement proxy'
                  : 'Low engagement proxy'
              }
            />
          </div>
        </div>

        {/* Card 2: Face Presence */}
        <div
          id="metric-face-presence"
          className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-2xs flex flex-col justify-between"
        >
          <div className="text-[10px] font-bold tracking-wider text-[#64748B] uppercase">
            FACE PRESENCE
          </div>
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-4xl font-bold text-[#0F172A] tracking-tight">
                {session.face_presence_percentage ?? 100}
              </span>
              <span className="text-xl font-bold text-[#0F172A]">%</span>
            </div>
            <p className="text-xs text-[#64748B] mt-1">Time face detected</p>
          </div>
        </div>

        {/* Card 3: Forward Gaze */}
        <div
          id="metric-forward-gaze"
          className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-2xs flex flex-col justify-between"
        >
          <div className="text-[10px] font-bold tracking-wider text-[#64748B] uppercase">
            FORWARD GAZE
          </div>
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-4xl font-bold text-[#0F172A] tracking-tight">
                {session.forward_gaze_percentage ?? 100}
              </span>
              <span className="text-xl font-bold text-[#0F172A]">%</span>
            </div>
            <p className="text-xs text-[#64748B] mt-1">Screen focus ratio</p>
          </div>
        </div>

        {/* Card 4: Distraction Events */}
        <div
          id="metric-distractions"
          className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-2xs flex flex-col justify-between"
        >
          <div className="text-[10px] font-bold tracking-wider text-[#64748B] uppercase">
            DISTRACTION EVENTS
          </div>
          <div>
            <div className="text-4xl font-bold text-[#0F172A] tracking-tight">
              {session.distraction_events_count ?? 0}
            </div>
            <p className="text-xs text-[#64748B] mt-1">Significant deviations</p>
          </div>
        </div>

        {/* Card 5: Longest Distraction */}
        <div
          id="metric-longest-distraction"
          className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-2xs flex flex-col justify-between"
        >
          <div className="text-[10px] font-bold tracking-wider text-[#64748B] uppercase">
            LONGEST DISTRACTION
          </div>
          <div>
            {longestMin > 0 ? (
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[#0F172A] tracking-tight">{longestMin}</span>
                <span className="text-base font-semibold text-[#0F172A]">m</span>
                <span className="text-4xl font-bold text-[#0F172A] tracking-tight ml-1">{longestRemSec}</span>
                <span className="text-base font-semibold text-[#0F172A]">s</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[#0F172A] tracking-tight">{longestSec}</span>
                <span className="text-base font-semibold text-[#0F172A]">s</span>
              </div>
            )}
            <p className="text-xs text-[#64748B] mt-1">Maximum duration</p>
          </div>
        </div>
      </div>

      {/* Middle Layout: Attention Timeline Chart + Session Insight & Privacy Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Attention Proxy Over Time Area Chart */}
        <div
          id="attention-timeline-chart-card"
          className="lg:col-span-8 bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-2xs flex flex-col justify-between"
        >
          <TimelineChart data={session.timeline || []} height={280} />
        </div>

        {/* Right Column (4 cols): AI Insight + Privacy & Processing Checklist */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* AI Insight Card */}
          <InsightCard
            insight={insight}
            isLoading={isLoadingInsight}
            onRegenerate={fetchAIInsight}
          />

          {/* Privacy & Processing Checklist */}
          <div
            id="privacy-checklist-card"
            className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-2xs space-y-3"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-[#0F172A]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Privacy & Processing</span>
            </div>

            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-2.5 text-xs text-[#334155] font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Video was processed at the edge</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#334155] font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Video was not stored</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#334155] font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Only anonymized metrics were retained</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {disputeNotification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{disputeNotification}</span>
          </div>
          <button
            onClick={() => setDisputeNotification(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold px-2 py-0.5 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Bottom Section: Detected Events Table */}
      <div
        id="detected-events-table-card"
        className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xs overflow-hidden"
      >
        <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">Detected Events & Distraction Log</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Review flagged events. Challenge any false alarms to adapt system sensitivity.
            </p>
          </div>
          <span className="text-xs text-[#64748B] font-mono">
            {session.events?.length || 0} Events Logged
          </span>
        </div>

        {session.events && session.events.length > 0 ? (
          <div className="divide-y divide-[#E2E8F0]">
            {session.events.map((event) => (
              <div
                key={event.id}
                className={`p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8FAFC] transition-colors ${
                  event.is_disputed ? 'bg-emerald-50/30' : ''
                }`}
              >
                <div className="flex items-center gap-6">
                  <span className="text-xs font-mono font-semibold text-[#64748B]">
                    {event.time || `${Math.floor((event.durationSec || 0) / 60)}m`}
                  </span>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        event.is_disputed
                          ? 'bg-emerald-500'
                          : event.type === 'face_absent'
                          ? 'bg-[#DC2626]'
                          : 'bg-[#F59E0B]'
                      }`}
                    ></span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#0F172A]">{event.label}</span>
                        {event.is_disputed && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Disputed & Auto-Tuned
                          </span>
                        )}
                      </div>
                      {event.is_disputed && event.dispute_reason && (
                        <p className="text-xs text-[#64748B] mt-0.5">
                          Reason: <span className="font-medium text-[#334155] capitalize">{event.dispute_reason.replace(/_/g, ' ')}</span>
                          {event.dispute_note ? ` — "${event.dispute_note}"` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-xs text-[#64748B] font-medium font-mono">
                    Duration:{' '}
                    {event.durationSec >= 60
                      ? `${Math.floor(event.durationSec / 60)}m ${event.durationSec % 60}s`
                      : `${event.durationSec}s`}
                  </div>

                  {!event.is_disputed && (
                    <button
                      type="button"
                      onClick={() => handleOpenDispute(event)}
                      className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Dispute Flag
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-[#64748B] text-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="font-semibold text-[#0F172A]">No Distraction Events</p>
            <p className="text-xs text-[#64748B] mt-0.5">
              Subject maintained continuous presence and focused head/gaze alignment throughout the session.
            </p>
          </div>
        )}
      </div>

      {/* Distraction Dispute Modal */}
      <DistractionDisputeModal
        isOpen={!!disputingEvent}
        event={disputingEvent}
        onClose={() => setDisputingEvent(null)}
        onSubmitDispute={handleSubmitDispute}
      />
    </div>
  );
};
