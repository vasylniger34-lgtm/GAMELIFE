import { useMemo } from "react";
import { useGameLifeStore } from "../state/store";
import { format } from "date-fns";

// v1.1: Компонент для відображення індикатора збереження з "Last saved: HH:MM"
export const SaveIndicator: React.FC = () => {
  const lastSavedAt = useGameLifeStore((s) => s.lastSavedAt);

  const formattedTime = useMemo(() => {
    if (!lastSavedAt) return null;
    try {
      return format(new Date(lastSavedAt), "HH:mm");
    } catch {
      return null;
    }
  }, [lastSavedAt]);

  if (!formattedTime) {
    return null;
  }

  return (
    <div className="gl-save-indicator">
      <span className="gl-save-indicator-text">
        Last saved: {formattedTime}
      </span>
    </div>
  );
};
