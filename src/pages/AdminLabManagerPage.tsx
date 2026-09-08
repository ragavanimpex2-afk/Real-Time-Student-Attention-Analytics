import React, { useState } from 'react';
import {
  Building2,
  Clock,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Settings,
  Users,
  Volume2,
  VolumeX,
  Radio,
  FileEdit,
  Trash2,
  Eye,
  Check,
  Info,
  ChevronRight,
  Sparkles,
  Send,
  Award,
} from 'lucide-react';
import { LabSessionConfig, StudentLabStatus, WarningResponseMode, User } from '../types';

interface AdminLabManagerPageProps {
  labs: LabSessionConfig[];
  onUpdateLabs: (labs: LabSessionConfig[]) => void;
  activeLab: LabSessionConfig;
  onSetActiveLab: (labId: string) => void;
  studentRoster: StudentLabStatus[];
  onManualIssueWarning?: (studentId: string, reason: string) => void;
  currentUser?: User | null;
}

export const AdminLabManagerPage: React.FC<AdminLabManagerPageProps> = ({
  labs,
  onUpdateLabs,
  activeLab,
  onSetActiveLab,
  studentRoster,
  onManualIssueWarning,
  currentUser,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<LabSessionConfig | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentLabStatus | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'compliant' | 'warning' | 'probation_exceeded'>('all');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // New/Edit Lab Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDurationHours, setFormDurationHours] = useState(2.0);
  const [formCohort, setFormCohort] = useState('CS-Cohort-B');
  const [formDescription, setFormDescription] = useState('');
  const [formMaxDistractions, setFormMaxDistractions] = useState(5);
  const [formWarningMode, setFormWarningMode] = useState<WarningResponseMode>('interactive_acknowledge');
  const [formWarningSound, setFormWarningSound] = useState(true);
  const [formProhibited, setFormProhibited] = useState<string[]>([
    'Leaving camera frame for longer than 15 seconds',
    'Prolonged gaze-down indicating phone usage',
    'Excessive talking/discussion during solo lab practical',
    'Exceeding allowable distraction strikes',
  ]);
  const [newProhibitedInput, setNewProhibitedInput] = useState('');

  const openCreateModal = () => {
    setEditingLab(null);
    setFormName('CS-403: Cloud Systems & Virtualization Lab');
    setFormCode('LAB-CLOUD-403');
    setFormDurationHours(2.0);
    setFormCohort('CS-Year-3');
    setFormDescription('Hands-on cloud orchestration, Kubernetes pods, and distributed message queues.');
    setFormMaxDistractions(5);
    setFormWarningMode('interactive_acknowledge');
    setFormWarningSound(true);
    setFormProhibited([
      'Leaving camera frame for longer than 15 seconds',
      'Prolonged gaze-down indicating phone usage',
      'Unauthorized external device usage',
      'Excessive speaking during solo practical assessment',
    ]);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (lab: LabSessionConfig) => {
    setEditingLab(lab);
    setFormName(lab.name);
    setFormCode(lab.code);
    setFormDurationHours(lab.durationHours);
    setFormCohort(lab.cohortClass);
    setFormDescription(lab.description);
    setFormMaxDistractions(lab.maxDistractionsAllowed);
    setFormWarningMode(lab.warningResponseMode);
    setFormWarningSound(lab.warningSoundEnabled);
    setFormProhibited([...lab.prohibitedBehaviors]);
    setIsCreateModalOpen(true);
  };

  const handleSaveLab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingLab) {
      const updated = labs.map((l) =>
        l.id === editingLab.id
          ? {
              ...l,
              name: formName,
              code: formCode,
              durationHours: formDurationHours,
              durationMinutes: Math.round(formDurationHours * 60),
              cohortClass: formCohort,
              description: formDescription,
              maxDistractionsAllowed: formMaxDistractions,
              warningResponseMode: formWarningMode,
              warningSoundEnabled: formWarningSound,
              prohibitedBehaviors: formProhibited,
            }
          : l
      );
      onUpdateLabs(updated);
    } else {
      const newLab: LabSessionConfig = {
        id: `lab_${Date.now()}`,
        name: formName,
        code: formCode || 'LAB-CUSTOM',
        instructorName: 'Dr. Elena Vance (Lab Coordinator)',
        cohortClass: formCohort,
        durationHours: formDurationHours,
        durationMinutes: Math.round(formDurationHours * 60),
        description: formDescription,
        prohibitedBehaviors: formProhibited,
        allowedBehaviors: [
          'Consulting class textbooks and code editor',
          'Brief keyboard posture alignment',
        ],
        maxDistractionsAllowed: formMaxDistractions,
        distractionGracePeriodSec: 6,
        warningResponseMode: formWarningMode,
        warningSoundEnabled: formWarningSound,
        minTargetAttentionScore: 70,
        isActive: false,
        createdAt: new Date().toISOString(),
      };
      onUpdateLabs([...labs, newLab]);
    }
    setIsCreateModalOpen(false);
  };

  const handleDeleteLab = (labId: string) => {
    if (labs.length <= 1) {
      alert('You must keep at least one active lab configuration in the system.');
      return;
    }
    const labToDelete = labs.find((l) => l.id === labId);
    if (!window.confirm(`Are you sure you want to remove the lab "${labToDelete?.name || 'Lab'}"? Enrolled students will be re-routed to the remaining active lab.`)) {
      return;
    }
    const updated = labs.filter((l) => l.id !== labId);
    onUpdateLabs(updated);
    if (activeLab.id === labId && updated.length > 0) {
      onSetActiveLab(updated[0].id);
      setActionNotice(`Removed "${labToDelete?.name}". Active lab switched to "${updated[0].name}".`);
    } else {
      setActionNotice(`Removed "${labToDelete?.name}" successfully.`);
    }
    setTimeout(() => setActionNotice(null), 5000);
  };

  const handleSwitchActiveLab = (labId: string) => {
    onSetActiveLab(labId);
    const target = labs.find((l) => l.id === labId);
    setActionNotice(`Active lab switched to "${target?.name}". All student test sessions are now associated with this lab.`);
    setTimeout(() => setActionNotice(null), 5000);
  };

  const handleAddProhibitedRule = () => {
    if (!newProhibitedInput.trim()) return;
    setFormProhibited([...formProhibited, newProhibitedInput.trim()]);
    setNewProhibitedInput('');
  };

  const handleRemoveProhibitedRule = (index: number) => {
    setFormProhibited(formProhibited.filter((_, i) => i !== index));
  };

  const filteredRoster = studentRoster.filter((s) => {
    if (statusFilter === 'all') return true;
    return s.complianceStatus === statusFilter;
  });

  return (
    <div id="admin-lab-manager-page" className="space-y-8 animate-in fade-in duration-200">
      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-blue-600 hover:text-blue-800 font-bold px-2 py-0.5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 sm:p-8 rounded-2xl text-white shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>LAB COORDINATOR ADMIN PORTAL</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-400/30">
              LIVE SUPERVISION
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Lab Configuration & Oversight
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Configure lab schedules, duration hours, rules & prohibitions ("What should NOT be done"), maximum distraction limits, and warning response behaviors for all enrolled student sessions.
          </p>
        </div>

        <button
          id="btn-admin-create-lab"
          onClick={openCreateModal}
          className="self-start sm:self-center px-4 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Lab</span>
        </button>
      </div>

      {/* Currently Active Lab Hero Card */}
      <div
        id="active-lab-hero-card"
        className="bg-white rounded-2xl border-2 border-blue-600/30 p-6 shadow-xs relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 px-4 py-1.5 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider rounded-bl-xl flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>CURRENTLY ASSIGNED TO STUDENTS</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-wider">
                {activeLab.code} • {activeLab.cohortClass}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                {activeLab.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {activeLab.description}
              </p>
            </div>

            {/* Key Lab Parameters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  LAB DURATION
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-900">
                  {activeLab.durationHours} Hours
                </span>
                <span className="text-[11px] text-slate-500 block">
                  ({activeLab.durationMinutes} minutes)
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  MAX DISTRACTIONS
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-900">
                  {activeLab.maxDistractionsAllowed} Strikes
                </span>
                <span className="text-[11px] text-slate-500 block">Before probation</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  WARNING RESPONSE
                </span>
                <span className="text-xs font-bold text-blue-700 block mt-1 truncate">
                  {activeLab.warningResponseMode === 'interactive_acknowledge'
                    ? 'Interactive Click'
                    : 'Audible Chime'}
                </span>
                <span className="text-[11px] text-slate-500 block">Required prompt</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  AUDIO CHIME
                </span>
                <span className="text-base font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                  {activeLab.warningSoundEnabled ? (
                    <>
                      <Volume2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 text-xs">Enabled</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500 text-xs">Muted</span>
                    </>
                  )}
                </span>
                <span className="text-[11px] text-slate-500 block">On alert trigger</span>
              </div>
            </div>

            {/* Prohibitions Card: "What should NOT be done" */}
            <div className="p-4 bg-red-50/70 border border-red-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-red-900 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span>LAB PROHIBITIONS (WHAT SHOULD NOT BE DONE):</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-red-800">
                {activeLab.prohibitedBehaviors.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Action & Quick Edit */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Active Lab Quick Actions
              </h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                When students open the Live Session or sign in, they will immediately be bound to the rules, duration hours, and distraction warning limits of this lab.
              </p>
              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex items-center justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Active Students:</span>
                  <span className="font-bold text-slate-900">
                    {studentRoster.filter((s) => s.isCurrentlyOnline).length} Online
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Grace Period:</span>
                  <span className="font-bold text-slate-900">{activeLab.distractionGracePeriodSec}s</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">Min Target Score:</span>
                  <span className="font-bold text-slate-900">{activeLab.minTargetAttentionScore}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => openEditModal(activeLab)}
                className="w-full py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <FileEdit className="w-3.5 h-3.5" />
                <span>Edit This Lab Rules & Duration</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* All Available Lab Configurations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">All Configured Labs</h2>
            <p className="text-xs text-slate-500">
              Select which lab is active or configure new course practicals.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {labs.length} Labs Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {labs.map((lab) => {
            const isCurrentlyActive = lab.id === activeLab.id;
            return (
              <div
                key={lab.id}
                className={`bg-white rounded-xl border p-5 shadow-2xs flex flex-col justify-between transition-all ${
                  isCurrentlyActive
                    ? 'border-blue-600 ring-2 ring-blue-600/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-600 px-2 py-0.5 rounded bg-blue-50 border border-blue-100">
                        {lab.code}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-1.5 line-clamp-1">
                        {lab.name}
                      </h3>
                    </div>
                    {isCurrentlyActive && (
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full uppercase shrink-0">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2">{lab.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-[10px] text-slate-400 block font-bold">DURATION</span>
                      <span className="font-semibold text-slate-800">{lab.durationHours} Hours</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-[10px] text-slate-400 block font-bold">MAX STRIKES</span>
                      <span className="font-semibold text-slate-800">{lab.maxDistractionsAllowed} Allowed</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg">
                    <span className="font-bold text-red-600">Prohibitions: </span>
                    <span>{lab.prohibitedBehaviors.length} strict rules configured</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 mt-2 border-t border-slate-100">
                  {!isCurrentlyActive ? (
                    <button
                      onClick={() => onSetActiveLab(lab.id)}
                      className="flex-1 py-1.5 px-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      Set As Active Lab
                    </button>
                  ) : (
                    <span className="flex-1 text-center py-1.5 text-xs font-bold text-blue-600">
                      Currently Assigned
                    </span>
                  )}
                  <button
                    onClick={() => openEditModal(lab)}
                    title="Edit Lab"
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    <FileEdit className="w-4 h-4" />
                  </button>
                  {labs.length > 1 && (
                    <button
                      onClick={() => handleDeleteLab(lab.id)}
                      title="Delete Lab"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Student Lab Oversight & Warning Response Monitor */}
      <div id="student-oversight-section" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Live Student Lab Oversight & Compliance Monitor</span>
            </h2>
            <p className="text-xs text-slate-500">
              Track student duration, distraction strikes, and how they respond to warning alerts.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({studentRoster.length})
            </button>
            <button
              onClick={() => setStatusFilter('compliant')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'compliant' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Compliant
            </button>
            <button
              onClick={() => setStatusFilter('warning')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'warning' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Warnings
            </button>
            <button
              onClick={() => setStatusFilter('probation_exceeded')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'probation_exceeded' ? 'bg-white text-red-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Exceeded
            </button>
          </div>
        </div>

        {/* Oversight Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Enrolled Candidate</th>
                  <th className="py-3 px-4">Live Examination Status</th>
                  <th className="py-3 px-4">Time in Lab / Duration</th>
                  <th className="py-3 px-4">Attention Score</th>
                  <th className="py-3 px-4">Distractions vs Max</th>
                  <th className="py-3 px-4">Warning Response ("How Responded")</th>
                  <th className="py-3 px-4">Compliance Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRoster.map((student) => {
                  const maxAllowed = activeLab.maxDistractionsAllowed;
                  const ratio = student.distractionCount / maxAllowed;
                  const durationProgress = Math.min(100, Math.round((student.timeSpentSec / (activeLab.durationMinutes * 60)) * 100));
                  const isCurrentLoggedUser =
                    student.isCurrentUser ||
                    student.studentEmail === currentUser?.email ||
                    student.studentId === currentUser?.id ||
                    (currentUser?.roleType === 'student' && student.studentName.toLowerCase().includes('alex'));

                  const statusBadge =
                    student.complianceStatus === 'compliant' ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                        COMPLIANT
                      </span>
                    ) : student.complianceStatus === 'warning' ? (
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold text-[11px] border border-amber-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>NEARING LIMIT</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-bold text-[11px] border border-red-200 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        <span>EXCEEDED PROBATION</span>
                      </span>
                    );

                  const hoursSpent = Math.floor(student.timeSpentSec / 3600);
                  const minsSpent = Math.floor((student.timeSpentSec % 3600) / 60);

                  return (
                    <tr
                      key={student.studentId}
                      className={`transition-colors ${
                        isCurrentLoggedUser ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 text-white ${
                            isCurrentLoggedUser ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gradient-to-tr from-slate-700 to-slate-900'
                          }`}>
                            {student.studentName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 truncate">
                                {student.studentName}
                              </span>
                              {isCurrentLoggedUser && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white uppercase tracking-wider flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                  YOU (ONLINE)
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block truncate">
                              {student.studentEmail}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Live Examination Status */}
                      <td className="py-3.5 px-4">
                        {student.testStatus === 'submitted' ? (
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-300 flex items-center gap-1 w-fit">
                              <Award className="w-3 h-3 text-emerald-600" />
                              <span>Score: {student.testScore}/{student.testTotalPoints || 100}</span>
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Finalized • All answers audited
                            </span>
                          </div>
                        ) : student.testStatus === 'in_progress' ? (
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px] border border-blue-300 flex items-center gap-1 w-fit">
                              <Send className="w-3 h-3 text-blue-600" />
                              <span>In Progress ({student.testAnswersCount || 0} solved)</span>
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Actively testing in live proctor
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium italic">
                            Awaiting start
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                            <span>
                              {hoursSpent > 0 ? `${hoursSpent}h ` : ''}{minsSpent}m
                            </span>
                            <span className="text-slate-400">/ {activeLab.durationHours}h</span>
                          </div>
                          <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all"
                              style={{ width: `${durationProgress}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <span
                          className={`text-sm ${
                            student.currentAttentionScore >= 75
                              ? 'text-emerald-600'
                              : student.currentAttentionScore >= 60
                              ? 'text-amber-600'
                              : 'text-red-600'
                          }`}
                        >
                          {student.currentAttentionScore}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold text-xs px-2 py-0.5 rounded-md ${
                              student.distractionCount >= maxAllowed
                                ? 'bg-red-100 text-red-700 font-bold'
                                : student.distractionCount >= maxAllowed - 1
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {student.distractionCount} / {maxAllowed}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {student.warningResponses.length > 0 ? (
                          <div className="space-y-1 max-w-xs">
                            {student.warningResponses.slice(-2).map((wr) => (
                              <div
                                key={wr.id}
                                className="flex items-center gap-1.5 text-[11px]"
                              >
                                {wr.responseStatus === 'acknowledged' ? (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Ack ({wr.responseTimeSec}s)</span>
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-semibold">
                                    Ignored / Timeout
                                  </span>
                                )}
                                <span className="text-slate-500 truncate" title={wr.triggerReason}>
                                  {wr.triggerReason}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No warnings issued</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">{statusBadge}</td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          View Logs
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Student Detail Warning Log Drawer / Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedStudent.studentName} — Warning Response Audit
                </h3>
                <p className="text-xs text-slate-500">{selectedStudent.studentEmail}</p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400 font-bold block">CURRENT LAB</span>
                  <span className="font-semibold text-slate-800">{activeLab.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">TOTAL DISTRACTIONS</span>
                  <span className="font-bold text-slate-800">
                    {selectedStudent.distractionCount} / {activeLab.maxDistractionsAllowed} max
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">Warning & Response History</h4>
                {selectedStudent.warningResponses.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedStudent.warningResponses.map((wr) => (
                      <div
                        key={wr.id}
                        className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-slate-800">
                            Warning #{wr.warningNumber}: {wr.triggerReason}
                          </div>
                          <div className="text-[11px] text-slate-400">{wr.timestamp}</div>
                        </div>
                        <div>
                          {wr.responseStatus === 'acknowledged' ? (
                            <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                              Acknowledged in {wr.responseTimeSec}s
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded bg-red-50 text-red-700 font-bold text-[11px] border border-red-200">
                              Ignored / Dismissed
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No warning events logged yet.</p>
                )}
              </div>

              {/* Live Examination Submission Audit */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-blue-600" />
                  <span>Live Practical Examination Results</span>
                </h4>
                {selectedStudent.testStatus === 'submitted' ? (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-950">
                        Total Score: {selectedStudent.testScore} / {selectedStudent.testTotalPoints || 100} Points
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold text-[10px]">
                        CERTIFIED SUBMISSION
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      All questions answered and recorded with Edge AI proctor integrity certificate.
                    </p>
                  </div>
                ) : selectedStudent.testStatus === 'in_progress' ? (
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                    <span className="font-semibold text-blue-900 block">
                      Candidate is actively answering the exam ({selectedStudent.testAnswersCount || 0} questions saved).
                    </span>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Candidate has not yet submitted an examination paper.</p>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Lab Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingLab ? 'Edit Lab Configuration' : 'Create New Course Lab'}
                </h3>
                <p className="text-xs text-slate-500">
                  Define lab name, duration hours, rules, max distraction strikes, and warning alert behaviors.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLab} className="space-y-4 text-xs sm:text-sm">
              {/* Lab Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 text-xs mb-1">
                    LAB NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. CS-402: Operating Systems Lab 4"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1">
                    COURSE / CODE
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="LAB-CS-402"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Lab Duration (How much hour the lab is) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1 flex items-center justify-between">
                    <span>LAB DURATION (HOURS)</span>
                    <span className="text-blue-600 font-bold">{formDurationHours} hrs ({Math.round(formDurationHours * 60)} min)</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0.5"
                      max="6.0"
                      step="0.5"
                      value={formDurationHours}
                      onChange={(e) => setFormDurationHours(parseFloat(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <input
                      type="number"
                      min="0.5"
                      max="6.0"
                      step="0.5"
                      value={formDurationHours}
                      onChange={(e) => setFormDurationHours(parseFloat(e.target.value) || 1)}
                      className="w-20 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-slate-900"
                    />
                  </div>
                </div>

                {/* Max Distraction strikes allowed */}
                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1 flex items-center justify-between">
                    <span>MAX DISTRACTION STRIKES</span>
                    <span className="text-amber-600 font-bold">{formMaxDistractions} allowed</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={formMaxDistractions}
                    onChange={(e) => setFormMaxDistractions(parseInt(e.target.value) || 5)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Warning Response Behavior ("How response for the warning") */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <label className="block font-bold text-slate-800 text-xs uppercase tracking-wider">
                  WARNING RESPONSE CONFIGURATION ("HOW RESPONSE FOR THE WARNING")
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 text-xs mb-1 font-semibold">
                      Student Warning Response Mode
                    </label>
                    <select
                      value={formWarningMode}
                      onChange={(e) => setFormWarningMode(e.target.value as WarningResponseMode)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 cursor-pointer"
                    >
                      <option value="interactive_acknowledge">
                        Interactive Click ("I am Focused" Button)
                      </option>
                      <option value="audio_beep">Audible Beep & Screen Flash</option>
                      <option value="visual_banner">Visual Banner Prompt Only</option>
                      <option value="strict_escort">Strict Lockdown Escalation</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div>
                      <span className="font-semibold text-xs text-slate-900 block">
                        Warning Sound Chime
                      </span>
                      <span className="text-[11px] text-slate-500">Play tone when threshold hit</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormWarningSound(!formWarningSound)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        formWarningSound ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {formWarningSound ? 'Sound ON' : 'Sound OFF'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Lab Prohibitions ("What should NOT be done") */}
              <div className="space-y-2">
                <label className="block font-bold text-red-700 text-xs uppercase tracking-wider">
                  LAB PROHIBITIONS: WHAT SHOULD NOT BE DONE
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newProhibitedInput}
                    onChange={(e) => setNewProhibitedInput(e.target.value)}
                    placeholder="e.g. No mobile phone usage / head down"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddProhibitedRule();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddProhibitedRule}
                    className="px-3 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-900 cursor-pointer"
                  >
                    Add Rule
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                  {formProhibited.map((rule, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-red-50/70 border border-red-100 rounded-lg text-xs text-red-900"
                    >
                      <span>• {rule}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveProhibitedRule(idx)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  {editingLab ? 'Save Lab Changes' : 'Create & Register Lab'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
