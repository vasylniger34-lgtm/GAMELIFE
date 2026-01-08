import { format } from "date-fns";

// Утиліти для роботи з датами/часом в одному місці

// Ключ дати у форматі YYYY-MM-DD
export const getDateKey = (d: Date = new Date()): string =>
  format(d, "yyyy-MM-dd");

// Повертає ISO‑час
export const nowIso = (): string => new Date().toISOString();

// Різниця в годинах між двома timestamp (ms)
export const diffHours = (from: number, to: number): number =>
  (to - from) / (1000 * 60 * 60);

