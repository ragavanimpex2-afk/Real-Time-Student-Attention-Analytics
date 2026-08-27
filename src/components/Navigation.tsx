import React from 'react';
import {
  LayoutDashboard,
  Video,
  History,
  BarChart3,
  Shield,
  Settings,
  User,
  Radio,
  Sliders,
  CheckCircle2,
  Lock,
  EyeOff,
  LogOut,
} from 'lucide-react';
import { User as UserType } from '../types';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: UserType | null;
  onLogout: () => void;
  onOpenSettings: () => void;
  isLiveActive?: boolean;
  liveSessionTime?: string;
  liveSessionTitle?: string;
}

export const Sidebar: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  isLiveActive,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'live',
      label: 'Live Session',
      icon: Video,
      badge: isLiveActive ? 'LIVE' : undefined,
    },
    { id: 'history', label: 'Session History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ];

  return (
    <aside
      id="app-sidebar"
      className="w-64 bg-white border-r border-[#E2E8F0] flex flex-col justify-between h-screen shrink-0 sticky top-0"
    >
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-[#E2E8F0] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-[15px] text-[#0F172A] tracking-tight leading-tight">
              Edge Analytics
            </h1>
            <p className="text-xs text-[#64748B] font-mono">V3.2.0 RESEARCH</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5" id="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-600 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Actions */}
      <div className="p-4 border-t border-[#E2E8F0] space-y-1.5">
        <button
          id="btn-sidebar-settings"
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
        >
          <Settings className="w-4 h-4 text-[#64748B]" />
          <span>Settings</span>
        </button>

        <button
          id="btn-sidebar-account"
          onClick={() => setActiveTab('privacy')}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
        >
          <User className="w-4 h-4 text-[#64748B]" />
          <span>Account & Security</span>
        </button>

        {/* Privacy Pill */}
        <div className="mt-3 p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-[11px] text-[#64748B] flex items-center gap-2">
          <EyeOff className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="truncate">Edge Processing • No Video Stored</span>
        </div>
      </div>
    </aside>
  );
};

export const Navbar: React.FC<NavigationProps> = ({
  user,
  onLogout,
  onOpenSettings,
  isLiveActive,
  liveSessionTime,
  liveSessionTitle = 'Intro to Computer Science - Section B',
}) => {
  return (
    <header
      id="app-navbar"
      className="h-16 bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between sticky top-0 z-30"
    >
      {/* Left Section: Research Monitor Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold text-[#0F172A]">Research Monitor</h2>
        <span className="text-[#CBD5E1]">|</span>
        <span className="text-sm text-[#64748B] font-medium hidden sm:inline">
          {liveSessionTitle}
        </span>

        {isLiveActive ? (
          <div
            id="live-indicator-badge"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-xs font-semibold tracking-wide border border-red-200 animate-pulse"
          >
            <span className="w-2 h-2 rounded-full bg-red-600"></span>
            <span>{liveSessionTime || '00:00:00'} LIVE</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            <span className="hidden md:inline">SYSTEM ACTIVE</span>
          </div>
        )}
      </div>

      {/* Right Section: Privacy Status, Quick Buttons, User Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Privacy Icon */}
        <div
          title="Edge processing verified: Zero video frames saved"
          className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] cursor-help"
        >
          <Shield className="w-4 h-4 text-emerald-600" />
        </div>

        <div
          title="Telemetry streaming active"
          className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B]"
        >
          <Radio className="w-4 h-4 text-blue-600" />
        </div>

        {/* Live Status Button */}
        <button
          id="btn-live-status-pill"
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
          <span>Live Status</span>
        </button>

        {/* User Avatar Menu */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#E2E8F0]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <button
            id="btn-nav-logout"
            onClick={onLogout}
            title="Sign Out"
            className="p-1.5 text-[#64748B] hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
