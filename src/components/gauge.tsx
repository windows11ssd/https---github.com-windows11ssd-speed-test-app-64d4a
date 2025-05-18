
"use client";

import React, { useEffect, useState } from 'react';

interface GaugeProps {
  value: number;
  maxValue: number;
  label: string; // This is the "Download", "Upload", "Ping" label below the gauge
  unit: string;  // This is "Mbps", "ms" displayed inside the gauge
  size?: number;
  strokeWidth?: number;
}

const Gauge: React.FC<GaugeProps> = ({
  value,
  maxValue,
  label,
  unit,
  size = 180, 
  strokeWidth = 8,
}) => {
  const [currentValue, setCurrentValue] = useState(0);

  const visualStartAngle = 150; 
  const visualSweepAngle = 240; 

  const internalNeedleInitialRotation = visualStartAngle - 270; // Initial rotation to align needle with startAngle visually

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
        setCurrentValue(value);
      }
    };
    requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);


  const centerX = size / 2;
  const centerY = size / 2; 

  // Tick configuration
  const numMajorTicks = 5; 
  const majorTickLength = strokeWidth * 1.5;
  const labelOffset = strokeWidth * 2.5; 
  const scaleColorSplitValue = maxValue / 2;

  // Adjusted radius calculation to ensure labels fit within 'size'
  const calculatedRadius = ((size / 2) * 0.90) - labelOffset;
  const radius = Math.max(10, calculatedRadius); // Ensure radius is at least 10

  const percentage = Math.min(Math.max(currentValue / maxValue, 0), 1);
  const needleRotationAngle = internalNeedleInitialRotation + percentage * visualSweepAngle;


  const majorTicks = Array.from({ length: numMajorTicks + 1 }).map((_, i) => {
    const tickValue = (maxValue / numMajorTicks) * i;
    const tickPercentage = tickValue / maxValue;
    const tickAngle = visualStartAngle + tickPercentage * visualSweepAngle; // SVG angle
    const isOnSecondaryColor = tickValue > scaleColorSplitValue;

    // Tick line coordinates
    const startX = centerX + (radius - majorTickLength / 2) * Math.cos((tickAngle - 90) * Math.PI / 180);
    const startY = centerY + (radius - majorTickLength / 2) * Math.sin((tickAngle - 90) * Math.PI / 180);
    const endX = centerX + (radius + majorTickLength / 2) * Math.cos((tickAngle - 90) * Math.PI / 180);
    const endY = centerY + (radius + majorTickLength / 2) * Math.sin((tickAngle - 90) * Math.PI / 180);

    // Label coordinates (anchor point of the text)
    const labelRadius = radius + labelOffset;
    const labelX = centerX + labelRadius * Math.cos((tickAngle - 90) * Math.PI / 180);
    const labelY = centerY + labelRadius * Math.sin((tickAngle - 90) * Math.PI / 180); // Removed + (size * 0.02)

    return {
      value: tickValue,
      label: tickValue.toFixed(0),
      startX, startY, endX, endY,
      labelX, labelY,
      angle: tickAngle,
      isSecondary: isOnSecondaryColor,
    };
  });

  const describeArc = (x: number, y: number, r: number, startAng: number, endAng: number) => {
    const start = {
      x: x + r * Math.cos((startAng - 90) * Math.PI / 180),
      y: y + r * Math.sin((startAng - 90) * Math.PI / 180),
    };
    const end = {
      x: x + r * Math.cos((endAng - 90) * Math.PI / 180),
      y: y + r * Math.sin((endAng - 90) * Math.PI / 180),
    };
    const arcSweep = endAng - startAng <= 0 ? 360 + endAng - startAng : endAng - startAng; 
    const largeArcFlag = arcSweep <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };
  
  const scaleMidAngle = visualStartAngle + (visualSweepAngle / 2);
  const primaryScalePath = describeArc(centerX, centerY, radius, visualStartAngle, scaleMidAngle);
  const secondaryScalePath = describeArc(centerX, centerY, radius, scaleMidAngle, visualStartAngle + visualSweepAngle);
  const backgroundTrackPath = describeArc(centerX, centerY, radius, visualStartAngle, visualStartAngle + visualSweepAngle);
  
  const valueArcEndAngle = visualStartAngle + percentage * visualSweepAngle;
  const valueArcPath = describeArc(
    centerX, 
    centerY, 
    radius, 
    visualStartAngle, 
    valueArcEndAngle
  );

  return (
    <div className="flex flex-col items-center p-2 md:p-4 rounded-lg shadow-md bg-card">
      <svg width={size} height={size * 1.05} viewBox={`0 0 ${size} ${size * 1.05}`}>
        <path
          d={backgroundTrackPath}
          fill="none"
          className="gauge-scale-background"
          strokeWidth={strokeWidth}
          strokeLinecap="round" 
        />
        <path
          d={primaryScalePath}
          fill="none"
          className="gauge-scale-primary"
          strokeWidth={strokeWidth}
          strokeLinecap="butt" 
        />
        <path
          d={secondaryScalePath}
          fill="none"
          className="gauge-scale-secondary"
          strokeWidth={strokeWidth}
          strokeLinecap="butt" 
        />

        {currentValue > 0 && (
            <path
            d={valueArcPath}
            fill="none"
            className="gauge-value-arc"
            strokeWidth={strokeWidth} 
            strokeLinecap="round" 
            style={{
                transition: 'd 0.5s ease-out, stroke 0.5s ease-out',
            }}
            />
        )}
        
        {majorTicks.map((tick) => (
          <g key={`tick-${tick.value}`}>
            <line
              x1={tick.startX}
              y1={tick.startY}
              x2={tick.endX}
              y2={tick.endY}
              strokeWidth={strokeWidth / 3} 
              className={tick.isSecondary ? "gauge-tick-secondary" : "gauge-tick-primary"}
            />
            <text
              x={tick.labelX}
              y={tick.labelY}
              textAnchor="middle"
              dominantBaseline="middle" 
              className={`gauge-tick-label ${tick.isSecondary ? "gauge-tick-label-secondary" : "gauge-tick-label-primary"}`}
              fontSize={size * 0.065} 
            >
              {tick.label}
            </text>
          </g>
        ))}

        <text
            x={centerX}
            y={centerY + size * 0.05} 
            textAnchor="middle"
            className="gauge-unit-text"
            fontSize={size * 0.08} 
        >
            {unit}
        </text>

        <text
          x={centerX}
          y={centerY + size * 0.22} 
          textAnchor="middle"
          className="gauge-main-value-text"
          fontSize={size * 0.16} 
          fontWeight="bold"
        >
          {currentValue.toFixed(currentValue !== 0 && currentValue < 100 && !Number.isInteger(currentValue) ? 1 : 0)}
        </text>

        <circle 
            cx={centerX} 
            cy={centerY} 
            r={strokeWidth * 1.5} 
            className="gauge-hub-outline"
            strokeWidth={strokeWidth / 1.5} 
            fill="hsl(var(--card))" 
        />
        <line
          x1={centerX}
          y1={centerY}
          x2={centerX + (radius - strokeWidth*0.5) * Math.cos((needleRotationAngle - 90) * Math.PI / 180)}
          y2={centerY + (radius - strokeWidth*0.5) * Math.sin((needleRotationAngle - 90) * Math.PI / 180)}
          strokeWidth={strokeWidth / 1.5} 
          className="gauge-needle"
          strokeLinecap="round"
          style={{
            transformOrigin: `${centerX}px ${centerY}px`,
            transition: 'x2 0.5s ease-out, y2 0.5s ease-out, stroke 0.5s ease-out', 
          }}
        />
      </svg>
      <p className="mt-1 text-base md:text-lg font-medium text-foreground">{label}</p>
    </div>
  );
};

export default Gauge;

