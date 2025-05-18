
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
  size = 180, // Default size adjusted to better fit multiple gauges
  strokeWidth = 8,
}) => {
  const [currentValue, setCurrentValue] = useState(0);

  const visualStartAngle = 150; // Starts from 5 o'clock position
  const visualSweepAngle = 240; // Sweeps 240 degrees to 1 o'clock position

  const internalNeedleInitialRotation = visualStartAngle - 270; // Adjust needle start based on visual arc

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

  const numMajorTicks = 5; // e.g., 0, 25, 50, 75, 100 for maxValue=100
  const majorTickLength = strokeWidth * 1.5;
  const labelOffset = strokeWidth * 2.5; // Distance of labels from the arc
  const scaleColorSplitValue = maxValue / 2; // Value at which the scale color changes

  // Adjusted radius calculation to ensure labels fit
  const calculatedRadius = ((size / 2) * 0.90) - labelOffset;
  const radius = Math.max(10, calculatedRadius);


  const percentage = Math.min(Math.max(currentValue / maxValue, 0), 1);
  const needleRotationAngle = internalNeedleInitialRotation + percentage * visualSweepAngle;


  const majorTicks = Array.from({ length: numMajorTicks + 1 }).map((_, i) => {
    const tickValue = (maxValue / numMajorTicks) * i;
    const tickPercentage = tickValue / maxValue;
    const tickAngle = visualStartAngle + tickPercentage * visualSweepAngle;
    const isOnSecondaryColor = tickValue > scaleColorSplitValue;

    // Tick line coordinates
    const startX = centerX + (radius - majorTickLength / 2) * Math.cos((tickAngle - 90) * Math.PI / 180);
    const startY = centerY + (radius - majorTickLength / 2) * Math.sin((tickAngle - 90) * Math.PI / 180);
    const endX = centerX + (radius + majorTickLength / 2) * Math.cos((tickAngle - 90) * Math.PI / 180);
    const endY = centerY + (radius + majorTickLength / 2) * Math.sin((tickAngle - 90) * Math.PI / 180);

    // Tick label coordinates
    const labelRadius = radius + labelOffset;
    const labelX = centerX + labelRadius * Math.cos((tickAngle - 90) * Math.PI / 180);
    const labelY = centerY + labelRadius * Math.sin((tickAngle - 90) * Math.PI / 180);


    return {
      value: tickValue,
      label: tickValue.toFixed(0), // Simple numeric label
      startX, startY, endX, endY,
      labelX, labelY,
      angle: tickAngle,
      isSecondary: isOnSecondaryColor,
    };
  });

  // Helper to describe an SVG arc path
  const describeArc = (x: number, y: number, r: number, startAng: number, endAng: number) => {
    const start = {
      x: x + r * Math.cos((startAng - 90) * Math.PI / 180),
      y: y + r * Math.sin((startAng - 90) * Math.PI / 180),
    };
    const end = {
      x: x + r * Math.cos((endAng - 90) * Math.PI / 180),
      y: y + r * Math.sin((endAng - 90) * Math.PI / 180),
    };
    const arcSweep = endAng - startAng <= 0 ? 360 + endAng - startAng : endAng - startAng; // handles wrap-around
    const largeArcFlag = arcSweep <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  // Paths for the two-color scale
  const scaleMidAngle = visualStartAngle + (visualSweepAngle / 2);
  const primaryScalePath = describeArc(centerX, centerY, radius, visualStartAngle, scaleMidAngle);
  const secondaryScalePath = describeArc(centerX, centerY, radius, scaleMidAngle, visualStartAngle + visualSweepAngle);
  const backgroundTrackPath = describeArc(centerX, centerY, radius, visualStartAngle, visualStartAngle + visualSweepAngle);


  // Path for the value arc (animated)
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
      {/* Adjusted SVG height to accommodate the label below */}
      <svg width={size} height={size * 1.05} viewBox={`0 0 ${size} ${size * 1.05}`}>
        {/* Background track for the scale */}
        <path
          d={backgroundTrackPath}
          fill="none"
          className="gauge-scale-background"
          strokeWidth={strokeWidth}
          strokeLinecap="round" // Rounded ends for the background track
        />

        {/* Primary color part of the scale (e.g., blue) */}
        <path
          d={primaryScalePath}
          fill="none"
          className="gauge-scale-primary"
          strokeWidth={strokeWidth}
          strokeLinecap="butt" // Butt caps to meet cleanly with the secondary part
        />

        {/* Secondary color part of the scale (e.g., orange-red) */}
        <path
          d={secondaryScalePath}
          fill="none"
          className="gauge-scale-secondary"
          strokeWidth={strokeWidth}
          strokeLinecap="butt" // Butt caps
        />

        {/* Animated value arc */}
        {currentValue > 0 && ( // Only render if there's a value to show
            <path
            d={valueArcPath}
            fill="none"
            className="gauge-value-arc" // Uses needle color for the value arc
            strokeWidth={strokeWidth}
            strokeLinecap="round" // Rounded cap for the value arc
            style={{
                transition: 'd 0.5s ease-out, stroke 0.5s ease-out', // Smooth transition for path and color
            }}
            />
        )}

        {/* Major Ticks and Labels */}
        {majorTicks.map((tick) => (
          <g key={`tick-${tick.value}`}>
            <line
              x1={tick.startX}
              y1={tick.startY}
              x2={tick.endX}
              y2={tick.endY}
              strokeWidth={strokeWidth / 3} // Thinner ticks
              className={tick.isSecondary ? "gauge-tick-secondary" : "gauge-tick-primary"}
            />
            <text
              x={tick.labelX}
              y={tick.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className={`gauge-tick-label ${tick.isSecondary ? "gauge-tick-label-secondary" : "gauge-tick-label-primary"}`}
              fontSize={size * 0.065} // Responsive font size for labels
            >
              {tick.label}
            </text>
          </g>
        ))}

        {/* Unit Text (Mbps, ms) - Positioned below the hub, above value */}
        <text
            x={centerX}
            y={centerY + size * 0.18} // Adjusted position
            textAnchor="middle"
            className="gauge-unit-text"
            fontSize={size * 0.08} // Responsive font size
        >
            {unit}
        </text>

        {/* Main Value Text - Positioned below the unit text */}
        <text
          x={centerX}
          y={centerY + size * 0.30} // Adjusted position
          textAnchor="middle"
          className="gauge-main-value-text"
          fontSize={size * 0.16} // Larger, responsive font size
          fontWeight="bold"
        >
          {/* Format to 1 decimal place if value is not 0, less than 100 and not an integer, otherwise 0 decimal places */}
          {currentValue.toFixed(currentValue !== 0 && currentValue < 100 && !Number.isInteger(currentValue) ? 1 : 0)}
        </text>

        {/* Needle Hub */}
        <circle
            cx={centerX}
            cy={centerY}
            r={strokeWidth * 1.5} // Hub size relative to strokeWidth
            className="gauge-hub-outline" // Uses specific hub outline color
            strokeWidth={strokeWidth / 1.5} // Thinner outline for hub
            fill="hsl(var(--card))" // Hub fill to match card background
        />
        {/* Needle */}
        <line
          x1={centerX}
          y1={centerY}
          // Needle points slightly beyond the arc for better visual
          x2={centerX + (radius - strokeWidth*0.5) * Math.cos((needleRotationAngle - 90) * Math.PI / 180)}
          y2={centerY + (radius - strokeWidth*0.5) * Math.sin((needleRotationAngle - 90) * Math.PI / 180)}
          strokeWidth={strokeWidth / 1.5} // Needle thickness
          className="gauge-needle" // Uses specific needle color
          strokeLinecap="round" // Rounded end for the needle
          style={{
            transformOrigin: `${centerX}px ${centerY}px`, // Rotate around the center
            transition: 'x2 0.5s ease-out, y2 0.5s ease-out, stroke 0.5s ease-out', // Smooth animation
          }}
        />
      </svg>
      {/* Label below the gauge (Download, Upload, Ping) */}
      <p className="mt-1 text-base md:text-lg font-medium text-foreground">{label}</p>
    </div>
  );
};

export default Gauge;
