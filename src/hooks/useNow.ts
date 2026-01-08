import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { useGameLifeStore } from "../state/store";

// Хук для відображення поточного часу + синхронізації з глобальним станом
export const useNow = () => {
  const [now, setNow] = useState<Date>(() => new Date());
  const touchTimeRef = useRef(useGameLifeStore.getState().touchTime);

  // Оновлюємо ref при зміні функції
  useEffect(() => {
    touchTimeRef.current = useGameLifeStore.getState().touchTime;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
      touchTimeRef.current();
    }, 30_000); // оновлення раз на 30 секунд

    return () => clearInterval(interval);
  }, []); // Порожній масив - інтервал створюється один раз

  return {
    now,
    dateLabel: format(now, "dd.MM.yyyy"),
    timeLabel: format(now, "HH:mm")
  };
};

