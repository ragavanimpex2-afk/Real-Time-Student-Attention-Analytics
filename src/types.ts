/**
 * Type definitions for Privacy-First Real-Time Student Attention Analytics
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
  oauth_provider: 'google' | 'institutional_sso' | 'local';
  created_at: string;
}

export type GazeDirection = 'forward' | 'away_left' | 'away_right' | 'away_up' | 'away_down';

export type DistractionState =
  | 'focused'
  | 'gaze_away'
  | 'head_turned'
  | 'head_down_phone'
  | 'head_up_drift'
  | 'head_dancing_erratic'
  | 'eyes_closed'
  | 'drowsy_microsleep'
  | 'rapid_gaze_darting'
  | 'speaking_discussion'
  | 'laughing_smiling'
  | 'posture_adjustment'
  | 'face_absent'
  | 'multi_face_warning'
  | 'break_rest';

export type SessionMode = 'exam' | 'pomodoro_rest';

export interface PomodoroConfig {
  workMinutes?: number;
  breakMinutes?: number;
  workDurationMin: number; // e.g. 20
  breakDurationMin: number; // e.g. 15
  autoStartBreaks?: boolean;
}

export type DistractionFeedbackReason =
  | 'posture_stretch' // Just stretching / adjusting chair / head movement
  | 'reading_notes' // Reading physical notes / desk book
  | 'speaking_allowed' // Asking doubt / permitted discussion
  | 'laughing_smiling' // Smiling / social reaction
  | 'self_break' // Taking a short self-directed breather
  | 'false_alarm' // System misclassified completely
  | 'confirmed_distraction'; // Yes, I was distracted

export interface DistractionFeedbackEntry {
  id: string;
  timestamp: string;
  original_state: DistractionState;
  user_reason: DistractionFeedbackReason;
  comment?: string;
  corrected_to: DistractionState;
  auto_tuned_applied?: boolean;
}

export interface CVTelemetryFrame {
  timestamp: string;
  face_present: boolean;
  face_count: number;
  eye_openness: number; // 0.0 to 1.0 (mean of both eyes)
  eye_openness_left: number;
  eye_openness_right: number;
  speaking_score?: number; // 0.0 to 1.0 (lip movement/jaw oscillation)
  smile_score?: number; // 0.0 to 1.0 (smile intensity)
  jaw_openness?: number; // 0.0 to 1.0
  gaze_direction: GazeDirection;
  gaze_forward_score: number; // 0.0 to 1.0
  head_alignment: number; // 0.0 to 1.0 (1.0 = facing screen directly)
  head_pitch_deg: number;
  head_yaw_deg: number;
  head_roll_deg: number;
  motion_intensity: number; // 0 to 100 (Restlessness proxy normalized from kinematic variance)
  motion_variance: number; // Raw kinematic variance score (deg^2)
  blink_detected: boolean;
  blink_count: number;
  attention_score: number; // 0 to 100 Engagement/Attention Proxy
  distraction_state: DistractionState;
  distraction_subreason?: string;
  fps: number;
  system_load_pct: number;
  bounding_box?: {
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
  };
  additional_faces?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
    label: string;
  }>;
}

export interface AttentionWeightsConfig {
  facePresenceWeight: number; // default 0.50
  forwardGazeWeight: number; // default 0.30
  headAlignmentWeight: number; // default 0.20
  distractionThresholdSec: number; // default 3.0s
  blinkEarThreshold: number; // default 0.22
  headYawThresholdDeg: number; // default 22 deg
  headPitchThresholdDeg: number; // default 20 deg
}

export interface CalibrationBaseline {
  isCalibrated: boolean;
  baselinePitch: number;
  baselineYaw: number;
  baselineRoll: number;
  baselineEAR: number;
  calibratedAt?: string;
  samplesCount?: number;
}

export interface DetectedEvent {
  id: string;
  time: string; // e.g. "10:14"
  timeOffsetSec: number;
  type:
    | 'gaze_away'
    | 'face_absent'
    | 'head_turned'
    | 'prolonged_closure'
    | 'multi_face'
    | 'rapid_gaze_darting'
    | 'head_dancing_erratic'
    | 'speaking_discussion'
    | 'laughing_smiling'
    | 'posture_adjustment';
  label: string;
  durationSec: number;
  severity: 'low' | 'medium' | 'high';
  is_disputed?: boolean;
  dispute_reason?: string;
  dispute_comment?: string;
  dispute_note?: string;
}

export interface AIInsight {
  summary: string;
  overall_pattern: string;
  notable_periods: string;
  distraction_analysis: string;
  recommendations: string[];
  generated_at: string;
  provider: 'gemini' | 'groq' | 'statistical_engine';
  anonymized_input: {
    session_duration: number;
    average_attention_score: number;
    face_presence: number;
    forward_gaze: number;
    gaze_away_events: number;
    long_distraction_events: number;
    blink_rate: number;
    session_mode?: SessionMode;
    resting_baseline_pitch?: number;
    resting_baseline_yaw?: number;
  };
}

export interface TimelineDataPoint {
  timestamp: string;
  timeLabel: string;
  timeOffsetSec: number;
  attention_score: number;
  face_present: boolean;
  gaze_direction: GazeDirection;
  is_distracted: boolean;
  event_label?: string;
  is_break_interval?: boolean;
}

export interface SessionData {
  id: string;
  userId: string;
  sessionName: string;
  cohortClass: string;
  started_at: string;
  ended_at?: string;
  duration_sec: number;
  status: 'active' | 'completed' | 'archived';
  privacy_mode: 'Local Edge' | 'Anonymized';
  session_mode?: SessionMode;
  pomodoro_config?: PomodoroConfig;
  calibration_baseline?: CalibrationBaseline;
  average_attention_score: number;
  peak_attention_score: number;
  lowest_attention_score: number;
  face_presence_percentage: number;
  forward_gaze_percentage: number;
  distraction_events_count: number;
  longest_distraction_sec: number;
  blink_rate_avg: number;
  ai_insight?: AIInsight;
  timeline: TimelineDataPoint[];
  events: DetectedEvent[];
  weights_used: AttentionWeightsConfig;
  disputes_count?: number;
  feedback_log?: DistractionFeedbackEntry[];
  auto_tuned_count?: number;
}

export interface PrivacySettings {
  videoStorage: boolean; // Always false
  processingNode: 'Localhost' | 'Local Edge WASM';
  dataExport: 'Telemetry Only';
  telemetryRetention: '24 Hours' | '48 Hours' | '7 Days' | '30 Days';
  aggregateRetention: '1 Month' | '3 Months' | '6 Months' | '1 Year';
  auditLogs: AuditLogEntry[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  event: string;
  category: 'purge' | 'retention' | 'auth' | 'policy';
  details: string;
}
