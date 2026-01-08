import { useGameLifeStore } from "../state/store";

// Окремий індикатор енергії з підсвіткою виснаження
export const EnergyBar: React.FC = () => {
  const stats = useGameLifeStore((s) => s.stats);

  const exhausted = stats.energy <= 0;

  return (
    <div className="gl-card gl-energy-card">
      <div className="gl-card-title-row">
        <span>Енергія дня</span>
        <span className={exhausted ? "gl-energy-exhausted" : ""}>
          {stats.energy}/100
        </span>
      </div>
      <div className="gl-stat-bar gl-energy-bar">
        <div
          className={`gl-stat-bar-fill ${
            exhausted ? "gl-energy-bar-exhausted" : ""
          }`}
          style={{ width: `${stats.energy}%` }}
        />
      </div>
      {exhausted && (
        <p className="gl-energy-hint">
          Енергія на сьогодні вичерпана. Завершіть день або оберіть легку дію
          для відновлення.
        </p>
      )}
    </div>
  );
};

