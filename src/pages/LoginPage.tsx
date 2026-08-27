import React, { useState } from 'react';
import {
  BarChart2,
  CheckCircle2,
  Cpu,
  EyeOff,
  ShieldCheck,
  Lock,
  ArrowRight,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { User } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('researcher@university.edu');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      onLogin({
        id: 'usr_researcher_01',
        email: email || 'researcher@university.edu',
        name: 'Dr. Elena Vance',
        role: 'Lead Cognitive Researcher',
        oauth_provider: 'local',
        created_at: new Date().toISOString(),
      });
      setIsLoading(false);
    }, 300);
  };

  const handleGuestLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      onLogin({
        id: 'usr_guest',
        email: 'guest@local.dev',
        name: 'Guest Researcher',
        role: 'Local Guest Mode',
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
      {/* Left Column - Academic Branding & Privacy Guarantees */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-20 py-12 lg:py-24 max-w-2xl">
        <div className="space-y-6">
          {/* Eyebrow Label */}
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
            <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-blue-600" />
            </div>
            <span>Precision Analytical System</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F172A] tracking-tight leading-[1.15]">
            Real-Time Student Attention Analytics
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#64748B] leading-relaxed max-w-lg">
            Privacy-first engagement analytics powered by edge computer vision and local processing.
          </p>

          {/* Privacy Value Props */}
          <div className="space-y-4 pt-6">
            <div className="flex items-center gap-3 text-sm text-[#0F172A] font-medium">
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
              <span>Real-time engagement proxy monitoring</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#0F172A] font-medium">
              <Cpu className="w-5 h-5 text-blue-600 shrink-0" />
              <span>Edge Processing Active (Zero Cloud Stream)</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#0F172A] font-medium">
              <EyeOff className="w-5 h-5 text-blue-600 shrink-0" />
              <span>Video Not Stored • Local Privacy Guard</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Sign In Form Card */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md">
          <div
            id="login-card"
            className="bg-white rounded-2xl border border-[#E2E8F0] p-8 sm:p-10 shadow-xs space-y-6"
          >
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">Sign In</h2>
              <p className="text-xs text-[#64748B]">
                Access dashboard with local guest mode or credentials
              </p>
            </div>

            {/* Quick Guest Mode Action Button */}
            <button
              id="btn-guest-login"
              type="button"
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2.5 group"
            >
              <UserCheck className="w-4 h-4 text-emerald-100 group-hover:scale-110 transition-transform" />
              <span>Continue as Guest (Instant Access)</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-[#E2E8F0] w-full"></div>
              <span className="bg-white px-3 text-xs font-semibold text-[#94A3B8] uppercase">
                OR SIGN IN LOCALLY
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="researcher@university.edu"
                  className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5"
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
                  className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                />
              </div>

              <button
                id="btn-sign-in-submit"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>Sign In as Researcher</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Privacy Enforcement Footnote Pill */}
          <div className="mt-6 flex flex-col items-center text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/80 border border-blue-100 text-[11px] font-semibold text-blue-800">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              <span>LOCAL EDGE PROCESSING • VIDEO NOT STORED</span>
            </div>
            <p className="text-xs text-[#64748B]">
              Camera signals process strictly inside your client browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
