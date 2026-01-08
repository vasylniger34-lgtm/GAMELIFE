import { FormEvent, useState, useMemo } from "react";
import { format } from "date-fns";
import { useGameLifeStore } from "../state/store";
import { DailyStats } from "../state/types";
import { StatSlider } from "../components/StatSlider";

// Екран "Магазин": покупка товарів за діаманти
const Shop: React.FC = () => {
  const diamonds = useGameLifeStore((s) => s.diamonds);
  const shopItemsRecord = useGameLifeStore((s) => s.shopItems);
  const purchaseHistory = useGameLifeStore((s) => s.purchaseHistory);
  
  // Мемоізуємо масив товарів
  const shopItems = useMemo(() => Object.values(shopItemsRecord), [shopItemsRecord]);
  
  // Групуємо історію покупок за датами
  const purchaseHistoryByDate = useMemo(() => {
    const groups: Record<string, typeof purchaseHistory> = {};
    purchaseHistory.forEach((p) => {
      const dateKey = format(new Date(p.purchaseDate), "yyyy-MM-dd");
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(p);
    });
    return groups;
  }, [purchaseHistory]);
  
  const sortedPurchaseDates = useMemo(() => {
    return Object.keys(purchaseHistoryByDate).sort().reverse();
  }, [purchaseHistoryByDate]);
  const purchaseShopItem = useGameLifeStore((s) => s.purchaseShopItem);
  const createShopItem = useGameLifeStore((s) => s.createShopItem);
  const updateShopItem = useGameLifeStore((s) => s.updateShopItem);
  const deleteShopItem = useGameLifeStore((s) => s.deleteShopItem);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState(10);
  const [effect, setEffect] = useState<Partial<DailyStats>>({});
  const [narrativeAction, setNarrativeAction] = useState("");

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createShopItem({
      name: name.trim(),
      description: description.trim() || undefined,
      cost,
      effect: Object.keys(effect).length > 0 ? effect : undefined,
      narrativeAction: narrativeAction.trim() || undefined
    });
    setName("");
    setDescription("");
    setCost(10);
    setEffect({});
    setNarrativeAction("");
    setShowAddForm(false);
  };

  const handleEdit = (id: string) => {
    const item = shopItems.find((i) => i.id === id);
    if (!item) return;
    setName(item.name);
    setDescription(item.description || "");
    setCost(item.cost);
    setEffect(item.effect || {});
    setNarrativeAction(item.narrativeAction || "");
    setEditingId(id);
    setShowAddForm(true);
  };

  const handleUpdate = (e: FormEvent) => {
    e.preventDefault();
    if (!editingId || !name.trim()) return;
    updateShopItem(editingId, {
      name: name.trim(),
      description: description.trim() || undefined,
      cost,
      effect: Object.keys(effect).length > 0 ? effect : undefined,
      narrativeAction: narrativeAction.trim() || undefined
    });
    setName("");
    setDescription("");
    setCost(10);
    setEffect({});
    setNarrativeAction("");
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Видалити цей товар?")) {
      deleteShopItem(id);
    }
  };

  return (
    <div className="gl-page">
      <div className="gl-page-header">
        <div className="gl-page-header-row">
          <h1 className="gl-page-title">Магазин</h1>
          <button
            className="gl-btn gl-btn-icon"
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingId(null);
              setName("");
              setDescription("");
              setCost(10);
              setEffect({});
              setNarrativeAction("");
            }}
            title="Додати товар"
          >
            +
          </button>
        </div>
      </div>

      <div className="gl-card gl-profile-summary">
        <div className="gl-profile-item">
          <span className="gl-profile-label">Діаманти</span>
          <strong className="gl-profile-value">💎 {diamonds}</strong>
        </div>
      </div>

      {/* Форма додавання/редагування товару */}
      {showAddForm && (
        <div className="gl-card">
          <div className="gl-card-title">
            {editingId ? "Редагувати товар" : "Додати товар"}
          </div>
          <form className="gl-form" onSubmit={editingId ? handleUpdate : handleCreate}>
            <label className="gl-form-label">
              Назва
              <input
                className="gl-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Наприклад: Піти на вечірку"
                required
              />
            </label>
            <label className="gl-form-label">
              Опис
              <textarea
                className="gl-input gl-input-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Опис товару"
              />
            </label>
            <div className="gl-form-label">Вартість (діаманти)</div>
            <StatSlider
              label="Діаманти"
              icon="💎"
              value={cost}
              onChange={(value) => setCost(value)}
              min={1}
              max={100}
              allowNegative={false}
            />
            <label className="gl-form-label">
              Описова дія (необов'язково)
              <input
                className="gl-input"
                value={narrativeAction}
                onChange={(e) => setNarrativeAction(e.target.value)}
                placeholder="Наприклад: Піти на вечірку, Відпочити"
              />
            </label>
            <div className="gl-form-section">
              <div className="gl-form-label">Ефект на стати (необов'язково)</div>
              <div className="gl-rewards-grid">
                <StatSlider
                  label="Настрій"
                  icon="😊"
                  value={effect.mood ?? 0}
                  onChange={(value) => setEffect({ ...effect, mood: value })}
                  min={-50}
                  max={50}
                />
                <StatSlider
                  label="Енергія"
                  icon="⚡"
                  value={effect.energy ?? 0}
                  onChange={(value) => setEffect({ ...effect, energy: value })}
                  min={-50}
                  max={50}
                />
                <StatSlider
                  label="Мотивація"
                  icon="🔥"
                  value={effect.motivation ?? 0}
                  onChange={(value) => setEffect({ ...effect, motivation: value })}
                  min={-50}
                  max={50}
                />
                <StatSlider
                  label="Стрес"
                  icon="⚠️"
                  value={effect.stress ?? 0}
                  onChange={(value) => setEffect({ ...effect, stress: value })}
                  min={-50}
                  max={50}
                />
                <StatSlider
                  label="Імпульс"
                  icon="📈"
                  value={effect.momentum ?? 0}
                  onChange={(value) => setEffect({ ...effect, momentum: value })}
                  min={-50}
                  max={50}
                />
              </div>
            </div>
            <div className="gl-card-actions">
              <button
                type="button"
                className="gl-btn gl-btn-secondary"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                }}
              >
                Скасувати
              </button>
              <button className="gl-btn gl-btn-primary" type="submit">
                {editingId ? "Оновити" : "Додати"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Список товарів */}
      {shopItems.length === 0 ? (
        <div className="gl-card">
          <p className="gl-muted">
            Магазин порожній. Додай перший товар!
          </p>
        </div>
      ) : (
        <div className="gl-card">
          <div className="gl-card-title">Доступні товари</div>
          <ul className="gl-list">
            {shopItems.map((item) => (
              <li key={item.id} className="gl-list-item">
                <div className="gl-list-main">
                  <div className="gl-list-title">{item.name}</div>
                  {item.description && (
                    <div className="gl-list-sub">{item.description}</div>
                  )}
                  {item.narrativeAction && (
                    <div className="gl-list-meta">
                      <span>Дія: {item.narrativeAction}</span>
                    </div>
                  )}
                  <div className="gl-list-meta">
                    <span>💎 {item.cost}</span>
                    {item.effect && (
                      <span>
                        Ефект: {Object.entries(item.effect)
                          .filter(([_, v]) => v !== 0)
                          .map(([k, v]) => `${k}: ${v > 0 ? "+" : ""}${v}`)
                          .join(", ")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="gl-list-actions">
                  <button
                    className={`gl-btn gl-btn-xs ${diamonds >= item.cost ? "gl-btn-primary" : "gl-btn-secondary"}`}
                    onClick={() => purchaseShopItem(item.id)}
                    disabled={diamonds < item.cost}
                  >
                    Купити
                  </button>
                  <button
                    className="gl-btn gl-btn-xs gl-btn-secondary"
                    onClick={() => handleEdit(item.id)}
                  >
                    Редагувати
                  </button>
                  <button
                    className="gl-btn gl-btn-xs gl-btn-danger"
                    onClick={() => handleDelete(item.id)}
                  >
                    Видалити
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Історія покупок */}
      {purchaseHistory.length > 0 && (
        <div className="gl-card">
          <div className="gl-card-title">Історія покупок</div>
          {sortedPurchaseDates.length === 0 ? (
            <p className="gl-muted">Історія покупок порожня.</p>
          ) : (
            sortedPurchaseDates.map((dateKey) => {
              const purchases = purchaseHistoryByDate[dateKey];
              return (
                <div key={dateKey} style={{ marginBottom: "1rem" }}>
                  <div className="gl-card-title" style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                    {format(new Date(dateKey), "dd.MM.yyyy")}
                  </div>
                  <ul className="gl-list">
                    {purchases.map((p) => (
                      <li key={p.id} className="gl-list-item">
                        <div className="gl-list-main">
                          <div className="gl-list-title">{p.itemName}</div>
                          <div className="gl-list-meta">
                            <span>💎 {p.cost}</span>
                            <span>{format(new Date(p.purchaseDate), "HH:mm")}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default Shop;
