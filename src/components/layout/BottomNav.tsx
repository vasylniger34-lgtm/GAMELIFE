import { NavLink } from "react-router-dom";

// Нижня мобільна навігація з великими іконками (тільки 5 розділів)
export const BottomNav: React.FC = () => {
  const links = [
    { to: "/", label: "Головна", icon: "🏠" },
    { to: "/quests", label: "Квести", icon: "🎯" },
    { to: "/statistics", label: "Статистика", icon: "📈" },
    { to: "/shop", label: "Магазин", icon: "🛒" },
    { to: "/profile", label: "Профіль", icon: "🧿" } // легкий натяк на "третє око"
  ] as const;

  return (
    <nav className="gl-bottom-nav">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === "/"}
          className="gl-nav-item"
        >
          <span className="gl-nav-icon" aria-hidden="true">
            {link.icon}
          </span>
          <span className="gl-nav-label">{link.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
