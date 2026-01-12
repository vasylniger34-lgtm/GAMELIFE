import { FormEvent, useMemo, useState, useEffect } from "react";
import { format } from "date-fns";
import { useGameLifeStore } from "../state/store";
import { Quest, QuestCategory, DailyStats, Habit, EpicQuest } from "../state/types";
import { getDateKey } from "../state/time";
import { StatSlider } from "../components/StatSlider";

// Екран "Квести": створення, планування та управління квестами (сьогодні + майбутні)
const Quests: React.FC = () => {
  const todayKey = getDateKey();
  const questsRecord = useGameLifeStore((s) => s.quests);
  
  // Мемоізуємо масив квестів
  const allQuests = useMemo(() => Object.values(questsRecord), [questsRecord]);
  const completeQuest = useGameLifeStore((s) => s.completeQuest);
  const executeQuest = useGameLifeStore((s) => s.executeQuest); // v1.1: Для постійних квестів
  const completeQuestEarly = useGameLifeStore((s) => s.completeQuestEarly);
  const failQuest = useGameLifeStore((s) => s.failQuest);
  const createQuest = useGameLifeStore((s) => s.createQuest);
  const setMainQuest = useGameLifeStore((s) => s.setMainQuest);
  const useSecondChance = useGameLifeStore((s) => s.useSecondChance);
  const diamonds = useGameLifeStore((s) => s.diamonds);
  const today = useGameLifeStore((s) => {
    const todayKey = getDateKey();
    return s.days[todayKey];
  });

  // v1.1: Вкладки для Quests/Habits/Epic Quest
  const [activeTab, setActiveTab] = useState<"quests" | "habits" | "epic">("quests");
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  
  // v1.1: Стан для Epic Quest
  const [showEpicQuestForm, setShowEpicQuestForm] = useState(false);
  const [epicQuestTitle, setEpicQuestTitle] = useState("");
  const [epicQuestDescription, setEpicQuestDescription] = useState("");
  const [epicQuestSteps, setEpicQuestSteps] = useState<Array<{ title: string; description: string }>>([
    { title: "", description: "" }
  ]);
  
  // v1.1: Стан для Habits
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [habitName, setHabitName] = useState("");
  const [habitDescription, setHabitDescription] = useState("");
  const [habitEffect, setHabitEffect] = useState<Habit["effect"]>({});
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<QuestCategory>("daily");
  const [description, setDescription] = useState("");
  const [plannedDate, setPlannedDate] = useState(todayKey);
  
  // Оновлюємо plannedDate при зміні todayKey
  useEffect(() => {
    setPlannedDate(todayKey);
  }, [todayKey]);
  const [rewards, setRewards] = useState<Quest["rewards"]>({
    stats: { mood: 5, motivation: 3 },
    xp: 10,
    diamonds: 5
  });
  const [penalties, setPenalties] = useState<Partial<DailyStats>>({
    motivation: -5
  });
  const [penaltyDiamonds, setPenaltyDiamonds] = useState<number>(0); // v1.1: Покарання діамантами
  const [failingQuestId, setFailingQuestId] = useState<string | null>(null); // v1.1: ID квесту, який провалюється
  const [failPenaltyDiamonds, setFailPenaltyDiamonds] = useState<number>(0); // v1.1: Покарання діамантами при провалі

  // Фільтруємо квести: активні/заплановані vs архівовані
  const activeQuests = useMemo(() => {
    if (showArchive) {
      return allQuests.filter((q) => q.status === "archived");
    }
    return allQuests.filter((q) => q.status !== "archived");
  }, [allQuests, showArchive]);

  // Групуємо за датами (v1.1: включаємо постійні квести без plannedDate)
  const groupedByDate = useMemo(() => {
    const groups: Record<string, Quest[]> = {};
    activeQuests.forEach((q) => {
      // v1.1: Постійні квести (без plannedDate) групуємо окремо
      const date = q.plannedDate || "permanent";
      if (!groups[date]) groups[date] = [];
      groups[date].push(q);
    });
    return groups;
  }, [activeQuests]);

  // Для архіву: підрахунок completed/failed по датах
  // Використовуємо finalStatus для точного визначення статусу перед архівуванням
  const archiveStatsByDate = useMemo(() => {
    if (!showArchive) return {};
    const stats: Record<string, { completed: number; failed: number }> = {};
    activeQuests.forEach((q) => {
      if (q.status !== "archived") return;
      const date = q.plannedDate;
      if (!date) return;
      if (!stats[date]) {
        stats[date] = { completed: 0, failed: 0 };
      }
      // Використовуємо finalStatus для точного визначення
      if (q.finalStatus === "completed") {
        stats[date].completed++;
      } else if (q.finalStatus === "failed") {
        stats[date].failed++;
      }
    });
    return stats;
  }, [activeQuests, showArchive]);

  const toggleDateExpansion = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createQuest({
      title: title.trim(),
      category,
      plannedDate: plannedDate || undefined, // v1.1: може бути порожнім для постійних квестів
      description: description.trim() || undefined,
      rewards,
      penalties: Object.keys(penalties).length > 0 ? penalties : undefined,
      penaltyDiamonds: penaltyDiamonds > 0 ? penaltyDiamonds : undefined // v1.1
    });
    setTitle("");
    setDescription("");
    setPlannedDate(todayKey);
    setPenaltyDiamonds(0);
    setShowAddForm(false);
  };

  const sortedDates = Object.keys(groupedByDate).sort();

  // v1.1: Отримуємо дані для Habits та Epic Quest
  const habits = useGameLifeStore((s) => s.habits);
  const habitHistory = useGameLifeStore((s) => s.getHabitHistory());
  const epicQuest = useGameLifeStore((s) => s.epicQuest);
  const createEpicQuest = useGameLifeStore((s) => s.createEpicQuest);
  const updateEpicQuest = useGameLifeStore((s) => s.updateEpicQuest);
  const completeEpicQuestStep = useGameLifeStore((s) => s.completeEpicQuestStep);
  const getEpicQuestProgress = useGameLifeStore((s) => s.getEpicQuestProgress);
  const resetEpicQuest = useGameLifeStore((s) => s.resetEpicQuest);
  const createHabit = useGameLifeStore((s) => s.createHabit);
  const updateHabit = useGameLifeStore((s) => s.updateHabit);
  const deleteHabit = useGameLifeStore((s) => s.deleteHabit);
  const executeHabit = useGameLifeStore((s) => s.executeHabit);

  return (
    <div className="gl-page">
      {/* v1.1: Вкладки для Quests/Habits/Epic Quest */}
      <div className="gl-tabs" style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", borderBottom: "1px solid var(--theme-card-border)" }}>
        <button
          className={`gl-btn ${activeTab === "quests" ? "gl-btn-primary" : "gl-btn-secondary"}`}
          onClick={() => setActiveTab("quests")}
          style={{ flex: 1 }}
        >
          Квести
        </button>
        <button
          className={`gl-btn ${activeTab === "habits" ? "gl-btn-primary" : "gl-btn-secondary"}`}
          onClick={() => setActiveTab("habits")}
          style={{ flex: 1 }}
        >
          Звички
        </button>
        <button
          className={`gl-btn ${activeTab === "epic" ? "gl-btn-primary" : "gl-btn-secondary"}`}
          onClick={() => setActiveTab("epic")}
          style={{ flex: 1 }}
        >
          Epic Quest
        </button>
      </div>

      {/* Вкладка Квести */}
      {activeTab === "quests" && (
        <>
      <div className="gl-page-header">
        <div className="gl-page-header-row">
          <button
            className="gl-btn gl-btn-icon"
            onClick={() => setShowArchive(!showArchive)}
            title={showArchive ? "Показати активні" : "Показати архів"}
          >
            {showArchive ? "📂" : "🗃️"}
          </button>
          <h1 className="gl-page-title">{showArchive ? "Архів квестів" : "Квести"}</h1>
          <button
            className="gl-btn gl-btn-icon"
            onClick={() => setShowAddForm(!showAddForm)}
            title="Додати квест"
          >
            +
          </button>
        </div>
      </div>

      {/* Форма додавання квесту */}
      {showAddForm && (
        <div className="gl-card">
          <div className="gl-card-title">Додати квест</div>
          <form className="gl-form" onSubmit={handleCreate}>
            <label className="gl-form-label">
              Назва
              <input
                className="gl-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Наприклад: 30 хвилин читання"
                required
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
                <option value="side">Побічний</option>
              </select>
            </label>
            <label className="gl-form-label">
              Запланована дата (залишити порожнім для постійного квесту)
              <input
                type="date"
                className="gl-input"
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                min={todayKey}
              />
              <small className="gl-hint" style={{ display: "block", marginTop: "0.25rem" }}>
                Якщо залишити порожнім, квест буде доступний завжди
              </small>
            </label>

            <div className="gl-form-section">
              <div className="gl-form-label">Винагороди</div>
              <div className="gl-rewards-grid">
                <StatSlider
                  label="Настрій"
                  icon="😊"
                  value={rewards.stats?.mood ?? 0}
                  onChange={(value) =>
                    setRewards({
                      ...rewards,
                      stats: { ...rewards.stats, mood: value }
                    })
                  }
                  min={-50}
                  max={50}
                />
                <StatSlider
                  label="Енергія"
                  icon="⚡"
                  value={rewards.stats?.energy ?? 0}
                  onChange={(value) =>
                    setRewards({
                      ...rewards,
                      stats: { ...rewards.stats, energy: value }
                    })
                  }
                  min={-50}
                  max={50}
                />
                <StatSlider
                  label="Мотивація"
                  icon="🔥"
                  value={rewards.stats?.motivation ?? 0}
                  onChange={(value) =>
                    setRewards({
                      ...rewards,
                      stats: { ...rewards.stats, motivation: value }
                    })
                  }
                  min={-50}
                  max={50}
                />
                <StatSlider
                  label="Стрес"
                  icon="⚠️"
                  value={rewards.stats?.stress ?? 0}
                  onChange={(value) =>
                    setRewards({
                      ...rewards,
                      stats: { ...rewards.stats, stress: value }
                    })
                  }
                  min={-50}
                  max={50}
                />
                <StatSlider
                  label="Імпульс"
                  icon="📈"
                  value={rewards.stats?.momentum ?? 0}
                  onChange={(value) =>
                    setRewards({
                      ...rewards,
                      stats: { ...rewards.stats, momentum: value }
                    })
                  }
                  min={-50}
                  max={50}
                />
                <StatSlider
                  label="Досвід (XP)"
                  icon="⭐"
                  value={rewards.xp ?? 0}
                  onChange={(value) =>
                    setRewards({
                      ...rewards,
                      xp: value
                    })
                  }
                  min={0}
                  max={100}
                  allowNegative={false}
                />
                <StatSlider
                  label="Діаманти"
                  icon="💎"
                  value={rewards.diamonds ?? 0}
                  onChange={(value) =>
                    setRewards({
                      ...rewards,
                      diamonds: value
                    })
                  }
                  min={0}
                  max={50}
                  allowNegative={false}
                />
              </div>
            </div>

            <div className="gl-form-section">
              <div className="gl-form-label">Штрафи (за невиконання)</div>
              <div className="gl-rewards-grid">
                <StatSlider
                  label="Мотивація"
                  icon="🔥"
                  value={penalties.motivation ?? 0}
                  onChange={(value) =>
                    setPenalties({
                      ...penalties,
                      motivation: value
                    })
                  }
                  min={-50}
                  max={0}
                />
                <StatSlider
                  label="Стрес"
                  icon="⚠️"
                  value={penalties.stress ?? 0}
                  onChange={(value) =>
                    setPenalties({
                      ...penalties,
                      stress: value
                    })
                  }
                  min={0}
                  max={50}
                  allowNegative={false}
                />
                {/* v1.1: Покарання діамантами */}
                <StatSlider
                  label="Покарання діамантами"
                  icon="💎"
                  value={penaltyDiamonds}
                  onChange={(value) => setPenaltyDiamonds(Math.abs(value))}
                  min={0}
                  max={100}
                  allowNegative={true}
                />
                <p className="gl-hint" style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--danger)" }}>
                  Діаманти будуть відніматись (мінус)
                </p>
              </div>
            </div>

            <div className="gl-card-actions">
              <button
                type="button"
                className="gl-btn gl-btn-secondary"
                onClick={() => setShowAddForm(false)}
              >
                Скасувати
              </button>
              <button className="gl-btn gl-btn-primary" type="submit">
                Зберегти квест
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Список квестів, згрупованих за датами */}
      {sortedDates.length === 0 ? (
        <div className="gl-card">
          <p className="gl-muted">
            {showArchive ? "Архів порожній." : "Поки що немає квестів. Додай перший квест!"}
          </p>
        </div>
      ) : (
        sortedDates.map((date) => {
          const quests = groupedByDate[date];
          const isToday = date === todayKey;
          const isPast = date < todayKey;
          const isExpanded = expandedDates.has(date);
          const stats = archiveStatsByDate[date] || { completed: 0, failed: 0 };
          
          // Для архіву показуємо заголовок з статистикою та можливістю розгорнути
          if (showArchive) {
            return (
              <div key={date} className="gl-card">
                <div 
                  className="gl-card-title gl-archive-header"
                  style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onClick={() => toggleDateExpansion(date)}
                >
                  <div>
                    {format(new Date(date), "dd.MM.yyyy")}
                    <span className="gl-muted" style={{ marginLeft: "0.5rem", fontSize: "0.8rem" }}>
                      ({stats.completed} виконано, {stats.failed} провалено)
                    </span>
                  </div>
                  <span>{isExpanded ? "▼" : "▶"}</span>
                </div>
                {isExpanded && (
                  <ul className="gl-list" style={{ marginTop: "0.5rem" }}>
                    {quests.map((q) => {
                      // Використовуємо finalStatus для точного визначення статусу
                      const wasCompleted = q.finalStatus === "completed";
                      const wasFailed = q.finalStatus === "failed";
                      return (
                        <li key={q.id} className="gl-list-item">
                          <div className="gl-list-main">
                            <div className="gl-list-title">
                              {q.title}
                              <span className={`gl-quest-badge gl-quest-badge-${q.category}`}>
                                {q.category === "daily" ? "Щоденний" : "Побічний"}
                              </span>
                              {wasCompleted && <span className="gl-badge gl-badge-success">✓ Виконано</span>}
                              {wasFailed && <span className="gl-badge gl-badge-danger">✗ Провалено</span>}
                            </div>
                            {q.description && (
                              <div className="gl-list-sub">{q.description}</div>
                            )}
                            <div className="gl-list-meta">
                              {wasCompleted && q.rewards.xp && <span>XP: +{q.rewards.xp}</span>}
                              {wasCompleted && q.rewards.diamonds && <span>💎: +{q.rewards.diamonds}</span>}
                              {wasFailed && q.penaltyDiamonds && q.penaltyDiamonds > 0 && (
                                <span className="gl-negative">💎: -{q.penaltyDiamonds}</span>
                              )}
                              {q.executedAt && (
                                <span>Дата: {format(new Date(q.executedAt), "dd.MM.yyyy HH:mm")}</span>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          }
          
          // Для активних квестів - звичайне відображення
          // v1.1: Обробка постійних квестів
          const isPermanent = date === "permanent";
          
          return (
            <div key={date} className="gl-card">
              <div className="gl-card-title">
                {isPermanent ? (
                  "Постійні квести"
                ) : isToday ? (
                  "Сьогодні"
                ) : isPast ? (
                  format(new Date(date), "dd.MM.yyyy")
                ) : (
                  format(new Date(date), "dd.MM.yyyy")
                )}
                {!isToday && !isPast && !isPermanent && <span className="gl-badge">Майбутнє</span>}
              </div>
              <ul className="gl-list">
                {quests.map((q) => (
                  <li key={q.id} className="gl-list-item">
                    <div className="gl-list-main">
                      <div className="gl-list-title">
                        {q.title}
                        <span className={`gl-quest-badge gl-quest-badge-${q.category}`}>
                          {q.category === "daily" ? "Щоденний" : "Побічний"}
                        </span>
                        {q.status === "completed" && <span className="gl-badge gl-badge-success">✓</span>}
                        {q.status === "failed" && <span className="gl-badge gl-badge-danger">✗</span>}
                      </div>
                      {q.description && (
                        <div className="gl-list-sub">{q.description}</div>
                      )}
                      <div className="gl-list-meta">
                        {q.isMainQuest && <span className="gl-badge gl-badge-warning">⭐ Головний</span>}
                        {q.rewards.xp && <span>XP: +{q.rewards.xp}</span>}
                        {q.rewards.diamonds && <span>💎: +{q.rewards.diamonds}</span>}
                        {q.status === "active" && <span>Активний</span>}
                        {q.status === "planned" && <span>Заплановано</span>}
                        {q.completedEarly && q.earlyCompletionDate && (
                          <span className="gl-badge gl-badge-info">
                            Виконано завчасно ({format(new Date(q.earlyCompletionDate + "T00:00:00"), "dd.MM.yyyy")})
                          </span>
                        )}
                      </div>
                    </div>
                    {/* v1.1: Галочка "Виконати завчасно" для майбутніх квестів */}
                    {/* v1.1: Показуємо "Виконати завчасно" тільки для майбутніх квестів (не сьогоднішніх) */}
                    {q.status === "planned" && q.plannedDate && q.plannedDate > todayKey && !q.completedEarly && (
                      <div className="gl-list-actions">
                        <button
                          className="gl-btn gl-btn-xs gl-btn-success"
                          onClick={() => completeQuestEarly(q.id)}
                          title="Виконати квест завчасно та отримати бонуси одразу"
                        >
                          ✓ Виконати завчасно
                        </button>
                      </div>
                    )}
                    {/* v1.1: Постійні квести (без plannedDate) - використовуємо executeQuest */}
                    {!q.plannedDate && q.status === "active" && (
                      <div className="gl-list-actions">
                        <button
                          className="gl-btn gl-btn-xs gl-btn-success"
                          onClick={() => executeQuest(q.id)}
                          title="Виконати квест та отримати бонуси (квест залишиться доступним)"
                        >
                          Виконати
                        </button>
                      </div>
                    )}
                    {/* Звичайні квести з датою */}
                    {/* v1.1: Показуємо кнопки для активних квестів або квестів на сьогодні (plannedDate === todayKey) */}
                    {q.plannedDate && (q.status === "active" || (q.status === "planned" && q.plannedDate === todayKey)) && (
                      <div className="gl-list-actions">
                        {/* Кнопка вибору головного квесту - показуємо на всіх активних квестах */}
                        {today && today.status === "active" && (
                          <button
                            className={`gl-btn gl-btn-xs gl-btn-icon ${q.isMainQuest ? "gl-btn-primary" : "gl-btn-secondary"}`}
                            onClick={() => setMainQuest(q.id)}
                            title={q.isMainQuest ? "Зняти з головного квесту" : "Зробити головним"}
                          >
                            {q.isMainQuest ? "⭐" : "☆"}
                          </button>
                        )}
                        <button
                          className="gl-btn gl-btn-xs gl-btn-success"
                          onClick={() => completeQuest(q.id)}
                        >
                          Виконано
                        </button>
                        <button
                          className="gl-btn gl-btn-xs gl-btn-danger"
                          onClick={() => {
                            // v1.1: Показуємо модальне вікно для вказання покарання діамантами
                            setFailingQuestId(q.id);
                            setFailPenaltyDiamonds(q.penaltyDiamonds || 0);
                          }}
                        >
                          Провалено
                        </button>
                      </div>
                    )}
                    {/* Другий шанс для провалених квестів - тільки один раз на день */}
                    {q.status === "failed" && !today?.secondChanceUsed && today && today.status === "active" && (
                      <div className="gl-list-actions">
                        <button
                          className="gl-btn gl-btn-xs gl-btn-warning"
                          onClick={() => useSecondChance(q.id)}
                          disabled={diamonds < 10}
                          title="Другий шанс за 10 діамантів (тільки один раз на день)"
                        >
                          Другий шанс (💎 10)
                        </button>
                      </div>
                    )}
                    {/* Показуємо, якщо другий шанс вже використано сьогодні */}
                    {q.status === "failed" && today?.secondChanceUsed && (
                      <div className="gl-list-meta">
                        <span className="gl-muted">Другий шанс вже використано сьогодні</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })
      )}

      {/* v1.1: Модальне вікно для покарання діамантами при провалі квесту */}
      {failingQuestId && (
        <div className="gl-modal-backdrop" onClick={() => setFailingQuestId(null)}>
          <div className="gl-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="gl-modal-title">Провалити квест</h2>
            <p style={{ marginBottom: "1rem", color: "var(--muted)" }}>Вкажи покарання діамантами за невиконання квесту:</p>
            <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
              <StatSlider
                label="Покарання діамантами"
                icon="💎"
                value={failPenaltyDiamonds}
                onChange={(value) => setFailPenaltyDiamonds(Math.abs(value))}
                min={0}
                max={Math.min(100, diamonds)}
                allowNegative={false}
              />
              {failPenaltyDiamonds > 0 && (
                <div style={{ marginTop: "0.75rem", padding: "0.75rem", background: "rgba(249, 115, 115, 0.1)", borderRadius: "0.5rem", border: "1px solid rgba(249, 115, 115, 0.3)" }}>
                  <p style={{ fontSize: "0.9rem", color: "var(--danger)", fontWeight: "600", margin: 0 }}>
                    💎 -{failPenaltyDiamonds} діамантів
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: "0.25rem 0 0 0" }}>
                    Поточний баланс: {diamonds} 💎 → Буде: {Math.max(0, diamonds - failPenaltyDiamonds)} 💎
                  </p>
                </div>
              )}
            </div>
            <div className="gl-card-actions">
              <button
                className="gl-btn gl-btn-secondary"
                onClick={() => {
                  setFailingQuestId(null);
                  setFailPenaltyDiamonds(0);
                }}
              >
                Скасувати
              </button>
              <button
                className="gl-btn gl-btn-danger"
                onClick={() => {
                  failQuest(failingQuestId, failPenaltyDiamonds);
                  setFailingQuestId(null);
                  setFailPenaltyDiamonds(0);
                }}
              >
                Провалити
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Вкладка Звички */}
      {activeTab === "habits" && (
        <div>
          <div className="gl-page-header">
            <div className="gl-page-header-row">
              <h1 className="gl-page-title">Звички</h1>
              <button
                className="gl-btn gl-btn-icon"
                onClick={() => setShowHabitForm(!showHabitForm)}
                title="Додати звичку"
              >
                +
              </button>
            </div>
          </div>

          {/* Форма створення/редагування звички */}
          {showHabitForm && (
            <div className="gl-card">
              <div className="gl-card-title">Додати звичку</div>
              <form className="gl-form" onSubmit={(e) => {
                e.preventDefault();
                if (!habitName.trim()) return;
                createHabit({
                  name: habitName.trim(),
                  description: habitDescription.trim() || undefined,
                  effect: habitEffect
                });
                setHabitName("");
                setHabitDescription("");
                setHabitEffect({});
                setShowHabitForm(false);
              }}>
                <label className="gl-form-label">
                  Назва
                  <input
                    className="gl-input"
                    value={habitName}
                    onChange={(e) => setHabitName(e.target.value)}
                    placeholder="Назва звички"
                  />
                </label>
                <label className="gl-form-label">
                  Опис
                  <textarea
                    className="gl-input gl-input-textarea"
                    value={habitDescription}
                    onChange={(e) => setHabitDescription(e.target.value)}
                    placeholder="Опис звички (опціонально)"
                  />
                </label>
                <div className="gl-form-label">Ефекти на статистику:</div>
                {/* v1.1: Звички можуть впливати лише на настрій, енергію, мотивацію, стрес і моментум */}
                {(["mood", "energy", "motivation", "stress", "momentum"] as const).map((stat) => (
                  <StatSlider
                    key={stat}
                    label={stat === "mood" ? "Настрій" : stat === "energy" ? "Енергія" : stat === "motivation" ? "Мотивація" : stat === "stress" ? "Стрес" : "Моментум"}
                    icon={stat === "mood" ? "😊" : stat === "energy" ? "⚡" : stat === "motivation" ? "🔥" : stat === "stress" ? "😰" : "📈"}
                    value={habitEffect[stat] || 0}
                    onChange={(value) => setHabitEffect({ ...habitEffect, [stat]: value })}
                    min={-50}
                    max={50}
                    allowNegative={true}
                  />
                ))}
                {/* v1.1: XP та діаманти можуть додаватись лише до 10 за кожне виконання */}
                <StatSlider
                  label="XP"
                  icon="⭐"
                  value={habitEffect.xp || 0}
                  onChange={(value) => setHabitEffect({ ...habitEffect, xp: Math.min(10, Math.max(0, value)) })}
                  min={0}
                  max={10}
                  allowNegative={false}
                />
                <StatSlider
                  label="Діаманти"
                  icon="💎"
                  value={habitEffect.diamonds || 0}
                  onChange={(value) => setHabitEffect({ ...habitEffect, diamonds: Math.min(10, Math.max(0, value)) })}
                  min={0}
                  max={10}
                  allowNegative={false}
                />
                <div className="gl-card-actions">
                  <button
                    type="button"
                    className="gl-btn gl-btn-secondary"
                    onClick={() => {
                      setHabitName("");
                      setHabitDescription("");
                      setHabitEffect({});
                      setShowHabitForm(false);
                    }}
                  >
                    Скасувати
                  </button>
                  <button type="submit" className="gl-btn gl-btn-primary">
                    Створити
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Список звичок */}
          <div style={{ marginTop: "1rem" }}>
            {Object.values(habits).length === 0 ? (
              <div className="gl-card">
                <p className="gl-muted">Поки що немає звичок. Створіть першу!</p>
              </div>
            ) : (
              Object.values(habits).map((habit) => (
                <div key={habit.id} className="gl-card" style={{ marginBottom: "1rem" }}>
                  <div className="gl-card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong>{habit.name}</strong>
                      {habit.description && (
                        <p className="gl-muted" style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>{habit.description}</p>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        className="gl-btn gl-btn-xs gl-btn-primary"
                        onClick={() => executeHabit(habit.id)}
                        title="Виконати звичку"
                      >
                        Виконати
                      </button>
                      <button
                        className="gl-btn gl-btn-xs gl-btn-danger"
                        onClick={() => {
                          if (confirm(`Видалити звичку "${habit.name}"?`)) {
                            deleteHabit(habit.id);
                          }
                        }}
                        title="Видалити"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                    Ефекти: {Object.entries(habit.effect).filter(([_, v]) => v !== 0).map(([k, v]) => `${k}: ${v > 0 ? "+" : ""}${v}`).join(", ") || "немає"}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Архів звичок */}
          {habitHistory.length > 0 && (
            <div className="gl-card" style={{ marginTop: "1.5rem" }}>
              <div className="gl-card-title">Архів звичок</div>
              <p className="gl-muted" style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                Виконано звичок за весь час: {habitHistory.length}
              </p>
              <details>
                <summary style={{ cursor: "pointer", color: "var(--accent)" }}>Показати історію</summary>
                <div style={{ marginTop: "0.5rem" }}>
                  {habitHistory
                    .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime())
                    .map((entry) => (
                      <div key={entry.id} style={{ padding: "0.5rem", borderBottom: "1px solid var(--theme-card-border)", fontSize: "0.85rem" }}>
                        <strong>{entry.habitName}</strong> - {format(new Date(entry.executedAt), "dd.MM.yyyy HH:mm")}
                      </div>
                    ))}
                </div>
              </details>
            </div>
          )}
        </div>
      )}

      {/* Вкладка Epic Quest */}
      {activeTab === "epic" && (
        <div>
          <div className="gl-page-header">
            <div className="gl-page-header-row">
              <h1 className="gl-page-title">Epic Quest</h1>
              {!epicQuest && (
                <button
                  className="gl-btn gl-btn-icon"
                  onClick={() => setShowEpicQuestForm(true)}
                  title="Створити Epic Quest"
                >
                  +
                </button>
              )}
            </div>
          </div>

          {/* Форма створення/редагування Epic Quest */}
          {showEpicQuestForm && (
            <div className="gl-card">
              <div className="gl-card-title">{epicQuest ? "Редагувати" : "Створити"} Epic Quest</div>
              <form className="gl-form" onSubmit={(e) => {
                e.preventDefault();
                if (!epicQuestTitle.trim()) {
                  alert("Введіть назву Epic Quest");
                  return;
                }
                if (epicQuestSteps.some(s => !s.title.trim())) {
                  alert("Всі етапи повинні мати назву");
                  return;
                }
                if (epicQuest) {
                  updateEpicQuest({
                    title: epicQuestTitle,
                    description: epicQuestDescription || undefined,
                    steps: epicQuestSteps
                  });
                } else {
                  createEpicQuest({
                    title: epicQuestTitle,
                    description: epicQuestDescription || undefined,
                    steps: epicQuestSteps
                  });
                }
                setShowEpicQuestForm(false);
                setEpicQuestTitle("");
                setEpicQuestDescription("");
                setEpicQuestSteps([{ title: "", description: "" }]);
              }}>
                <label className="gl-form-label">
                  Назва Epic Quest
                  <input
                    className="gl-input"
                    value={epicQuestTitle}
                    onChange={(e) => setEpicQuestTitle(e.target.value)}
                    placeholder="Наприклад: Стати кращим розробником"
                  />
                </label>
                <label className="gl-form-label">
                  Опис
                  <textarea
                    className="gl-input gl-input-textarea"
                    value={epicQuestDescription}
                    onChange={(e) => setEpicQuestDescription(e.target.value)}
                    placeholder="Короткий опис вашого Epic Quest"
                  />
                </label>
                <div className="gl-form-label" style={{ marginTop: "1rem" }}>Етапи (виконуються послідовно)</div>
                {epicQuestSteps.map((step, index) => (
                  <div key={index} style={{ marginBottom: "1rem", padding: "0.75rem", background: "rgba(15, 23, 42, 0.5)", borderRadius: "0.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <strong>Етап {index + 1}</strong>
                      {epicQuestSteps.length > 1 && (
                        <button
                          type="button"
                          className="gl-btn gl-btn-xs gl-btn-danger"
                          onClick={() => {
                            setEpicQuestSteps(epicQuestSteps.filter((_, i) => i !== index));
                          }}
                        >
                          Видалити
                        </button>
                      )}
                    </div>
                    <label className="gl-form-label">
                      Назва етапу
                      <input
                        className="gl-input"
                        value={step.title}
                        onChange={(e) => {
                          const newSteps = [...epicQuestSteps];
                          newSteps[index].title = e.target.value;
                          setEpicQuestSteps(newSteps);
                        }}
                        placeholder="Назва етапу"
                      />
                    </label>
                    <label className="gl-form-label">
                      Опис етапу
                      <textarea
                        className="gl-input gl-input-textarea"
                        value={step.description}
                        onChange={(e) => {
                          const newSteps = [...epicQuestSteps];
                          newSteps[index].description = e.target.value;
                          setEpicQuestSteps(newSteps);
                        }}
                        placeholder="Опис етапу (опціонально)"
                      />
                    </label>
                  </div>
                ))}
                <button
                  type="button"
                  className="gl-btn gl-btn-secondary"
                  onClick={() => {
                    setEpicQuestSteps([...epicQuestSteps, { title: "", description: "" }]);
                  }}
                  style={{ marginBottom: "1rem" }}
                >
                  + Додати етап
                </button>
                <div className="gl-card-actions">
                  <button
                    type="button"
                    className="gl-btn gl-btn-secondary"
                    onClick={() => {
                      setShowEpicQuestForm(false);
                      setEpicQuestTitle("");
                      setEpicQuestDescription("");
                      setEpicQuestSteps([{ title: "", description: "" }]);
                    }}
                  >
                    Скасувати
                  </button>
                  <button type="submit" className="gl-btn gl-btn-primary">
                    {epicQuest ? "Оновити" : "Створити"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Відображення Epic Quest */}
          {epicQuest && (
            <div className="gl-card" style={{ marginTop: "1rem" }}>
              <div className="gl-card-title">
                <span style={{ fontSize: "1.5rem", marginRight: "0.5rem" }}>⚔️</span>
                {epicQuest.title}
              </div>
              {epicQuest.description && (
                <p className="gl-muted" style={{ marginTop: "0.5rem" }}>{epicQuest.description}</p>
              )}
              <div style={{ marginTop: "1rem" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.5rem" }}>
                  Прогрес: {getEpicQuestProgress()}%
                </div>
                <div style={{ width: "100%", height: "12px", background: "rgba(51, 65, 85, 0.5)", borderRadius: "6px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${getEpicQuestProgress()}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, var(--theme-primary, var(--neon-blue)), var(--theme-secondary, #14b8a6))",
                      transition: "width 0.5s ease"
                    }}
                  />
                </div>
              </div>
              <div style={{ marginTop: "1.5rem" }}>
                {epicQuest.steps.map((step, index) => {
                  const isActive = index === epicQuest.currentStepIndex;
                  const isPast = index < epicQuest.currentStepIndex;
                  const isFuture = index > epicQuest.currentStepIndex;

                  return (
                    <div
                      key={step.id}
                      className={`gl-epic-quest-step-item ${
                        isActive ? "gl-epic-quest-step-active" :
                        isPast ? "gl-epic-quest-step-completed" :
                        "gl-epic-quest-step-inactive"
                      }`}
                      style={{ marginBottom: "0.5rem" }}
                    >
                      <button
                        className={`gl-epic-quest-checkbox ${
                          step.completed ? "gl-epic-quest-checkbox-completed" :
                          isActive ? "gl-epic-quest-checkbox-active" :
                          "gl-epic-quest-checkbox-inactive"
                        }`}
                        onClick={() => {
                          if (isActive && !step.completed) {
                            completeEpicQuestStep(step.id);
                          }
                        }}
                        disabled={!isActive || step.completed}
                        title={isActive && !step.completed ? "Виконати етап" : "Етап заблокований"}
                        style={{ fontSize: "1.5rem", padding: "0.5rem" }}
                      >
                        {step.completed ? "✅" : "⭕"}
                      </button>
                      <div className="gl-epic-quest-step-content">
                        <div className="gl-epic-quest-step-title">
                          {index + 1}. {step.title}
                        </div>
                        {step.description && (
                          <div className="gl-epic-quest-step-desc">{step.description}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {epicQuest.currentStepIndex === -1 && (
                <div className="gl-epic-quest-completed" style={{ marginTop: "1rem" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎉</div>
                  <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>Epic Quest завершено!</div>
                  <button
                    className="gl-btn gl-btn-primary"
                    onClick={() => {
                      resetEpicQuest();
                      setShowEpicQuestForm(true);
                    }}
                    style={{ marginTop: "1rem" }}
                  >
                    Створити новий Epic Quest
                  </button>
                </div>
              )}
            </div>
          )}

          {!epicQuest && !showEpicQuestForm && (
            <div className="gl-card">
              <p className="gl-muted">Epic Quest не створено. Створіть свій перший Epic Quest!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Quests;
