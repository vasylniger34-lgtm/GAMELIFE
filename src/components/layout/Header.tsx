import { useNow } from "../../hooks/useNow";
import { useGameLifeStore } from "../../state/store";
import { SaveIndicator } from "../SaveIndicator";

// Верхня панель з датою, часом та коротким повідомленням (v1.1: fixed зверху з логотипом)
export const Header: React.FC = () => {
  const { dateLabel, timeLabel } = useNow();
  const timeSuspicious = useGameLifeStore(
    (s) => s.timeMeta.timeSuspicious
  );

  return (
    <>
      <header className="gl-header gl-header-fixed">
        <div className="gl-header-logo">
          <img src="/pwa-icon.png" alt="Game Life" className="gl-logo-img" />
        </div>
        <div className="gl-header-time-container">
          <div className="gl-header-date">{dateLabel}</div>
          <div className="gl-header-time">{timeLabel}</div>
        </div>
        <div className="gl-header-right">
          {timeSuspicious && (
            <div className="gl-header-warning">
              ⚠️
            </div>
          )}
          <SaveIndicator />
        </div>
      </header>
      {/* Spacer для fixed header */}
      <div className="gl-header-spacer"></div>
    </>
  );
};

