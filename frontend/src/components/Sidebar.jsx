import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

const navItems = [
  { to: "/overview", label: "Overview", icon: "◈" },
  { to: "/signatures", label: "Golden Signatures", icon: "✦" },
  { to: "/monitoring", label: "Real-Time Monitoring", icon: "◉" },
  { to: "/targets", label: "Target Configuration", icon: "⊕" },
  { to: "/history", label: "Historical Analytics", icon: "◷" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { ease: "easeOut", duration: 0.35 } },
};

function Sidebar() {
  return (
    <aside className="sidebar">
      <motion.div
        className="sidebar__brand"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="sidebar__title">GS Optimization</div>
        <div className="sidebar__subtitle">Batch Manufacturing</div>
      </motion.div>

      <motion.nav
        className="sidebar__nav"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {navItems.map((item) => (
          <motion.div key={item.to} variants={itemVariants}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                isActive ? "nav-link nav-link--active" : "nav-link"
              }
            >
              <span style={{ fontSize: "0.9rem", lineHeight: 1 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          </motion.div>
        ))}
      </motion.nav>

      <div className="sidebar__footer">
        v0.1.0 · Pune Site 2
      </div>
    </aside>
  );
}

export default Sidebar;
