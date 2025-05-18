
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
  size = 180, // Adjusted size for better fit with new elements
  strokeWidth = 8, // Thinner stroke for scale/needle
}) => {
  const [currentValue, setCurrentValue] = useState(0);

  const visualStartAngle = 150; // SVG angle where the gauge scale starts (0%)
  const visualSweepAngle = 240; // SVG sweep angle for the gauge scale (100%)

  const internalNeedleInitialRotation = visualStartAngle - 270;
  const internalPathTransformRotation = visualStartAngle - 540 + visualSweepAngle; // Aligns path to visual start

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

  const radius = (size - strokeWidth * 4) / 2; // Adjusted radius for new layout
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max(currentValue / maxValue, 0), 1);

  const valueArcFillFraction = percentage * (visualSweepAngle / 360);
  const valueArcDashoffset = circumference * (1 - valueArcFillFraction);
  const rotateAngle = internalNeedleInitialRotation + percentage * visualSweepAngle;

  const centerX = size / 2;
  const centerY = size / 2;

  // Tick configuration
  const numMajorTicks = 5; // 0, 25, 50, 75, 100%
  const majorTickLength = strokeWidth * 1.5;
  const labelOffset = strokeWidth * 2.5;
  const scaleColorSplitValue = maxValue / 2;

  const majorTicks = Array.from({ length: numMajorTicks + 1 }).map((_, i) => {
    const tickValue = (maxValue / numMajorTicks) * i;
    const tickPercentage = tickValue / maxValue;
    const tickAngle = visualStartAngle + tickPercentage * visualSweepAngle;
    const isOnSecondaryColor = tickValue > scaleColorSplitValue;

    const startX = centerX + (radius - majorTickLength / 2) * Math.cos((tickAngle - 90) * Math.PI / 180);
    const startY = centerY + (radius - majorTickLength / 2) * Math.sin((tickAngle - 90) * Math.PI / 180);
    const endX = centerX + (radius + majorTickLength / 2) * Math.cos((tickAngle - 90) * Math.PI / 180);
    const endY = centerY + (radius + majorTickLength / 2) * Math.sin((tickAngle - 90) * Math.PI / 180);

    const labelX = centerX + (radius + labelOffset) * Math.cos((tickAngle - 90) * Math.PI / 180);
    const labelY = centerY + (radius + labelOffset) * Math.sin((tickAngle - 90) * Math.PI / 180) + (size * 0.02); // Slight Y adjustment for label

    return {
      value: tickValue,
      label: tickValue.toFixed(0),
      startX, startY, endX, endY,
      labelX, labelY,
      angle: tickAngle,
      isSecondary: isOnSecondaryColor,
    };
  });

  // Path for the scale background (split into two colors)
  const describeArc = (x: number, y: number, r: number, startAng: number, endAng: number) => {
    const start = {
      x: x + r * Math.cos((startAng - 90) * Math.PI / 180),
      y: y + r * Math.sin((startAng - 90) * Math.PI / 180),
    };
    const end = {
      x: x + r * Math.cos((endAng - 90) * Math.PI / 180),
      y: y + r * Math.sin((endAng - 90) * Math.PI / 180),
    };
    const largeArcFlag = endAng - startAng <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  const scaleMidAngle = visualStartAngle + (visualSweepAngle / 2);
  const primaryScalePath = describeArc(centerX, centerY, radius, visualStartAngle, scaleMidAngle);
  const secondaryScalePath = describeArc(centerX, centerY, radius, scaleMidAngle, visualStartAngle + visualSweepAngle);
  const backgroundTrackPath = describeArc(centerX, centerY, radius, visualStartAngle, visualStartAngle + visualSweepAngle);

  // Static bar chart placeholder
  const barChartHeight = size * 0.15;
  const barChartY = size * 0.8;
  const numBars = 12;
  const barWidth = (size * 0.6) / numBars;
  const barSpacing = barWidth * 0.3;
  const barChartStartX = centerX - (numBars * (barWidth + barSpacing) - barSpacing) / 2;

  return (
    <div className="flex flex-col items-center p-2 md:p-4 rounded-lg shadow-md bg-card">
      <svg width={size} height={size * 1.05} viewBox={`0 0 ${size} ${size * 1.05}`}> {/* Adjusted height for bar chart */}
        {/* Background Track for the scale */}
        <path
          d={backgroundTrackPath}
          fill="none"
          className="gauge-scale-background"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Primary Color Scale Segment */}
        <path
          d={primaryScalePath}
          fill="none"
          className="gauge-scale-primary"
          strokeWidth={strokeWidth}
          strokeLinecap="butt" // Use butt for seamless connection
        />
        {/* Secondary Color Scale Segment */}
        <path
          d={secondaryScalePath}
          fill="none"
          className="gauge-scale-secondary"
          strokeWidth={strokeWidth}
          strokeLinecap="butt" // Use butt for seamless connection
        />

        {/* Value Arc (filled part) */}
        <path
          d={`M ${centerX + radius * Math.cos((visualStartAngle-90)*Math.PI/180)} ${centerY + radius * Math.sin((visualStartAngle-90)*Math.PI/180)}
              A ${radius} ${radius} 0 ${valueArcFillFraction * 360 > 180 ? 1 : 0} 1 
              ${centerX + radius * Math.cos((visualStartAngle + valueArcFillFraction * visualSweepAngle - 90)*Math.PI/180)} 
              ${centerY + radius * Math.sin((visualStartAngle + valueArcFillFraction * visualSweepAngle - 90)*Math.PI/180)}`}
          fill="none"
          className="gauge-value-arc"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.5s ease-out, stroke 0.5s ease-out',
          }}
        />
        
        {/* Tick Marks and Labels */}
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
              className={`gauge-tick-label ${tick.isSecondary ? "gauge-tick-label-secondary" : "gauge-tick-label-primary"}`}
              fontSize={size * 0.065}
            >
              {tick.label}
            </text>
          </g>
        ))}

        {/* Unit Text (e.g., Mbps) - Above value, below hub */}
        <text
            x={centerX}
            y={centerY + size * 0.05} // Positioned below center
            textAnchor="middle"
            className="gauge-unit-text"
            fontSize={size * 0.08}
        >
            {unit}
        </text>

        {/* Value Text (e.g., 30.1) - Prominent, below unit */}
        <text
          x={centerX}
          y={centerY + size * 0.22} // Positioned further below center
          textAnchor="middle"
          className="gauge-main-value-text"
          fontSize={size * 0.16}
          fontWeight="bold"
        >
          {currentValue.toFixed(currentValue !== 0 && currentValue < 100 && !Number.isInteger(currentValue) ? 1 : 0)}
        </text>

        {/* Needle Base (Hub) - Outlined circle */}
        <circle 
            cx={centerX} 
            cy={centerY} 
            r={strokeWidth * 1.5} 
            className="gauge-hub-outline"
            strokeWidth={strokeWidth / 1.5} 
            fill="var(--card)" // Or a specific hub fill color
        />
        {/* Needle */}
        <line
          x1={centerX}
          y1={centerY}
          x2={centerX + (radius - strokeWidth*0.5) * Math.cos((rotateAngle - 90) * Math.PI / 180)}
          y2={centerY + (radius - strokeWidth*0.5) * Math.sin((rotateAngle - 90) * Math.PI / 180)}
          strokeWidth={strokeWidth / 1.5}
          className="gauge-needle"
          strokeLinecap="round"
          style={{
            transition: 'transform 0.5s ease-out',
          }}
        />
        
        {/* Static Bar Chart Placeholder */}
        <g className="static-sparkline">
          {Array.from({ length: numBars }).map((_, i) => {
            const barHeight = barChartHeight * (0.3 + Math.random() * 0.5); // Random height for placeholder
            return (
              <rect
                key={`bar-${i}`}
                x={barChartStartX + i * (barWidth + barSpacing)}
                y={barChartY + (barChartHeight - barHeight)}
                width={barWidth}
                height={barHeight}
                className="gauge-sparkline-bar"
              />
            );
          })}
        </g>

      </svg>
      <p className="mt-1 text-base md:text-lg font-medium text-foreground">{label}</p>
    </div>
  );
};

export default Gauge;

    