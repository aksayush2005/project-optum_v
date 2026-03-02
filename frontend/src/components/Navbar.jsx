import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getHealth } from "../lib/api";
import { assetAlerts } from "../data/dummyData";

function Navbar() {
  const [status, setStatus] = useState("Checking");
  const [ok, setOk] = useState(null);
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  );
  const [alerts, setAlerts] = useState(assetAlerts);
  const [notifOpen, setNotifOpen] = useState(false);
  const bellRef = useRef(null);
  const unreadCount = alerts.filter((a) => !a.read).length;

  useEffect(() => {
    let isMounted = true;
    getHealth()
      .then((data) => {
        if (!isMounted) return;
        const healthy = data?.status === "ok";
        setOk(healthy);
        setStatus(healthy ? "Backend Connected" : "Backend Degraded");
      })
      .catch(() => {
        if (!isMounted) return;
        setOk(false);
        setStatus("Backend Unreachable");
      });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    }, 30000);
    return () => clearInterval(id);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markRead = (id) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  };

  return (
    <motion.header
      className="topbar"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <div>
        <h1 className="topbar__title">
          Golden Signature Multi-Objective Optimization Engine
        </h1>
        <p className="topbar__meta">
          Plant: Pune Site 2 &nbsp;|&nbsp; Shift: A &nbsp;|&nbsp; Last sync: {time}
        </p>
      </div>

      <div className="topbar__right">
        {ok !== null && (
          <span className={ok ? "badge badge--ok" : "badge badge--alert"}>
            <span className="pulse-dot" />
            {status}
          </span>
        )}

        {/* Notification Bell */}
        <div ref={bellRef} style={{ position: "relative" }}>
          <button
            className="notif-btn"
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notifications"
          >
            🔔
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount}</span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                className="notif-dropdown"
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                <div className="notif-header">
                  Asset Health Alerts {unreadCount > 0 && `· ${unreadCount} new`}
                </div>
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`notif-item notif-item--${alert.severity} ${!alert.read ? "notif-item--unread" : ""}`}
                    onClick={() => markRead(alert.id)}
                  >
                    <p className="notif-item__title">
                      {alert.severity === "warn" ? "⚡" : "ℹ"} {alert.title}
                      {!alert.read && (
                        <span style={{
                          marginLeft: "auto",
                          width: 7, height: 7,
                          borderRadius: "50%",
                          background: "var(--alert)",
                          flexShrink: 0,
                        }} />
                      )}
                    </p>
                    <p className="notif-item__body">{alert.body}</p>
                    <p className="notif-item__time">{alert.time}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <span className="topbar__user">R. Sharma</span>
      </div>
    </motion.header>
  );
}

export default Navbar;
