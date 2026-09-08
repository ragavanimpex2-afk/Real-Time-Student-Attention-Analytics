import React, { useState } from 'react';
import {
  LayoutDashboard,
  Video,
  History,
  BarChart3,
  Shield,
  Settings,
  User,
  Radio,
  EyeOff,
  LogOut,
  Menu,
  X,
  ChevronRight,
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
  isMobileDrawerOpen?: boolean;
  setIsMobileDrawerOpen?: (open: boolean) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    id: 'live',
    label: 'Live Session',
    icon: Video,
    badge: 'LIVE',
  },
  { id: 'history', label: 'Session History', icon: History },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'privacy', label: 'Privacy', icon: Shield },
];

export const Sidebar: React.FC<NavigationProps & { isCollapsed?: boolean; setIsCollapsed?: (val: boolean) => void }> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  isLiveActive,
}) => {
  return (
    <aside
      id="app-sidebar"
      className="desktop-sidebar-only hidden md:flex w-64 bg-white border-r border-[#E2E8F0] flex-col justify-between h-screen shrink-0 sticky top-0 z-20"
    >
      <div>
        {/* Brand Header */}
        <div className="p-5 lg:p-6 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-sm lg:text-[15px] text-[#0F172A] tracking-tight leading-tight truncate">
                Edge Analytics
              </h1>
              <p className="text-[11px] text-[#64748B] font-mono">V3.2.0 RESEARCH</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 lg:p-4 space-y-1.5" id="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.id === 'live' && isLiveActive && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-600 animate-pulse">
                    LIVE
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
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4 text-[#64748B]" />
          <span>Settings</span>
        </button>

        <button
          id="btn-sidebar-account"
          onClick={() => setActiveTab('privacy')}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        >
          <User className="w-4 h-4 text-[#64748B]" />
          <span>Account & Security</span>
        </button>

        {/* Privacy Pill */}
        <div className="mt-3 p-2.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-[11px] text-[#64748B] flex items-center gap-2">
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
  isMobileDrawerOpen,
  setIsMobileDrawerOpen,
}) => {
  return (
    <header
      id="app-navbar"
      className="h-16 bg-white border-b border-[#E2E8F0] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs"
    >
      {/* Left Section: Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          id="btn-mobile-menu-toggle"
          type="button"
          onClick={() => setIsMobileDrawerOpen && setIsMobileDrawerOpen(!isMobileDrawerOpen)}
          className="md:hidden p-2 -ml-1 text-[#334155] hover:text-[#0F172A] hover:bg-slate-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Toggle mobile menu"
        >
          {isMobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm sm:text-base font-semibold text-[#0F172A] truncate">
            Research Monitor
          </h2>
          <span className="text-[#CBD5E1] hidden sm:inline">|</span>
          <span className="text-xs sm:text-sm text-[#64748B] font-medium hidden lg:inline truncate max-w-[200px]">
            {liveSessionTitle}
          </span>
        </div>

        {isLiveActive ? (
          <div
            id="live-indicator-badge"
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-[11px] sm:text-xs font-semibold tracking-wide border border-red-200 animate-pulse shrink-0"
          >
            <span className="w-2 h-2 rounded-full bg-red-600"></span>
            <span>{liveSessionTime || '00:00:00'} LIVE</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            <span className="hidden md:inline">SYSTEM ACTIVE</span>
          </div>
        )}
      </div>

      {/* Right Section: Privacy Status, Quick Buttons, User Profile */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Privacy Icon */}
        <div
          title="Edge processing verified: Zero video frames saved"
          className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] cursor-help"
        >
          <Shield className="w-4 h-4 text-emerald-600" />
        </div>

        {/* Live Status Button */}
        <button
          id="btn-live-status-pill"
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
          <span className="hidden xs:inline">Config</span>
          <span className="xs:hidden">Calib</span>
        </button>

        {/* User Avatar Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-[#E2E8F0]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <button
            id="btn-nav-logout"
            onClick={onLogout}
            title="Sign Out"
            className="p-1.5 text-[#64748B] hover:text-red-600 rounded-md hover:bg-red-50 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export const MobileDrawer: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  onLogout,
  onOpenSettings,
  isLiveActive,
  isMobileDrawerOpen,
  setIsMobileDrawerOpen,
  user,
}) => {
  if (!isMobileDrawerOpen) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50 flex">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => setIsMobileDrawerOpen && setIsMobileDrawerOpen(false)}
      />

      {/* Drawer panel */}
      <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
        <div>
          {/* Header */}
          <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-semibold text-sm text-[#0F172A] leading-tight">
                  Edge Analytics
                </h1>
                <p className="text-[11px] text-[#64748B] font-mono">V3.2.0 MOBILE</p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileDrawerOpen && setIsMobileDrawerOpen(false)}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User info banner */}
          <div className="p-4 bg-slate-50 border-b border-[#E2E8F0] flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-xs shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#0F172A] truncate">{user?.name || 'Researcher'}</p>
              <p className="text-[11px] text-[#64748B] truncate">{user?.role || 'Academic'}</p>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileDrawerOpen && setIsMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-colors min-h-[46px] cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'live' && isLiveActive ? (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-600 animate-pulse">
                      LIVE
                    </span>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E2E8F0] space-y-2">
          <button
            onClick={() => {
              onOpenSettings();
              setIsMobileDrawerOpen && setIsMobileDrawerOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 min-h-[44px] cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Sensitivity & Weights</span>
          </button>

          <button
            onClick={() => {
              onLogout();
              setIsMobileDrawerOpen && setIsMobileDrawerOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 min-h-[44px] cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>

          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
            <EyeOff className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">Edge Processing • 0 Video Stored</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MobileBottomNav: React.FC<{
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLiveActive?: boolean;
}> = ({ activeTab, setActiveTab, isLiveActive }) => {
  return (
    <nav
      id="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] px-2 py-1 flex items-center justify-around shadow-lg"
      aria-label="Mobile navigation"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        const isLive = item.id === 'live';

        return (
          <button
            key={item.id}
            id={`mobile-nav-${item.id}`}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all min-w-[56px] min-h-[48px] cursor-pointer relative ${
              isActive
                ? 'text-blue-600 font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? 'scale-110 text-blue-600 stroke-[2.2]' : 'stroke-[1.8]'
                }`}
              />
              {isLive && isLiveActive && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                </span>
              )}
            </div>
            <span className={`text-[10px] tracking-tight mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>
              {item.id === 'live' ? 'Live' : item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

