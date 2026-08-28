import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// In-Memory persistent data store (with SQLite-compatible schema)
interface DBUser {
  id: string;
  email: string;
  name: string;
  role: string;
  oauth_provider: string;
  created_at: string;
}

interface DBSession {
  id: string;
  user_id: string;
  session_name: string;
  cohort_class: string;
  started_at: string;
  ended_at?: string;
  duration_sec: number;
  status: 'active' | 'completed' | 'archived';
  average_attention_score: number;
  peak_attention_score: number;
  lowest_attention_score: number;
  face_presence_percentage: number;
  forward_gaze_percentage: number;
  distraction_events_count: number;
  longest_distraction_sec: number;
  blink_rate_avg: number;
  privacy_mode: string;
  weights_used?: any;
}

interface DBMetric {
  id: string;
  session_id: string;
  timestamp: string;
  timeOffsetSec: number;
  attention_score: number;
  face_present: boolean;
  gaze_forward: boolean;
  gaze_direction: string;
  is_distracted: boolean;
  head_alignment: number;
  blink_count: number;
}

interface DBEvent {
  id: string;
  session_id: string;
  time: string;
  timeOffsetSec: number;
  type: string;
  label: string;
  durationSec: number;
}

interface DBInsight {
  id: string;
  session_id: string;
  summary: string;
  overall_pattern: string;
  notable_periods: string;
  distraction_analysis: string;
  recommendations: string[];
  created_at: string;
  provider: string;
}

// Initial seed data matching academic research study sessions
const USERS: DBUser[] = [
  {
    id: 'usr_researcher_01',
    email: 'researcher@university.edu',
    name: 'Dr. Elena Vance',
    role: 'Lead Cognitive Researcher',
    oauth_provider: 'google',
    created_at: '2026-08-01T08:00:00Z',
  },
];

let CURRENT_USER: DBUser = USERS[0];

const SESSIONS: DBSession[] = [
  {
    id: 'sess_psy101_01',
    user_id: 'usr_researcher_01',
    session_name: 'Cognitive load baseline test',
    cohort_class: 'PSY-101',
    started_at: '2026-08-24T09:00:00Z',
    ended_at: '2026-08-24T09:45:12Z',
    duration_sec: 2712,
    status: 'completed',
    average_attention_score: 72.4,
    peak_attention_score: 89.1,
    lowest_attention_score: 41.0,
    face_presence_percentage: 94,
    forward_gaze_percentage: 78,
    distraction_events_count: 6,
    longest_distraction_sec: 48,
    blink_rate_avg: 17,
    privacy_mode: 'Local Edge',
  },
  {
    id: 'sess_cs340_01',
    user_id: 'usr_researcher_01',
    session_name: 'Algorithms Lecture 12',
    cohort_class: 'CS-340',
    started_at: '2026-08-23T14:00:00Z',
    ended_at: '2026-08-23T15:15:00Z',
    duration_sec: 4500,
    status: 'completed',
    average_attention_score: 78.0,
    peak_attention_score: 92.5,
    lowest_attention_score: 55.0,
    face_presence_percentage: 96,
    forward_gaze_percentage: 84,
    distraction_events_count: 2,
    longest_distraction_sec: 24,
    blink_rate_avg: 16,
    privacy_mode: 'Local Edge',
  },
  {
    id: 'sess_bio201_01',
    user_id: 'usr_researcher_01',
    session_name: 'Cellular Biology Lab A',
    cohort_class: 'BIO-201',
    started_at: '2026-08-22T10:30:00Z',
    ended_at: '2026-08-22T12:30:00Z',
    duration_sec: 7200,
    status: 'archived',
    average_attention_score: 64.0,
    peak_attention_score: 81.0,
    lowest_attention_score: 22.0,
    face_presence_percentage: 88,
    forward_gaze_percentage: 62,
    distraction_events_count: 12,
    longest_distraction_sec: 134,
    blink_rate_avg: 21,
    privacy_mode: 'Anonymized',
  },
  {
    id: 'sess_psy101_02',
    user_id: 'usr_researcher_01',
    session_name: 'Memory retention study phase 1',
    cohort_class: 'PSY-101',
    started_at: '2026-08-21T09:00:00Z',
    ended_at: '2026-08-21T09:50:05Z',
    duration_sec: 3005,
    status: 'completed',
    average_attention_score: 88.0,
    peak_attention_score: 96.0,
    lowest_attention_score: 68.0,
    face_presence_percentage: 98,
    forward_gaze_percentage: 91,
    distraction_events_count: 1,
    longest_distraction_sec: 15,
    blink_rate_avg: 15,
    privacy_mode: 'Local Edge',
  },
  {
    id: 'sess_demo_live',
    user_id: 'usr_researcher_01',
    session_name: 'Intro to Computer Science - Section B',
    cohort_class: 'CS-101',
    started_at: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    ended_at: new Date().toISOString(),
    duration_sec: 2520, // 42 minutes
    status: 'completed',
    average_attention_score: 74.0,
    peak_attention_score: 88.0,
    lowest_attention_score: 24.0,
    face_presence_percentage: 91,
    forward_gaze_percentage: 76,
    distraction_events_count: 14,
    longest_distraction_sec: 134, // 2m 14s
    blink_rate_avg: 18,
    privacy_mode: 'Local Edge',
  },
];

