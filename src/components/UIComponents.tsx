import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  CartesianGrid,
} from 'recharts';
import {
  Shield,
  EyeOff,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  X,
  Sliders,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { AttentionWeightsConfig, TimelineDataPoint, AIInsight } from '../types';

/**
 * Metric Card Component matching the academic spec
 */
export interface MetricCardProps {
  id?: string;
  title: string;
  value: string | number;
  subtitle?: string;
  unit?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  id,
  title,
  value,
  subtitle,
  unit,
  trend,
  onClick,
}) => {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs transition-all ${
        onClick ? 'cursor-pointer hover:border-blue-300 hover:shadow-sm' : ''
      }`}
    >
      <div className="text-[11px] font-semibold tracking-wider text-[#64748B] uppercase mb-2">
        {title}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-[#0F172A] tracking-tight">{value}</span>
        {unit && <span className="text-sm font-medium text-[#64748B]">{unit}</span>}
      </div>
      {subtitle && <p className="text-xs text-[#64748B] mt-1.5">{subtitle}</p>}
      {trend && (
        <div
          className={`flex items-center gap-1 text-xs font-medium mt-2 ${
            trend.isPositive ? 'text-emerald-600' : 'text-amber-600'
          }`}
        >
          {trend.isPositive ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5" />
          )}
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Attention Proxy Score Circular Gauge Ring (Image 5 style)
 */
export const ScoreRing: React.FC<{
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}> = ({ score, size = 110, strokeWidth = 9, label }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  let strokeColor = '#2563EB'; // Blue
  if (clampedScore < 50) strokeColor = '#DC2626'; // Red
  else if (clampedScore < 70) strokeColor = '#F59E0B'; // Amber

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-[#0F172A] tracking-tight">{clampedScore}</span>
        </div>
      </div>
      {label && (
        <div>
          <div className="text-2xl font-bold text-[#0F172A] leading-tight">{clampedScore}</div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-[#64748B]">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: strokeColor }}
            ></span>
            <span>{label}</span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Privacy Status Banner
 */
export const PrivacyBanner: React.FC = () => {
  return (
    <div
      id="privacy-enforcement-banner"
      className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-center justify-between shadow-xs mb-6"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-semibold text-[#0F172A] tracking-wide uppercase">
            Privacy Enforcement Active
          </div>
          <div className="text-xs text-[#64748B]">
            Local Edge Processing • Zero Video Frames Stored
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold">
        <EyeOff className="w-3.5 h-3.5" />
        <span>Video Not Stored</span>
      </div>
    </div>
  );
};

/**
 * Interactive Timeline Chart for Attention Proxy Over Time (Recharts)
 */
export interface TimelineChartProps {
  data: TimelineDataPoint[];
  height?: number;
  showDistractionAreas?: boolean;
}

export const TimelineChart: React.FC<TimelineChartProps> = ({
  data,
  height = 260,
  showDistractionAreas = true,
}) => {
  // Format data for chart display
  const chartData = data.map((d, index) => ({
    time: d.timeLabel || `${Math.round(d.timeOffsetSec / 60)}m`,
    score: d.attention_score,
    isDistracted: d.is_distracted,
    isBreak: d.is_break_interval,
    eventLabel: d.event_label,
  }));

  return (
    <div className="w-full h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-semibold text-[#0F172A]">Attention Proxy Over Time</div>
        <div className="flex items-center gap-3 text-xs font-medium text-[#64748B]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#2563EB]"></span>
            <span>ATTENTION SCORE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
            <span>REST BREAK</span>
          </div>
        </div>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="attentionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const val = payload[0].value;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-[#0F172A] text-white px-3 py-2 rounded-lg text-xs shadow-lg">
                      <div className="text-[#94A3B8] font-mono">{label}</div>
                      <div className="font-bold text-sm mt-0.5 text-blue-300">
                        Proxy Score: {val}/100
                      </div>
                      {item.isBreak ? (
                        <div className="text-emerald-400 font-medium text-[11px] mt-1">
                          ☕ Scheduled Rest Interval
                        </div>
                      ) : item.isDistracted ? (
                        <div className="text-amber-400 font-medium text-[11px] mt-1">
                          ⚠️ Off-Screen Deviation
                        </div>
                      ) : (
                        <div className="text-emerald-400 font-medium text-[11px] mt-1">
                          ✓ Focused Engagement
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={50} stroke="#E2E8F0" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#2563EB"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#attentionGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/**
 * AI Insight Card matching Image 5
 */
export const InsightCard: React.FC<{
  insight: AIInsight | null;
  onRegenerate?: () => void;
  isLoading?: boolean;
}> = ({ insight, onRegenerate, isLoading }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (!insight) return;
    const text = `${insight.summary}\n\nKey Observations:\n- ${insight.overall_pattern}\n- ${insight.notable_periods}\n\nRecommendations:\n${insight.recommendations?.map((r) => '- ' + r).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="session-insight-card"
      className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-bold text-[#0F172A]">Session Insight</h3>
          </div>
          <div className="flex items-center gap-1.5">
            {onRegenerate && (
              <button
                id="btn-regenerate-insight"
                onClick={onRegenerate}
                disabled={isLoading}
                title="Regenerate from Anonymized Metrics"
                className="p-1.5 text-[#64748B] hover:text-blue-600 rounded-md hover:bg-[#F8FAFC] transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              onClick={handleCopy}
              title="Copy Summary"
              className="p-1.5 text-[#64748B] hover:text-blue-600 rounded-md hover:bg-[#F8FAFC] transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-6 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mb-2" />
            <p className="text-xs text-[#64748B]">Synthesizing anonymized numerical telemetry...</p>
          </div>
        ) : insight ? (
          <div className="space-y-3">
            <p className="text-sm text-[#0F172A] leading-relaxed font-normal">
              {insight.summary}
            </p>
            {insight.recommendations && insight.recommendations.length > 0 && (
              <div className="pt-2 border-t border-[#F1F5F9]">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">
                  Actionable Suggestions
                </span>
                <ul className="space-y-1">
                  {insight.recommendations.slice(0, 2).map((rec, idx) => (
                    <li key={idx} className="text-xs text-[#334155] flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0"></span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-[#64748B] italic">No AI insight generated yet.</p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-1.5 text-[11px] text-[#64748B]">
        <div className="flex items-center gap-1.5 truncate">
          <HelpCircle className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
          <span className="truncate">ANONYMIZED NUMERICAL TELEMETRY</span>
        </div>
        {insight?.provider && (
          <span className="font-mono text-[10px] bg-[#F1F5F9] text-[#475569] px-2 py-0.5 rounded border border-[#E2E8F0] uppercase font-medium shrink-0">
            {insight.provider}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Settings & Weights Calibration Modal
 */
export const SettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  weights: AttentionWeightsConfig;
  onSaveWeights: (weights: AttentionWeightsConfig) => void;
}> = ({ isOpen, onClose, weights, onSaveWeights }) => {
  const [localWeights, setLocalWeights] = React.useState<AttentionWeightsConfig>(weights);

  React.useEffect(() => {
    setLocalWeights(weights);
  }, [weights]);

  if (!isOpen) return null;

  const totalWeight =
    localWeights.facePresenceWeight +
    localWeights.forwardGazeWeight +
    localWeights.headAlignmentWeight;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">Attention Formula Weights</h3>
              <p className="text-xs text-[#64748B]">
                Configure proxy weights & distraction thresholds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#64748B] hover:text-[#0F172A] rounded-lg hover:bg-[#F8FAFC]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4">
          {/* Formula Display */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 font-mono text-xs text-[#334155]">
            <span className="text-blue-600 font-bold">score</span> = 100 × (
            <span className="text-emerald-700 font-semibold">{localWeights.facePresenceWeight.toFixed(2)}</span>·face +{' '}
            <span className="text-indigo-700 font-semibold">{localWeights.forwardGazeWeight.toFixed(2)}</span>·gaze +{' '}
            <span className="text-amber-700 font-semibold">{localWeights.headAlignmentWeight.toFixed(2)}</span>·head)
          </div>

          {/* Sliders */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#0F172A] mb-1">
                <span>Face Presence Weight</span>
                <span className="text-blue-600">{localWeights.facePresenceWeight.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={localWeights.facePresenceWeight}
                onChange={(e) =>
                  setLocalWeights({
                    ...localWeights,
                    facePresenceWeight: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-[#0F172A] mb-1">
                <span>Forward Gaze Weight</span>
                <span className="text-indigo-600">{localWeights.forwardGazeWeight.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={localWeights.forwardGazeWeight}
                onChange={(e) =>
                  setLocalWeights({
                    ...localWeights,
                    forwardGazeWeight: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-[#0F172A] mb-1">
                <span>Head Alignment Weight</span>
                <span className="text-amber-600">{localWeights.headAlignmentWeight.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={localWeights.headAlignmentWeight}
                onChange={(e) =>
                  setLocalWeights({
                    ...localWeights,
                    headAlignmentWeight: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-amber-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-[#0F172A] mb-1">
                <span>Distraction Trigger Threshold</span>
                <span>{localWeights.distractionThresholdSec} seconds</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.5"
                value={localWeights.distractionThresholdSec}
                onChange={(e) =>
                  setLocalWeights({
                    ...localWeights,
                    distractionThresholdSec: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-slate-700"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-xs leading-relaxed border border-blue-100">
            <strong>Non-Cognitive Disclaimer:</strong> The attention proxy score is an empirical
            visual-orientation composite and does not constitute a cognitive, psychological, or medical
            determination of learning comprehension.
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
          <button
            onClick={() => {
              setLocalWeights({
                facePresenceWeight: 0.5,
                forwardGazeWeight: 0.3,
                headAlignmentWeight: 0.2,
                distractionThresholdSec: 3.0,
                blinkEarThreshold: 0.22,
                headYawThresholdDeg: 22,
                headPitchThresholdDeg: 20,
              });
            }}
            className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-lg transition-colors"
          >
            Reset Defaults
          </button>
          <button
            onClick={() => {
              onSaveWeights(localWeights);
              onClose();
            }}
            className="px-5 py-2 text-xs font-semibold bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
          >
            Save Formula
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Distraction Event Dispute & Adaptive Auto-Tuning Modal
 * Enables students/users to challenge false-positive flags (e.g. typing posture, thinking head shakes, discussion)
 * and automatically adapts the CV engine's tolerance to avoid repeating the warning.
 */
export interface DistractionDisputeModalProps {
  isOpen: boolean;
  event: {
    id: string;
    label: string;
    durationSec: number;
    time?: string;
  } | null;
  remainingDisputes?: number;
  isContinuousSevereInfraction?: boolean;
  onClose: () => void;
  onSubmitDispute: (reason: 'posture_adjustment' | 'thinking_gesture' | 'speaking_proctor' | 'environmental_glance' | 'false_alarm_sensor' | 'other', note?: string) => void;
}

export const DistractionDisputeModal: React.FC<DistractionDisputeModalProps> = ({
  isOpen,
  event,
  remainingDisputes = 5,
  isContinuousSevereInfraction = false,
  onClose,
  onSubmitDispute,
}) => {
  const [selectedReason, setSelectedReason] = React.useState<
    'posture_adjustment' | 'thinking_gesture' | 'speaking_proctor' | 'environmental_glance' | 'false_alarm_sensor' | 'other'
  >('posture_adjustment');
  const [note, setNote] = React.useState<string>('');

  if (!isOpen || !event) return null;

  const isQuotaExhausted = remainingDisputes <= 0;
  const isBlocked = isQuotaExhausted || isContinuousSevereInfraction;

  const REASONS = [
    {
      id: 'posture_adjustment' as const,
      label: 'Natural Posture / Typing Head Position',
      desc: 'Looking down at mechanical keyboard or brief neck stretch/tilt.',
    },
    {
      id: 'thinking_gesture' as const,
      label: 'Thinking Head Shake / Solving Gesture',
      desc: 'Brief head nod, head shake, or ceiling glance while reasoning through a problem.',
    },
    {
      id: 'speaking_proctor' as const,
      label: 'Vocal Clarification / Speaking to Instructor',
      desc: 'Legitimate question asked aloud or verbal self-talk during exam.',
    },
    {
      id: 'environmental_glance' as const,
      label: 'Physical Workspace Reference / Allowed Material',
      desc: 'Consulting approved textbook, scratchpad, or physical desk notes.',
    },
    {
      id: 'false_alarm_sensor' as const,
      label: 'Lighting Shift / Optical Sensor Jitter',
      desc: 'Room shadow, backlight glare, or web camera latency glitch.',
    },
    {
      id: 'other' as const,
      label: 'Other Contextual Activity',
      desc: 'Provide custom clarification below.',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E2E8F0] space-y-5">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#0F172A]">Dispute Distraction Flag</h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    remainingDisputes > 0
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {remainingDisputes > 0 ? `${remainingDisputes} of 5 Disputes Left` : '0 / 5 Disputes Left'}
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                Max 5 disputes allowed per session. Adapts detection sensitivity.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning If Quota Exhausted */}
        {isQuotaExhausted && (
          <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-900 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <strong>Dispute Quota Exhausted:</strong> You have reached the maximum allowed limit of 5 disputes for this session. This flag will be preserved in the audit log for proctor evaluation.
            </div>
          </div>
        )}

        {/* Warning If Continuous Severe Infraction Ongoing */}
        {isContinuousSevereInfraction && !isQuotaExhausted && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Dispute Blocked During Active Violation:</strong> Continuous severe off-task activity detected (prolonged sleeping or continuous phone usage). Please refocus on the screen before filing a dispute.
            </div>
          </div>
        )}

        {/* Flagged Event Details Summary */}
        <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-center justify-between text-xs">
          <div>
            <span className="text-[#64748B] font-medium">Flagged Event: </span>
            <strong className="text-[#0F172A] font-semibold">{event.label}</strong>
          </div>
          <span className="font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold">
            {event.durationSec}s Duration
          </span>
        </div>

        {/* Reason Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider block">
            Select Context Reason
          </label>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {REASONS.map((r) => (
              <label
                key={r.id}
                onClick={() => !isBlocked && setSelectedReason(r.id)}
                className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                  isBlocked
                    ? 'opacity-50 cursor-not-allowed bg-[#F8FAFC] border-[#E2E8F0]'
                    : selectedReason === r.id
                    ? 'bg-blue-50/70 border-blue-400 text-blue-950 shadow-2xs cursor-pointer'
                    : 'bg-white border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#334155] cursor-pointer'
                }`}
              >
                <input
                  type="radio"
                  name="dispute_reason"
                  disabled={isBlocked}
                  checked={selectedReason === r.id}
                  onChange={() => setSelectedReason(r.id)}
                  className="mt-0.5 accent-blue-600"
                />
                <div className="text-xs">
                  <div className="font-bold">{r.label}</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">{r.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Optional Context Note */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#0F172A] flex items-center justify-between">
            <span>Additional Explanation (Optional)</span>
            <span className="text-[11px] text-[#94A3B8]">Logged to audit trail</span>
          </label>
          <textarea
            rows={2}
            disabled={isBlocked}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g., solving quadratic equation on physical paper pad..."
            className={`w-full text-xs p-2.5 rounded-lg border border-[#E2E8F0] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              isBlocked ? 'opacity-50 bg-[#F1F5F9] cursor-not-allowed' : ''
            }`}
          />
        </div>

        {/* Auto-Tuning Assurance Banner */}
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <strong>Adaptive Calibration:</strong> Submitting this dispute immediately adapts the CV engine tolerance by +15%, increasing temporal hysteresis and zero-deviation angles. (Max 5 allowed per session).
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isBlocked}
            onClick={() => {
              if (isBlocked) return;
              onSubmitDispute(selectedReason, note);
              onClose();
            }}
            className={`px-5 py-2 text-xs font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-1.5 ${
              isBlocked
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#2563EB] hover:bg-blue-700 text-white cursor-pointer'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Confirm & Auto-Tune ({remainingDisputes}/5 Left)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
