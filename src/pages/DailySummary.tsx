import { useGameLifeStore } from "../state/store";
import { Day } from "../state/types";

// Показує короткий підсумок останнього завершеного дня
const DailySummary: React.FC = () => {
  const days = useGameLifeStore((s) => s.days);

  const finishedDays = Object.values(days).filter(
    (d) => d.status === "finished"
  );
  const lastDay: Day | undefined = finishedDays.sort((a, b) =>
    a.date < b.date ? 1 : -1
  )[0];

  if (!lastDay) {
    return (
      <div className="gl-page">
        <div className="gl-page-header">
          <h1 className="gl-page-title">Щоденний підсумок</h1>
        </div>
        <p className="gl-muted">
          Поки що немає завершених днів. Завершіть хоча б один день, щоб
          побачити підсумок.
        </p>
      </div>
    );
  }

  const diff =
    lastDay.endStats &&
    (["energy", "focus", "discipline", "health", "money"] as const).map(
      (k) => ({
        key: k,
        start: lastDay.startStats[k],
        end: lastDay.endStats![k],
        delta: lastDay.endStats![k] - lastDay.startStats[k]
      })
    );

  return (
    <div className="gl-page">
      <div className="gl-page-header">
        <h1 className="gl-page-title">Щоденний підсумок</h1>
      </div>

      <div className="gl-card">
        <div className="gl-card-title">
          Дата: {lastDay.date} · Енергія використана: {lastDay.energyUsed}
        </div>
        {diff && (
          <ul className="gl-list">
            {diff.map((row) => (
              <li key={row.key} className="gl-list-item gl-summary-row">
                <div className="gl-list-main">
                  <div className="gl-list-title">
                    {translateStat(row.key)}
                  </div>
                  <div className="gl-list-meta">
                    <span>Було: {row.start}</span>
                    <span>Стало: {row.end}</span>
                    <span
                      className={
                        row.delta >= 0 ? "gl-positive" : "gl-negative"
                      }
                    >
                      {row.delta >= 0 ? "+" : ""}
                      {row.delta}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const translateStat = (
  k: "energy" | "focus" | "discipline" | "health" | "money"
): string => {
  switch (k) {
    case "energy":
      return "Енергія";
    case "focus":
      return "Фокус";
    case "discipline":
      return "Дисципліна";
    case "health":
      return "Здоровʼя";
    case "money":
      return "Гроші";
  }
};

export default DailySummary;