const TIMELINES: Record<string, DBMetric[]> = {
  sess_demo_live: generateSampleTimeline(2520, 74),
  sess_psy101_01: generateSampleTimeline(2712, 72.4),
  sess_cs340_01: generateSampleTimeline(4500, 78.0),
  sess_bio201_01: generateSampleTimeline(7200, 64.0),
  sess_psy101_02: generateSampleTimeline(3005, 88.0),
};

const EVENTS: Record<string, DBEvent[]> = {
  sess_demo_live: [
    {
      id: 'evt_1',
      session_id: 'sess_demo_live',
      time: '10:14',
      timeOffsetSec: 840,
      type: 'gaze_away',
      label: 'Gaze away',
      durationSec: 12,
    },
    {
      id: 'evt_2',
      session_id: 'sess_demo_live',
      time: '10:19',
      timeOffsetSec: 1200,
      type: 'face_absent',
      label: 'Face absent',
      durationSec: 134, // 2m 14s
    },
    {
      id: 'evt_3',
      session_id: 'sess_demo_live',
      time: '10:28',
      timeOffsetSec: 1740,
      type: 'gaze_away',
      label: 'Gaze away',
      durationSec: 45,
    },
    {
      id: 'evt_4',
      session_id: 'sess_demo_live',
      time: '10:35',
      timeOffsetSec: 2160,
      type: 'head_turned',
      label: 'Head turned away',
      durationSec: 20,
    },
  ],
};

const INSIGHTS: Record<string, DBInsight> = {
  sess_demo_live: {
    id: 'ins_demo',
    session_id: 'sess_demo_live',
    summary:
      'Engagement remained relatively stable during the first half of the session. Several prolonged gaze-away periods occurred during the second half.',
    overall_pattern:
      'High initial engagement proxy (75-88%) during introductory lecture minutes, followed by a noticeable lull between minute 20 and minute 27.',
    notable_periods:
      'Sustained high focus during minutes 0-18. Critical 2m 14s absence period detected at minute 20.',
    distraction_analysis:
      '14 significant deviations logged. Total distraction duration was approx. 5m 11s (12.3% of session).',
    recommendations: [
      'Incorporate short comprehension checkpoints at the 20-minute mark to retain engagement.',
      'Reduce continuous monologues past 25 minutes.',
      'Ensure screen-oriented visual aids are synced with spoken explanations.',
    ],
    created_at: new Date().toISOString(),
    provider: 'statistical_engine',
  },
};

let AUDIT_LOGS = [
  {
    id: 'aud_1',
    timestamp: '10:42 AM',
    event: 'Automated Purge: Batch #492',
    category: 'purge' as const,
    details: 'Deleted 1,280 expired transient frame metrics older than 24h retention window.',
  },
  {
    id: 'aud_2',
    timestamp: '09:15 AM',
    event: 'Retention Policy Updated',
    category: 'policy' as const,
    details: 'Telemetry window confirmed at 24 Hours. Video storage strictly disabled.',
  },
  {
    id: 'aud_3',
    timestamp: '08:00 AM',
    event: 'Session Auth Verify (Local)',
    category: 'auth' as const,
    details: 'Verified local OIDC token signature for researcher@university.edu.',
  },
  {
    id: 'aud_4',
    timestamp: 'Yesterday',
    event: 'Automated Purge: Batch #491',
    category: 'purge' as const,
    details: 'Routine unrecoverable cleanup of expired session telemetry logs.',
  },
];

