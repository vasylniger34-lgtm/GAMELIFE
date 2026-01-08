import { useGameLifeStore } from "../state/store";
import { Project, Quest } from "../state/types";

// Екран проєктів: головні квести як проєкти з відсотком прогресу
const Projects: React.FC = () => {
  const projects = useGameLifeStore((s) => s.getActiveProjects());
  const questsMap = useGameLifeStore((s) => s.quests);

  const getProgress = (project: Project): number => {
    const quests: Quest[] = project.questIds
      .map((id) => questsMap[id])
      .filter(Boolean);
    if (!quests.length) return 0;
    const completed = quests.filter((q) => q.status === "completed")
      .length;
    return Math.round((completed / quests.length) * 100);
  };

  return (
    <div className="gl-page">
      <div className="gl-page-header">
        <h1 className="gl-page-title">Проєкти</h1>
      </div>

      {projects.length === 0 ? (
        <p className="gl-muted">
          Поки що немає активних проєктів. Створи головний квест у Планері
          або Сьогодні, щоб розпочати.
        </p>
      ) : (
        <div className="gl-list">
          {projects.map((p) => {
            const progress = getProgress(p);
            return (
              <article key={p.id} className="gl-list-item gl-project">
                <div className="gl-list-main">
                  <div className="gl-list-title">{p.title}</div>
                  {p.description && (
                    <div className="gl-list-sub">{p.description}</div>
                  )}
                  <div className="gl-project-progress-row">
                    <div className="gl-project-progress-label">
                      Прогрес: {progress}%
                    </div>
                    <div className="gl-stat-bar gl-project-bar">
                      <div
                        className="gl-stat-bar-fill gl-project-bar-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="gl-list-meta">
                    <span>Квестів у проєкті: {p.questIds.length}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Projects;

