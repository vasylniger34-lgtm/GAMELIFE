import { FormEvent, useState, useMemo } from "react";
import { useGameLifeStore } from "../state/store";
import { DailyStats } from "../state/types";
import { format } from "date-fns";
import { StatSlider } from "./StatSlider";

// Швидкі дії: користувач може додавати, редагувати та застосовувати
export const QuickActions: React.FC = () => {
  const quickActionsRecord = useGameLifeStore((s) => s.quickActions);
  
  // Мемоізуємо масив швидких дій
  const quickActions = useMemo(() => Object.values(quickActionsRecord), [quickActionsRecord]);
  const quickActionHistory = useGameLifeStore((s) => s.getQuickActionHistory()); // v1.1
  const applyQuickAction = useGameLifeStore((s) => s.applyQuickAction);
  const createQuickAction = useGameLifeStore((s) => s.createQuickAction);
  const updateQuickAction = useGameLifeStore((s) => s.updateQuickAction);
  const deleteQuickAction = useGameLifeStore((s) => s.deleteQuickAction);

  // v1.1: Групуємо статистику по днях
  const statsByDate = useMemo(() => {
    const groups: Record<string, typeof quickActionHistory> = {};
    quickActionHistory.forEach((entry) => {
      if (!groups[entry.date]) {
        groups[entry.date] = [];
      }
      groups[entry.date].push(entry);
    });
    return groups;
  }, [quickActionHistory]);

  const sortedDates = useMemo(() => {
    return Object.keys(statsByDate).sort((a, b) => b.localeCompare(a));
  }, [statsByDate]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [effect, setEffect] = useState<Partial<DailyStats>>({});
  const [showStats, setShowStats] = useState(false); // v1.1: Показ статистики

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createQuickAction({
      name: name.trim(),
      description: description.trim() || undefined,
      effect
    });
    setName("");
    setDescription("");
    setEffect({});
    setShowAddForm(false);
  };

  const handleEdit = (id: string) => {
    const action = quickActions.find((a) => a.id === id);
    if (!action) return;
    setName(action.name);
    setDescription(action.description || "");
    setEffect(action.effect);
    setEditingId(id);
    setShowAddForm(true);
  };

  const handleUpdate = (e: FormEvent) => {
    e.preventDefault();
    if (!editingId || !name.trim()) return;
    updateQuickAction(editingId, {
      name: name.trim(),
      description: description.trim() || undefined,
      effect
    });
    setName("");
    setDescription("");
    setEffect({});
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Видалити цю швидку дію?")) {
      deleteQuickAction(id);
    }
  };

  return (
    <div className="gl-card">
      <div className="gl-card-header-row">
        <div className="gl-card-title">Швидкі дії</div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {/* v1.1: Іконка статистики */}
          <button
            className="gl-btn gl-btn-xs gl-btn-secondary"
            onClick={() => setShowStats(!showStats)}
            title="Статистика виконання швидких дій"
          >
            📊
          </button>
          <button
            className="gl-btn gl-btn-xs gl-btn-secondary"
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingId(null);
              setName("");
              setDescription("");
              setEffect({});
            }}
          >
            {showAddForm ? "Скасувати" : "+ Додати"}
          </button>
        </div>
      </div>

      {/* v1.1: Модальне вікно зі статистикою */}
      {showStats && (
        <div className="gl-modal-overlay" onClick={() => setShowStats(false)}>
          <div className="gl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gl-modal-header">
              <h2 className="gl-modal-title">Статистика швидких дій</h2>
              <button
                className="gl-btn gl-btn-xs gl-btn-secondary"
                onClick={() => setShowStats(false)}
                style={{ position: "absolute", right: "1rem", top: "1rem" }}
              >
                ✕
              </button>
            </div>
            <div className="gl-modal-body">
              {sortedDates.length === 0 ? (
                <p className="gl-muted">Поки що немає виконаних швидких дій.</p>
              ) : (
                <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
                  {sortedDates.map((date) => {
                    const entries = statsByDate[date];
                    const totalCount = entries.length;
                    const totalEffects: Partial<DailyStats> = {};
                    
                    entries.forEach((entry) => {
                      Object.entries(entry.effect).forEach(([key, value]) => {
                        if (typeof value === "number") {
                          const statKey = key as keyof DailyStats;
                          totalEffects[statKey] = (totalEffects[statKey] || 0) + value;
                        }
                      });
                    });

                    return (
                      <div key={date} style={{ marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid var(--theme-card-border)" }}>
                        <h3 style={{ marginBottom: "0.5rem", fontSize: "1rem" }}>
                          {format(new Date(date + "T00:00:00"), "dd.MM.yyyy")}
                        </h3>
                        <p style={{ marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--muted)" }}>
                          Виконано швидких дій: <strong>{totalCount}</strong>
                        </p>
                        {Object.keys(totalEffects).length > 0 && (
                          <div style={{ marginTop: "0.5rem" }}>
                            <p style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>Загальний ефект:</p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                              {Object.entries(totalEffects)
                                .filter(([_, v]) => v !== 0)
                                .map(([k, v]) => {
                                  const label = k === "mood" ? "Настрій" :
                                    k === "energy" ? "Енергія" :
                                    k === "motivation" ? "Мотивація" :
                                    k === "stress" ? "Стрес" :
                                    k === "momentum" ? "Імпульс" : k;
                                  return (
                                    <span key={k} className="gl-badge" style={{ fontSize: "0.75rem" }}>
                                      {label}: {v > 0 ? "+" : ""}{v}
                                    </span>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                        <details style={{ marginTop: "0.5rem" }}>
                          <summary style={{ cursor: "pointer", fontSize: "0.85rem", color: "var(--accent)" }}>
                            Деталі ({entries.length})
                          </summary>
                          <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem", fontSize: "0.8rem" }}>
                            {entries.map((entry) => (
                              <li key={entry.id} style={{ marginBottom: "0.25rem" }}>
                                <strong>{entry.quickActionName}</strong> - {format(new Date(entry.executedAt), "HH:mm")}
                              </li>
                            ))}
                          </ul>
                        </details>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="gl-modal-footer">
              <button
                className="gl-btn gl-btn-primary"
                onClick={() => setShowStats(false)}
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Форма додавання/редагування */}
      {showAddForm && (
        <form className="gl-form" onSubmit={editingId ? handleUpdate : handleCreate}>
          <label className="gl-form-label">
            Назва
            <input
              className="gl-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Наприклад: 3 глибокі вдихи"
              required
            />
          </label>
          <label className="gl-form-label">
            Опис
            <input
              className="gl-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Короткий опис дії"
            />
          </label>
          <div className="gl-form-section">
            <div className="gl-form-label">Ефект на стати</div>
            <StatSlider
              label="Настрій"
              icon="😊"
              value={effect.mood || 0}
              onChange={(value) => setEffect({ ...effect, mood: value })}
              min={-50}
              max={50}
              allowNegative={true}
            />
            <StatSlider
              label="Енергія"
              icon="⚡"
              value={effect.energy || 0}
              onChange={(value) => setEffect({ ...effect, energy: value })}
              min={-50}
              max={50}
              allowNegative={true}
            />
            <StatSlider
              label="Мотивація"
              icon="🔥"
              value={effect.motivation || 0}
              onChange={(value) => setEffect({ ...effect, motivation: value })}
              min={-50}
              max={50}
              allowNegative={true}
            />
            <StatSlider
              label="Стрес"
              icon="😰"
              value={effect.stress || 0}
              onChange={(value) => setEffect({ ...effect, stress: value })}
              min={-50}
              max={50}
              allowNegative={true}
            />
            <StatSlider
              label="Імпульс"
              icon="📈"
              value={effect.momentum || 0}
              onChange={(value) => setEffect({ ...effect, momentum: value })}
              min={-50}
              max={50}
              allowNegative={true}
            />
          </div>
          <div className="gl-card-actions">
            <button className="gl-btn gl-btn-primary" type="submit">
              {editingId ? "Оновити" : "Додати"}
            </button>
          </div>
        </form>
      )}

      {/* Список швидких дій */}
      {quickActions.length === 0 && !showAddForm ? (
        <p className="gl-muted">Поки що немає швидких дій. Додай першу!</p>
      ) : (
        <div className="gl-quick-actions">
          {quickActions.map((qa) => (
            <div key={qa.id} className="gl-quick-action-item">
              <button
                className="gl-btn gl-btn-outline gl-quick-action-btn"
                onClick={() => applyQuickAction(qa.id)}
              >
                <div className="gl-quick-action-label">{qa.name}</div>
                {qa.description && (
                  <div className="gl-quick-action-desc">{qa.description}</div>
                )}
                {qa.effect && Object.keys(qa.effect).length > 0 && (
                  <div className="gl-quick-action-desc">
                    {Object.entries(qa.effect)
                      .filter(([_, v]) => v !== 0)
                      .map(([k, v]) => {
                        const label = k === "mood" ? "Настрій" :
                          k === "energy" ? "Енергія" :
                          k === "motivation" ? "Мотивація" :
                          k === "stress" ? "Стрес" :
                          k === "momentum" ? "Імпульс" : k;
                        return `${label}: ${v > 0 ? "+" : ""}${v}`;
                      })
                      .join(", ")}
                  </div>
                )}
              </button>
              <div className="gl-quick-action-controls">
                <button
                  className="gl-btn gl-btn-xs gl-btn-secondary"
                  onClick={() => handleEdit(qa.id)}
                >
                  Редагувати
                </button>
                <button
                  className="gl-btn gl-btn-xs gl-btn-danger"
                  onClick={() => handleDelete(qa.id)}
                >
                  Видалити
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