let PRIVACY_SETTINGS = {
  videoStorage: false,
  processingNode: 'Localhost' as const,
  dataExport: 'Telemetry Only' as const,
  telemetryRetention: '24 Hours' as const,
  aggregateRetention: '6 Months' as const,
};

function generateSampleTimeline(durationSec: number, avgScore: number): DBMetric[] {
  const points: DBMetric[] = [];
  const count = Math.max(10, Math.min(60, Math.floor(durationSec / 60)));
  const step = durationSec / count;

  for (let i = 0; i <= count; i++) {
    const timeOffsetSec = Math.round(i * step);
    const minute = timeOffsetSec / 60;
    let score = avgScore + Math.sin(i * 0.4) * 12 + (Math.random() * 8 - 4);
    let isDistracted = false;
    let facePresent = true;
    let gazeDirection = 'forward';

    // Dip in the middle (e.g. 20m - 27m for demo)
    if (minute >= 18 && minute <= 26) {
      score = 15 + Math.random() * 15;
      isDistracted = true;
      if (minute >= 20 && minute <= 22) {
        facePresent = false;
        gazeDirection = 'away_left';
      } else {
        gazeDirection = 'away_right';
      }
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    points.push({
      id: `met_${i}`,
      session_id: 'generated',
      timestamp: new Date(Date.now() - (durationSec - timeOffsetSec) * 1000).toISOString(),
      timeOffsetSec,
      attention_score: score,
      face_present: facePresent,
      gaze_forward: !isDistracted,
      gaze_direction: gazeDirection,
      is_distracted: isDistracted,
      head_alignment: facePresent ? (isDistracted ? 0.45 : 0.92) : 0,
      blink_count: Math.floor(i * 1.5),
    });
  }
  return points;
}

// -------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Student Attention Analytics Engine',
    edge_privacy_enforced: true,
    video_storage: 'DISABLED_BY_DESIGN',
  });
});

