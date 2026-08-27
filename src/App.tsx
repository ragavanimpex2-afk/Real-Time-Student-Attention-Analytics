import React, { useState, useEffect } from 'react';
import {
  User as UserType,
  SessionData,
  AttentionWeightsConfig,
  PrivacySettings,
} from './types';
import { DEFAULT_WEIGHTS } from './lib/cvEngine';
import { Sidebar, Navbar } from './components/Navigation';
import { SettingsModal } from './components/UIComponents';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LiveSessionPage } from './pages/LiveSessionPage';
import { SessionResultsPage } from './pages/SessionResultsPage';
import { SessionHistoryPage } from './pages/SessionHistoryPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { AnalyticsPage } from './pages/AnalyticsPage';

// Default initial sessions matching academic research references
const INITIAL_SESSIONS: SessionData[] = [
  {
    id: 'sess_psy101_01',
    userId: 'usr_researcher_01',
    sessionName: 'Cognitive load baseline test',
    cohortClass: 'PSY-101',
    started_at: '2026-08-24T09:00:00Z',
    ended_at: '2026-08-24T09:45:12Z',
    duration_sec: 2712, // 45m 12s
    status: 'completed',
    privacy_mode: 'Local Edge',
    average_attention_score: 72.4,
    peak_attention_score: 89.1,
    lowest_attention_score: 41.0,
    face_presence_percentage: 94,
    forward_gaze_percentage: 78,
    distraction_events_count: 6,
    longest_distraction_sec: 48,
    blink_rate_avg: 17,
    weights_used: DEFAULT_WEIGHTS,
    timeline: [
      { timestamp: '09:00', timeLabel: '0m', timeOffsetSec: 0, attention_score: 70, face_present: true, gaze_direction: 'forward', is_distracted: false },
      { timestamp: '09:10', timeLabel: '10m', timeOffsetSec: 600, attention_score: 75, face_present: true, gaze_direction: 'forward', is_distracted: false },
      { timestamp: '09:22', timeLabel: '22m', timeOffsetSec: 1320, attention_score: 55, face_present: true, gaze_direction: 'away_left', is_distracted: true },
      { timestamp: '09:35', timeLabel: '35m', timeOffsetSec: 2100, attention_score: 82, face_present: true, gaze_direction: 'forward', is_distracted: false },
      { timestamp: '09:45', timeLabel: '45m', timeOffsetSec: 2700, attention_score: 89, face_present: true, gaze_direction: 'forward', is_distracted: false },
    ],
    events: [
      { id: 'e1', time: '09:22', timeOffsetSec: 1320, type: 'gaze_away', label: 'Gaze away', durationSec: 18, severity: 'low' },
    ],
  },
  {
    id: 'sess_cs340_01',
    userId: 'usr_researcher_01',
    sessionName: 'Algorithms Lecture 12',
    cohortClass: 'CS-340',
    started_at: '2026-08-23T14:00:00Z',
    ended_at: '2026-08-23T15:15:00Z',
    duration_sec: 4500, // 1h 15m
    status: 'completed',
    privacy_mode: 'Local Edge',
    average_attention_score: 78.0,
    peak_attention_score: 92.5,
    lowest_attention_score: 55.0,
    face_presence_percentage: 96,
    forward_gaze_percentage: 84,
    distraction_events_count: 2,
    longest_distraction_sec: 24,
    blink_rate_avg: 16,
    weights_used: DEFAULT_WEIGHTS,
    timeline: [
      { timestamp: '14:00', timeLabel: '0m', timeOffsetSec: 0, attention_score: 74, face_present: true, gaze_direction: 'forward', is_distracted: false },
      { timestamp: '14:25', timeLabel: '25m', timeOffsetSec: 1500, attention_score: 84, face_present: true, gaze_direction: 'forward', is_distracted: false },
      { timestamp: '14:50', timeLabel: '50m', timeOffsetSec: 3000, attention_score: 78, face_present: true, gaze_direction: 'forward', is_distracted: false },
      { timestamp: '15:15', timeLabel: '75m', timeOffsetSec: 4500, attention_score: 80, face_present: true, gaze_direction: 'forward', is_distracted: false },
    ],
    events: [
      { id: 'e2', time: '14:35', timeOffsetSec: 2100, type: 'head_turned', label: 'Head turned away', durationSec: 24, severity: 'medium' },
    ],
  },
  {
    id: 'sess_bio201_01',
    userId: 'usr_researcher_01',
    sessionName: 'Cellular Biology Lab A',
    cohortClass: 'BIO-201',
    started_at: '2026-08-22T10:30:00Z',
    ended_at: '2026-08-22T12:30:00Z',
    duration_sec: 7200, // 2h 00m
    status: 'archived',
    privacy_mode: 'Anonymized',
    average_attention_score: 64.0,
    peak_attention_score: 81.0,
    lowest_attention_score: 22.0,
    face_presence_percentage: 88,
    forward_gaze_percentage: 62,
    distraction_events_count: 12,
    longest_distraction_sec: 134,
    blink_rate_avg: 21,
    weights_used: DEFAULT_WEIGHTS,
    timeline: [
      { timestamp: '10:30', timeLabel: '0m', timeOffsetSec: 0, attention_score: 65, face_present: true, gaze_direction: 'forward', is_distracted: false },
      { timestamp: '11:15', timeLabel: '45m', timeOffsetSec: 2700, attention_score: 48, face_present: true, gaze_direction: 'away_right', is_distracted: true },
      { timestamp: '12:00', timeLabel: '90m', timeOffsetSec: 5400, attention_score: 72, face_present: true, gaze_direction: 'forward', is_distracted: false },
      { timestamp: '12:30', timeLabel: '120m', timeOffsetSec: 7200, attention_score: 68, face_present: true, gaze_direction: 'forward', is_distracted: false },
    ],
    events: [
      { id: 'e3', time: '11:15', timeOffsetSec: 2700, type: 'face_absent', label: 'Face absent', durationSec: 134, severity: 'high' },
    ],
  },
  {
    id: 'sess_psy101_02',
    userId: 'usr_researcher_01',
    sessionName: 'Memory retention study phase 1',
    cohortClass: 'PSY-101',
    started_at: '2026-08-21T09:00:00Z',
    ended_at: '2026-08-21T09:50:05Z',
    duration_sec: 3005, // 50m 05s
    status: 'completed',
    privacy_mode: 'Local Edge',
    average_attention_score: 88.0,
    peak_attention_score: 96.0,
    lowest_attention_score: 68.0,
    face_presence_percentage: 98,
    forward_gaze_percentage: 91,
    distraction_events_count: 1,
    longest_distraction_sec: 15,
    blink_rate_avg: 15,
    weights_used: DEFAULT_WEIGHTS,
    timeline: [
      { timestamp: '09:00', timeLabel: '0m', timeOffsetSec: 0, attention_score: 82, face_present: true, gaze_direction: 'forward', is_distracted: false },
      { timestamp: '09:25', timeLabel: '25m', timeOffsetSec: 1500, attention_score: 91, face_present: true, gaze_direction: 'forward', is_distracted: false },
      { timestamp: '09:50', timeLabel: '50m', timeOffsetSec: 3000, attention_score: 88, face_present: true, gaze_direction: 'forward', is_distracted: false },
    ],
    events: [
      { id: 'e4', time: '09:32', timeOffsetSec: 1920, type: 'gaze_away', label: 'Gaze away', durationSec: 15, severity: 'low' },
    ],
  },
];

