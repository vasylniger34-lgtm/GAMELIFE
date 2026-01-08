import React, { useMemo } from "react";

interface StatSliderProps {
  label: string;
  icon: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  allowNegative?: boolean;
}

export const StatSlider: React.FC<StatSliderProps> = ({
  label,
  icon,
  value,
  onChange,
  min = -100,
  max = 100,
  step = 1,
  allowNegative = true
}) => {
  const actualMin = allowNegative ? min : 0;
  const displayValue = value || 0;
  
  // Розраховуємо позицію та ширину для заповнення
  const range = max - actualMin;
  const normalizedValue = displayValue - actualMin;
  const thumbPosition = (normalizedValue / range) * 100; // Позиція thumb від 0 до 100%
  
  // Для заповнення: від центру (0) до поточної позиції
  const isNegative = displayValue < 0;
  const isPositive = displayValue > 0;
  const isZero = displayValue === 0;
  
  // Заповнення має йти від центру (50%) до поточної позиції
  let fillLeft = "50%";
  let fillWidth = "0%";
  
  if (isNegative) {
    // Для від'ємних: заповнення від центру вліво (справа наліво)
    // thumbPosition < 50, тому fillLeft = thumbPosition, fillWidth = 50 - thumbPosition
    fillLeft = `${thumbPosition}%`;
    fillWidth = `${50 - thumbPosition}%`;
  } else if (isPositive) {
    // Для додатних: заповнення від центру вправо (зліва направо)
    // thumbPosition > 50, тому fillLeft = 50%, fillWidth = thumbPosition - 50
    fillLeft = "50%";
    fillWidth = `${thumbPosition - 50}%`;
  }

  // Генеруємо позначки (tick marks) для значень 10, 20, 30, 40, -10, -20, -30, -40
  // Нуль не включаємо, оскільки він відображається як центральна лінія
  const tickMarks = useMemo(() => {
    const ticks: number[] = [];
    if (allowNegative) {
      // Від'ємні позначки
      for (let i = -40; i <= -10; i += 10) {
        if (i >= actualMin && i !== 0) ticks.push(i);
      }
    }
    // Додатні позначки
    for (let i = 10; i <= 40; i += 10) {
      if (i <= max && i !== 0) ticks.push(i);
    }
    return ticks;
  }, [actualMin, max, allowNegative]);

  return (
    <div className="gl-stat-slider">
      <div className="gl-stat-slider-header">
        <span className="gl-stat-slider-icon">{icon}</span>
        <span className="gl-stat-slider-label">{label}</span>
        <span className={`gl-stat-slider-value ${displayValue >= 0 ? "gl-positive" : "gl-negative"}`}>
          {displayValue > 0 ? "+" : ""}{displayValue}
        </span>
      </div>
      <div className="gl-stat-slider-container">
        <div className="gl-stat-slider-track">
          {/* Позначки (tick marks) */}
          {tickMarks.map((tick) => {
            const tickPosition = ((tick - actualMin) / range) * 100;
            return (
              <div
                key={tick}
                className="gl-stat-slider-tick"
                style={{ left: `${tickPosition}%` }}
              />
            );
          })}
          
          {/* Заповнення */}
          {!isZero && (
            <div
              className={`gl-stat-slider-fill ${isNegative ? "gl-stat-slider-fill-negative" : "gl-stat-slider-fill-positive"}`}
              style={{
                left: fillLeft,
                width: fillWidth
              }}
            />
          )}
          
          {/* Центральна лінія (нуль) */}
          <div className="gl-stat-slider-center-line" />
          
          {/* Thumb (точечка) */}
          <div
            className="gl-stat-slider-thumb"
            style={{ left: `${thumbPosition}%` }}
          />
        </div>
        <input
          type="range"
          className="gl-stat-slider-input"
          min={actualMin}
          max={max}
          step={step}
          value={displayValue}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
};
