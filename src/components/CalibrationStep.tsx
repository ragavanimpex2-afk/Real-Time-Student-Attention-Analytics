import React, { useState, useEffect, useRef } from 'react';
import { Target, CheckCircle2, AlertCircle, RotateCcw, ArrowRight, ShieldCheck } from 'lucide-react';
import { CalibrationBaseline, CVTelemetryFrame } from '../types';

interface CalibrationStepProps {
  latestFrame: CVTelemetryFrame;
  onCalibrationComplete: (baseline: CalibrationBaseline) => void;
  onSkip: () => void;
  isRecalibrating?: boolean;
}

export const CalibrationStep: React.FC<CalibrationStepProps> = ({
  latestFrame,
  onCalibrationComplete,
  onSkip,
  isRecalibrating = false,
}) => {
  const TOTAL_DURATION_SEC = 5;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(TOTAL_DURATION_SEC);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(true);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Hold steady looking directly at the screen...');

  // Frame sample accumulator
  const samplesRef = useRef<Array<{
    pitch: number;
    yaw: number;
    roll: number;
    ear: number;
  }>>([]);

  const startTimeRef = useRef<number>(Date.now());

  // Collect samples on every frame when calibrating
  useEffect(() => {
    if (!isCalibrating || isCompleted) return;

    if (latestFrame.face_present) {
      samplesRef.current.push({
        pitch: latestFrame.head_pitch_deg,
        yaw: latestFrame.head_yaw_deg,
        roll: latestFrame.head_roll_deg,
        ear: latestFrame.eye_openness * 0.28, // estimated aperture baseline
      });
    }
  }, [latestFrame, isCalibrating, isCompleted]);

  // 5-second countdown timer
  useEffect(() => {
    if (!isCalibrating || isCompleted) return;

    startTimeRef.current = Date.now();
    samplesRef.current = [];

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, TOTAL_DURATION_SEC - elapsed);
      setSecondsRemaining(Math.ceil(remaining));

      if (remaining <= 0) {
        clearInterval(interval);
        finalizeCalibration();
      } else if (remaining < 2) {
        setStatusMessage('Almost done, locking in your baseline...');
      } else if (remaining < 4) {
        setStatusMessage('Great posture! Recording resting eye & head angles...');
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isCalibrating, isCompleted]);

  const finalizeCalibration = () => {
    setIsCalibrating(false);
    setIsCompleted(true);

    const validSamples = samplesRef.current;
    if (validSamples.length >= 5) {
      const avgPitch = validSamples.reduce((a, b) => a + b.pitch, 0) / validSamples.length;
      const avgYaw = validSamples.reduce((a, b) => a + b.yaw, 0) / validSamples.length;
      const avgRoll = validSamples.reduce((a, b) => a + b.roll, 0) / validSamples.length;
      const avgEAR = validSamples.reduce((a, b) => a + b.ear, 0) / validSamples.length;

      const baseline: CalibrationBaseline = {
        isCalibrated: true,
        baselinePitch: Number(avgPitch.toFixed(1)),
        baselineYaw: Number(avgYaw.toFixed(1)),
        baselineRoll: Number(avgRoll.toFixed(1)),
        baselineEAR: Number(Math.max(0.22, Math.min(0.38, avgEAR)).toFixed(2)),
        calibratedAt: new Date().toISOString(),
        samplesCount: validSamples.length,
      };

      onCalibrationComplete(baseline);
    } else {
      // Fallback baseline if insufficient face frames
      const fallback: CalibrationBaseline = {
        isCalibrated: true,
        baselinePitch: 0,
        baselineYaw: 0,
        baselineRoll: 0,
        baselineEAR: 0.28,
        calibratedAt: new Date().toISOString(),
        samplesCount: 0,
      };
      onCalibrationComplete(fallback);
    }
  };

  const restartCalibration = () => {
    samplesRef.current = [];
    setIsCompleted(false);
    setSecondsRemaining(TOTAL_DURATION_SEC);
    setStatusMessage('Hold steady looking directly at the screen...');
    setIsCalibrating(true);
  };

  const progressPercent = Math.min(
    100,
    Math.max(0, ((TOTAL_DURATION_SEC - secondsRemaining) / TOTAL_DURATION_SEC) * 100)
  );

  return (
    <div
      id="calibration-step-overlay"
      className="absolute inset-0 bg-[#0F172A]/85 backdrop-blur-md rounded-2xl z-30 flex flex-col items-center justify-center p-6 text-white select-none animate-in fade-in duration-200"
    >
      <div className="max-w-md w-full bg-[#1E293B] border border-[#334155] rounded-2xl p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-400">
            <Target className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {isRecalibrating ? 'Recalibrate Baseline' : 'Personalized Sensor Calibration'}
            </span>
          </div>
          <button
            onClick={onSkip}
            className="text-xs text-[#94A3B8] hover:text-white transition-colors underline underline-offset-4"
          >
            Skip (Use Defaults)
          </button>
        </div>

        {/* Primary Prompt & Countdown Display */}
        <div className="text-center space-y-3 py-2">
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            {/* SVG Radial Countdown Ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="#334155"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="#3B82F6"
                strokeWidth="6"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * progressPercent) / 100}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-300 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {isCompleted ? (
                <CheckCircle2 className="w-9 h-9 text-emerald-400 animate-bounce" />
              ) : (
                <span className="text-3xl font-black text-white font-mono tracking-tight">
                  {secondsRemaining}s
                </span>
              )}
            </div>
          </div>

          <h3 className="text-lg font-bold text-white tracking-tight">
            {isCompleted ? 'Baseline Calibrated Successfully' : 'Look Straight at the Camera'}
          </h3>
          <p className="text-xs text-[#94A3B8] leading-relaxed max-w-sm mx-auto">
            {isCompleted
              ? 'Your personalized head orientation and resting eye aperture have been zeroed.'
              : statusMessage}
          </p>
        </div>

        {/* Real-time Optical Feedback Grid */}
        <div className="grid grid-cols-3 gap-2 bg-[#0F172A]/70 rounded-xl p-3 border border-[#334155]/60 text-center text-[11px]">
          <div>
            <div className="text-[#64748B] uppercase font-bold text-[9px]">Face Lock</div>
            <div className="font-semibold mt-0.5 flex items-center justify-center gap-1">
              {latestFrame.face_present ? (
                <span className="text-emerald-400 flex items-center gap-0.5 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Active
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-0.5">
                  <AlertCircle className="w-3 h-3" />
                  Align Face
                </span>
              )}
            </div>
          </div>

          <div>
            <div className="text-[#64748B] uppercase font-bold text-[9px]">Resting Pitch</div>
            <div className="font-mono font-semibold text-white mt-0.5">
              {latestFrame.head_pitch_deg > 0 ? `+${latestFrame.head_pitch_deg}°` : `${latestFrame.head_pitch_deg}°`}
            </div>
          </div>

          <div>
            <div className="text-[#64748B] uppercase font-bold text-[9px]">Resting Yaw</div>
            <div className="font-mono font-semibold text-white mt-0.5">
              {latestFrame.head_yaw_deg > 0 ? `+${latestFrame.head_yaw_deg}°` : `${latestFrame.head_yaw_deg}°`}
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="flex items-center gap-1.5 text-[10px] text-[#64748B] justify-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Local edge calibration: zero video frames leave your device.</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 pt-1">
          {isCompleted ? (
            <button
              onClick={() => onSkip()}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              <span>Begin Attention Analytics</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                onClick={restartCalibration}
                className="flex-1 py-2 bg-[#334155] hover:bg-[#475569] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart (5s)</span>
              </button>
              <button
                onClick={finalizeCalibration}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Lock Baseline Now</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
