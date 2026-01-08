import { useGameLifeStore } from "../state/store";

// v1.1: Ранкова рутина - модальне вікно після Start New Day
export const MorningRoutine: React.FC = () => {
  const completeMorningRoutine = useGameLifeStore((s) => s.completeMorningRoutine);
  const today = useGameLifeStore((s) => {
    const todayKey = new Date().toISOString().split("T")[0];
    return s.days[todayKey];
  });

  // Перевіряємо, чи потрібно показувати ранкову рутину
  if (!today || today.status !== "active" || today.morningRoutineCompleted) {
    return null;
  }

  const handleComplete = () => {
    completeMorningRoutine();
  };

  return (
    <div className="gl-modal-overlay" style={{ zIndex: 1000 }}>
      <div className="gl-modal gl-modal-large">
        <div className="gl-modal-header">
          <h2 className="gl-modal-title">Ранкова рутина</h2>
        </div>
        <div className="gl-modal-body">
          <div className="gl-morning-routine-content">
            <p className="gl-morning-routine-text">
              Першим ділом:
            </p>
            <ul className="gl-morning-routine-list">
              <li>– випий стакан води</li>
              <li>– відіжмись 10 разів</li>
              <li>– почисти зуби</li>
            </ul>
            <div className="gl-morning-routine-reward">
              <p>Нагорода за виконання:</p>
              <div className="gl-reward-badges">
                <span className="gl-badge gl-badge-success">+5 XP</span>
                <span className="gl-badge gl-badge-primary">+2 💎</span>
              </div>
            </div>
          </div>
        </div>
        <div className="gl-modal-footer">
          <button
            className="gl-btn gl-btn-primary gl-btn-large"
            onClick={handleComplete}
          >
            Виконав
          </button>
        </div>
      </div>
    </div>
  );
};
