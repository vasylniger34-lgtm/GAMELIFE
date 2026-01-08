import { useMemo } from "react";
import { useGameLifeStore } from "../state/store";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from "date-fns";
import { getDateKey } from "../state/time";
import { DailyStats } from "../state/types";

// Екран статистики: графіки статів, загальна статистика
const Statistics: React.FC = () => {
  // Використовуємо примітивні селектори
  const days = useGameLifeStore((s) => s.days);
  const quests = useGameLifeStore((s) => s.quests);
  const diamondsEarnedTotal = useGameLifeStore((s) => s.diamondsEarnedTotal);
  const xpTotal = useGameLifeStore((s) => s.profile.xpTotal);

  // Обчислюємо агреговану статистику в useMemo
  const aggregated = useMemo(() => {
    const daysArray = Object.values(days);
    const questsArray = Object.values(quests);
    const finishedDays = daysArray.filter((d) => d.status === "finished");
    const totalDays = finishedDays.length;
    const completedQuests = questsArray.filter((q) => q.status === "completed").length;
    const failedQuests = questsArray.filter((q) => q.status === "failed").length;

    return {
      totalDays,
      completedQuests,
      failedQuests,
      diamondsEarned: diamondsEarnedTotal,
      xpGained: xpTotal
    };
  }, [days, quests, diamondsEarnedTotal, xpTotal]);

  // Фільтруємо дні в useMemo - включаємо як завершені, так і активні дні
  const allDaysWithStats = useMemo(() => {
    return Object.values(days).filter((d) => 
      d.status === "finished" || d.status === "active"
    );
  }, [days]);

  // Отримуємо дані за останній місяць
  const monthlyData = useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Створюємо мапу дат для швидкого пошуку
    const daysMap = new Map<string, typeof allDaysWithStats[0]>();
    allDaysWithStats.forEach((d) => {
      daysMap.set(d.date, d);
    });

    // Для кожної дати місяця знаходимо значення статів, XP та зміну грошей
    return monthDays.map((date, index) => {
      const dateKey = getDateKey(date);
      const day = daysMap.get(dateKey);
      
      // Для активних днів використовуємо startStats (початкову статистику)
      // Для завершених днів використовуємо endStats (якщо є) або startStats
      let stats = null;
      let xpGained = null;
      let moneyChange = null;
      
      if (day) {
        // Знаходимо попередній день для обчислення змін (використовуємо subDays для точності)
        const prevDate = subDays(date, 1);
        const prevDateKey = getDateKey(prevDate);
        const prevDay = daysMap.get(prevDateKey);
        
        if (day.status === "active") {
          // Для активного дня показуємо початкову статистику
          stats = day.startStats;
          // XP за попередній день (якщо є) - при початку нового дня показуємо XP попереднього
          if (prevDay && prevDay.xpGained) {
            xpGained = prevDay.xpGained;
          }
          // Зміна грошей від попереднього дня - при початку нового дня порівнюємо startStats з попереднім днем
          if (prevDay) {
            // Беремо кінцеві гроші попереднього дня (якщо є) або початкові
            const prevMoney = prevDay.endStats?.money ?? prevDay.startStats.money;
            // Порівнюємо з початковими грошима поточного дня
            moneyChange = stats.money - prevMoney;
          }
        } else if (day.status === "finished") {
          // Для завершеного дня показуємо кінцеву статистику (якщо є) або початкову
          stats = day.endStats || day.startStats;
          // XP зароблений за цей день
          if (day.xpGained) {
            xpGained = day.xpGained;
          }
          // Зміна грошей від попереднього дня
          if (prevDay) {
            // Беремо кінцеві гроші попереднього дня (якщо є) або початкові
            const prevMoney = prevDay.endStats?.money ?? prevDay.startStats.money;
            // Порівнюємо з кінцевими грошима поточного дня
            moneyChange = stats.money - prevMoney;
          }
        }
      }
      
      return {
        date: dateKey,
        dateObj: date,
        stats: stats,
        xpGained: xpGained,
        moneyChange: moneyChange
      };
    });
  }, [allDaysWithStats]);

  // Функція для відображення графіка XP
  const renderXpChart = () => {
    const data = monthlyData.map((d) => ({
      date: d.date,
      value: d.xpGained ?? null,
      hasData: d.xpGained !== null
    }));

    const maxValue = Math.max(...data.filter(d => d.value !== null).map(d => d.value!), 10);

    return (
      <div className="gl-card">
        <div className="gl-card-title">XP зароблений за день</div>
        <div className="gl-chart-container">
          <div className="gl-chart-row">
            {data.map((d, idx) => {
              if (!d.hasData || d.value === null) {
                return (
                  <div key={idx} className="gl-chart-col">
                    <div className="gl-chart-bar gl-chart-bar-empty" />
                    <span className="gl-chart-label">
                      {format(monthlyData[idx].dateObj, "dd")}
                    </span>
                  </div>
                );
              }
              const percent = maxValue > 0 ? (d.value / maxValue) * 100 : 0;
              return (
                <div key={idx} className="gl-chart-col">
                  <div
                    className="gl-chart-bar"
                    style={{ 
                      height: `${Math.min(100, Math.max(0, percent))}%`,
                      background: "linear-gradient(to top, var(--neon-green), var(--neon-teal))"
                    }}
                    title={`${format(new Date(d.date), "dd.MM")}: +${d.value} XP`}
                  />
                  <span className="gl-chart-label">
                    {format(monthlyData[idx].dateObj, "dd")}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="gl-chart-legend">
            <span>Мін: 0</span>
            <span>Макс: {maxValue}</span>
          </div>
        </div>
      </div>
    );
  };

  // Функція для відображення графіка зміни грошей
  const renderMoneyChangeChart = () => {
    const data = monthlyData.map((d) => ({
      date: d.date,
      value: d.moneyChange ?? null,
      hasData: d.moneyChange !== null
    }));

    const allValues = data.filter(d => d.value !== null).map(d => d.value!);
    const maxValue = allValues.length > 0 ? Math.max(...allValues, 100) : 100;
    const minValue = allValues.length > 0 ? Math.min(...allValues, -100) : -100;

    return (
      <div className="gl-card">
        <div className="gl-card-title">Зміна грошей від попереднього дня</div>
        <p className="gl-muted" style={{ fontSize: "0.75rem", marginBottom: "0.5rem" }}>
          Показує скільки грошей додалося (+) або зменшилося (-) порівняно з попереднім днем
        </p>
        <div className="gl-chart-container">
          <div className="gl-chart-row">
            {data.map((d, idx) => {
              if (!d.hasData || d.value === null) {
                return (
                  <div key={idx} className="gl-chart-col">
                    <div className="gl-chart-bar gl-chart-bar-empty" />
                    <span className="gl-chart-label">
                      {format(monthlyData[idx].dateObj, "dd")}
                    </span>
                  </div>
                );
              }
              // Для від'ємних значень - червоний, для додатних - зелений
              const isPositive = d.value >= 0;
              const percent = maxValue !== minValue
                ? ((d.value - minValue) / (maxValue - minValue)) * 100
                : 50;
              return (
                <div key={idx} className="gl-chart-col">
                  <div
                    className="gl-chart-bar"
                    style={{ 
                      height: `${Math.min(100, Math.max(0, percent))}%`,
                      background: isPositive 
                        ? "linear-gradient(to top, var(--neon-green), var(--neon-teal))"
                        : "linear-gradient(to top, var(--neon-red), #dc2626)"
                    }}
                    title={`${format(new Date(d.date), "dd.MM")}: ${d.value > 0 ? "+" : ""}${d.value.toFixed(0)} $`}
                  />
                  <span className="gl-chart-label">
                    {format(monthlyData[idx].dateObj, "dd")}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="gl-chart-legend">
            <span>Мін: {minValue.toFixed(0)} $</span>
            <span>Макс: {maxValue.toFixed(0)} $</span>
          </div>
        </div>
      </div>
    );
  };

  // Функція для відображення графіка однієї стати
  const renderStatChart = (statKey: keyof DailyStats, label: string) => {
    const data = monthlyData.map((d) => {
      if (!d.stats) return null;
      const value = d.stats[statKey];
      return {
        date: d.date,
        value: typeof value === "number" ? value : 0,
        hasData: d.stats !== null
      };
    });

    const maxValue = statKey === "sleepHours" ? 12 : statKey === "money" ? Math.max(...data.filter(d => d).map(d => d!.value), 100) : 100;
    const minValue = statKey === "money" ? Math.min(...data.filter(d => d).map(d => d!.value), -100) : 0;

    return (
      <div key={statKey} className="gl-card">
        <div className="gl-card-title">{label}</div>
        <div className="gl-chart-container">
          <div className="gl-chart-row">
            {data.map((d, idx) => {
              if (!d || !d.hasData) {
                return (
                  <div key={idx} className="gl-chart-col">
                    <div className="gl-chart-bar gl-chart-bar-empty" />
                    <span className="gl-chart-label">
                      {format(monthlyData[idx].dateObj, "dd")}
                    </span>
                  </div>
                );
              }
              const percent = maxValue !== minValue
                ? ((d.value - minValue) / (maxValue - minValue)) * 100
                : 50;
              return (
                <div key={idx} className="gl-chart-col">
                  <div
                    className="gl-chart-bar"
                    style={{ height: `${Math.min(100, Math.max(0, percent))}%` }}
                    title={`${format(new Date(d.date), "dd.MM")}: ${d.value.toFixed(statKey === "money" ? 0 : statKey === "sleepHours" ? 1 : 0)}`}
                  />
                  <span className="gl-chart-label">
                    {format(monthlyData[idx].dateObj, "dd")}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="gl-chart-legend">
            <span>Мін: {minValue.toFixed(statKey === "money" ? 0 : statKey === "sleepHours" ? 1 : 0)}</span>
            <span>Макс: {maxValue.toFixed(statKey === "money" ? 0 : statKey === "sleepHours" ? 1 : 0)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="gl-page">
      <div className="gl-page-header">
        <h1 className="gl-page-title">Статистика</h1>
      </div>

      {/* Загальна статистика */}
      <div className="gl-card">
        <div className="gl-card-title">Загальна статистика</div>
        <div className="gl-stats-summary">
          <div className="gl-stats-summary-item">
            <span>Днів загалом</span>
            <strong>{aggregated.totalDays}</strong>
          </div>
          <div className="gl-stats-summary-item">
            <span>Квестів виконано</span>
            <strong>{aggregated.completedQuests}</strong>
          </div>
          <div className="gl-stats-summary-item">
            <span>Квестів провалено</span>
            <strong>{aggregated.failedQuests}</strong>
          </div>
          <div className="gl-stats-summary-item">
            <span>Діамантів зароблено</span>
            <strong>💎 {aggregated.diamondsEarned}</strong>
          </div>
          <div className="gl-stats-summary-item">
            <span>Досвіду отримано</span>
            <strong>{aggregated.xpGained} XP</strong>
          </div>
        </div>
      </div>

      {/* Графіки статів за місяць - окремо для кожної стати */}
      <div className="gl-card">
        <div className="gl-card-title">Графіки статів (поточний місяць)</div>
        <p className="gl-muted">
          Лінійні графіки для кожної характеристики. Для активних днів показується початкова статистика, для завершених - кінцева.
        </p>
      </div>

      {renderStatChart("mood", "Настрій / Психічний стан")}
      {renderStatChart("money", "Гроші ($)")}
      {renderStatChart("energy", "Енергія")}
      {renderStatChart("motivation", "Мотивація")}
      {renderStatChart("stress", "Стрес")}
      {renderStatChart("momentum", "Імпульс")}
      {renderStatChart("sleepHours", "Години сну")}

      {/* Графік XP заробленого за день */}
      {renderXpChart()}

      {/* Графік зміни грошей від попереднього дня */}
      {renderMoneyChangeChart()}
    </div>
  );
};

export default Statistics;
