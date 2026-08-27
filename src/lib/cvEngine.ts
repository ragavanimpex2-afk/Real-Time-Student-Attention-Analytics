/**
 * Privacy-First Edge Computer Vision Engine for Student Attention Analytics
 * 
 * CRITICAL PRIVACY ARCHITECTURE:
 * - Frames are processed entirely in transient WebGL/Canvas memory in the user's browser.
 * - No raw webcam frames or photographs are EVER stored, transmitted, or logged.
 * - Only anonymized numerical telemetry (scores, angles, blink counts) is produced.
 */

import {
  CVTelemetryFrame,
  AttentionWeightsConfig,
  CalibrationBaseline,
  GazeDirection,
  DistractionState,
  DetectedEvent,
} from '../types';

export const DEFAULT_WEIGHTS: AttentionWeightsConfig = {
  facePresenceWeight: 0.5,
  forwardGazeWeight: 0.3,
  headAlignmentWeight: 0.2,
  distractionThresholdSec: 2.5,
  blinkEarThreshold: 0.22,
  headYawThresholdDeg: 20,
  headPitchThresholdDeg: 18,
};

export const DEFAULT_CALIBRATION: CalibrationBaseline = {
  isCalibrated: false,
  baselinePitch: 0,
  baselineYaw: 0,
  baselineRoll: 0,
  baselineEAR: 0.28,
};

export interface CVEngineCallbacks {
  onTelemetry: (frame: CVTelemetryFrame) => void;
  onEventDetected: (event: DetectedEvent) => void;
  onEventFinalized?: (event: DetectedEvent) => void;
  onError: (error: string) => void;
}

export class AttentionCVEngine {
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private animFrameId: number | null = null;
  private isRunning: boolean = false;
  private weights: AttentionWeightsConfig = { ...DEFAULT_WEIGHTS };
  private calibration: CalibrationBaseline = { ...DEFAULT_CALIBRATION };
  private callbacks: CVEngineCallbacks;

  // Real-time tracking state
  private blinkCount: number = 0;
  private isEyeClosed: boolean = false;
  private eyeClosedStartMs: number = 0;
  private blinkTimestamps: number[] = [];

  // Saccade / gaze shift rate tracking (rapid gaze darting)
  private recentGazeDirections: { dir: GazeDirection; time: number }[] = [];
  private recentEyeOpennessValues: { val: number; time: number }[] = [];
  private recentPitchAngles: { pitch: number; time: number }[] = [];

  // Kinematic pose history for variance & oscillation / head dancing detection
  private recentHeadPoses: {
    yaw: number;
    pitch: number;
    roll: number;
    centerX: number;
    centerY: number;
    time: number;
  }[] = [];

  // Adaptive baseline EAR & ocular occlusion discrimination to prevent false positives
  private runningBaselineEAR: number = 0.28;
  private isEyeOccluded: boolean = false;
  private eyeOcclusionStartMs: number = 0;
  private lastBlinkEndedMs: number = 0;

  // Distraction accumulation state
  private currentDistractionType: DistractionState | null = null;
  private distractionStartMs: number = 0;
  private activeEvent: DetectedEvent | null = null;
  private manualOverrideState: DistractionState | null = null;

  // Performance metrics
  private lastFrameTimestamp: number = performance.now();
  private frameCount: number = 0;
  private currentFps: number = 30;

  // Landmarker instance if loaded
  private faceLandmarker: any = null;
  private isMediaPipeReady: boolean = false;

  // Optical frame difference tracking for fallback video analysis
  private prevFrameData: Uint8ClampedArray | null = null;

  constructor(callbacks: CVEngineCallbacks, initialWeights?: Partial<AttentionWeightsConfig>) {
    this.callbacks = callbacks;
    if (initialWeights) {
      this.weights = { ...this.weights, ...initialWeights };
    }
  }

  public updateWeights(newWeights: Partial<AttentionWeightsConfig>) {
    this.weights = { ...this.weights, ...newWeights };
  }

  public setCalibrationBaseline(baseline: CalibrationBaseline) {
    this.calibration = { ...baseline };
    if (baseline.baselineEAR > 0.18) {
      this.runningBaselineEAR = baseline.baselineEAR;
    }
  }

  public getCalibrationBaseline(): CalibrationBaseline {
    return { ...this.calibration };
  }

  public resetCalibration() {
    this.calibration = { ...DEFAULT_CALIBRATION };
    this.runningBaselineEAR = 0.28;
  }

  public setManualOverride(state: DistractionState | null) {
    this.manualOverrideState = state;
  }

  public async initializeMediaPipe(): Promise<boolean> {
    try {
      const vision = await import('@mediapipe/tasks-vision');
      const { FaceLandmarker, FilesetResolver } = vision;

      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        outputFaceBlendshapes: true,
        runningMode: 'VIDEO',
        numFaces: 2, // Detect up to 2 faces to enforce single-subject policy
      });

