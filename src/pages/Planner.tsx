import { FormEvent, useState } from "react";
import { addDays, format } from "date-fns";
import { useGameLifeStore } from "../state/store";
import { Quest, QuestCategory } from "../state/types";
import { getDateKey } from "../state/time";

// Екран планера: сьогодні / завтра / майбутнє
const Planner: React.FC = () => {
  const createQuest = useGameLifeStore((s) => s.createQuest);
  const questsForDate = useGameLifeStore((s) => s.getQuestsForDate);

  const todayKey = getDateKey();
  const tomorrowKey = getDateKey(addDays(new Date(), 1));

  const [plannedDate, setPlannedDate] = useState<string>(tomorrowKey);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<QuestCategory>("daily");

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createQuest({
      title: title.trim(),
      description: undefined,
      category,
      plannedDate,
      energyCost: 15,
      rewards: { focus: 4, discipline: 3 }
    });
    setTitle("");
  };

  const todayQuests = questsForDate(todayKey);
  const tomorrowQuests = questsForDate(tomorrowKey);
  const futureQuests = Object.values(
    useGameLifeStore.getState().quests
  ).filter(
    (q) => q.plannedDate > tomorrowKey && q.status === "planned"
  );

  const renderList = (quests: Quest[]) =>
    quests.length === 0 ? (
      <p className="gl-muted">Нічого не заплановано.</p>
    ) : (
      <ul className="gl-list">
        {quests.map((q) => (
          <li key={q.id} className="gl-list-item">
            <div className="gl-list-main">
              <div className="gl-list-title">{q.title}</div>
              {q.description && (
                <div className="gl-list-sub">{q.description}</div>
              )}
              <div className="gl-list-meta">
                <span>
                  На дату:{" "}
                  {format(new Date(q.plannedDate), "dd.MM.yyyy")}
                </span>
                <span>Тип: {translateCategory(q.category)}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    );

  return (
    <div className="gl-page">
      <div className="gl-page-header">
        <h1 className="gl-page-title">Планер</h1>
      </div>

      <div className="gl-card">
        <div className="gl-card-title">Запланувати новий квест</div>
        <form className="gl-form" onSubmit={handleCreate}>
          <label className="gl-form-label">
            Назва
            <input
              className="gl-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Наприклад: фокусна сесія 90 хв"
            />
          </label>
          <label className="gl-form-label">
            Дата
            <input
              type="date"
              className="gl-input"
              value={plannedDate}
              onChange={(e) => setPlannedDate(e.target.value)}
            />
          </label>
          <label className="gl-form-label">
            Тип квесту
            <select
              className="gl-input"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as QuestCategory)
              }
            >
              <option value="daily">Щоденний</option>
              <option value="main">Головний (проєкт)</option>
              <option value="side">Побічний</option>
              <option value="habit">Звичка</option>
            </select>
          </label>
          <button className="gl-btn gl-btn-primary" type="submit">
            Додати в план
          </button>
        </form>
      </div>

      <div className="gl-card">
        <div className="gl-card-title">Сьогодні</div>
        {renderList(todayQuests)}
      </div>

      <div className="gl-card">
        <div className="gl-card-title">Завтра</div>
        {renderList(tomorrowQuests)}
      </div>

      <div className="gl-card">
        <div className="gl-card-title">Майбутні дні</div>
        {renderList(futureQuests)}
      </div>
    </div>
  );
};

const translateCategory = (c: QuestCategory): string => {
  switch (c) {
    case "daily":
      return "Щоденний";
    case "main":
      return "Головний";
    case "side":
      return "Побічний";
    case "habit":
      return "Звичка";
  }
};

export default Planner;

