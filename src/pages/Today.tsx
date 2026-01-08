import { FormEvent, useMemo, useState } from "react";
import { format } from "date-fns";
import { useGameLifeStore } from "../state/store";
import { Quest, QuestCategory, Stats } from "../state/types";
import { getDateKey } from "../state/time";

// Екран "Квести": створення та виконання квестів для поточного дня
const Today: React.FC = () => {
  const todayKey = getDateKey();
  const todayQuests = useGameLifeStore((s) => s.getTodayQuests());
  const completeQuest = useGameLifeStore((s) => s.completeQuest);
  const failQuest = useGameLifeStore((s) => s.failQuest);
  const createQuest = useGameLifeStore((s) => s.createQuest);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<QuestCategory>("daily");
  const [energyCost, setEnergyCost] = useState(10);
  const [description, setDescription] = useState("");
  const [rewards, setRewards] = useState<Partial<Stats>>({
    focus: 3,
    discipline: 2,
    money: 10
  });

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createQuest({
      title: title.trim(),
      category,
      plannedDate: todayKey,
      description: description.trim() || undefined,
      energyCost,
      rewards,
      penalties: { discipline: 2 }
    });
    setTitle("");
    setDescription("");
  };

  const grouped = useMemo(() => {
    const byCat: Record<QuestCategory, Quest[]> = {
      daily: [],
      main: [],
      side: [],
      habit: []
    };
    todayQuests.forEach((q) => byCat[q.category].push(q));
    return byCat;
  }, [todayQuests]);

  const renderList = (quests: Quest[]) =>
    quests.length === 0 ? (
      <p className="gl-muted">Поки що немає квестів цього типу.</p>
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
                <span>Вартість: {q.energyCost} енергії</span>
                <span>
                  Створено:{" "}
                  {format(new Date(q.createdAt), "dd.MM HH:mm")}
                </span>
              </div>
            </div>
            <div className="gl-list-actions">
              <button
                className="gl-btn gl-btn-xs gl-btn-success"
                onClick={() => completeQuest(q.id)}
              >
                Виконано
              </button>
              <button
                className="gl-btn gl-btn-xs gl-btn-danger"
                onClick={() => failQuest(q.id)}
              >
                Провалено
              </button>
            </div>
          </li>
        ))}
      </ul>
    );

  return (
    <div className="gl-page">
      <div className="gl-page-header">
        <h1 className="gl-page-title">Сьогодні</h1>
      </div>

      <div className="gl-card">
        <div className="gl-card-title">Додати квест на сьогодні</div>
        <form className="gl-form" onSubmit={handleCreate}>
          <label className="gl-form-label">
            Назва
            <input
              className="gl-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Наприклад: 30 хвилин читання"
            />
          </label>
          <label className="gl-form-label">
            Опис
            <textarea
              className="gl-input gl-input-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Коротко опиши, що саме потрібно зробити"
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
              <option value="main">Головний</option>
              <option value="side">Побічний</option>
              <option value="habit">Звичка</option>
            </select>
          </label>
          <label className="gl-form-label">
            Вартість енергії
            <input
              type="number"
              min={1}
              max={50}
              className="gl-input"
              value={energyCost}
              onChange={(e) =>
                setEnergyCost(Number(e.target.value) || 1)
              }
            />
          </label>
          <div className="gl-form-label">
            Винагороди
            <div className="gl-rewards-grid">
              <label>
                Фокус (+)
                <input
                  type="number"
                  min={0}
                  max={30}
                  className="gl-input"
                  value={rewards.focus ?? 0}
                  onChange={(e) =>
                    setRewards((r) => ({
                      ...r,
                      focus: Number(e.target.value) || 0
                    }))
                  }
                />
              </label>
              <label>
                Дисципліна (+)
                <input
                  type="number"
                  min={0}
                  max={30}
                  className="gl-input"
                  value={rewards.discipline ?? 0}
                  onChange={(e) =>
                    setRewards((r) => ({
                      ...r,
                      discipline: Number(e.target.value) || 0
                    }))
                  }
                />
              </label>
              <label>
                Здоровʼя (+)
                <input
                  type="number"
                  min={0}
                  max={30}
                  className="gl-input"
                  value={rewards.health ?? 0}
                  onChange={(e) =>
                    setRewards((r) => ({
                      ...r,
                      health: Number(e.target.value) || 0
                    }))
                  }
                />
              </label>
              <label>
                Валюта (+₴)
                <input
                  type="number"
                  min={0}
                  max={500}
                  className="gl-input"
                  value={rewards.money ?? 0}
                  onChange={(e) =>
                    setRewards((r) => ({
                      ...r,
                      money: Number(e.target.value) || 0
                    }))
                  }
                />
              </label>
            </div>
          </div>
          <button className="gl-btn gl-btn-primary" type="submit">
            Зберегти квест
          </button>
        </form>
      </div>

      <div className="gl-card">
        <div className="gl-card-title">Щоденні</div>
        {renderList(grouped.daily)}
      </div>
      <div className="gl-card">
        <div className="gl-card-title">Головні</div>
        {renderList(grouped.main)}
      </div>
      <div className="gl-card">
        <div className="gl-card-title">Побічні</div>
        {renderList(grouped.side)}
      </div>
      <div className="gl-card">
        <div className="gl-card-title">Звички</div>
        {renderList(grouped.habit)}
      </div>
    </div>
  );
};

export default Today;

