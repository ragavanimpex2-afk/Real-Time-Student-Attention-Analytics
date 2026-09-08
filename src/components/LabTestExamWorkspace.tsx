import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Code2,
  Check,
  ChevronLeft,
  ChevronRight,
  Flag,
  RotateCcw,
  Send,
  Award,
  ShieldCheck,
  Play,
  HelpCircle,
  Terminal,
} from 'lucide-react';
import { LabTestQuestion, StudentTestAnswer, LabSessionConfig, User } from '../types';

interface LabTestExamWorkspaceProps {
  questions: LabTestQuestion[];
  activeLab: LabSessionConfig;
  user?: User | null;
  remainingSec: number;
  distractionStrikes: number;
  maxDistractionsAllowed: number;
  onTestSubmitted: (result: {
    score: number;
    totalPoints: number;
    answers: Record<string, StudentTestAnswer>;
  }) => void;
  onAnswerChange?: (answers: Record<string, StudentTestAnswer>) => void;
}

export const LabTestExamWorkspace: React.FC<LabTestExamWorkspaceProps> = ({
  questions,
  activeLab,
  user,
  remainingSec,
  distractionStrikes,
  maxDistractionsAllowed,
  onTestSubmitted,
  onAnswerChange,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, StudentTestAnswer>>(() => {
    const initial: Record<string, StudentTestAnswer> = {};
    questions.forEach((q) => {
      initial[q.id] = {
        questionId: q.id,
        isAnswered: false,
        codeAnswer: q.starterCode || '',
        textAnswer: '',
      };
    });
    return initial;
  });

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [testResult, setTestResult] = useState<{
    score: number;
    totalPoints: number;
    percentage: number;
    submittedAt: string;
  } | null>(null);

  // Simulated code compiler output
  const [codeExecutionOutput, setCodeExecutionOutput] = useState<string | null>(null);
  const [isRunningCode, setIsRunningCode] = useState(false);

  const currentQ = questions[currentIdx] || questions[0];
  const currentAnswer = answers[currentQ?.id] || {
    questionId: currentQ?.id,
    isAnswered: false,
  };

  const answeredCount = (Object.values(answers) as StudentTestAnswer[]).filter((a) => a.isAnswered).length;
  const totalQuestions = questions.length;
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 20), 0);

  // Sync answer state
  const handleSelectOption = (optIdx: number) => {
    const updated = {
      ...answers,
      [currentQ.id]: {
        ...currentAnswer,
        selectedOption: optIdx,
        isAnswered: true,
      },
    };
    setAnswers(updated);
    if (onAnswerChange) onAnswerChange(updated);
  };

  const handleTextAnswer = (text: string) => {
    const updated = {
      ...answers,
      [currentQ.id]: {
        ...currentAnswer,
        textAnswer: text,
        isAnswered: text.trim().length > 0,
      },
    };
    setAnswers(updated);
    if (onAnswerChange) onAnswerChange(updated);
  };

  const handleCodeAnswer = (code: string) => {
    const updated = {
      ...answers,
      [currentQ.id]: {
        ...currentAnswer,
        codeAnswer: code,
        isAnswered: code.trim().length > 10,
      },
    };
    setAnswers(updated);
    if (onAnswerChange) onAnswerChange(updated);
  };

  const handleToggleFlag = () => {
    const updated = {
      ...answers,
      [currentQ.id]: {
        ...currentAnswer,
        isFlaggedForReview: !currentAnswer.isFlaggedForReview,
      },
    };
    setAnswers(updated);
    if (onAnswerChange) onAnswerChange(updated);
  };

  const handleClearAnswer = () => {
    const updated = {
      ...answers,
      [currentQ.id]: {
        questionId: currentQ.id,
        isAnswered: false,
        codeAnswer: currentQ.starterCode || '',
        textAnswer: '',
        selectedOption: undefined,
        isFlaggedForReview: currentAnswer.isFlaggedForReview,
      },
    };
    setAnswers(updated);
    setCodeExecutionOutput(null);
    if (onAnswerChange) onAnswerChange(updated);
  };

  const handleRunCodeTest = () => {
    setIsRunningCode(true);
    setCodeExecutionOutput(null);
    setTimeout(() => {
      setIsRunningCode(false);
      setCodeExecutionOutput(
        `[Kernel Unit Test Suite]\n✓ POSIX mutex initialization: OK\n✓ Predicate loop validation: OK\n✓ Non-empty signaling verified: PASSED (3/3 test cases passed in 0.04ms)`
      );
    }, 450);
  };

  const handleFinalSubmit = () => {
    // Calculate Score
    let earnedPoints = 0;
    questions.forEach((q) => {
      const ans = answers[q.id];
      if (q.type === 'multiple_choice' && typeof q.correctOptionIndex === 'number') {
        if (ans && ans.selectedOption === q.correctOptionIndex) {
          earnedPoints += q.points;
        }
      } else if (ans && ans.isAnswered) {
        // Free-response/coding questions get completion credit
        earnedPoints += Math.round(q.points * 0.9);
      }
    });

    const finalPct = Math.round((earnedPoints / totalPoints) * 100);
    const resultObj = {
      score: earnedPoints,
      totalPoints,
      percentage: finalPct,
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTestResult(resultObj);
    setIsSubmitted(true);
    setIsSubmitModalOpen(false);

    onTestSubmitted({
      score: earnedPoints,
      totalPoints,
      answers,
    });
  };

  // Format Time
  const formatTime = (totalSeconds: number) => {
    const s = Math.max(0, totalSeconds);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  if (!currentQ) return null;

  // SUBMITTED RESULTS VIEW
  if (isSubmitted && testResult) {
    return (
      <div
        id="lab-test-results-view"
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Award className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                  Examination Finalized
                </span>
                <span className="text-xs text-slate-400">
                  Submitted at {testResult.submittedAt}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                {activeLab.name} - Official Assessment Report
              </h2>
              <p className="text-xs text-slate-500">
                Candidate: <strong className="text-slate-800">{user?.name || 'Alex Rivera'}</strong> ({user?.email || 'student@university.edu'})
              </p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6">
            <span className="text-xs uppercase font-bold text-slate-400 block">
              Grade Score
            </span>
            <div className="text-3xl font-extrabold text-slate-900">
              {testResult.percentage}%
            </div>
            <span className="text-xs font-semibold text-emerald-600">
              {testResult.score} / {testResult.totalPoints} Points
            </span>
          </div>
        </div>

        {/* Proctoring & Integrity Verification Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              AI Proctoring Status
            </span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-xs text-emerald-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Certified Edge Monitored</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Distraction Strikes
            </span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-xs text-slate-800">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>{distractionStrikes} of {maxDistractionsAllowed} Allowed</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Questions Completed
            </span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-xs text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>{answeredCount} of {totalQuestions} Solved</span>
            </div>
          </div>
        </div>

        {/* Detailed Question Review */}
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Question Review & Solution Explanations</span>
          </h3>

          <div className="space-y-3">
            {questions.map((q, idx) => {
              const ans = answers[q.id];
              const isCorrect =
                q.type === 'multiple_choice'
                  ? ans?.selectedOption === q.correctOptionIndex
                  : ans?.isAnswered;

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border ${
                    isCorrect
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-amber-50/40 border-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        Q{idx + 1}. {q.category}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-white text-slate-600 border border-slate-200">
                        {q.points} Pts
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isCorrect
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isCorrect ? 'Correct / Credit' : 'Needs Review'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 font-medium mt-1.5 leading-relaxed">
                    {q.questionText}
                  </p>

                  {q.type === 'multiple_choice' && q.options && (
                    <div className="mt-2 space-y-1 text-xs">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = ans?.selectedOption === optIdx;
                        const isAnswerKey = q.correctOptionIndex === optIdx;
                        return (
                          <div
                            key={optIdx}
                            className={`p-2 rounded-lg text-xs flex items-center justify-between ${
                              isAnswerKey
                                ? 'bg-emerald-100 text-emerald-950 font-semibold border border-emerald-300'
                                : isSelected
                                ? 'bg-amber-100 text-amber-950 border border-amber-300'
                                : 'text-slate-600'
                            }`}
                          >
                            <span>
                              {String.fromCharCode(65 + optIdx)}. {opt}
                            </span>
                            {isAnswerKey && (
                              <span className="text-[10px] font-bold text-emerald-800">
                                ✓ Correct Key
                              </span>
                            )}
                            {isSelected && !isAnswerKey && (
                              <span className="text-[10px] font-bold text-amber-800">
                                Your Choice
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.explanation && (
                    <div className="mt-2.5 p-2 bg-white/80 rounded-lg text-[11px] text-slate-600 border border-slate-200">
                      <strong className="text-slate-800">Instructor Note: </strong>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-500">
          <span>Submission recorded and transmitted to Lab Coordinator Dr. Elena Vance.</span>
          <button
            onClick={() => setIsSubmitted(false)}
            className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
          >
            Review Examination Workspace
          </button>
        </div>
      </div>
    );
  }

  // ACTIVE LIVE TEST INTERFACE
  return (
    <div
      id="live-lab-test-container"
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
    >
      {/* Test Header & Candidate Info */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase flex items-center gap-1">
              <Code2 className="w-3 h-3" />
              LIVE PRACTICAL TEST
            </span>
            <span className="font-bold text-xs text-slate-800">
              {activeLab.code} • {activeLab.name}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600 flex-wrap">
            <span>
              Candidate: <strong className="text-slate-900">{user?.name || 'Alex Rivera (Student)'}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span>
              ID: <strong className="text-slate-700">{user?.id || 'STU-48201'}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">{user?.email || 'student@university.edu'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Answered Progress Badge */}
          <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <div className="text-left">
              <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">
                Progress
              </span>
              <span className="text-xs font-bold text-slate-800">
                {answeredCount} of {totalQuestions} Solved
              </span>
            </div>
          </div>

          {/* Time Remaining */}
          <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <div className="text-left">
              <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">
                Test Clock
              </span>
              <span className="text-xs font-mono font-bold text-slate-900">
                {formatTime(remainingSec)}
              </span>
            </div>
          </div>

          {/* Submit Test Button */}
          <button
            id="btn-submit-lab-test"
            onClick={() => setIsSubmitModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Finish & Submit</span>
          </button>
        </div>
      </div>

      {/* Question Header & Category */}
      <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
            Q{currentIdx + 1}
          </div>
          <div>
            <span className="text-[11px] font-bold text-blue-700 tracking-wider uppercase">
              {currentQ.category}
            </span>
            <div className="text-xs text-slate-400">
              Worth {currentQ.points} Points • {currentQ.type.replace('_', ' ')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleFlag}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentAnswer.isFlaggedForReview
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>{currentAnswer.isFlaggedForReview ? 'Flagged' : 'Flag for Review'}</span>
          </button>

          <button
            onClick={handleClearAnswer}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Clear current answer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Question Prompt Body */}
      <div className="p-4 sm:p-6 flex-1 space-y-6">
        <div className="text-sm sm:text-base font-medium text-slate-900 leading-relaxed">
          {currentQ.questionText}
        </div>

        {/* Multiple Choice Form */}
        {currentQ.type === 'multiple_choice' && currentQ.options && (
          <div className="space-y-2.5">
            {currentQ.options.map((optionText, optIdx) => {
              const isSelected = currentAnswer.selectedOption === optIdx;
              const letter = String.fromCharCode(65 + optIdx);

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(optIdx)}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/90 border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {letter}
                  </span>
                  <span
                    className={`text-xs sm:text-sm ${
                      isSelected ? 'font-semibold text-slate-900' : 'text-slate-700'
                    }`}
                  >
                    {optionText}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Code Snippet Editor Challenge */}
        {currentQ.type === 'code_snippet' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono text-[11px] text-slate-600 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-blue-600" />
                <span>workspace/kernel_sync.c (Read/Write)</span>
              </span>
              <button
                onClick={handleRunCodeTest}
                disabled={isRunningCode}
                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Play className="w-3 h-3 text-emerald-400" />
                <span>{isRunningCode ? 'Compiling...' : 'Run Unit Tests'}</span>
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#0F172A] shadow-inner">
              <textarea
                value={currentAnswer.codeAnswer || ''}
                onChange={(e) => handleCodeAnswer(e.target.value)}
                rows={11}
                spellCheck={false}
                className="w-full p-4 bg-transparent text-emerald-400 font-mono text-xs sm:text-sm leading-relaxed outline-hidden resize-none"
                placeholder="// Write or refine your implementation here..."
              />
            </div>

            {codeExecutionOutput && (
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-line animate-in fade-in">
                {codeExecutionOutput}
              </div>
            )}
          </div>
        )}

        {/* Short Answer Text Area */}
        {currentQ.type === 'short_answer' && (
          <div className="space-y-2">
            <textarea
              value={currentAnswer.textAnswer || ''}
              onChange={(e) => handleTextAnswer(e.target.value)}
              rows={5}
              className="w-full p-3.5 sm:p-4 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-hidden leading-relaxed"
              placeholder="Type your explanation here. Be clear, concise, and reference system architecture principles..."
            />
            <div className="text-right text-[11px] text-slate-400">
              {(currentAnswer.textAnswer || '').length} characters entered
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation & Question Navigator Pills */}
      <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            disabled={currentIdx === totalQuestions - 1}
            onClick={() => setCurrentIdx((prev) => Math.min(totalQuestions - 1, prev + 1))}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Question Selector Quick-jump Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">
            Jump to:
          </span>
          {questions.map((q, idx) => {
            const ans = answers[q.id];
            const isCurrent = idx === currentIdx;
            const isAnswered = ans?.isAnswered;
            const isFlagged = ans?.isFlaggedForReview;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(idx)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all relative flex items-center justify-center cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/30'
                    : isFlagged
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : isAnswered
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
                title={`Question ${idx + 1}${isFlagged ? ' (Flagged)' : ''}${
                  isAnswered ? ' (Answered)' : ''
                }`}
              >
                {idx + 1}
                {isFlagged && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Submit Lab Examination?
                </h3>
                <p className="text-xs text-slate-500">
                  Confirm test submission and finalize AI proctoring session.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Questions:</span>
                <span className="font-bold text-slate-900">{totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Answered Questions:</span>
                <span className="font-bold text-emerald-600">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Unanswered Questions:</span>
                <span className="font-bold text-amber-600">
                  {totalQuestions - answeredCount}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5">
                <span className="text-slate-600">Distraction Strikes Incurred:</span>
                <span className="font-bold text-slate-800">
                  {distractionStrikes} of {maxDistractionsAllowed}
                </span>
              </div>
            </div>

            {totalQuestions - answeredCount > 0 && (
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                ⚠️ You have {totalQuestions - answeredCount} unanswered question(s). You can still return to complete them before final submission.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Return to Test
              </button>
              <button
                onClick={handleFinalSubmit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
