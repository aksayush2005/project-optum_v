import { useEffect, useMemo, useState } from "react";
import {
  RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis,
} from "recharts";
import { motion } from "framer-motion";
import { gaugeData, liveParameters, recommendations } from "../data/dummyData";
import { defaultMode, liveInputRow } from "../data/livePayload";
import { getRecommendation } from "../lib/api";
import Skeleton from "../components/Skeleton";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" },
});

function Gauge({ value, label, color, max = 100 }) {
  const data = [{ value, fill: color }];
  return (
    <div className="gauge-wrap">
      <div className="gauge-label">{label}</div>
      <ResponsiveContainer width={160} height={160}>
        <RadialBarChart
          innerRadius={48}
          outerRadius={72}
          data={data}
          startAngle={210}
          endAngle={-30}
        >
          <PolarAngleAxis type="number" domain={[0, max]} angleAxisId={0} tick={false} />
          <RadialBar
            background={{ fill: "rgba(255,255,255,0.04)" }}
            dataKey="value"
            angleAxisId={0}
            cornerRadius={6}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="gauge-value">{value}%</div>
    </div>
  );
}

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
        row: liveInputRow,
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
        current: Number(liveInputRow[item.key]).toFixed(2),
        recommended: Number(rec.parameters?.[item.key] ?? liveInputRow[item.key]).toFixed(2),
        unit: item.unit,
        confidence: `${Math.max(70, Math.min(99, Math.round((1 - Number(rec.drift_score ?? 0) / 10) * 100)))}%`,
      }));
      setRows(newRows);
      setParams([
        { key: "Temperature", value: `${Number(liveInputRow.temperature).toFixed(1)} °C`, status: "Within" },
        { key: "Pressure", value: `${Number(liveInputRow.pressure).toFixed(1)} bar`, status: "Within" },
        {
          key: "Mixing Speed", value: `${Number(liveInputRow.mixing_speed).toFixed(0)} rpm`,
          status: Number(rec.parameters?.mixing_speed ?? liveInputRow.mixing_speed) === Number(liveInputRow.mixing_speed) ? "Within" : "Deviation"
        },
        { key: "Batch Size", value: `${Number(liveInputRow.batch_size).toFixed(0)} kg`, status: "Within" },
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
      {/* Animated Gauges */}
      <motion.section className="panel panel--span-4" {...fadeUp(0)}>
        <div className="panel__header">
          <h2><span className="panel__icon">◯</span>Batch Health Gauges</h2>
        </div>
        <div style={{ display: "flex", justifyContent: "space-around", padding: "8px 0 4px" }}>
          <Gauge
            value={gaugeData.batchVariability}
            label="Batch Variability"
            color="url(#goldGrad)"
            max={100}
          />
          <Gauge
            value={gaugeData.targetCompliance}
            label="Target Compliance"
            color="#10b981"
            max={100}
          />
        </div>
        {/* SVG gradient definition */}
        <svg style={{ position: "absolute", width: 0, height: 0 }}>
          <defs>
            <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#c98f18" />
              <stop offset="100%" stopColor="#f5c842" />
            </linearGradient>
          </defs>
        </svg>
      </motion.section>

      {/* Live Params */}
      <motion.section className="panel panel--span-4" {...fadeUp(0.08)}>
        <div className="panel__header">
          <h2><span className="panel__icon">◉</span>Live Batch Parameters</h2>
          <button className="btn" type="button" onClick={fetchRecommendation} disabled={loading}>
            {loading ? "⟳" : "↻"} Refresh
          </button>
        </div>
        {error && <p className="action-note">{error}</p>}
        {loading ? (
          <Skeleton rows={4} height={20} wide />
        ) : (
          <table className="table">
            <thead><tr><th>Parameter</th><th>Value</th><th>Status</th></tr></thead>
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
        )}
      </motion.section>

      {/* Deviation Alert */}
      <motion.section className="panel panel--span-4" {...fadeUp(0.15)}>
        <div className="panel__header">
          <h2><span className="panel__icon">⚠</span>Deviation Alerts</h2>
        </div>
        <div className="alert-card">
          <h3>⚡ Mixing Speed High</h3>
          <p>Observed 338 rpm — threshold upper bound 330 rpm under current material profile.</p>
          <p className="alert-card__time">First detected: 09:31 · Open for: 11 min</p>
        </div>
      </motion.section>

      {/* Recommendations Table */}
      <motion.section className="panel panel--span-12" {...fadeUp(0.22)}>
        <div className="panel__header">
          <h2><span className="panel__icon">⊞</span>Recommended Parameter Adjustments</h2>
          {!hasPending && <span className="badge badge--ok">All Reviewed</span>}
        </div>
        {message && <p className="action-note">{message}</p>}
        <table className="table">
          <thead>
            <tr>
              <th>Parameter</th><th>Current</th><th>Recommended</th>
              <th>Confidence</th><th>Decision</th><th>Action</th>
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
                    fontWeight: 600,
                  }}>
                    {row.confidence}
                  </span>
                </td>
                <td>
                  <span style={{
                    color: row.decision === "Applied" ? "var(--ok)" : row.decision === "Overridden" ? "var(--alert)" : "var(--text-muted)",
                    fontWeight: 500,
                  }}>
                    {row.decision || "Pending"}
                  </span>
                </td>
                <td style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn--primary" type="button" onClick={() => handleDecision(row.parameter, "Applied")}>Apply</button>
                  <button className="btn btn--text" type="button" onClick={() => handleDecision(row.parameter, "Overridden")}>Override</button>
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