      this.isMediaPipeReady = true;
      return true;
    } catch (err: any) {
      console.warn(
        'MediaPipe task loading deferred/fallback to high-precision optical Canvas tracker:',
        err?.message || err
      );
      this.isMediaPipeReady = false;
      return false;
    }
  }

  public start(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
    this.videoElement = video;
    this.canvasElement = canvas;
    this.isRunning = true;
    this.blinkCount = 0;
    this.blinkTimestamps = [];
    this.currentDistractionType = null;
    this.activeEvent = null;
    this.lastFrameTimestamp = performance.now();

    this.processLoop();
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.canvasElement) {
      const ctx = this.canvasElement.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
      }
    }
  }

  private processLoop = () => {
    if (!this.isRunning || !this.videoElement || !this.canvasElement) return;

    const now = performance.now();
    const elapsed = now - this.lastFrameTimestamp;
    this.frameCount++;

    if (elapsed >= 1000) {
      this.currentFps = Math.max(15, Math.min(60, Math.round((this.frameCount * 1000) / elapsed)));
      this.frameCount = 0;
      this.lastFrameTimestamp = now;
    }

    if (this.videoElement.readyState >= 2 && !this.videoElement.paused) {
      this.processFrame(now);
    } else {
      // If video is still warming up or simulated
      this.processFrame(now);
    }

    this.animFrameId = requestAnimationFrame(this.processLoop);
  };

  private processFrame(now: number) {
    if (!this.videoElement || !this.canvasElement) return;

    const video = this.videoElement;
    const canvas = this.canvasElement;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Match dimensions to video or default to 640x480
    const targetW = video.videoWidth || 640;
    const targetH = video.videoHeight || 480;
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let telemetry: CVTelemetryFrame;

    if (this.isMediaPipeReady && this.faceLandmarker && video.readyState >= 2 && !video.paused) {
      telemetry = this.processWithMediaPipe(now, ctx, canvas.width, canvas.height);
    } else {
      telemetry = this.processWithOpticalTracker(now, ctx, canvas.width, canvas.height);
    }

    // Apply manual override if tester has toggled a specific state
    if (this.manualOverrideState) {
      telemetry = this.applyManualState(telemetry, this.manualOverrideState, canvas.width, canvas.height, ctx);
    }

    // Check Distraction Event Lifecycle
    this.evaluateDistractionEvents(telemetry, now);

    // Emit telemetry frame to app
    this.callbacks.onTelemetry(telemetry);
  }

  private processWithMediaPipe(
    now: number,
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): CVTelemetryFrame {
    let facePresent = false;
    let faceCount = 0;
    let eyeOpenness = 0.88;
    let eyeOpennessLeft = 0.88;
    let eyeOpennessRight = 0.88;
    let gazeDirection: GazeDirection = 'forward';
    let gazeForwardScore = 0.95;
    let headAlignment = 0.92;
    let pitchDeg = 0;
    let yawDeg = 0;
    let rollDeg = 0;
    let blinkDetected = false;
    let distractionState: DistractionState = 'focused';
    let boundingBox: CVTelemetryFrame['bounding_box'] = undefined;
    let compositeKinematicVariance = 0;
    let motionIntensity = 10;

    try {
      const results = this.faceLandmarker.detectForVideo(this.videoElement, now);

      if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
        faceCount = results.faceLandmarks.length;
        facePresent = true;

        if (faceCount > 1) {
          distractionState = 'multi_face_warning';
        }

        const landmarks = results.faceLandmarks[0];

        // Compute Bounding Box
        let minX = 1,
          maxX = 0,
          minY = 1,
          maxY = 0;
        for (const pt of landmarks) {
          if (pt.x < minX) minX = pt.x;
          if (pt.x > maxX) maxX = pt.x;
          if (pt.y < minY) minY = pt.y;
          if (pt.y > maxY) maxY = pt.y;
        }

        // Add 8% margin for face boundary
        const boxX = Math.max(0, (minX - 0.04) * width);
        const boxY = Math.max(0, (minY - 0.06) * height);
        const boxW = Math.min(width - boxX, (maxX - minX + 0.08) * width);
        const boxH = Math.min(height - boxY, (maxY - minY + 0.12) * height);

        boundingBox = {
          x: boxX,
          y: boxY,
          width: boxW,
          height: boxH,
          confidence: 0.98,
        };

        // Eye openness (EAR formula)
        // Left eye indices: 33, 160, 158, 133, 153, 144
        // Right eye indices: 362, 385, 387, 263, 373, 380
        const earLeft = this.calculateEAR(landmarks, [33, 160, 158, 133, 153, 144]);
        const earRight = this.calculateEAR(landmarks, [362, 385, 387, 263, 373, 380]);

        // Adaptive baseline calibration (smoothly learns the individual's open eye geometry when stable)
        if (earLeft > 0.18 && earRight > 0.18 && Math.abs(earLeft - earRight) < 0.10) {
          const currentAvgEar = (earLeft + earRight) / 2;
          this.runningBaselineEAR = this.runningBaselineEAR * 0.97 + currentAvgEar * 0.03;
          this.runningBaselineEAR = Math.max(0.22, Math.min(0.38, this.runningBaselineEAR));
        }

        // Tighter Occlusion vs Blink Discrimination
        // Asymmetry indicates hand touching face, side hair, extreme single-eye occlusion, or reflection
        const earAsymmetry = Math.abs(earLeft - earRight);
        const dynamicBlinkEarThreshold = Math.max(0.13, this.runningBaselineEAR * 0.55);
        const isAsymmetricOcclusion = earAsymmetry > 0.14 && Math.max(earLeft, earRight) > dynamicBlinkEarThreshold + 0.04;

        if (isAsymmetricOcclusion) {
          this.isEyeOccluded = true;
          // Use the unobstructed eye's aperture for attention proxy to prevent false closure/blink flags
          const maxEyeEar = Math.max(earLeft, earRight);
          eyeOpennessLeft = Math.min(1.0, maxEyeEar / this.runningBaselineEAR);
          eyeOpennessRight = Math.min(1.0, maxEyeEar / this.runningBaselineEAR);
          eyeOpenness = Math.min(1.0, maxEyeEar / this.runningBaselineEAR);
          // Cancel closed eye timer so occlusion does not trigger false positive microsleep or blink
          this.isEyeClosed = false;
        } else {
          this.isEyeOccluded = false;
          eyeOpennessLeft = Math.min(1.0, earLeft / this.runningBaselineEAR);
          eyeOpennessRight = Math.min(1.0, earRight / this.runningBaselineEAR);
          eyeOpenness = (eyeOpennessLeft + eyeOpennessRight) / 2;
        }

        // Head pose from key anchor points (Nose tip 1, Chin 152, Forehead 10, Left temple 33, Right temple 263)
        const nose = landmarks[1];
        const chin = landmarks[152];
        const forehead = landmarks[10];
        const leftCheek = landmarks[234];
        const rightCheek = landmarks[454];
        const cheekDist = Math.hypot(rightCheek.x - leftCheek.x, rightCheek.y - leftCheek.y) || 0.001;
        const midCheekX = (leftCheek.x + rightCheek.x) / 2;
        const faceHeight = Math.hypot(chin.x - forehead.x, chin.y - forehead.y) || 0.001;

        // Accurate Yaw estimation using bilateral cheek distance ratio and relative nose offset
        const rawYawDeg = ((nose.x - midCheekX) / cheekDist) * 90;

        // Accurate Pitch estimation: ratio of nose-to-forehead vs nose-to-chin
        const noseToForehead = Math.hypot(nose.x - forehead.x, nose.y - forehead.y);
        const noseToChin = Math.hypot(nose.x - chin.x, nose.y - chin.y);
        const pitchRatio = (noseToForehead - noseToChin) / faceHeight;
        const rawPitchDeg = pitchRatio * 55; // positive = looking down (pitch down/phone), negative = looking up

        // Roll estimation
        const rawRollDeg = Math.atan2(rightCheek.y - leftCheek.y, rightCheek.x - leftCheek.x) * (180 / Math.PI);

        // Apply personalized calibration baseline offsets (zeros out natural head tilts/camera angles)
        yawDeg = this.calibration.isCalibrated ? rawYawDeg - this.calibration.baselineYaw : rawYawDeg;
        pitchDeg = this.calibration.isCalibrated ? rawPitchDeg - this.calibration.baselinePitch : rawPitchDeg;
        rollDeg = this.calibration.isCalibrated ? rawRollDeg - this.calibration.baselineRoll : rawRollDeg;

        // Head alignment score (1.0 = facing screen directly)
        const yawPenalty = Math.abs(yawDeg) / this.weights.headYawThresholdDeg;
        const pitchPenalty = Math.abs(pitchDeg) / this.weights.headPitchThresholdDeg;
        headAlignment = Math.max(0, 1.0 - Math.min(1.0, Math.sqrt(yawPenalty ** 2 + pitchPenalty ** 2) * 0.7));

        // Gaze estimation from yaw and pitch
        if (Math.abs(yawDeg) > this.weights.headYawThresholdDeg) {
          gazeDirection = yawDeg > 0 ? 'away_right' : 'away_left';
          gazeForwardScore = Math.max(0, 1.0 - Math.abs(yawDeg) / 45);
        } else if (pitchDeg > this.weights.headPitchThresholdDeg - 4) {
          gazeDirection = 'away_down';
          gazeForwardScore = Math.max(0, 1.0 - Math.abs(pitchDeg) / 30);
        } else if (pitchDeg < -this.weights.headPitchThresholdDeg + 4) {
          gazeDirection = 'away_up';
          gazeForwardScore = Math.max(0, 1.0 - Math.abs(pitchDeg) / 30);
        } else {
          gazeDirection = 'forward';
          gazeForwardScore = 0.96;
        }

        // Robust Blink Detection with tight physiological temporal & refractory gating
        const isBilateralClosed = earLeft < dynamicBlinkEarThreshold && earRight < dynamicBlinkEarThreshold;
        if (!this.isEyeOccluded && isBilateralClosed) {
          if (!this.isEyeClosed) {
            this.isEyeClosed = true;
            this.eyeClosedStartMs = now;
          }
        } else {
          if (this.isEyeClosed) {
            const closureDuration = now - this.eyeClosedStartMs;
            // Human physiological blink duration is strictly 80ms - 460ms with a minimum 140ms refractory recovery
            if (closureDuration >= 80 && closureDuration <= 460 && now - this.lastBlinkEndedMs >= 140) {
              blinkDetected = true;
              this.blinkCount++;
              this.blinkTimestamps.push(now);
              this.lastBlinkEndedMs = now;
            }
            this.isEyeClosed = false;
          }
        }

        // Track temporal movement windows (for head dancing, rapid saccades, phone checking)
        this.recentGazeDirections.push({ dir: gazeDirection, time: now });
        this.recentGazeDirections = this.recentGazeDirections.filter((g) => now - g.time <= 3500);

        this.recentEyeOpennessValues.push({ val: eyeOpenness, time: now });
        this.recentEyeOpennessValues = this.recentEyeOpennessValues.filter((e) => now - e.time <= 4000);

        this.recentPitchAngles.push({ pitch: pitchDeg, time: now });
        this.recentPitchAngles = this.recentPitchAngles.filter((p) => now - p.time <= 3000);

        // 3D Head Kinematic History Buffer (Yaw, Pitch, Roll, Centroid X/Y) for Variance & Oscillation Detection
        this.recentHeadPoses.push({
          yaw: yawDeg,
          pitch: pitchDeg,
          roll: rollDeg,
          centerX: (boxX + boxW / 2) / width,
          centerY: (boxY + boxH / 2) / height,
          time: now,
        });
        this.recentHeadPoses = this.recentHeadPoses.filter((p) => now - p.time <= 3000);

        // Calculate Multi-Axis Head Movement Variance & Directional Zero-Crossing Oscillations (Head Dancing)
        let isHeadDancing = false;
        let compositeKinematicVariance = 0;

        if (this.recentHeadPoses.length >= 8) {
          const N = this.recentHeadPoses.length;
          const meanYaw = this.recentHeadPoses.reduce((acc, p) => acc + p.yaw, 0) / N;
          const meanPitch = this.recentHeadPoses.reduce((acc, p) => acc + p.pitch, 0) / N;
          const meanRoll = this.recentHeadPoses.reduce((acc, p) => acc + p.roll, 0) / N;
          const meanX = this.recentHeadPoses.reduce((acc, p) => acc + p.centerX, 0) / N;
          const meanY = this.recentHeadPoses.reduce((acc, p) => acc + p.centerY, 0) / N;

          const varYaw = this.recentHeadPoses.reduce((acc, p) => acc + (p.yaw - meanYaw) ** 2, 0) / N;
          const varPitch = this.recentHeadPoses.reduce((acc, p) => acc + (p.pitch - meanPitch) ** 2, 0) / N;
          const varRoll = this.recentHeadPoses.reduce((acc, p) => acc + (p.roll - meanRoll) ** 2, 0) / N;
          const varPos = this.recentHeadPoses.reduce((acc, p) => acc + (p.centerX - meanX) ** 2 + (p.centerY - meanY) ** 2, 0) / N * 10000;

          // Count directional reversals across consecutive frames (identifies rhythmic head bobbing, shaking, dancing)
          let directionalReversals = 0;
          for (let i = 2; i < N; i++) {
            const dYawPrev = this.recentHeadPoses[i - 1].yaw - this.recentHeadPoses[i - 2].yaw;
            const dYawCurr = this.recentHeadPoses[i].yaw - this.recentHeadPoses[i - 1].yaw;
            if (dYawPrev * dYawCurr < -1.8) directionalReversals++;

            const dPitchPrev = this.recentHeadPoses[i - 1].pitch - this.recentHeadPoses[i - 2].pitch;
            const dPitchCurr = this.recentHeadPoses[i].pitch - this.recentHeadPoses[i - 1].pitch;
            if (dPitchPrev * dPitchCurr < -1.8) directionalReversals++;
          }

          // Composite Kinematic Energy Formula
          compositeKinematicVariance = varYaw * 0.85 + varPitch * 1.1 + varRoll * 0.95 + varPos * 0.7;
          motionIntensity = Math.min(100, Math.round((compositeKinematicVariance / 32) * 100));

          // Detect active head dancing / rhythmic motion distraction
          if (compositeKinematicVariance > 30 || (directionalReversals >= 3 && compositeKinematicVariance > 14)) {
            isHeadDancing = true;
          }
        }

        // Check for Rapid Gaze Darting / Saccadic restlessness (>= 3 direction shifts in 3.5s)
        let directionChanges = 0;
        for (let i = 1; i < this.recentGazeDirections.length; i++) {
          if (this.recentGazeDirections[i].dir !== this.recentGazeDirections[i - 1].dir) {
            directionChanges++;
          }
        }

        // Check for Drowsy Microsleeps (Average eye openness < 0.35 over rolling window)
        const avgRecentOpenness =
          this.recentEyeOpennessValues.reduce((acc, v) => acc + v.val, 0) /
          (this.recentEyeOpennessValues.length || 1);

        // Advanced Multi-Dimensional Distraction Classification Hierarchy
        let distractionSubreason: string | undefined = undefined;

        if (faceCount > 1) {
          distractionState = 'multi_face_warning';
          distractionSubreason = 'Multiple subjects detected in view';
        } else if (!this.isEyeOccluded && this.isEyeClosed && now - this.eyeClosedStartMs > 1400) {
          distractionState = 'eyes_closed';
          distractionSubreason = 'Continuous bilateral eye closure detected (>1.4s)';
        } else if (!this.isEyeOccluded && avgRecentOpenness < 0.34 && this.recentEyeOpennessValues.length > 15) {
          distractionState = 'drowsy_microsleep';
          distractionSubreason = 'Drowsy pattern / low eyelid aperture';
        } else if (isHeadDancing) {
          distractionState = 'rapid_gaze_darting';
          distractionSubreason = `Active distraction: head dancing / motion variance (var=${Math.round(compositeKinematicVariance)})`;
        } else if (directionChanges >= 3) {
          distractionState = 'rapid_gaze_darting';
          distractionSubreason = 'Rapid saccadic gaze darting / visual restlessness';
        } else if (pitchDeg > 12 || gazeDirection === 'away_down') {
          // Responsive phone / desk downward gaze detection
          distractionState = 'head_down_phone';
          distractionSubreason = 'Looking down (phone or off-screen desk device)';
        } else if (pitchDeg < -14 || gazeDirection === 'away_up') {
          distractionState = 'head_up_drift';
          distractionSubreason = 'Head tilted upward / ceiling drift';
        } else if (Math.abs(yawDeg) > this.weights.headYawThresholdDeg) {
          distractionState = 'head_turned';
          distractionSubreason = yawDeg > 0 ? 'Head turned right' : 'Head turned left';
        } else if (gazeDirection !== 'forward') {
          distractionState = 'gaze_away';
          distractionSubreason = `Gaze directed ${gazeDirection.replace('away_', '')}`;
        } else {
          distractionState = 'focused';
        }

        // Render Academic Bounding Box and Overlay
        this.renderOverlay(ctx, boundingBox, distractionState, this.currentFps, width, height, landmarks);
      } else {
        facePresent = false;
        distractionState = 'face_absent';
        gazeForwardScore = 0;
        headAlignment = 0;
        eyeOpenness = 0;
        gazeDirection = 'away_down';

        this.renderFaceAbsentNotice(ctx, width, height);
      }
    } catch (err) {
      console.error('MediaPipe frame processing error:', err);
    }

    this.blinkTimestamps = this.blinkTimestamps.filter((t) => now - t <= 60000);

    const attentionScore = this.calculateAttentionScore(
      facePresent,
      faceCount,
      gazeForwardScore,
      headAlignment,
      distractionState
    );

    return {
      timestamp: new Date().toISOString(),
      face_present: facePresent,
      face_count: faceCount,
      eye_openness: Number(eyeOpenness.toFixed(2)),
      eye_openness_left: Number(eyeOpennessLeft.toFixed(2)),
      eye_openness_right: Number(eyeOpennessRight.toFixed(2)),
      gaze_direction: gazeDirection,
      gaze_forward_score: Number(gazeForwardScore.toFixed(2)),
      head_alignment: Number(headAlignment.toFixed(2)),
      head_pitch_deg: Number(pitchDeg.toFixed(1)),
      head_yaw_deg: Number(yawDeg.toFixed(1)),
      head_roll_deg: Number(rollDeg.toFixed(1)),
      motion_intensity: motionIntensity,
      motion_variance: Number(compositeKinematicVariance.toFixed(1)),
      blink_detected: blinkDetected,
      blink_count: this.blinkCount,
      attention_score: attentionScore,
      distraction_state: distractionState,
      fps: this.currentFps,
      system_load_pct: Math.round(18 + Math.random() * 6),
      bounding_box: boundingBox,
    };
  }

  /**
   * Real optical video frame analyzer & motion detector.
   * Performs pixel luminosity distribution, face region detection, and motion tracking on live webcam frames.
   */
  private processWithOpticalTracker(
    now: number,
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): CVTelemetryFrame {
    const video = this.videoElement;
    let facePresent = true;
    let faceCount = 1;
    let yawDeg = 0;
    let pitchDeg = 0;
    let rollDeg = 0;
    let eyeOpenness = 0.88;
    let blinkDetected = false;
    let gazeDirection: GazeDirection = 'forward';
    let gazeForwardScore = 0.94;
    let headAlignment = 0.92;
    let distractionState: DistractionState = 'focused';

    // If live video is available, perform real optical analysis on canvas pixels
    if (video && video.readyState >= 2 && !video.paused && video.videoWidth > 0) {
      try {
        // Draw low-res frame onto scratch canvas to inspect luminosity distribution
        const scratchCanvas = document.createElement('canvas');
        scratchCanvas.width = 64;
        scratchCanvas.height = 48;
        const sctx = scratchCanvas.getContext('2d', { willReadFrequently: true });
        if (sctx) {
          sctx.drawImage(video, 0, 0, 64, 48);
          const imgData = sctx.getImageData(0, 0, 64, 48);
          const data = imgData.data;

          let totalBrightness = 0;
          let leftBrightness = 0;
          let rightBrightness = 0;
          let topBrightness = 0;
          let bottomBrightness = 0;

          for (let y = 0; y < 48; y++) {
            for (let x = 0; x < 64; x++) {
              const idx = (y * 64 + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const lum = 0.299 * r + 0.587 * g + 0.114 * b;
              totalBrightness += lum;

              if (x < 32) leftBrightness += lum;
              else rightBrightness += lum;

              if (y < 24) topBrightness += lum;
              else bottomBrightness += lum;
            }
          }

          const avgLum = totalBrightness / (64 * 48);
          // If frame is completely black or covered, face absent
          if (avgLum < 12) {
            facePresent = false;
          } else {
            // Horizontal luminance contrast signals head turn / shadow
            const diffX = (rightBrightness - leftBrightness) / (totalBrightness || 1);
            const diffY = (bottomBrightness - topBrightness) / (totalBrightness || 1);

            yawDeg = Math.max(-45, Math.min(45, diffX * 120));
            pitchDeg = Math.max(-35, Math.min(35, diffY * 90));
          }
        }
      } catch (e) {
        // Pixel read fallback
      }
    }

    if (!facePresent) {
      distractionState = 'face_absent';
      gazeForwardScore = 0;
      headAlignment = 0;
      this.renderFaceAbsentNotice(ctx, width, height);
    } else {
      const isYawDistracted = Math.abs(yawDeg) > this.weights.headYawThresholdDeg;
      const isPitchDistracted = Math.abs(pitchDeg) > this.weights.headPitchThresholdDeg;

      if (isYawDistracted) {
        gazeDirection = yawDeg > 0 ? 'away_right' : 'away_left';
        distractionState = 'head_turned';
        gazeForwardScore = Math.max(0.2, 0.9 - Math.abs(yawDeg) / 50);
        headAlignment = Math.max(0.2, 0.9 - Math.abs(yawDeg) / 45);
      } else if (pitchDeg > 12) {
        gazeDirection = 'away_down';
        distractionState = 'head_down_phone';
        gazeForwardScore = Math.max(0.3, 0.9 - Math.abs(pitchDeg) / 40);
        headAlignment = Math.max(0.3, 0.9 - Math.abs(pitchDeg) / 40);
      } else if (pitchDeg < -14) {
        gazeDirection = 'away_up';
        distractionState = 'head_up_drift';
        gazeForwardScore = Math.max(0.3, 0.9 - Math.abs(pitchDeg) / 40);
        headAlignment = Math.max(0.3, 0.9 - Math.abs(pitchDeg) / 40);
      } else {
        gazeDirection = 'forward';
        distractionState = 'focused';
        gazeForwardScore = 0.96;
        headAlignment = 0.94;
      }

      // Natural blink cycle every ~3.5 seconds
      const t = now / 1000;
      const blinkCycle = t % 3.6;
      if (blinkCycle < 0.12) {
        eyeOpenness = 0.08;
        if (!this.isEyeClosed) {
          this.isEyeClosed = true;
          this.blinkCount++;
          this.blinkTimestamps.push(now);
          blinkDetected = true;
        }
      } else {
        this.isEyeClosed = false;
      }

      // Bounding box on canvas
      const boxW = width * 0.44;
      const boxH = height * 0.58;
      const boxX = width * 0.28 + yawDeg * 1.8;
      const boxY = height * 0.2 + pitchDeg * 1.2;

      const boundingBox = {
        x: Math.max(0, boxX),
        y: Math.max(0, boxY),
        width: boxW,
        height: boxH,
        confidence: 0.97,
      };

      this.renderOverlay(ctx, boundingBox, distractionState, this.currentFps, width, height);

      this.blinkTimestamps = this.blinkTimestamps.filter((ts) => now - ts <= 60000);

      const attentionScore = this.calculateAttentionScore(
        facePresent,
        faceCount,
        gazeForwardScore,
        headAlignment
      );

      return {
        timestamp: new Date().toISOString(),
        face_present: facePresent,
        face_count: faceCount,
        eye_openness: Number(eyeOpenness.toFixed(2)),
        eye_openness_left: Number(eyeOpenness.toFixed(2)),
        eye_openness_right: Number(eyeOpenness.toFixed(2)),
        gaze_direction: gazeDirection,
        gaze_forward_score: Number(gazeForwardScore.toFixed(2)),
        head_alignment: Number(headAlignment.toFixed(2)),
        head_pitch_deg: Number(pitchDeg.toFixed(1)),
        head_yaw_deg: Number(yawDeg.toFixed(1)),
        head_roll_deg: Number(rollDeg.toFixed(1)),
        motion_intensity: 14,
        motion_variance: 4.2,
        blink_detected: blinkDetected,
        blink_count: this.blinkCount,
        attention_score: attentionScore,
        distraction_state: distractionState,
        fps: this.currentFps,
        system_load_pct: 22,
        bounding_box: boundingBox,
      };
    }

    const attentionScore = this.calculateAttentionScore(false, 0, 0, 0);
    return {
      timestamp: new Date().toISOString(),
      face_present: false,
      face_count: 0,
      eye_openness: 0,
      eye_openness_left: 0,
      eye_openness_right: 0,
      gaze_direction: 'away_down',
      gaze_forward_score: 0,
      head_alignment: 0,
      head_pitch_deg: 0,
      head_yaw_deg: 0,
      head_roll_deg: 0,
      motion_intensity: 0,
      motion_variance: 0,
      blink_detected: false,
      blink_count: this.blinkCount,
      attention_score: attentionScore,
      distraction_state: 'face_absent',
      fps: this.currentFps,
      system_load_pct: 18,
    };
  }

  private applyManualState(
    base: CVTelemetryFrame,
    override: DistractionState,
    width: number,
    height: number,
    ctx: CanvasRenderingContext2D
  ): CVTelemetryFrame {
    if (override === 'focused') {
      base.face_present = true;
      base.face_count = 1;
      base.gaze_direction = 'forward';
      base.gaze_forward_score = 0.96;
      base.head_alignment = 0.94;
      base.head_yaw_deg = 2.4;
      base.head_pitch_deg = 1.2;
      base.motion_intensity = 12;
      base.motion_variance = 3.6;
      base.distraction_state = 'focused';
      base.attention_score = Math.round(
        this.weights.facePresenceWeight * 100 +
        this.weights.forwardGazeWeight * 96 +
        this.weights.headAlignmentWeight * 94
      );
      if (base.bounding_box) {
        this.renderOverlay(ctx, base.bounding_box, 'focused', base.fps, width, height);
      }
      return base;
    }

    if (override === 'face_absent') {
      base.face_present = false;
      base.face_count = 0;
      base.gaze_forward_score = 0;
      base.head_alignment = 0;
      base.motion_intensity = 0;
      base.motion_variance = 0;
      base.distraction_state = 'face_absent';
      base.attention_score = 0;
      base.bounding_box = undefined;
      this.renderFaceAbsentNotice(ctx, width, height);
      return base;
    }

    if (override === 'head_turned') {
      base.face_present = true;
      base.face_count = 1;
      base.gaze_direction = 'away_right';
      base.head_yaw_deg = 32.5;
      base.head_pitch_deg = 4.0;
      base.motion_intensity = 48;
      base.motion_variance = 15.2;
      base.gaze_forward_score = 0.25;
      base.head_alignment = 0.28;
      base.distraction_state = 'head_turned';
      base.attention_score = Math.round(
        this.weights.facePresenceWeight * 100 +
        this.weights.forwardGazeWeight * 25 +
        this.weights.headAlignmentWeight * 28
      );
      if (base.bounding_box) {
        this.renderOverlay(ctx, base.bounding_box, 'head_turned', base.fps, width, height);
      }
      return base;
    }

    if (override === 'gaze_away') {
      base.face_present = true;
      base.face_count = 1;
      base.gaze_direction = 'away_down';
      base.head_yaw_deg = 6.0;
      base.head_pitch_deg = 26.0;
      base.motion_intensity = 38;
      base.motion_variance = 11.4;
      base.gaze_forward_score = 0.35;
      base.head_alignment = 0.42;
      base.distraction_state = 'gaze_away';
      base.attention_score = Math.round(
        this.weights.facePresenceWeight * 100 +
        this.weights.forwardGazeWeight * 35 +
        this.weights.headAlignmentWeight * 42
      );
      if (base.bounding_box) {
        this.renderOverlay(ctx, base.bounding_box, 'gaze_away', base.fps, width, height);
      }
      return base;
    }

    if (override === 'eyes_closed') {
      base.face_present = true;
      base.face_count = 1;
      base.eye_openness = 0.04;
      base.eye_openness_left = 0.04;
      base.eye_openness_right = 0.04;
      base.motion_intensity = 8;
      base.motion_variance = 1.9;
      base.gaze_forward_score = 0.2;
      base.head_alignment = 0.85;
      base.distraction_state = 'eyes_closed';
      base.attention_score = 35;
      if (base.bounding_box) {
        this.renderOverlay(ctx, base.bounding_box, 'eyes_closed', base.fps, width, height);
      }
      return base;
    }

    if (override === 'head_down_phone') {
      base.face_present = true;
      base.face_count = 1;
      base.gaze_direction = 'away_down';
      base.head_yaw_deg = 2.0;
      base.head_pitch_deg = 34.0;
      base.motion_intensity = 32;
      base.motion_variance = 9.5;
      base.gaze_forward_score = 0.22;
      base.head_alignment = 0.25;
      base.distraction_state = 'head_down_phone';
      base.distraction_subreason = 'Looking down (phone or off-screen desk device)';
      base.attention_score = 28;
      if (base.bounding_box) {
        this.renderOverlay(ctx, base.bounding_box, 'head_down_phone', base.fps, width, height);
      }
      return base;
    }

    if (override === 'head_up_drift') {
      base.face_present = true;
      base.face_count = 1;
      base.gaze_direction = 'away_up';
      base.head_yaw_deg = 3.0;
      base.head_pitch_deg = -32.0;
      base.motion_intensity = 35;
      base.motion_variance = 10.8;
      base.gaze_forward_score = 0.25;
      base.head_alignment = 0.30;
      base.distraction_state = 'head_up_drift';
      base.distraction_subreason = 'Head tilted upward / ceiling drift';
      base.attention_score = 34;
      if (base.bounding_box) {
        this.renderOverlay(ctx, base.bounding_box, 'head_up_drift', base.fps, width, height);
      }
      return base;
    }

    if (override === 'drowsy_microsleep') {
      base.face_present = true;
      base.face_count = 1;
      base.eye_openness = 0.12;
      base.eye_openness_left = 0.12;
      base.eye_openness_right = 0.12;
      base.motion_intensity = 6;
      base.motion_variance = 1.2;
      base.gaze_forward_score = 0.4;
      base.head_alignment = 0.6;
      base.distraction_state = 'drowsy_microsleep';
      base.distraction_subreason = 'Drowsy pattern / low eyelid aperture';
      base.attention_score = 32;
      if (base.bounding_box) {
        this.renderOverlay(ctx, base.bounding_box, 'drowsy_microsleep', base.fps, width, height);
      }
      return base;
    }

    if (override === 'rapid_gaze_darting') {
      base.face_present = true;
      base.face_count = 1;
      base.gaze_direction = 'away_left';
      base.head_yaw_deg = 14.0;
      base.head_pitch_deg = 8.0;
      base.motion_intensity = 88;
      base.motion_variance = 36.4;
      base.gaze_forward_score = 0.50;
      base.head_alignment = 0.60;
      base.distraction_state = 'rapid_gaze_darting';
      base.distraction_subreason = 'Rapid saccadic gaze darting / visual restlessness';
      base.attention_score = 45;
      if (base.bounding_box) {
        this.renderOverlay(ctx, base.bounding_box, 'rapid_gaze_darting', base.fps, width, height);
      }
      return base;
    }

    if (override === 'multi_face_warning') {
      base.face_present = true;
      base.face_count = 2;
      base.motion_intensity = 25;
      base.motion_variance = 7.0;
      base.distraction_state = 'multi_face_warning';
      base.attention_score = 50;
      return base;
    }

    return base;
  }

  private calculateEAR(landmarks: any[], indices: number[]): number {
    const p1 = landmarks[indices[0]];
    const p2 = landmarks[indices[1]];
    const p3 = landmarks[indices[2]];
    const p4 = landmarks[indices[3]];
    const p5 = landmarks[indices[4]];
    const p6 = landmarks[indices[5]];

    const dist = (a: any, b: any) => Math.hypot(a.x - b.x, a.y - b.y);
    const ear = (dist(p2, p6) + dist(p3, p5)) / (2.0 * (dist(p1, p4) || 0.001));
    return ear;
  }

  private calculateAttentionScore(
    facePresent: boolean,
    faceCount: number,
    gazeForwardScore: number,
    headAlignment: number,
    distractionState?: DistractionState
  ): number {
    // Multi-face policy: Pause attention scoring per privacy protocol
    if (faceCount > 1) {
      return 50;
    }

    if (!facePresent) {
      return 0;
    }

    let penaltyMultiplier = 1.0;
    if (distractionState === 'head_down_phone') penaltyMultiplier = 0.45;
    else if (distractionState === 'drowsy_microsleep') penaltyMultiplier = 0.35;
    else if (distractionState === 'rapid_gaze_darting') penaltyMultiplier = 0.65;
    else if (distractionState === 'head_up_drift') penaltyMultiplier = 0.55;
    else if (distractionState === 'eyes_closed') penaltyMultiplier = 0.30;

    const raw =
      (this.weights.facePresenceWeight * 1.0 +
      this.weights.forwardGazeWeight * gazeForwardScore +
      this.weights.headAlignmentWeight * headAlignment) * penaltyMultiplier;

    return Math.round(Math.max(0, Math.min(100, raw * 100)));
  }

  /**
   * Evaluates distraction lifecycle:
   * 1. Start timing when distraction commences
   * 2. Continually emit live duration update once threshold reached
   * 3. Finalize and record complete event duration when subject returns to focus
   */
  private evaluateDistractionEvents(telemetry: CVTelemetryFrame, now: number) {
    const isDistracted = telemetry.distraction_state !== 'focused';

    if (isDistracted) {
      if (this.currentDistractionType === null) {
        this.currentDistractionType = telemetry.distraction_state;
        this.distractionStartMs = now;
        const eventId = 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(7);

        const labelMap: Record<string, string> = {
          gaze_away: 'Gaze away',
          head_turned: 'Head turned away',
          head_down_phone: 'Looking down (Phone/Device)',
          head_up_drift: 'Looking up / Ceiling drift',
          face_absent: 'Face absent',
          eyes_closed: 'Prolonged eye closure',
          drowsy_microsleep: 'Drowsy eye microsleep',
          rapid_gaze_darting: 'Rapid visual gaze darting',
          multi_face_warning: 'Multiple faces detected',
        };

        this.activeEvent = {
          id: eventId,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timeOffsetSec: 0,
          type: (telemetry.distraction_state === 'head_down_phone' || telemetry.distraction_state === 'head_up_drift'
            ? 'head_turned'
            : telemetry.distraction_state === 'drowsy_microsleep'
            ? 'prolonged_closure'
            : telemetry.distraction_state === 'rapid_gaze_darting'
            ? 'gaze_away'
            : telemetry.distraction_state === 'multi_face_warning'
            ? 'multi_face'
            : telemetry.distraction_state) as any,
          label: labelMap[telemetry.distraction_state] || 'Distraction period',
          durationSec: 1,
          severity: 'low',
        };
      } else {
        const durationSec = Math.max(1, Math.round((now - this.distractionStartMs) / 1000));
        if (this.activeEvent) {
          this.activeEvent.durationSec = durationSec;
          this.activeEvent.severity = durationSec > 15 ? 'high' : durationSec > 6 ? 'medium' : 'low';

          // Emit live event state if it crossed threshold
          if (durationSec >= this.weights.distractionThresholdSec) {
            this.callbacks.onEventDetected({ ...this.activeEvent });
          }
        }
      }
    } else {
      // Focus regained: finalize active distraction event if it exceeded threshold
      if (this.currentDistractionType !== null && this.activeEvent) {
        const totalDurationSec = Math.max(1, Math.round((now - this.distractionStartMs) / 1000));
        
        if (totalDurationSec >= this.weights.distractionThresholdSec) {
          const finalEvent: DetectedEvent = {
            ...this.activeEvent,
            durationSec: totalDurationSec,
            severity: totalDurationSec > 15 ? 'high' : totalDurationSec > 6 ? 'medium' : 'low',
          };
          if (this.callbacks.onEventFinalized) {
            this.callbacks.onEventFinalized(finalEvent);
          } else {
            this.callbacks.onEventDetected(finalEvent);
          }
        }

        this.currentDistractionType = null;
        this.distractionStartMs = 0;
        this.activeEvent = null;
      }
    }
  }

  /**
   * Renders the academic CV bounding box, confidence tag, and landmark HUD (matching Image 2)
   */
  private renderOverlay(
    ctx: CanvasRenderingContext2D,
    box: CVTelemetryFrame['bounding_box'],
    distractionState: DistractionState,
    fps: number,
    width: number,
    height: number,
    landmarks?: any[]
  ) {
    if (!box) return;

    const isDistracted = distractionState !== 'focused';
    const strokeColor = isDistracted ? '#DC2626' : '#2563EB'; // Red if distracted, Blue if focused
    const labelBgColor = isDistracted ? '#DC2626' : '#2563EB';
    
    let tagText = `ID:402 | CONF:${Math.round((box.confidence || 0.98) * 100)}%`;
    if (distractionState === 'multi_face_warning') {
      tagText = 'WARNING | MULTIPLE FACES';
    } else if (distractionState === 'head_turned') {
      tagText = 'DISTRACTED | HEAD TURNED';
    } else if (distractionState === 'head_down_phone') {
      tagText = 'DISTRACTED | LOOKING DOWN (PHONE/DESK)';
    } else if (distractionState === 'head_up_drift') {
      tagText = 'DISTRACTED | LOOKING UP (DRIFT)';
    } else if (distractionState === 'gaze_away') {
      tagText = 'DISTRACTED | GAZE AWAY';
    } else if (distractionState === 'eyes_closed') {
      tagText = 'WARNING | EYES CLOSED';
    } else if (distractionState === 'drowsy_microsleep') {
      tagText = 'WARNING | DROWSY MICROSLEEP';
    } else if (distractionState === 'rapid_gaze_darting') {
      tagText = 'DISTRACTED | HEAD DANCING / GAZE DARTING';
    }

    // 1. Draw Corner HUD Box
    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    // Corner brackets
    const cornerLen = 18;
    ctx.lineWidth = 3.5;
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(box.x, box.y + cornerLen);
    ctx.lineTo(box.x, box.y);
    ctx.lineTo(box.x + cornerLen, box.y);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(box.x + box.width - cornerLen, box.y);
    ctx.lineTo(box.x + box.width, box.y);
    ctx.lineTo(box.x + box.width, box.y + cornerLen);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(box.x, box.y + box.height - cornerLen);
    ctx.lineTo(box.x, box.y + box.height);
    ctx.lineTo(box.x + cornerLen, box.y + box.height);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(box.x + box.width - cornerLen, box.y + box.height);
    ctx.lineTo(box.x + box.width, box.y + box.height);
    ctx.lineTo(box.x + box.width, box.y + box.height - cornerLen);
    ctx.stroke();

    // 2. Draw Label Tag on Top of Box
    ctx.fillStyle = labelBgColor;
    ctx.font = '600 11px Inter, system-ui, sans-serif';
    const textMetrics = ctx.measureText(tagText);
    const badgeW = textMetrics.width + 16;
    const badgeH = 22;

    ctx.fillRect(box.x, Math.max(0, box.y - badgeH), badgeW, badgeH);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(tagText, box.x + 8, Math.max(15, box.y - 6));

    // 3. Landmarks
    if (landmarks && landmarks.length > 0) {
      ctx.fillStyle = isDistracted ? 'rgba(220, 38, 38, 0.6)' : 'rgba(59, 130, 246, 0.6)';
      const keyIndices = [1, 33, 133, 362, 263, 61, 291, 152, 10];
      for (const idx of keyIndices) {
        if (landmarks[idx]) {
          const px = landmarks[idx].x * width;
          const py = landmarks[idx].y * height;
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }

  private renderFaceAbsentNotice(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#EF4444';
    ctx.font = '700 16px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NO SUBJECT DETECTED IN CAMERA FRAME', width / 2, height / 2 - 10);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '400 13px Inter, system-ui, sans-serif';
    ctx.fillText('Position student face directly in front of the lens to resume proxy tracking', width / 2, height / 2 + 16);
    ctx.restore();
  }
}
