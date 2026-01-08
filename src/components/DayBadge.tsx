import { DayStatus } from "../state/types";

// Невеликий бейдж статусу дня
export const DayBadge: React.FC<{ status: DayStatus }> = ({ status }) => {
  const label =
    status === "inactive"
      ? "День не розпочато"
      : status === "active"
      ? "День триває"
      : "День завершено";

  return <span className={`gl-day-badge gl-day-badge-${status}`}>{label}</span>;
};

