import { useMemo } from "react";
import { useGameLifeStore } from "../state/store";
import { format } from "date-fns";
import { QuickActionHistory } from "../state/types";

// v1.1: Архів швидких дій
const QuickActionArchive: React.FC = () => {
  const history = useGameLifeStore((s) => s.getQuickActionHistory());

  // Групуємо по датах
  const groupedByDate = useMemo(() => {
    const groups: Record<string, QuickActionHistory[]> = {};
    history.forEach((entry) => {
      if (!groups[entry.date]) {
        groups[entry.date] = [];
      }
      groups[entry.date].push(entry);
    });
    return groups;
  }, [history]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));
  }, [groupedByDate]);

  const totalCount = history.length;

  return (
    <div className="gl-page">
      <div className="gl-page-header">
        <h1 className="gl-page-title">Архів швидких дій</h1>
        <div className="gl-stats-summary">
          <div className="gl-stat-card">
            <div className="gl-stat-value">{totalCount}</div>
            <div className="gl-stat-label">виконано швидких дій за весь час</div>
          </div>
        </div>
      </div>

      <div className="gl-card">
        {sortedDates.length === 0 ? (
          <p className="gl-muted">Поки що немає виконаних швидких дій.</p>
        ) : (
          <div className="gl-archive-list">
            {sortedDates.map((date) => {
              const entries = groupedByDate[date];
              const formattedDate = format(new Date(date + "T00:00:00"), "dd.MM.yyyy");
              
              return (
                <div key={date} className="gl-archive-date-group">
                  <h3 className="gl-archive-date-title">{formattedDate}</h3>
                  <ul className="gl-list">
                    {entries.map((entry) => (
                      <li key={entry.id} className="gl-list-item">
                        <div className="gl-list-main">
                          <div className="gl-list-title">{entry.quickActionName}</div>
                          <div className="gl-list-meta">
                            <span>{format(new Date(entry.executedAt), "HH:mm")}</span>
                            {Object.entries(entry.effect)
                              .filter(([_, v]) => v !== 0)
                              .map(([k, v]) => {
                                const label = k === "mood" ? "Настрій" :
                                  k === "energy" ? "Енергія" :
                                  k === "motivation" ? "Мотивація" :
                                  k === "stress" ? "Стрес" :
                                  k === "momentum" ? "Імпульс" : k;
                                return (
                                  <span key={k}>
                                    {label}: {v > 0 ? "+" : ""}{v}
                                  </span>
                                );
                              })}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickActionArchive;
