import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getHealth } from "../lib/api";

function Navbar() {
  const [status, setStatus] = useState("Checking");
  const [ok, setOk] = useState(null);
  const [time, setTime] = useState(() => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));

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
        <span className="topbar__user">R. Sharma</span>
      </div>
    </motion.header>
  );
}

export default Navbar;
