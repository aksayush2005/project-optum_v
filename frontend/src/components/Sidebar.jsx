import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/overview", label: "Overview" },
  { to: "/signatures", label: "Golden Signatures" },
  { to: "/monitoring", label: "Real-Time Monitoring" },
  { to: "/targets", label: "Target Configuration" },
  { to: "/history", label: "Historical Analytics" }
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__title">GS Optimization</div>
        <div className="sidebar__subtitle">Batch Manufacturing</div>
      </div>
      <nav className="sidebar__nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? "nav-link nav-link--active" : "nav-link")}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
