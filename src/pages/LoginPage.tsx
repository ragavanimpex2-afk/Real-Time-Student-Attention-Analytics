import React, { useState } from 'react';
import {
  BarChart2,
  CheckCircle2,
  Cpu,
  EyeOff,
  Building2,
  GraduationCap,
  ArrowRight,
  UserCheck,
  ShieldCheck,
  Key,
  Clock,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { User } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'student'>('admin');
  const [email, setEmail] = useState('admin@university.edu');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelect = (role: 'admin' | 'student') => {
    setSelectedRole(role);
    if (role === 'admin') {
      setEmail('admin@university.edu');
      setPassword('admin123');
    } else {
      setEmail('student@university.edu');
      setPassword('student123');
    }
  };

  const executeLogin = (role: 'admin' | 'student', customEmail?: string) => {
    setIsLoading(true);
    setTimeout(() => {
      if (role === 'admin') {
        onLogin({
          id: 'usr_admin_01',
          email: customEmail || 'admin@university.edu',
          name: 'Dr. Elena Vance',
          role: 'Lab Coordinator & Admin',
          roleType: 'admin',
          oauth_provider: 'local',
          created_at: new Date().toISOString(),
        });
      } else {
        onLogin({
          id: 'usr_student_01',
          email: customEmail || 'student@university.edu',
          name: 'Alex Rivera (Student)',
          role: 'CS Undergrad Participant',
          roleType: 'student',
          oauth_provider: 'local',
          created_at: new Date().toISOString(),
        });
      }
      setIsLoading(false);
    }, 250);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Auto-detect role from email or selected role
    const isStudent =
      selectedRole === 'student' ||
      email.toLowerCase().includes('student') ||
      email.toLowerCase().includes('alex');
    executeLogin(isStudent ? 'student' : 'admin', email);
  };

  const handleGuestLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      onLogin({
        id: 'usr_guest',
        email: 'guest@university.dev',
        name: 'Guest Researcher',
        role: 'Research Evaluator',
        roleType: 'admin',
        oauth_provider: 'local',
        created_at: new Date().toISOString(),
      });
      setIsLoading(false);
    }, 200);
  };

  return (
    <div
      id="login-page-container"
      className="min-h-screen w-full bg-[#F8FAFC] flex flex-col lg:flex-row items-stretch justify-center"
    >
      {/* Left Column - Academic Branding & Credentials Note */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-10 lg:py-20 max-w-2xl">
        <div className="space-y-6">
          {/* Eyebrow Label */}
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs sm:text-sm">
            <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-blue-600" />
            </div>
            <span>Academic Lab Engagement & Attention Intelligence</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F172A] tracking-tight leading-[1.15]">
            Real-Time Student Lab Attention System
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
            Privacy-first edge computer vision monitoring with instructor lab creation, duration limits, prohibition rules, and interactive distraction response tracking.
          </p>

          {/* DEMO CREDENTIALS NOTE BOX (As requested) */}
          <div
            id="demo-credentials-note-box"
            className="p-5 bg-white border-2 border-indigo-100 rounded-2xl shadow-xs space-y-4"
          >
            <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs uppercase tracking-wider">
              <Key className="w-4 h-4 text-blue-600" />
              <span>TEST CREDENTIALS & ROLE GUIDE</span>
            </div>

            {/* Admin Credential Card */}
            <div
              onClick={() => handleRoleSelect('admin')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-blue-50/90 border-blue-500 ring-1 ring-blue-500'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-700" />
                  <span className="text-xs font-bold text-slate-900">
                    Admin / Lab Coordinator
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-200/60 text-blue-900">
                  FULL LAB CREATOR
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-600 font-mono">
                Email: <span className="font-bold text-slate-900">admin@university.edu</span> • Pass: <span className="font-bold text-slate-900">admin123</span>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500 leading-snug">
                Creates & edits labs (how many hours the lab is, what rules should not be done, distraction limits, warning response policies) and live student oversight.
              </p>
            </div>

            {/* Student Credential Card */}
            <div
              onClick={() => handleRoleSelect('student')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedRole === 'student'
                  ? 'bg-emerald-50/90 border-emerald-500 ring-1 ring-emerald-500'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-slate-900">
                    Student / Lab Participant
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-200/60 text-emerald-900">
                  PARTICIPANT VIEW
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-600 font-mono">
                Email: <span className="font-bold text-slate-900">student@university.edu</span> • Pass: <span className="font-bold text-slate-900">student123</span>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500 leading-snug">
                Joins the active lab, sees remaining lab duration countdown, adheres to prohibitions, runs attention proxy, and responds to distraction warnings.
              </p>
            </div>
          </div>

          {/* Privacy Value Props */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-3 text-xs sm:text-sm text-[#0F172A] font-medium">
              <Cpu className="w-4 h-4 text-blue-600 shrink-0" />
              <span>100% Client-side Edge WASM Processing (No cloud video streaming)</span>
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-[#0F172A] font-medium">
              <EyeOff className="w-4 h-4 text-blue-600 shrink-0" />
              <span>No video frames stored • Ephemeral telemetry only</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Sign In Form Card */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-10 lg:px-16">
        <div className="w-full max-w-md">
          <div
            id="login-card"
            className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-5"
          >
            <div className="text-center space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
                Sign In to Platform
              </h2>
              <p className="text-xs text-[#64748B]">
                Select role or enter your institutional credentials
              </p>
            </div>

            {/* Role Switcher Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => handleRoleSelect('admin')}
                className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedRole === 'admin'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Admin Login</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('student')}
                className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedRole === 'student'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student Login</span>
              </button>
            </div>

            {/* 1-Click Fast Role Sign-In Buttons */}
            <div className="space-y-2">
              <button
                id="btn-fast-login-role"
                type="button"
                onClick={() => executeLogin(selectedRole)}
                disabled={isLoading}
                className={`w-full py-3 px-4 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  selectedRole === 'admin'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  1-Click Sign In as {selectedRole === 'admin' ? 'Admin / Coordinator' : 'Student'}
                </span>
              </button>

              <button
                id="btn-guest-login"
                type="button"
                onClick={handleGuestLogin}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-slate-500" />
                <span>Instant Guest Evaluation Mode</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-[#E2E8F0] w-full"></div>
              <span className="bg-white px-3 text-[10px] font-semibold text-[#94A3B8] uppercase">
                OR SIGN IN WITH CUSTOM CREDENTIALS
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1"
                >
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={selectedRole === 'admin' ? 'admin@university.edu' : 'student@university.edu'}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1"
                >
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                />
              </div>

              <button
                id="btn-sign-in-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#0F172A] hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>Submit & Access Platform</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Privacy Footnote */}
          <div className="mt-5 flex flex-col items-center text-center space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-100 text-[10px] font-bold text-blue-800">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              <span>EDGE PROCESSING ACTIVE • NO CLOUD VIDEO STORED</span>
            </div>
            <p className="text-[11px] text-[#64748B]">
              Switch roles freely at any time by signing out from the sidebar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
