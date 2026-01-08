import { useMemo } from "react";
import { format } from "date-fns";
import { useGameLifeStore } from "../state/store";
import { Day, DailyStats } from "../state/types";
import { getDateKey } from "../state/time";

interface MorningViewProps {
  previousDay: Day;
  onClose: () => void;
}

export const MorningView: React.FC<MorningViewProps> = ({ previousDay, onClose }) => {
  const quests = useGameLifeStore((s) => s.quests);
  const profile = useGameLifeStore((s) => s.profile);

  // Статистика попереднього дня
  const dayStats = useMemo(() => {
    if (!previousDay.endStats || !previousDay.startStats) return null;

    const completed = Object.values(quests).filter(
      (q) => q.plannedDate === previousDay.date && q.status === "completed"
    ).length;
    const failed = Object.values(quests).filter(
      (q) => q.plannedDate === previousDay.date && q.status === "failed"
    ).length;

    const statChanges: Partial<Record<keyof DailyStats, { from: number; to: number; diff: number }>> = {};
    const statKeys: (keyof DailyStats)[] = ["mood", "money", "energy", "motivation", "stress", "momentum", "sleepHours"];
    
    statKeys.forEach((key) => {
      const from = previousDay.startStats[key];
      const to = previousDay.endStats![key];
      statChanges[key] = { from, to, diff: to - from };
    });

    return {
      completed,
      failed,
      statChanges,
      xpGained: previousDay.xpGained || 0,
      diamondsEarned: previousDay.diamondsEarned || 0
    };
  }, [previousDay, quests]);

  if (!dayStats) return null;

  const statLabels: Record<keyof DailyStats, string> = {
    mood: "Настрій",
    money: "Гроші ($)",
    energy: "Енергія",
    motivation: "Мотивація",
    stress: "Стрес",
    momentum: "Імпульс",
    sleepHours: "Години сну"
  };

  return (
    <div className="gl-morning-view-overlay">
      <div className="gl-morning-view">
        <div className="gl-morning-view-header">
          <h2>Статистика вчорашнього дня</h2>
          <p>{format(new Date(previousDay.date), "dd.MM.yyyy")}</p>
        </div>

        <div className="gl-morning-view-stats">
          <div className="gl-morning-stat-card">
            <div className="gl-morning-stat-label">Виконано квестів</div>
            <div className="gl-morning-stat-value gl-positive">{dayStats.completed}</div>
          </div>
          <div className="gl-morning-stat-card">
            <div className="gl-morning-stat-label">Провалено квестів</div>
            <div className="gl-morning-stat-value gl-negative">{dayStats.failed}</div>
          </div>
          <div className="gl-morning-stat-card">
            <div className="gl-morning-stat-label">XP отримано</div>
            <div className="gl-morning-stat-value gl-positive">+{dayStats.xpGained}</div>
          </div>
          <div className="gl-morning-stat-card">
            <div className="gl-morning-stat-label">Діаманти отримано</div>
            <div className="gl-morning-stat-value gl-positive">+{dayStats.diamondsEarned}</div>
          </div>
        </div>

        <div className="gl-morning-view-changes">
          <h3>Зміни характеристик</h3>
          <div className="gl-stat-changes-list">
            {Object.entries(dayStats.statChanges).map(([key, change]) => (
              <div key={key} className="gl-stat-change-item">
                <span className="gl-stat-change-label">{statLabels[key as keyof DailyStats]}</span>
                <span className={`gl-stat-change-value ${change.diff >= 0 ? "gl-positive" : "gl-negative"}`}>
                  {change.diff >= 0 ? "+" : ""}{change.diff.toFixed(1)}
                </span>
                <span className="gl-stat-change-range">
                  {change.from.toFixed(1)} → {change.to.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button 
          className="gl-btn gl-btn-primary gl-btn-large" 
          onClick={() => {
            onClose();
            // Викликаємо handleOpenStart через setTimeout, щоб MorningView встиг закритись
            setTimeout(() => {
              const event = new CustomEvent('openStartDayModal');
              window.dispatchEvent(event);
            }, 100);
          }}
        >
          Почати новий день
        </button>
      </div>
    </div>
  );
};
