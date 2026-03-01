import { useEffect, useState } from "react";
import { getHealth } from "../lib/api";

function Navbar() {
  const [status, setStatus] = useState("Checking");
  const [ok, setOk] = useState(false);

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

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="topbar">
      <div>
        <h1 className="topbar__title">Golden Signature Multi-Objective Optimization Engine</h1>
        <p className="topbar__meta">Plant: Pune Site 2 | Shift: A | Last sync: 09:42</p>
      </div>
      <div className="topbar__right">
        <span className={ok ? "badge badge--ok" : "badge badge--alert"}>{status}</span>
        <span className="topbar__user">Operator: R. Sharma</span>
      </div>
    </header>
  );
}

export default Navbar;
