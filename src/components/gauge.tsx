
"use client";

import React, { useEffect, useState } from 'react';

interface GaugeProps {
  value: number;
  maxValue: number;
  label: string;
  unit: string;
  size?: number;
  strokeWidth?: number;
}

const Gauge: React.FC<GaugeProps> = ({
  value,
  maxValue,
  label,
  unit,
  size = 160, // Reduced default size to prevent overflow in 3-column layout
  strokeWidth = 12,
}) => {
  const [currentValue, setCurrentValue] = useState(0);

  // Configuration for the gauge appearance - aiming for Ookla-like wide arc
  const visualStartAngle = 150; // SVG angle where the gauge scale starts (0%) - e.g., 5 o'clock
  const visualSweepAngle = 240; // SVG sweep angle for the gauge scale (100%) - wide sweep

  // Calculate internal rotation values based on visual parameters
  // Needle points UP (SVG 270 deg) by default before rotation.
  // internalNeedleInitialRotation is the rotation to apply to the needle to make it point to visualStartAngle.
  const internalNeedleInitialRotation = visualStartAngle - 270;
  // internalPathTransformRotation is the rotation for the arc paths.
  // This aligns the path's drawable segment with the visualStartAngle.
  const internalPathTransformRotation = visualStartAngle - 540 + visualSweepAngle;


  useEffect(() => {
    const animationDuration = 500; // ms
    const startTime = Date.now();
    const startValue = currentValue;

    const animate = () => {
      const now = Date.now();
      const elapsedTime = now - startTime;
      const progress = Math.min(elapsedTime / animationDuration, 1);
      
      const easedProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic

      const nextValue = startValue + (value - startValue) * easedProgress;
      setCurrentValue(nextValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCurrentValue(value); // Ensure final value is exact
      }
    };

    requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);


  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const percentage = Math.min(Math.max(currentValue / maxValue, 0), 1);

  // Stroke dashoffset for the background arc
  const backgroundArcDashoffset = circumference * (1 - (visualSweepAngle / 360));
  
  // Stroke dashoffset for the value arc
  const valueArcFillFraction = percentage * (visualSweepAngle / 360);
  const valueArcDashoffset = circumference * (1 - valueArcFillFraction);

  // Needle rotation: starts at `internalNeedleInitialRotation` and sweeps by `visualSweepAngle`
  const rotateAngle = internalNeedleInitialRotation + percentage * visualSweepAngle;

  return (
    <div className="flex flex-col items-center p-4 rounded-lg shadow-md bg-card">
      <svg width={size} height={size * 0.85} viewBox={`0 0 ${size} ${size * 0.85}`}>
        {/* Background Arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2}
              a ${radius} ${radius} 0 1 1 ${radius * 2} 0`}
          fill="none"
          className="gauge-arc-bg"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          transform={`rotate(${internalPathTransformRotation} ${size / 2} ${size / 2})`}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: backgroundArcDashoffset,
          }}
        />
        {/* Value Arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2}
              a ${radius} ${radius} 0 1 1 ${radius * 2} 0`}
          fill="none"
          className="gauge-arc-fill"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          transform={`rotate(${internalPathTransformRotation} ${size / 2} ${size / 2})`}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: valueArcDashoffset,
            transition: 'stroke-dashoffset 0.5s ease-out',
          }}
        />
        {/* Needle Base */}
        <circle cx={size / 2} cy={size / 2} r={strokeWidth / 1.5} className="gauge-needle" />
        {/* Needle */}
        <line
          x1={size / 2}
          y1={size / 2}
          x2={size / 2}
          y2={strokeWidth * 1.5} // Needle points upwards before rotation
          strokeWidth={strokeWidth / 3}
          className="gauge-needle"
          strokeLinecap="round"
          style={{
            transformOrigin: `${size / 2}px ${size / 2}px`,
            transform: `rotate(${rotateAngle}deg)`,
            transition: 'transform 0.5s ease-out',
          }}
        />
        {/* Text */}
        <text
          x={size / 2}
          y={size / 2 + (size * 0.05)}
          textAnchor="middle"
          className="gauge-value-text"
          fontSize={size * 0.18}
        >
          {currentValue.toFixed(currentValue < 10 && currentValue !== 0 ? 1 : 0)}
        </text>
        <text
          x={size / 2}
          y={size / 2 + (size * 0.22)}
          textAnchor="middle"
          className="gauge-label-text"
          fontSize={size * 0.09}
        >
          {unit}
        </text>
      </svg>
      <p className="mt-2 text-lg font-medium text-foreground">{label}</p>
    </div>
  );
};

export default Gauge;