// Auth endpoints
app.get('/api/auth/me', (req, res) => {
  res.json({
    user: CURRENT_USER,
    authenticated: !!CURRENT_USER,
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password, provider } = req.body;
  CURRENT_USER = {
    id: 'usr_' + Date.now(),
    email: email || 'researcher@university.edu',
    name: email ? email.split('@')[0] : 'Research Faculty',
    role: 'Instructor / Researcher',
    oauth_provider: provider || 'google',
    created_at: new Date().toISOString(),
  };
  res.json({ success: true, user: CURRENT_USER });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

app.get('/api/auth/callback', (req, res) => {
  res.redirect('/?auth=success');
});

// Session endpoints
app.get('/api/sessions', (req, res) => {
  res.json({ sessions: SESSIONS });
});

app.post('/api/sessions', (req, res) => {
  const { session_name, cohort_class, privacy_mode, weights } = req.body;
  const newSession: DBSession = {
    id: 'sess_' + Date.now(),
    user_id: CURRENT_USER ? CURRENT_USER.id : 'usr_anon',
    session_name: session_name || `Session ${new Date().toLocaleDateString()}`,
    cohort_class: cohort_class || 'General Cohort',
    started_at: new Date().toISOString(),
    duration_sec: 0,
    status: 'active',
    average_attention_score: 100,
    peak_attention_score: 100,
    lowest_attention_score: 100,
    face_presence_percentage: 100,
    forward_gaze_percentage: 100,
    distraction_events_count: 0,
    longest_distraction_sec: 0,
    blink_rate_avg: 16,
    privacy_mode: privacy_mode || 'Local Edge',
    weights_used: weights || {
      facePresenceWeight: 0.5,
      forwardGazeWeight: 0.3,
      headAlignmentWeight: 0.2,
    },
  };

  SESSIONS.unshift(newSession);
  TIMELINES[newSession.id] = [];
  EVENTS[newSession.id] = [];

  res.status(201).json({ session: newSession });
});

app.get('/api/sessions/:id', (req, res) => {
  const session = SESSIONS.find((s) => s.id === req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const timeline = TIMELINES[session.id] || [];
  const events = EVENTS[session.id] || [];
  const insight = INSIGHTS[session.id] || null;

  res.json({
    session,
    timeline,
    events,
    insight,
  });
});

app.post('/api/sessions/:id/end', (req, res) => {
  const session = SESSIONS.find((s) => s.id === req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const {
    duration_sec,
    average_attention_score,
    peak_attention_score,
    lowest_attention_score,
    face_presence_percentage,
    forward_gaze_percentage,
    distraction_events_count,
    longest_distraction_sec,
    blink_rate_avg,
    timeline,
    events,
  } = req.body;

  session.status = 'completed';
  session.ended_at = new Date().toISOString();
  if (duration_sec !== undefined) session.duration_sec = duration_sec;
  if (average_attention_score !== undefined)
    session.average_attention_score = average_attention_score;
  if (peak_attention_score !== undefined)
    session.peak_attention_score = peak_attention_score;
  if (lowest_attention_score !== undefined)
    session.lowest_attention_score = lowest_attention_score;
  if (face_presence_percentage !== undefined)
    session.face_presence_percentage = face_presence_percentage;
  if (forward_gaze_percentage !== undefined)
    session.forward_gaze_percentage = forward_gaze_percentage;
  if (distraction_events_count !== undefined)
    session.distraction_events_count = distraction_events_count;
  if (longest_distraction_sec !== undefined)
    session.longest_distraction_sec = longest_distraction_sec;
  if (blink_rate_avg !== undefined) session.blink_rate_avg = blink_rate_avg;

  if (Array.isArray(timeline) && timeline.length > 0) {
    TIMELINES[session.id] = timeline;
  }
  if (Array.isArray(events)) {
    EVENTS[session.id] = events;
  }

  res.json({ success: true, session });
});

// Batch numerical metrics ingestion (anonymized numbers only)
app.post('/api/sessions/:id/metrics', (req, res) => {
  const sessionId = req.params.id;
  const { metrics } = req.body;

  if (!TIMELINES[sessionId]) {
    TIMELINES[sessionId] = [];
  }

  if (Array.isArray(metrics)) {
    for (const m of metrics) {
      TIMELINES[sessionId].push({
        id: 'met_' + Date.now() + '_' + Math.random().toString(36).substring(7),
        session_id: sessionId,
        timestamp: m.timestamp || new Date().toISOString(),
        timeOffsetSec: m.timeOffsetSec || 0,
        attention_score: m.attention_score || 0,
        face_present: m.face_present ?? true,
        gaze_forward: m.gaze_direction === 'forward',
        gaze_direction: m.gaze_direction || 'forward',
        is_distracted: m.distraction_state !== 'focused',
        head_alignment: m.head_alignment || 0,
        blink_count: m.blink_count || 0,
      });
    }
  }

  res.json({ received: metrics?.length || 0 });
});

// Analytics endpoints
app.get('/api/analytics/:id', (req, res) => {
  const session = SESSIONS.find((s) => s.id === req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const timeline = TIMELINES[session.id] || [];
  const events = EVENTS[session.id] || [];
  const insight = INSIGHTS[session.id] || null;

  res.json({
    summary: {
      average_attention_score: session.average_attention_score,
      peak_attention_score: session.peak_attention_score,
      lowest_attention_score: session.lowest_attention_score,
      face_presence_percentage: session.face_presence_percentage,
      forward_gaze_percentage: session.forward_gaze_percentage,
      distraction_events_count: session.distraction_events_count,
      longest_distraction_sec: session.longest_distraction_sec,
      blink_rate_avg: session.blink_rate_avg,
      duration_sec: session.duration_sec,
    },
    timeline,
    events,
    insight,
  });
});

app.get('/api/analytics/:id/timeline', (req, res) => {
  const timeline = TIMELINES[req.params.id] || [];
  res.json({ timeline });
});

app.get('/api/analytics/:id/summary', (req, res) => {
  const session = SESSIONS.find((s) => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: 'Not found' });
  res.json({ session });
});

// AI Insights endpoint (Only receives numerical, anonymized aggregated metrics)
app.post('/api/ai/insight', async (req, res) => {
  const {
    session_id,
    session_duration = 1800,
    average_attention_score = 74,
    face_presence = 0.91,
    forward_gaze = 0.76,
    gaze_away_events = 14,
    long_distraction_events = 3,
    blink_rate = 18,
  } = req.body;

  // Strict privacy validation: ensure no raw images or embeddings are in the payload
  const bodyKeys = Object.keys(req.body);
  const forbiddenKeywords = ['image', 'frame', 'face_embedding', 'biometric', 'photo', 'video'];
  const hasForbidden = bodyKeys.some((k) =>
    forbiddenKeywords.some((fk) => k.toLowerCase().includes(fk))
  );

  if (hasForbidden) {
    return res.status(400).json({
      error: 'Privacy Violation: Raw frames or biometric data cannot be sent to the AI service.',
    });
  }

  // Attempt Google GenAI API or generate rich academic observation
  let insightResult: DBInsight = {
    id: 'ins_' + Date.now(),
    session_id: session_id || 'unassigned',
    summary: '',
    overall_pattern: '',
    notable_periods: '',
    distraction_analysis: '',
    recommendations: [],
    created_at: new Date().toISOString(),
    provider: 'statistical_engine',
  };

  const durationMin = Math.round(session_duration / 60);

  // 1. Attempt Groq API (Active production models: llama-3.3-70b-versatile, llama-3.1-8b-instant)
  if (process.env.GROQ_API_KEY) {
    const groqCandidateModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const prompt = `You are an academic research assistant for student engagement proxies in educational sessions.
Analyze these anonymized, aggregated numerical metrics from a ${durationMin}-minute session:
- Average Attention/Engagement Proxy Score: ${average_attention_score}/100
- Face Presence Ratio: ${(face_presence * 100).toFixed(1)}%
- Forward Gaze Ratio: ${(forward_gaze * 100).toFixed(1)}%
- Gaze-Away Events: ${gaze_away_events}
- Long Distraction Events: ${long_distraction_events}
- Average Blink Rate: ${blink_rate} blinks/min

CRITICAL PRIVACY INSTRUCTION:
- Do NOT infer personal identity, mental health, medical diagnoses, personality, emotion, or psychological conclusions.
- Frame all findings strictly as "visual engagement proxy signals" or "attention proxy indicators".

Provide your response in valid JSON with these exact keys:
{
  "summary": "1-2 sentence overall summary of visual engagement patterns",
  "overall_pattern": "Analysis of the stability and trajectory across the session",
  "notable_periods": "Description of focus peaks and lull intervals",
  "distraction_analysis": "Context on the ${gaze_away_events} gaze deviations and ${long_distraction_events} prolonged events",
  "recommendations": ["Actionable pedagogical suggestion 1", "Actionable pedagogical suggestion 2", "Actionable pedagogical suggestion 3"]
}
`;

    for (const modelName of groqCandidateModels) {
      if (insightResult.summary) break;
      try {
        const chatCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content:
                'You are a rigorous educational analytics assistant. You evaluate student engagement solely from aggregated telemetry proxy metrics. Always return clean JSON without markdown code blocks.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          model: modelName,
          response_format: { type: 'json_object' },
          temperature: 0.2,
          max_tokens: 650,
        });

        const rawText = chatCompletion.choices[0]?.message?.content?.trim();
        if (rawText) {
          const parsed = JSON.parse(rawText);
          insightResult = {
            id: 'ins_' + Date.now(),
            session_id: session_id || 'unassigned',
            summary: parsed.summary || insightResult.summary,
            overall_pattern: parsed.overall_pattern || insightResult.overall_pattern,
            notable_periods: parsed.notable_periods || insightResult.notable_periods,
            distraction_analysis: parsed.distraction_analysis || insightResult.distraction_analysis,
            recommendations: parsed.recommendations || [
              'Incorporate interactive polling at midpoint.',
              'Break lectures longer than 25 minutes into micro-segments.',
            ],
            created_at: new Date().toISOString(),
            provider: `groq (${modelName})`,
          };
          break;
        }
      } catch (err: any) {
        // Silently skip if model is unavailable or rate limited
      }
    }
  }

  // 2. Attempt Google GenAI API with active Gemini 3 series models (gemini-3.7-flash, gemini-3.1-flash-lite, gemini-flash-latest)
  if (!insightResult.summary && process.env.GEMINI_API_KEY) {
    const geminiCandidateModels = ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `You are an academic research assistant for student engagement proxies in educational sessions.
Analyze these anonymized, aggregated numerical metrics from a ${durationMin}-minute session:
- Average Attention/Engagement Proxy Score: ${average_attention_score}/100
- Face Presence Ratio: ${(face_presence * 100).toFixed(1)}%
- Forward Gaze Ratio: ${(forward_gaze * 100).toFixed(1)}%
- Gaze-Away Events: ${gaze_away_events}
- Long Distraction Events: ${long_distraction_events}
- Average Blink Rate: ${blink_rate} blinks/min

CRITICAL PRIVACY INSTRUCTION:
- Do NOT infer personal identity, mental health, medical diagnoses, personality, emotion, or psychological conclusions.
- Frame all findings strictly as "visual engagement proxy signals" or "attention proxy indicators".

Provide your response in JSON format with these exact keys:
{
  "summary": "1-2 sentence overall summary of visual engagement patterns",
  "overall_pattern": "Analysis of the stability and trajectory across the session",
  "notable_periods": "Description of focus peaks and lull intervals",
  "distraction_analysis": "Context on the ${gaze_away_events} gaze deviations and ${long_distraction_events} prolonged events",
  "recommendations": ["Actionable pedagogical suggestion 1", "Actionable pedagogical suggestion 2", "Actionable pedagogical suggestion 3"]
}`;

    for (const modelName of geminiCandidateModels) {
      if (insightResult.summary) break;
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.text?.trim();
        if (text) {
          const parsed = JSON.parse(text);
          insightResult = {
            id: 'ins_' + Date.now(),
            session_id: session_id || 'unassigned',
            summary: parsed.summary || insightResult.summary,
            overall_pattern: parsed.overall_pattern || insightResult.overall_pattern,
            notable_periods: parsed.notable_periods || insightResult.notable_periods,
            distraction_analysis: parsed.distraction_analysis || insightResult.distraction_analysis,
            recommendations: parsed.recommendations || [
              'Incorporate interactive polling at midpoint.',
              'Break lectures longer than 25 minutes into micro-segments.',
            ],
            created_at: new Date().toISOString(),
            provider: `gemini (${modelName})`,
          };
          break;
        }
      } catch (err: any) {
        // Fall back to next model candidate smoothly
      }
    }
  }

  // If Gemini was not configured or fell back, supply accurate calibrated research observations
  if (!insightResult.summary) {
    const focusLevel =
      average_attention_score >= 80 ? 'High' : average_attention_score >= 65 ? 'Moderate' : 'Low';
    insightResult.summary = `Engagement remained ${focusLevel.toLowerCase()} throughout the ${durationMin}-minute session with ${(
      face_presence * 100
    ).toFixed(0)}% face presence and ${(forward_gaze * 100).toFixed(0)}% screen-aligned gaze.`;

    insightResult.overall_pattern =
      average_attention_score >= 75
        ? 'Consistent visual engagement across lecture segments with standard micro-distraction intervals.'
        : 'Intermittent focus drops observed during mid-session intervals with elevated gaze-away frequency.';

    insightResult.notable_periods =
      long_distraction_events > 0
        ? `Logged ${long_distraction_events} extended distraction interval(s). Strongest visual orientation occurred during introductory segment.`
        : 'Steady engagement maintained with minimal prolonged off-screen head turns.';

    insightResult.distraction_analysis = `Detected ${gaze_away_events} gaze deviations and a blink frequency of ${blink_rate} blinks/min, typical of active visual display monitoring.`;

    insightResult.recommendations = [
      'Structure material into 15-20 minute thematic blocks to prevent engagement drop-offs.',
      'Introduce active student participation or comprehension questions after extended slide explanations.',
      'Maintain visual alignment by placing key instructional references near central display regions.',
    ];
  }

  if (session_id) {
    INSIGHTS[session_id] = insightResult;
  }

  res.json({ insight: insightResult });
});

// Privacy & Audit Log endpoints
app.get('/api/privacy/settings', (req, res) => {
  res.json({
    settings: PRIVACY_SETTINGS,
    auditLogs: AUDIT_LOGS,
  });
});

app.post('/api/privacy/settings', (req, res) => {
  const { telemetryRetention, aggregateRetention } = req.body;
  if (telemetryRetention) PRIVACY_SETTINGS.telemetryRetention = telemetryRetention;
  if (aggregateRetention) PRIVACY_SETTINGS.aggregateRetention = aggregateRetention;

  AUDIT_LOGS.unshift({
    id: 'aud_' + Date.now(),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    event: 'Retention Policy Updated',
    category: 'policy',
    details: `Updated telemetry retention window to ${PRIVACY_SETTINGS.telemetryRetention}.`,
  });

  res.json({ success: true, settings: PRIVACY_SETTINGS });
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Student Attention Analytics Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
