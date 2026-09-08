import React, { useState, useEffect } from 'react';
import {
  User as UserType,
  SessionData,
  AttentionWeightsConfig,
  PrivacySettings,
  LabSessionConfig,
  StudentLabStatus,
  WarningResponseRecord,
  StudentTestAnswer,
} from './types';
import { DEFAULT_WEIGHTS } from './lib/cvEngine';
import { DEFAULT_LABS, INITIAL_STUDENT_ROSTER } from './data/defaultLabs';
import { Sidebar, Navbar, MobileDrawer, MobileBottomNav } from './components/Navigation';
import { SettingsModal } from './components/UIComponents';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LiveSessionPage } from './pages/LiveSessionPage';
import { SessionResultsPage } from './pages/SessionResultsPage';
import { SessionHistoryPage } from './pages/SessionHistoryPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AdminLabManagerPage } from './pages/AdminLabManagerPage';

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
    average_attention_score: 68.2,
    peak_attention_score: 92.0,
    lowest_attention_score: 35.5,
    face_presence_percentage: 91,
    forward_gaze_percentage: 72,
    distraction_events_count: 9,
    longest_distraction_sec: 64,
    blink_rate_avg: 19,
    weights_used: DEFAULT_WEIGHTS,
    timeline: [
      { timestamp: '14:00', timeLabel: '0m', timeOffsetSec: 0, attention_score: 80, face_present: true, gaze_direction: 'forward', is_distracted: false },
      { timestamp: '14:20', timeLabel: '20m', timeOffsetSec: 1200, attention_score: 71, face_present: true, gaze_direction: 'forward', is_distracted: false },
      { timestamp: '14:45', timeLabel: '45m', timeOffsetSec: 2700, attention_score: 58, face_present: true, gaze_direction: 'away_right', is_distracted: true },
      { timestamp: '15:10', timeLabel: '70m', timeOffsetSec: 4200, attention_score: 64, face_present: true, gaze_direction: 'forward', is_distracted: false },
    ],
    events: [
      { id: 'e2', time: '14:45', timeOffsetSec: 2700, type: 'head_turned', label: 'Head turned', durationSec: 25, severity: 'medium' },
    ],
  },
];

