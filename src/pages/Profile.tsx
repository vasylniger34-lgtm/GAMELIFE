import { useMemo, useState, useRef } from "react";
import { useGameLifeStore } from "../state/store";
import { format } from "date-fns";
import { getDateKey } from "../state/time";
import { DayTheme } from "../state/types";
import { exportState, downloadStateAsFile, importState, loadStateFromFile } from "../services/saveSystem";
import { forceSave } from "../services/autosave";
import { EpicQuest } from "../state/types";

// Екран "Профіль": рівень, досвід, історія, прогрес статів, досягнення
const Profile: React.FC = () => {
  const profile = useGameLifeStore((s) => s.profile);
  const daysRecord = useGameLifeStore((s) => s.days);
  const questsRecord = useGameLifeStore((s) => s.quests);
  const achievements = useGameLifeStore((s) => s.achievements);
  const todayKey = getDateKey();
  const today = daysRecord[todayKey];
  const [selectedTheme, setSelectedTheme] = useState<DayTheme | undefined>(today?.theme);
  const epicQuest = useGameLifeStore((s) => s.epicQuest);
  const createEpicQuest = useGameLifeStore((s) => s.createEpicQuest);
  const updateEpicQuest = useGameLifeStore((s) => s.updateEpicQuest);
  const [showEpicQuestForm, setShowEpicQuestForm] = useState(false);
  const [epicQuestTitle, setEpicQuestTitle] = useState("");
  const [epicQuestDescription, setEpicQuestDescription] = useState("");
  const [epicQuestSteps, setEpicQuestSteps] = useState<Array<{ title: string; description: string }>>([
    { title: "", description: "" }
  ]);
  
  // Мемоізуємо масиви
  const days = useMemo(() => Object.values(daysRecord), [daysRecord]);
  const completedQuests = useMemo(
    () => Object.values(questsRecord).filter((q) => q.status === "completed"),
    [questsRecord]
  );
  
  // Сортуємо досягнення: спочатку розблоковані, потім заблоковані
  const sortedAchievements = useMemo(() => {
    return Object.values(achievements).sort((a, b) => {
      if (a.unlocked && !b.unlocked) return -1;
      if (!a.unlocked && b.unlocked) return 1;
      return 0;
    });
  }, [achievements]);

  // Розраховуємо XP до наступного рівня (починаємо з рівня 0)
  const xpForCurrentLevel = profile.level * 100;
  const xpForNextLevel = (profile.level + 1) * 100;
  const xpProgress = profile.xpTotal - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const xpPercent = xpNeeded > 0 ? Math.min(100, Math.max(0, (xpProgress / xpNeeded) * 100)) : 100;

  // Останні 30 днів історії досвіду
  const recentXpHistory = useMemo(() => {
    return profile.xpHistory
      .slice()
      .sort((a, b) => (a.date > b.date ? -1 : 1))
      .slice(0, 30);
  }, [profile.xpHistory]);

  // Статистика по статах з архівованих днів
  const statsProgression = useMemo(() => {
    const finishedDays = days.filter((d) => d.status === "finished" && d.endStats);
    if (finishedDays.length === 0) return null;

    const latest = finishedDays[finishedDays.length - 1];
    const oldest = finishedDays[0];

    return {
      latest: latest.endStats!,
      oldest: oldest.startStats,
      daysCount: finishedDays.length
    };
  }, [days]);

  return (
    <div className="gl-page">
      <div className="gl-page-header">
        <h1 className="gl-page-title">Профіль</h1>
      </div>

      {/* Рівень та досвід */}
      <div className="gl-card">
        <div className="gl-card-title">Рівень та досвід</div>
        <div className="gl-profile-summary">
          <div className="gl-profile-row">
            <div className="gl-profile-item">
              <span className="gl-profile-label">Поточний рівень</span>
              <strong className="gl-profile-value">{profile.level}</strong>
            </div>
            <div className="gl-profile-item">
              <span className="gl-profile-label">Загальний досвід</span>
              <strong className="gl-profile-value">{profile.xpTotal} XP</strong>
            </div>
          </div>
          <div className="gl-xp-bar-container">
            <div className="gl-xp-bar-label">
              {xpProgress} / {xpNeeded} XP до рівня {profile.level + 1}
            </div>
            <div className="gl-xp-bar">
              <div
                className="gl-xp-bar-fill"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Історія досвіду */}
      {recentXpHistory.length > 0 && (
        <div className="gl-card">
          <div className="gl-card-title">Історія досвіду (останні 30 днів)</div>
          <div className="gl-chart-row">
            {recentXpHistory.map((entry) => (
              <div key={entry.date} className="gl-chart-col">
                <div
                  className="gl-chart-bar"
                  style={{
                    height: `${Math.min((entry.xp / 100) * 100, 100)}%`
                  }}
                  title={`${format(new Date(entry.date), "dd.MM")}: ${entry.xp} XP`}
                />
                <span className="gl-chart-label">
                  {format(new Date(entry.date), "dd.MM")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Прогрес статів */}
      {statsProgression && (
        <div className="gl-card">
          <div className="gl-card-title">Прогрес статів</div>
          <p className="gl-muted">
            Порівняння початкових та кінцевих значень за {statsProgression.daysCount} днів
          </p>
          <div className="gl-stats-progression">
            {Object.keys(statsProgression.latest).map((key) => {
              const statKey = key as keyof typeof statsProgression.latest;
              const latest = statsProgression.latest[statKey];
              const oldest = statsProgression.oldest[statKey];
              const change = latest - oldest;
              const changePercent = oldest !== 0 ? ((change / oldest) * 100).toFixed(1) : "0";
              return (
                <div key={statKey} className="gl-stats-progression-item">
                  <div className="gl-stats-progression-label">
                    {statKey === "mood" ? "Настрій" :
                     statKey === "money" ? "Гроші ($)" :
                     statKey === "energy" ? "Енергія" :
                     statKey === "motivation" ? "Мотивація" :
                     statKey === "stress" ? "Стрес" :
                     statKey === "momentum" ? "Імпульс" :
                     "Години сну"}
                  </div>
                  <div className="gl-stats-progression-values">
                    <span>{oldest.toFixed(statKey === "money" ? 0 : statKey === "sleepHours" ? 1 : 0)}</span>
                    <span>→</span>
                    <span>{latest.toFixed(statKey === "money" ? 0 : statKey === "sleepHours" ? 1 : 0)}</span>
                    <span className={change >= 0 ? "gl-text-success" : "gl-text-danger"}>
                      ({change > 0 ? "+" : ""}{change.toFixed(statKey === "money" ? 0 : statKey === "sleepHours" ? 1 : 0)})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Загальна статистика */}
      <div className="gl-card">
        <div className="gl-card-title">Загальна статистика</div>
        <div className="gl-stats-summary">
          <div className="gl-stats-summary-item">
            <span>Завершених днів</span>
            <strong>{days.filter((d) => d.status === "finished").length}</strong>
          </div>
          <div className="gl-stats-summary-item">
            <span>Виконаних квестів</span>
            <strong>{completedQuests.length}</strong>
          </div>
          <div className="gl-stats-summary-item">
            <span>Загальний досвід</span>
            <strong>{profile.xpTotal} XP</strong>
          </div>
        </div>
      </div>

      {/* Epic Quest Management */}
      <div className="gl-card">
        <div className="gl-card-title">Epic Quest</div>
        {epicQuest ? (
          <div>
            <p style={{ marginBottom: "1rem" }}>
              <strong>{epicQuest.title}</strong>
              {epicQuest.description && <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "0.25rem" }}>{epicQuest.description}</div>}
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "1rem" }}>
              Етапів: {epicQuest.steps.length} | Виконано: {epicQuest.steps.filter(s => s.completed).length}
            </p>
            <button
              className="gl-btn gl-btn-secondary"
              onClick={() => {
                setEpicQuestTitle(epicQuest.title);
                setEpicQuestDescription(epicQuest.description || "");
                setEpicQuestSteps(epicQuest.steps.map(s => ({ title: s.title, description: s.description || "" })));
                setShowEpicQuestForm(true);
              }}
            >
              Редагувати Epic Quest
            </button>
          </div>
        ) : (
          <div>
            <p className="gl-muted" style={{ marginBottom: "1rem" }}>
              Epic Quest - це ваш довгостроковий квест з послідовними етапами. Створіть свій перший Epic Quest!
            </p>
            <button
              className="gl-btn gl-btn-primary"
              onClick={() => setShowEpicQuestForm(true)}
            >
              Створити Epic Quest
            </button>
          </div>
        )}

        {showEpicQuestForm && (
          <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(51, 65, 85, 0.3)", borderRadius: "0.5rem" }}>
            <h3 style={{ marginBottom: "1rem" }}>{epicQuest ? "Редагувати" : "Створити"} Epic Quest</h3>
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
              <button
                className="gl-btn gl-btn-primary"
                onClick={() => {
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
                }}
              >
                {epicQuest ? "Оновити" : "Створити"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Вибір теми */}
      <div className="gl-card">
        <div className="gl-card-title">Тема дня</div>
        <label className="gl-form-label">
          <select
            className="gl-input"
            value={selectedTheme || "hustle_mode"}
            onChange={(e) => {
              const theme = e.target.value as DayTheme;
              setSelectedTheme(theme);
              // Оновлюємо тему поточного дня
              if (today) {
                const days = { ...daysRecord };
                days[todayKey] = { ...today, theme };
                useGameLifeStore.setState({ days });
              }
            }}
          >
            <option value="hustle_mode">Hustle Mode</option>
            <option value="zen_focus">Zen Focus</option>
            <option value="procrastinator_slayer">Procrastinator Slayer</option>
            <option value="night_owl">Night Owl</option>
            <option value="momentum_boost">Momentum Boost</option>
            <option value="mystic_vision">Mystic Vision</option>
          </select>
        </label>
      </div>

      {/* Збереження та імпорт/експорт */}
      <div className="gl-card">
        <div className="gl-card-title">Збереження даних</div>
        <div className="gl-save-actions">
          <button
            className="gl-btn gl-btn-primary"
            onClick={() => {
              try {
                const state = useGameLifeStore.getState();
                downloadStateAsFile(state);
                alert("✅ Дані успішно експортовано!");
              } catch (error) {
                console.error("Export error:", error);
                alert("❌ Помилка експорту даних");
              }
            }}
          >
            💾 Експортувати дані
          </button>
          <label className="gl-btn gl-btn-secondary" style={{ cursor: "pointer", display: "inline-block" }}>
            📥 Імпортувати дані
            <input
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                if (!confirm("⚠️ Ця дія замінить всі поточні дані. Продовжити?")) {
                  e.target.value = "";
                  return;
                }

                try {
                  const importedData = await loadStateFromFile(file);
                  useGameLifeStore.setState(importedData);
                  // Примусово зберігаємо після імпорту
                  await forceSave(useGameLifeStore.getState());
                  alert("✅ Дані успішно імпортовано!");
                  // Перезавантажуємо сторінку для оновлення UI
                  window.location.reload();
                } catch (error) {
                  console.error("Import error:", error);
                  alert(`❌ Помилка імпорту: ${error instanceof Error ? error.message : "Невідома помилка"}`);
                } finally {
                  e.target.value = "";
                }
              }}
            />
          </label>
          <button
            className="gl-btn gl-btn-secondary"
            onClick={async () => {
              try {
                await forceSave(useGameLifeStore.getState());
                alert("✅ Дані збережено вручну!");
              } catch (error) {
                console.error("Manual save error:", error);
                alert("❌ Помилка збереження");
              }
            }}
          >
            💾 Зберегти зараз
          </button>
        </div>
        <p className="gl-muted" style={{ marginTop: "1rem", fontSize: "0.85rem" }}>
          Дані автоматично зберігаються кожні 3 хвилини та при закритті додатку.
          Ви можете експортувати свої дані для резервного копіювання або імпортувати збереження.
        </p>
      </div>

      {/* v1.1: Небезпечна зона */}
      <div className="gl-card gl-danger-zone">
        <div className="gl-card-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>⚠️</span>
          <span>Небезпечна зона</span>
        </div>
        <p className="gl-muted" style={{ marginBottom: "1rem" }}>
          Ці дії не можна скасувати. Будьте обережні!
        </p>
        <button
          className="gl-btn gl-btn-danger"
          onClick={() => {
            const confirmText = "ВИ ВПЕВНЕНІ?";
            const confirmMessage = "Ця дія повністю обнулить всю гру:\n\n- Всі дні та статистика\n- Всі квести\n- Всі швидкі дії\n- Весь прогрес та досягнення\n- Всі діаманти та XP\n\nЦе НЕ можна скасувати!\n\nВведіть 'СКИНУТИ' для підтвердження:";
            
            const userInput = prompt(confirmMessage);
            if (userInput !== "СКИНУТИ") {
              alert("Скидання скасовано.");
              return;
            }

            // Підтвердження ще раз
            if (!confirm("⚠️ ОСТАННЄ ПІДТВЕРДЖЕННЯ!\n\nВи точно хочете повністю обнулити гру?\n\nЦе НЕ можна скасувати!")) {
              return;
            }

            // Повне скидання стану
            const initialState = {
              currentStats: {
                mood: 70,
                money: 0,
                energy: 70,
                motivation: 60,
                stress: 30,
                momentum: 50,
                sleepHours: 7
              },
              days: {},
              quests: {},
              quickActions: {},
              quickActionHistory: [],
              shopItems: {},
              profile: {
                level: 0,
                xpTotal: 0,
                xpHistory: []
              },
              diamonds: 0,
              diamondsEarnedTotal: 0,
              timeMeta: {
                lastTimestamp: Date.now(),
                lastActivityAt: Date.now(),
                timeSuspicious: false
              },
              purchaseHistory: [],
              achievements: useGameLifeStore.getState().achievements, // Залишаємо структуру досягнень, але скидаємо прогрес
              lastDayStarted: null,
              lastSavedAt: undefined
            };

            // Скидаємо прогрес досягнень
            Object.keys(initialState.achievements).forEach((key) => {
              const ach = initialState.achievements[key as keyof typeof initialState.achievements];
              ach.unlocked = false;
              ach.unlockedAt = undefined;
              ach.progress = 0;
              ach.current = 0;
            });

            useGameLifeStore.setState(initialState);
            
            // Очищаємо localStorage
            localStorage.removeItem("game-life-store");
            
            alert("✅ Гра повністю скинута. Сторінка буде перезавантажена.");
            window.location.reload();
          }}
        >
          🗑️ Скинути всю статистику
        </button>
      </div>

      {/* Досягнення */}
      <div className="gl-card">
        <div className="gl-card-title">Досягнення</div>
        <div className="gl-achievements-grid">
          {sortedAchievements.map((ach) => (
            <div
              key={ach.id}
              className={`gl-achievement-item ${ach.unlocked ? "gl-achievement-unlocked" : "gl-achievement-locked"}`}
            >
              <div className="gl-achievement-icon" style={{ filter: ach.unlocked ? "none" : "grayscale(100%)" }}>
                {ach.icon}
              </div>
              <div className="gl-achievement-content">
                <div className="gl-achievement-name">
                  {ach.name}
                  {ach.unlocked && <span className="gl-badge gl-badge-success">✓</span>}
                </div>
                <div className="gl-achievement-desc">{ach.description}</div>
                <div className="gl-achievement-progress">
                  <div className="gl-stat-bar" style={{ marginTop: "0.3rem" }}>
                    <div
                      className="gl-stat-bar-fill"
                      style={{
                        width: `${ach.progress}%`,
                        background: ach.unlocked ? "linear-gradient(90deg, #22c55e, #14b8a6)" : "rgba(56, 189, 248, 0.3)"
                      }}
                    />
                  </div>
                  <div className="gl-achievement-progress-text">
                    {ach.current} / {ach.target}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
