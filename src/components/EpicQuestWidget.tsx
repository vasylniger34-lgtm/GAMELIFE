import { useMemo } from "react";
import { useGameLifeStore } from "../state/store";
import { EpicQuestStep } from "../state/types";

// Epic Quest Widget - віджет довгострокового квесту з етапами
export const EpicQuestWidget: React.FC = () => {
  const epicQuest = useGameLifeStore((s) => s.epicQuest);
  const completeEpicQuestStep = useGameLifeStore((s) => s.completeEpicQuestStep);
  const getEpicQuestProgress = useGameLifeStore((s) => s.getEpicQuestProgress);

  const progress = useMemo(() => {
    return getEpicQuestProgress();
  }, [epicQuest, getEpicQuestProgress]);

  if (!epicQuest) {
    return null; // Не показуємо віджет, якщо Epic Quest не створено
  }

  const currentStep = epicQuest.currentStepIndex >= 0 
    ? epicQuest.steps[epicQuest.currentStepIndex] 
    : null;
  const nextStep = epicQuest.currentStepIndex >= 0 && epicQuest.currentStepIndex < epicQuest.steps.length - 1
    ? epicQuest.steps[epicQuest.currentStepIndex + 1]
    : null;
  const isCompleted = epicQuest.currentStepIndex === -1;

  const handleStepComplete = (stepId: string) => {
    completeEpicQuestStep(stepId);
  };

  // v1.1: На головному екрані показуємо тільки поточний етап
  return (
    <div className="gl-card gl-epic-quest-widget">
      <div className="gl-card-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "1.5rem" }}>⚔️</span>
        <span>Epic Quest</span>
      </div>

      <div className="gl-epic-quest-content">
        <h3 className="gl-epic-quest-title">{epicQuest.title}</h3>
        {epicQuest.description && (
          <p className="gl-epic-quest-description">{epicQuest.description}</p>
        )}

        {/* Progress Bar */}
        <div className="gl-epic-quest-progress-container">
          <div className="gl-epic-quest-progress-label">
            Прогрес: {progress}%
          </div>
          <div className="gl-epic-quest-progress-bar">
            <div
              className="gl-epic-quest-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Тільки поточний етап на головному екрані */}
        {currentStep && (
          <div className="gl-epic-quest-current-step">
            <div className="gl-epic-quest-step-header">
              <span className="gl-epic-quest-step-label">Поточний етап:</span>
            </div>
            <div className="gl-epic-quest-step-item gl-epic-quest-step-active">
              <div className="gl-epic-quest-checkbox gl-epic-quest-checkbox-active" title="Етап виконується в розділі Квести" style={{ fontSize: "1.5rem", padding: "0.5rem" }}>
                {currentStep.completed ? "✅" : "⭕"}
              </div>
              <div className="gl-epic-quest-step-content">
                <div className="gl-epic-quest-step-title">{currentStep.title}</div>
                {currentStep.description && (
                  <div className="gl-epic-quest-step-desc">{currentStep.description}</div>
                )}
              </div>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.5rem", textAlign: "center" }}>
              Для зміни прогресу перейдіть в розділ "Квести"
            </p>
          </div>
        )}

        {/* Повідомлення про завершення */}
        {isCompleted && (
          <div className="gl-epic-quest-completed">
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎉</div>
            <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>Epic Quest завершено!</div>
            <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
              Всі етапи виконано. Вітаємо з досягненням!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
