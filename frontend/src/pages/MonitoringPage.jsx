import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { liveParameters, recommendations } from "../data/dummyData";
import { defaultMode, liveBatchRow } from "../data/livePayload";
import { getRecommendation } from "../lib/api";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" },
});

function MonitoringPage() {
  const [rows, setRows] = useState(recommendations);
  const [message, setMessage] = useState("");
  const [params, setParams] = useState(liveParameters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasPending = useMemo(() => rows.some((r) => !r.decision), [rows]);

  const handleDecision = (parameter, decision) => {
    setRows((prev) =>
      prev.map((row) => row.parameter === parameter ? { ...row, decision } : row)
    );
    setMessage(
      decision === "Applied"
        ? `${parameter} recommendation applied and queued for execution.`
        : `${parameter} recommendation overridden by operator.`
    );
  };

  const fetchRecommendation = async () => {
    setLoading(true);
    setError("");
    try {
      const rec = await getRecommendation({
        row: liveBatchRow,
        mode: defaultMode,
        energy_price: 0.12,
        carbon_price: 0.04,
      });
      const newRows = [
        { parameter: "Mixing Speed", key: "mixing_speed", unit: "rpm" },
        { parameter: "Temperature", key: "temperature", unit: "°C" },
        { parameter: "Pressure", key: "pressure", unit: "bar" },
      ].map((item) => ({
        parameter: item.parameter,
        current: Number(liveBatchRow[item.key]).toFixed(2),
        recommended: Number(rec.parameters?.[item.key] ?? liveBatchRow[item.key]).toFixed(2),
        unit: item.unit,
        confidence: `${Math.max(70, Math.min(99, Math.round((1 - Number(rec.drift_score ?? 0) / 10) * 100)))}%`,
      }));
      setRows(newRows);
      setParams([
        { key: "Temperature", value: `${Number(liveBatchRow.temperature).toFixed(1)} °C`, status: "Within" },
        { key: "Pressure", value: `${Number(liveBatchRow.pressure).toFixed(1)} bar`, status: "Within" },
        {
          key: "Mixing Speed", value: `${Number(liveBatchRow.mixing_speed).toFixed(0)} rpm`,
          status: Number(rec.parameters?.mixing_speed ?? liveBatchRow.mixing_speed) === Number(liveBatchRow.mixing_speed) ? "Within" : "Deviation"
        },
        { key: "Batch Size", value: `${Number(liveBatchRow.batch_size).toFixed(0)} kg`, status: "Within" },
      ]);
      setMessage("Live recommendation pulled from optimization service.");
    } catch (e) {
      setError(`Unable to load live recommendation — showing fallback. (${e.message})`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecommendation(); }, []);

  return (
    <div className="page-grid">
      {/* Live Params */}
      <motion.section className="panel panel--span-6" {...fadeUp(0)}>
        <div className="panel__header">
          <h2><span className="panel__icon">◉</span>Live Batch Parameters</h2>
          <button className="btn" type="button" onClick={fetchRecommendation} disabled={loading}>
            {loading ? "⟳ Refreshing..." : "↻ Refresh"}
          </button>
        </div>
        {error && <p className="action-note">{error}</p>}
        <table className="table">
          <thead>
            <tr><th>Parameter</th><th>Value</th><th>Status</th></tr>
          </thead>
          <tbody>
            {params.map((item) => (
              <tr key={item.key}>
                <td style={{ fontWeight: 500 }}>{item.key}</td>
                <td style={{ color: "#f5c842", fontWeight: 600 }}>{item.value}</td>
                <td>
                  <span className={item.status === "Within" ? "badge badge--ok" : "badge badge--alert"}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.section>

      {/* Deviation Alert */}
      <motion.section className="panel panel--span-6" {...fadeUp(0.1)}>
        <div className="panel__header">
          <h2><span className="panel__icon">⚠</span>Deviation Alerts</h2>
        </div>
        <div className="alert-card">
          <h3>⚡ Mixing Speed High</h3>
          <p>Observed 338 rpm — threshold upper bound 330 rpm under current material profile.</p>
          <p className="alert-card__time">First detected: 09:31 &nbsp;·&nbsp; Open for: 11 min</p>
        </div>
      </motion.section>

      {/* Recommendations Table */}
      <motion.section className="panel panel--span-12" {...fadeUp(0.2)}>
        <div className="panel__header">
          <h2><span className="panel__icon">⊞</span>Recommended Parameter Adjustments</h2>
          {!hasPending && <span className="badge badge--ok">All Reviewed</span>}
        </div>
        {message && <p className="action-note">{message}</p>}
        <table className="table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Current</th>
              <th>Recommended</th>
              <th>Confidence</th>
              <th>Decision</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.parameter}>
                <td style={{ fontWeight: 500 }}>{row.parameter}</td>
                <td style={{ color: "var(--text-muted)" }}>{row.current} {row.unit}</td>
                <td style={{ color: "#f5c842", fontWeight: 600 }}>{row.recommended} {row.unit}</td>
                <td>
                  <span style={{
                    color: parseInt(row.confidence) >= 85 ? "var(--ok)" : "var(--gold)",
                    fontWeight: 600
                  }}>
                    {row.confidence}
                  </span>
                </td>
                <td>
                  <span style={{
                    color: row.decision === "Applied" ? "var(--ok)" : row.decision === "Overridden" ? "var(--alert)" : "var(--text-muted)",
                    fontWeight: 500
                  }}>
                    {row.decision || "Pending"}
                  </span>
                </td>
                <td style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn--primary" type="button" onClick={() => handleDecision(row.parameter, "Applied")}>
                    Apply
                  </button>
                  <button className="btn btn--text" type="button" onClick={() => handleDecision(row.parameter, "Overridden")}>
                    Override
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.section>
    </div>
  );
}

export default MonitoringPage;
