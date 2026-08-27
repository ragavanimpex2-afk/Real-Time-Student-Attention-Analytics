import React from 'react';

interface MotionSparklineProps {
  data: Array<{ intensity: number; variance: number }>;
  height?: number;
  width?: number | string;
  strokeColor?: string;
  fillColor?: string;
  showPeak?: boolean;
}

export const MotionSparkline: React.FC<MotionSparklineProps> = ({
  data,
  height = 36,
  strokeColor = '#3B82F6',
  fillColor = 'rgba(59, 130, 246, 0.12)',
  showPeak = true,
}) => {
  if (!data || data.length < 2) {
    // Render subtle placeholder flatline
    return (
      <svg
        className="w-full overflow-visible"
        height={height}
        viewBox="0 0 100 36"
        preserveAspectRatio="none"
      >
        <line
          x1="0"
          y1="18"
          x2="100"
          y2="18"
          stroke="#E2E8F0"
          strokeWidth="1.5"
          strokeDasharray="2 2"
        />
      </svg>
    );
  }

  const values = data.map((d) => Math.max(0, Math.min(100, d.intensity)));
  const maxVal = Math.max(100, ...values);
  const minVal = 0;
  const range = maxVal - minVal || 1;

  const width = 100;
  const paddingY = 4;
  const usableHeight = height - paddingY * 2;

  const points = values.map((val, idx) => {
    const x = (idx / (values.length - 1)) * width;
    const y = height - paddingY - ((val - minVal) / range) * usableHeight;
    return { x, y, val };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    if (idx === 0) return `M ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    // Smooth Catmull-Rom or cubic Bezier curve approximation
    const prev = points[idx - 1];
    const midX = (prev.x + pt.x) / 2;
    return `${acc} C ${midX.toFixed(1)},${prev.y.toFixed(1)} ${midX.toFixed(1)},${pt.y.toFixed(1)} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
  }, '');

  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  const lastPoint = points[points.length - 1];
  const peakPoint = points.reduce((max, p) => (p.val > max.val ? p : max), points[0]);

  // Determine dynamic line color based on latest value
  const latestVal = values[values.length - 1];
  const dynamicColor =
    latestVal > 70
      ? '#EF4444' // High restlessness (red)
      : latestVal > 40
      ? '#F59E0B' // Moderate restlessness (amber)
      : strokeColor; // Normal/calm (blue or specified)

  const dynamicFill =
    latestVal > 70
      ? 'rgba(239, 68, 68, 0.15)'
      : latestVal > 40
      ? 'rgba(245, 158, 11, 0.15)'
      : fillColor;

  const gradientId = `motion-sparkline-grad-${Math.random().toString(36).substr(2, 5)}`;

  return (
    <div className="relative w-full">
      <svg
        className="w-full overflow-visible"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={dynamicColor} stopOpacity="0.28" />
            <stop offset="100%" stopColor={dynamicColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Gradient Fill under line */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* Base Sparkline Stroke */}
        <path
          d={pathD}
          fill="none"
          stroke={dynamicColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Current Value Live Indicator Pulse */}
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="3"
          fill={dynamicColor}
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />

        {/* Peak indicator */}
        {showPeak && peakPoint.val > 50 && (
          <circle
            cx={peakPoint.x}
            cy={peakPoint.y}
            r="2"
            fill="#EF4444"
            opacity="0.85"
          />
        )}
      </svg>
    </div>
  );
};