export default function App() {
  const [user, setUser] = useState<UserType | null>({
    id: 'usr_researcher_01',
    email: 'researcher@university.edu',
    name: 'Dr. Elena Vance',
    role: 'Lead Cognitive Researcher',
    oauth_provider: 'local',
    created_at: new Date().toISOString(),
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sessions, setSessions] = useState<SessionData[]>(() => {
    try {
      const saved = localStorage.getItem('student_attention_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not read local sessions storage:', e);
    }
    return INITIAL_SESSIONS;
  });
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(() => {
    try {
      const saved = localStorage.getItem('student_attention_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      }
    } catch (e) {
      // ignore
    }
    return INITIAL_SESSIONS[0];
  });
  const [weights, setWeights] = useState<AttentionWeightsConfig>(DEFAULT_WEIGHTS);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Sync sessions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('student_attention_sessions', JSON.stringify(sessions));
    } catch (e) {
      console.warn('Could not persist sessions to localStorage:', e);
    }
  }, [sessions]);

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    videoStorage: false,
    processingNode: 'Localhost',
    dataExport: 'Telemetry Only',
    telemetryRetention: '24 Hours',
    aggregateRetention: '6 Months',
    auditLogs: [
      {
        id: 'aud_1',
        timestamp: '10:42 AM',
        event: 'Automated Purge: Batch #492',
        category: 'purge',
        details: 'Deleted 1,280 expired transient frame metrics older than 24h retention window.',
      },
      {
        id: 'aud_2',
        timestamp: '09:15 AM',
        event: 'Retention Policy Updated',
        category: 'policy',
        details: 'Telemetry window confirmed at 24 Hours. Video storage strictly disabled.',
      },
      {
        id: 'aud_3',
        timestamp: '08:00 AM',
        event: 'Session Auth Verify (Local)',
        category: 'auth',
        details: 'Verified local OIDC token signature for researcher@university.edu.',
      },
      {
        id: 'aud_4',
        timestamp: 'Yesterday',
        event: 'Automated Purge: Batch #491',
        category: 'purge',
        details: 'Routine unrecoverable cleanup of expired session telemetry logs.',
      },
    ],
  });

  // Fetch initial session list from backend if available
  useEffect(() => {
    fetch('/api/sessions')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.sessions) && data.sessions.length > 0) {
          // Transform if needed
          const backendSessions = data.sessions.map((s: any) => ({
            id: s.id,
            userId: s.user_id,
            sessionName: s.session_name,
            cohortClass: s.cohort_class,
            started_at: s.started_at,
            ended_at: s.ended_at,
            duration_sec: s.duration_sec,
            status: s.status,
            privacy_mode: s.privacy_mode || 'Local Edge',
            average_attention_score: s.average_attention_score,
            peak_attention_score: s.peak_attention_score || 90,
            lowest_attention_score: s.lowest_attention_score || 40,
            face_presence_percentage: s.face_presence_percentage || 90,
            forward_gaze_percentage: s.forward_gaze_percentage || 75,
            distraction_events_count: s.distraction_events_count || 0,
            longest_distraction_sec: s.longest_distraction_sec || 0,
            blink_rate_avg: s.blink_rate_avg || 18,
            weights_used: s.weights_used || DEFAULT_WEIGHTS,
            timeline: [],
            events: [],
          }));
          setSessions((prev) => {
            const combined = [...backendSessions];
            // ensure initial ones exist
            for (const initS of INITIAL_SESSIONS) {
              if (!combined.some((c) => c.id === initS.id)) {
                combined.push(initS);
              }
            }
            return combined;
          });
        }
      })
      .catch((err) => console.log('Using in-memory session repository'));
  }, []);

  const handleLogin = (newUser: UserType) => {
    setUser(newUser);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleStartLive = () => {
    setActiveTab('live');
  };

  const handleFinishLiveSession = (completedSession: SessionData) => {
    setSessions((prev) => [completedSession, ...prev]);
    setSelectedSession(completedSession);
    setActiveTab('results');

    // Notify backend
    fetch(`/api/sessions/${completedSession.id}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        duration_sec: completedSession.duration_sec,
        average_attention_score: completedSession.average_attention_score,
        peak_attention_score: completedSession.peak_attention_score,
        lowest_attention_score: completedSession.lowest_attention_score,
        face_presence_percentage: completedSession.face_presence_percentage,
        forward_gaze_percentage: completedSession.forward_gaze_percentage,
        distraction_events_count: completedSession.distraction_events_count,
        longest_distraction_sec: completedSession.longest_distraction_sec,
        blink_rate_avg: completedSession.blink_rate_avg,
        timeline: completedSession.timeline,
        events: completedSession.events,
      }),
    }).catch((err) => console.warn('Could not post session end telemetry:', err));
  };

  const handleSelectSession = (session: SessionData) => {
    setSelectedSession(session);
    setActiveTab('results');
  };

  const handleUpdatePrivacySettings = (newSettings: Partial<PrivacySettings>) => {
    setPrivacySettings((prev) => ({ ...prev, ...newSettings }));
    fetch('/api/privacy/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    }).catch((err) => console.warn('Privacy settings sync error:', err));
  };

  // If user is not logged in, show Login view matching Image 1
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-[#0F172A] font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isLiveActive={activeTab === 'live'}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Navbar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          onLogout={handleLogout}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isLiveActive={activeTab === 'live'}
          liveSessionTitle={
            activeTab === 'results' && selectedSession
              ? selectedSession.sessionName
              : 'Intro to Computer Science - Section B'
          }
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 lg:p-10 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardPage
              sessions={sessions}
              onStartLive={handleStartLive}
              onSelectSession={handleSelectSession}
            />
          )}

          {activeTab === 'live' && (
            <LiveSessionPage
              weights={weights}
              onFinishSession={handleFinishLiveSession}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          )}

          {activeTab === 'results' && selectedSession && (
            <SessionResultsPage
              session={selectedSession}
              onBackToHistory={() => setActiveTab('history')}
              onStartNewSession={handleStartLive}
            />
          )}

          {activeTab === 'history' && (
            <SessionHistoryPage
              sessions={sessions}
              onSelectSession={handleSelectSession}
            />
          )}

          {activeTab === 'privacy' && (
            <PrivacyPage
              settings={privacySettings}
              onUpdateSettings={handleUpdatePrivacySettings}
            />
          )}

          {activeTab === 'analytics' && <AnalyticsPage sessions={sessions} />}
        </main>
      </div>

      {/* Formula & Calibration Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        weights={weights}
        onSaveWeights={(newWeights) => setWeights(newWeights)}
      />
    </div>
  );
}
