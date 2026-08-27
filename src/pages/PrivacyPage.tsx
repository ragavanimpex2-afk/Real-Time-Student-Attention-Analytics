import React, { useState } from 'react';
import {
  ShieldCheck,
  VideoOff,
  Server,
  FileCheck,
  Lock,
  Key,
  History,
  Info,
  CheckCircle,
  Clock,
  Trash2,
} from 'lucide-react';
import { PrivacySettings, AuditLogEntry } from '../types';

interface PrivacyPageProps {
  settings: PrivacySettings;
  onUpdateSettings: (newSettings: Partial<PrivacySettings>) => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [telemetryRetention, setTelemetryRetention] = useState(
    settings.telemetryRetention || '24 Hours'
  );
  const [aggregateRetention, setAggregateRetention] = useState(
    settings.aggregateRetention || '6 Months'
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveRetention = (newTel: any, newAgg: any) => {
    setTelemetryRetention(newTel);
    setAggregateRetention(newAgg);
    onUpdateSettings({
      telemetryRetention: newTel,
      aggregateRetention: newAgg,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div id="privacy-controls-page" className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
          Privacy & Security Controls
        </h1>
        <p className="text-sm text-[#64748B] mt-1 max-w-3xl leading-relaxed">
          Configuration and status of edge-processing parameters, data retention, and encryption
          protocols for real-time attention analytics.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Retention policy updated successfully. Automated purge schedule synced.</span>
        </div>
      )}

      {/* Main Grid: Left Controls (8 cols) & Right Encryption/Audit (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Edge Processing Status */}
          <div
            id="edge-processing-status-card"
            className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-2xs space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-[#0F172A]">Edge Processing Status</h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                <span>SYSTEM ACTIVE</span>
              </span>
            </div>

            <p className="text-xs text-[#64748B]">
              All video analysis is localized. No visual data is transmitted or stored.
            </p>

            {/* 3 Status Blocks in a row (Matching Image 4) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5 text-center flex flex-col items-center justify-center space-y-1">
                <VideoOff className="w-5 h-5 text-[#64748B] mb-1" />
                <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                  VIDEO STORAGE
                </div>
                <div className="text-base font-bold text-[#0F172A]">Disabled</div>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5 text-center flex flex-col items-center justify-center space-y-1">
                <Server className="w-5 h-5 text-[#64748B] mb-1" />
                <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                  PROCESSING NODE
                </div>
                <div className="text-base font-bold text-[#0F172A]">Localhost</div>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5 text-center flex flex-col items-center justify-center space-y-1">
                <FileCheck className="w-5 h-5 text-[#64748B] mb-1" />
                <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                  DATA EXPORT
                </div>
                <div className="text-base font-bold text-[#0F172A]">Telemetry Only</div>
              </div>
            </div>
          </div>

          {/* Card 2: Analytical Proxy Data Retention */}
          <div
            id="data-retention-card"
            className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-2xs space-y-6"
          >
            <div className="flex items-center gap-2.5">
              <History className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">
                  Analytical Proxy Data Retention
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Configure lifecycle for numeric attention proxy scores and aggregate telemetry.
                </p>
              </div>
            </div>

            <div className="space-y-5 divide-y divide-[#E2E8F0] pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
                <div>
                  <div className="text-sm font-bold text-[#0F172A]">
                    Session Telemetry Retention
                  </div>
                  <div className="text-xs text-[#64748B]">
                    Duration numeric proxy scores are held before permanent deletion.
                  </div>
                </div>
                <select
                  id="select-telemetry-retention"
                  value={telemetryRetention}
                  onChange={(e) => handleSaveRetention(e.target.value, aggregateRetention)}
                  className="bg-white border border-[#E2E8F0] rounded-lg px-4 py-2 text-xs font-semibold text-[#0F172A] shadow-2xs focus:outline-hidden focus:border-blue-600 cursor-pointer min-w-[140px]"
                >
                  <option value="24 Hours">24 Hours</option>
                  <option value="48 Hours">48 Hours</option>
                  <option value="7 Days">7 Days</option>
                  <option value="30 Days">30 Days</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-5">
                <div>
                  <div className="text-sm font-bold text-[#0F172A]">
                    Aggregate Statistical Models
                  </div>
                  <div className="text-xs text-[#64748B]">
                    Retention of fully anonymized, averaged cohort data for baseline comparison.
                  </div>
                </div>
                <select
                  id="select-aggregate-retention"
                  value={aggregateRetention}
                  onChange={(e) => handleSaveRetention(telemetryRetention, e.target.value)}
                  className="bg-white border border-[#E2E8F0] rounded-lg px-4 py-2 text-xs font-semibold text-[#0F172A] shadow-2xs focus:outline-hidden focus:border-blue-600 cursor-pointer min-w-[140px]"
                >
                  <option value="1 Month">1 Month</option>
                  <option value="3 Months">3 Months</option>
                  <option value="6 Months">6 Months</option>
                  <option value="1 Year">1 Year</option>
                </select>
              </div>
            </div>

            {/* Information Callout Box */}
            <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl p-4 flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-[#1E40AF] leading-relaxed">
                Data purging is an automated, unrecoverable process. Changes to retention policies
                apply globally to all subsequent sessions.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Transit Encryption Card (Matching Image 4) */}
          <div
            id="transit-encryption-card"
            className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-2xs space-y-4"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-[#0F172A]">
              <Key className="w-4 h-4 text-blue-600" />
              <span>Transit Encryption</span>
            </div>

            <div className="space-y-4 pt-1 text-xs">
              <div className="border-l-2 border-l-blue-600 pl-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                  PROTOCOL
                </div>
                <div className="text-sm font-bold text-[#0F172A] mt-0.5">TLS 1.3 (Strict)</div>
              </div>

              <div className="border-l-2 border-l-slate-200 pl-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                  CIPHER SUITE
                </div>
                <div className="font-mono text-xs font-semibold text-[#334155] mt-0.5">
                  TLS_AES_256_GCM_SHA384
                </div>
              </div>

              <div className="border-l-2 border-l-slate-200 pl-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                  KEY EXCHANGE
                </div>
                <div className="font-mono text-xs font-semibold text-[#334155] mt-0.5">
                  X25519 (Forward Secrecy)
                </div>
              </div>
            </div>
          </div>

          {/* Audit Log Card (Matching Image 4) */}
          <div
            id="audit-log-card"
            className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xs overflow-hidden"
          >
            <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0F172A]">
                <Clock className="w-4 h-4 text-[#64748B]" />
                <span>Audit Log</span>
              </div>
              <span className="text-xs font-semibold text-blue-600 cursor-pointer hover:underline">
                View All
              </span>
            </div>

            <div className="divide-y divide-[#E2E8F0] text-xs">
              {settings.auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 px-5 flex items-start gap-4">
                  <span className="font-mono text-[#64748B] shrink-0 font-medium">
                    {log.timestamp}
                  </span>
                  <div>
                    <div className="font-semibold text-[#0F172A]">{log.event}</div>
                    <div className="text-[11px] text-[#64748B] mt-0.5 leading-snug">
                      {log.details}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