export default function App() {
  // Authentication State
  const [user, setUser] = useState<UserType | null>(() => {
    try {
      const saved = localStorage.getItem('auth_user_session');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // ignore
    }
    // Default to admin for immediate exploration, or login note view
    return {
      id: 'usr_admin_01',
      email: 'admin@university.edu',
      name: 'Dr. Elena Vance',
      role: 'Lab Coordinator & Admin',
      roleType: 'admin',
      oauth_provider: 'local',
      created_at: new Date().toISOString(),
    };
  });

  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<string>(() => {
    return user?.roleType === 'admin' ? 'labs' : 'dashboard';
  });

  // Lab Configuration State (Admin-managed)
  const [labs, setLabs] = useState<LabSessionConfig[]>(() => {
    try {
      const saved = localStorage.getItem('admin_lab_configs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not read saved lab configs:', e);
    }
    return DEFAULT_LABS;
  });

  const [activeLabId, setActiveLabId] = useState<string>(() => {
    return labs[0]?.id || DEFAULT_LABS[0].id;
  });

  const activeLab = labs.find((l) => l.id === activeLabId) || labs[0] || DEFAULT_LABS[0];

  // Student Oversight & Warning Response Roster
  const [studentRoster, setStudentRoster] = useState<StudentLabStatus[]>(() => {
    try {
      const saved = localStorage.getItem('admin_student_roster');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return INITIAL_STUDENT_ROSTER;
  });

  // Sync labs to localStorage
  const handleUpdateLabs = (updatedLabs: LabSessionConfig[]) => {
    setLabs(updatedLabs);
    try {
      localStorage.setItem('admin_lab_configs', JSON.stringify(updatedLabs));
    } catch (e) {
      console.warn('Could not save lab configs:', e);
    }
  };

  const handleSetActiveLab = (labId: string) => {
    setActiveLabId(labId);
    setLabs((prevLabs) => {
      const updated = prevLabs.map((l) => ({
        ...l,
        isActive: l.id === labId,
      }));
      try {
        localStorage.setItem('admin_lab_configs', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save lab configs:', e);
      }
      return updated;
    });
  };

  // Sync student roster when a student responds to an on-screen warning
  const handleRecordWarningResponse = (record: WarningResponseRecord) => {
    setStudentRoster((prev) =>
      prev.map((student) => {
        // Match active student (defaulting to Alex Rivera or user id)
        const isCurrentStudent =
          student.studentId === user?.id ||
          student.studentEmail === user?.email ||
          student.studentName.toLowerCase().includes('alex') ||
          student.studentId === 'STU-48201';

        if (isCurrentStudent) {
          const updatedStrikes = student.distractionCount + 1;
          const isWarningExceeded = updatedStrikes >= (activeLab?.maxDistractionsAllowed || 5);
          return {
            ...student,
            distractionCount: updatedStrikes,
            lastWarningResponseStatus: record.responseStatus,
            warningResponses: [record, ...student.warningResponses],
            complianceStatus: isWarningExceeded ? 'probation_exceeded' : student.complianceStatus,
          };
        }
        return student;
      })
    );
  };

  // Update student test examination status in the live roster
  const handleUpdateTestProgress = (progress: {
    testStatus: 'in_progress' | 'submitted';
    testScore?: number;
    testTotalPoints?: number;
    testQuestionsCount?: number;
    testAnswersCount?: number;
    studentAnswers?: Record<string, StudentTestAnswer>;
  }) => {
    setStudentRoster((prev) =>
      prev.map((student) => {
        const isCurrentStudent =
          student.studentId === user?.id ||
          student.studentEmail === user?.email ||
          student.studentName.toLowerCase().includes('alex') ||
          student.studentId === 'STU-48201';

        if (isCurrentStudent) {
          return {
            ...student,
            testStatus: progress.testStatus,
            testScore: progress.testScore ?? student.testScore,
            testTotalPoints: progress.testTotalPoints ?? student.testTotalPoints ?? 100,
            testQuestionsCount: progress.testQuestionsCount ?? student.testQuestionsCount,
            testAnswersCount: progress.testAnswersCount ?? student.testAnswersCount,
            studentAnswers: progress.studentAnswers ?? student.studentAnswers,
          };
        }
        return student;
      })
    );
  };

  // Save student roster changes
  useEffect(() => {
    try {
      localStorage.setItem('admin_student_roster', JSON.stringify(studentRoster));
    } catch (e) {
      // ignore
    }
  }, [studentRoster]);

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
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

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
    ],
  });

  const handleLogin = (newUser: UserType) => {
    setUser(newUser);
    try {
      localStorage.setItem('auth_user_session', JSON.stringify(newUser));
    } catch (e) {
      // ignore
    }

    if (newUser.roleType === 'admin') {
      setActiveTab('labs');
    } else {
      setActiveTab('live');
    }
  };

  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem('auth_user_session');
    } catch (e) {
      // ignore
    }
  };

  const handleStartLive = () => {
    setActiveTab('live');
  };

  const handleFinishLiveSession = (completedSession: SessionData) => {
    setSessions((prev) => [completedSession, ...prev]);
    setSelectedSession(completedSession);
    setActiveTab('results');
  };

  const handleSelectSession = (session: SessionData) => {
    setSelectedSession(session);
    setActiveTab('results');
  };

  const handleUpdatePrivacySettings = (newSettings: Partial<PrivacySettings>) => {
    setPrivacySettings((prev) => ({ ...prev, ...newSettings }));
  };

  // If user is not logged in, show Login view with demo credentials note
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
          isMobileDrawerOpen={isMobileDrawerOpen}
          setIsMobileDrawerOpen={setIsMobileDrawerOpen}
          liveSessionTitle={
            activeTab === 'results' && selectedSession
              ? selectedSession.sessionName
              : activeLab
              ? `${activeLab.name} (${activeLab.durationHours} hrs)`
              : 'Intro to Computer Science - Section B'
          }
        />

        {/* Mobile Slide-Out Drawer */}
        <MobileDrawer
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          onLogout={handleLogout}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isLiveActive={activeTab === 'live'}
          isMobileDrawerOpen={isMobileDrawerOpen}
          setIsMobileDrawerOpen={setIsMobileDrawerOpen}
        />

        {/* Dynamic Page Content (with mobile-friendly bottom clearance) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-10 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
          {/* Admin Lab Manager Page (Admin Exclusive) */}
          {activeTab === 'labs' && (
            <AdminLabManagerPage
              labs={labs}
              onUpdateLabs={handleUpdateLabs}
              activeLab={activeLab}
              onSetActiveLab={handleSetActiveLab}
              studentRoster={studentRoster}
              currentUser={user}
            />
          )}

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
              activeLab={activeLab}
              onRecordWarningResponse={handleRecordWarningResponse}
              user={user}
              onUpdateTestProgress={handleUpdateTestProgress}
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

        {/* Mobile Ergonomic Bottom Tab Navigation */}
        <MobileBottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isLiveActive={activeTab === 'live'}
          user={user}
        />
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
