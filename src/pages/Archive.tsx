import { useMemo, useState } from "react";
import { useGameLifeStore } from "../state/store";
import { Day, QuestStatus } from "../state/types";

// Архів завершених днів і квестів (тільки для читання)
const Archive: React.FC = () => {
  const days = useGameLifeStore((s) => s.days);
  const quests = useGameLifeStore((s) => s.quests);

  const [statusFilter, setStatusFilter] = useState<QuestStatus | "all">(
    "all"
  );

  const finishedDays = useMemo(
    () =>
      Object.values(days)
        .filter((d) => d.status === "finished")
        .sort((a, b) => (a.date > b.date ? -1 : 1)),
    [days]
  );

  const archivedQuests = useMemo(
    () =>
      Object.values(quests).filter((q) =>
        statusFilter === "all" ? q.status !== "active" : q.status === statusFilter
      ),
    [quests, statusFilter]
  );

  return (
    <div className="gl-page">
      <div className="gl-page-header">
        <h1 className="gl-page-title">Архів</h1>
      </div>

      <div className="gl-card">
        <div className="gl-card-title">Завершені дні</div>
        {finishedDays.length === 0 ? (
          <p className="gl-muted">
            Архів днів поки що порожній. Завершуйте дні, щоб бачити історію.
          </p>
        ) : (
          <ul className="gl-list">
            {finishedDays.map((d: Day) => (
              <li key={d.id} className="gl-list-item">
                <div className="gl-list-main">
                  <div className="gl-list-title">{d.date}</div>
                  <div className="gl-list-meta">
                    <span>Енергія використана: {d.energyUsed}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="gl-card">
        <div className="gl-card-title-row">
          <span>Квести в архіві</span>
          <select
            className="gl-input gl-input-xs"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as QuestStatus | "all"
              )
            }
          >
            <option value="all">Усі, крім активних</option>
            <option value="completed">Виконані</option>
            <option value="failed">Провалені</option>
            <option value="archived">Заархівовані</option>
          </select>
        </div>
        {archivedQuests.length === 0 ? (
          <p className="gl-muted">Немає квестів для відображення.</p>
        ) : (
          <ul className="gl-list">
            {archivedQuests.map((q) => (
              <li key={q.id} className="gl-list-item">
                <div className="gl-list-main">
                  <div className="gl-list-title">{q.title}</div>
                  <div className="gl-list-meta">
                    <span>Дата: {q.plannedDate}</span>
                    <span>Статус: {translateStatus(q.status)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="gl-hint">
        Архів є лише для читання — минулі дні та квести не можна змінювати, щоб
        історія залишалась чесною.
      </p>
    </div>
  );
};

const translateStatus = (s: QuestStatus): string => {
  switch (s) {
    case "planned":
      return "Заплановано";
    case "active":
      return "Активний";
    case "completed":
      return "Виконано";
    case "failed":
      return "Провалено";
    case "archived":
      return "В архіві";
  }
};

export default Archive;

