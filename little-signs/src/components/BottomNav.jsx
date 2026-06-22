import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/today", label: "Today", icon: "☀️" },
  { to: "/learn", label: "Learn", icon: "🤟" },
  { to: "/practice", label: "Practice", icon: "✨" },
  { to: "/routines", label: "Routines", icon: "🏡" },
  { to: "/progress", label: "Progress", icon: "🌱" }
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <span aria-hidden="true">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
