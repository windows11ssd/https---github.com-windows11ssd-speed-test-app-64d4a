
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
  const [sparklineBarRandomFactors, setSparklineBarRandomFactors] = useState<number[]>([]);

  const visualStartAngle = 150; 
  const visualSweepAngle = 240; 

  const internalNeedleInitialRotation = visualStartAngle - 270;
  // Path transform rotation: Not strictly needed if describing arcs from center with start/end angles
  // const internalPathTransformRotation = visualStartAngle - 540 + visualSweepAngle; 

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

  // Static bar chart placeholder - moved random factor generation to useEffect
  const barChartHeight = size * 0.15;
  const numBars = 12;

  useEffect(() => {
    // Generate random factors for bar heights only on the client, after mount
    const factors = Array.from({ length: numBars }).map(() => 0.3 + Math.random() * 0.5);
    setSparklineBarRandomFactors(factors);
  }, [numBars]); // numBars is constant, so this runs once on mount


  const radius = (size - strokeWidth * 4) / 2; 
  const circumference = 2 * Math.PI * radius; // Not directly used for dashoffset with new arc method
  const percentage = Math.min(Math.max(currentValue / maxValue, 0), 1);

  const valueArcFillFraction = percentage * (visualSweepAngle / 360);
  // const valueArcDashoffset = circumference * (1 - valueArcFillFraction); // Not used with current arc path
  const rotateAngle = internalNeedleInitialRotation + percentage * visualSweepAngle;

  const centerX = size / 2;
  const centerY = size / 2;

  // Tick configuration
  const numMajorTicks = 5; 
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
    const labelY = centerY + (radius + labelOffset) * Math.sin((tickAngle - 90) * Math.PI / 180) + (size * 0.02); 

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
    const largeArcFlag = endAng - startAng <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  const scaleMidAngle = visualStartAngle + (visualSweepAngle / 2);
  const primaryScalePath = describeArc(centerX, centerY, radius, visualStartAngle, scaleMidAngle);
  const secondaryScalePath = describeArc(centerX, centerY, radius, scaleMidAngle, visualStartAngle + visualSweepAngle);
  const backgroundTrackPath = describeArc(centerX, centerY, radius, visualStartAngle, visualStartAngle + visualSweepAngle);
  
  const valueArcPath = describeArc(
    centerX, 
    centerY, 
    radius, 
    visualStartAngle, 
    visualStartAngle + valueArcFillFraction * visualSweepAngle
  );


  const barWidth = (size * 0.6) / numBars;
  const barSpacing = barWidth * 0.3;
  const barChartStartX = centerX - (numBars * (barWidth + barSpacing) - barSpacing) / 2;
  const barChartY = size * 0.8;


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

        {/* Value Arc (filled part) */}
        {currentValue > 0 && ( // Only render if there's a value to show
            <path
            d={valueArcPath}
            fill="none"
            className="gauge-value-arc"
            strokeWidth={strokeWidth}
            strokeLinecap="round" // Can be butt if preferred for exact end
            style={{
                transition: 'd 0.5s ease-out, stroke 0.5s ease-out', // Animate path 'd' attribute
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
          x2={centerX + (radius - strokeWidth*0.5) * Math.cos((rotateAngle - 90) * Math.PI / 180)}
          y2={centerY + (radius - strokeWidth*0.5) * Math.sin((rotateAngle - 90) * Math.PI / 180)}
          strokeWidth={strokeWidth / 1.5}
          className="gauge-needle"
          strokeLinecap="round"
          style={{
            transformOrigin: `${centerX}px ${centerY}px`, // Ensure rotation is around the center
            transform: `rotate(${rotateAngle - internalNeedleInitialRotation}deg)`, // Apply rotation via transform
            transition: 'transform 0.5s ease-out',
          }}
        />
        
        <g className="static-sparkline">
          {Array.from({ length: numBars }).map((_, i) => {
            // Use a default factor if sparklineBarRandomFactors is not yet populated (SSR or initial client render)
            const randomFactor = sparklineBarRandomFactors.length > 0 ? sparklineBarRandomFactors[i] : 0.5;
            const barHeightValue = barChartHeight * randomFactor;
            return (
              <rect
                key={`bar-${i}`}
                x={barChartStartX + i * (barWidth + barSpacing)}
                y={barChartY + (barChartHeight - barHeightValue)}
                width={barWidth}
                height={barHeightValue}
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
