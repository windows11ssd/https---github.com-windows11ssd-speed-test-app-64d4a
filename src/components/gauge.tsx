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
  size = 200,
  strokeWidth = 12,
}) => {
  const [currentValue, setCurrentValue] = useState(0);

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
  const angleOffset = -225; // Start angle at -135 degrees (bottom-left)
  const totalAngle = 270; // Gauge arc spans 270 degrees

  const percentage = Math.min(Math.max(currentValue / maxValue, 0), 1);
  const strokeDashoffset = circumference * (1 - (percentage * (totalAngle / 360)) / (270/360) ); // Adjust offset calculation for 270 degree arc

  const rotateAngle = angleOffset + percentage * totalAngle;

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
          transform={`rotate(${angleOffset} ${size / 2} ${size / 2})`}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: circumference * (1 - (totalAngle / 360)) , // Show only 270 degree portion
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
          transform={`rotate(${angleOffset} ${size / 2} ${size / 2})`}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
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
          y2={strokeWidth * 1.5}
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

