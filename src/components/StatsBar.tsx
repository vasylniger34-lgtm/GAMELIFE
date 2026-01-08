import { useGameLifeStore } from "../state/store";

// Відображення всіх 7 основних статів у вигляді горизонтальних барів
export const StatsBar: React.FC = () => {
  const stats = useGameLifeStore((s) => s.currentStats);

  const statItems = [
    { key: "mood" as const, label: "Настрій", color: "#22c55e" },
    { key: "energy" as const, label: "Енергія", color: "#38bdf8" },
    { key: "motivation" as const, label: "Мотивація", color: "#f97316" },
    { key: "stress" as const, label: "Стрес", color: "#ef4444" },
    { key: "momentum" as const, label: "Імпульс", color: "#a855f7" }
  ] as const;

  return (
    <div className="gl-card">
      <div className="gl-card-title">Поточні стати</div>
      <div className="gl-stats-grid">
        {statItems.map((sItem) => {
          const value = stats[sItem.key];
          const maxValue = 100;
          return (
            <div key={sItem.key} className="gl-stat-row">
              <div className="gl-stat-label">
                {sItem.label} <span className="gl-stat-value">{value}</span>
              </div>
              <div className="gl-stat-bar">
                <div
                  className="gl-stat-bar-fill"
                  style={{
                    width: `${value}%`,
                    background: sItem.color
                  }}
                />
              </div>
            </div>
          );
        })}
        <div className="gl-stat-row">
          <div className="gl-stat-label">
            Гроші ($){" "}
            <span className="gl-stat-value">
              {stats.money.toLocaleString("uk-UA")}
            </span>
          </div>
        </div>
        <div className="gl-stat-row">
          <div className="gl-stat-label">
            Години сну{" "}
            <span className="gl-stat-value">
              {stats.sleepHours.toFixed(1)} год
            </span>
          </div>
          <div className="gl-stat-bar">
            <div
              className="gl-stat-bar-fill"
              style={{
                width: `${(stats.sleepHours / 12) * 100}%`,
                background: "#8b5cf6"
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
