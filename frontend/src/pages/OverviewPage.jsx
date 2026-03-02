import { useEffect, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import KpiCard from "../components/KpiCard";
import { batchVsSignature, kpiCards, trendData } from "../data/dummyData";
import { defaultMode, liveBatchRow } from "../data/livePayload";
import { compareBatch } from "../lib/api";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: "easeOut" },
});

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#161f33",
      border: "1px solid rgba(245,200,66,0.25)",
      borderRadius: 10,
      padding: "10px 14px",
      fontSize: "0.82rem",
    }}>
      <p style={{ color: "#f5c842", fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color, margin: "2px 0" }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

function OverviewPage() {
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    compareBatch({ row: liveBatchRow, mode: defaultMode })
      .then((data) => { if (active) { setComparison(data); setError(""); } })
      .catch((e) => { if (active) setError(`Backend data unavailable — showing fallback. (${e.message})`); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const runtimeKpis = useMemo(() => {
    if (!comparison?.prediction) return kpiCards;
    const p = comparison.prediction;
    return [
      { label: "Current Yield", value: `${Number(p.yield).toFixed(1)}%`, delta: "Live", positive: true },
      { label: "Energy / Batch", value: `${Number(p.energy_kwh).toFixed(0)} kWh`, delta: "Live", positive: true },
      { label: "Emission Intensity", value: `${Number(p.emission_kgco2e).toFixed(0)} kg`, delta: "Live", positive: true },
      { label: "Quality Index", value: `${Number(p.quality_score).toFixed(1)}`, delta: "Live", positive: true },
    ];
  }, [comparison]);

  const comparisonRows = useMemo(() => {
    if (!comparison?.prediction || !comparison?.active_signature) return batchVsSignature;
    const p = comparison.prediction;
    const s = comparison.active_signature.objectives || {};
    return [
      { metric: "Yield (%)", current: Number(p.yield).toFixed(2), golden: Number(s.yield ?? 0).toFixed(2), status: Number(p.yield) >= Number(s.yield ?? p.yield) ? "Within" : "Deviation" },
      { metric: "Energy (kWh)", current: Number(p.energy_kwh).toFixed(2), golden: Number(s.energy_kwh ?? 0).toFixed(2), status: Number(p.energy_kwh) <= Number(s.energy_kwh ?? p.energy_kwh) ? "Within" : "Deviation" },
      { metric: "Quality Score", current: Number(p.quality_score).toFixed(2), golden: Number(s.quality_score ?? 0).toFixed(2), status: Number(p.quality_score) >= Number(s.quality_score ?? p.quality_score) ? "Within" : "Deviation" },
      { metric: "Emission (kgCO2e)", current: Number(p.emission_kgco2e).toFixed(2), golden: Number(s.emission_kgco2e ?? 0).toFixed(2), status: Number(p.emission_kgco2e) <= Number(s.emission_kgco2e ?? p.emission_kgco2e) ? "Within" : "Deviation" },
    ];
  }, [comparison]);

  const hasDeviation = comparisonRows.some((r) => r.status === "Deviation");

  return (
    <div className="page-grid">
      {/* KPI Row */}
      <section className="panel panel--span-12">
        {loading && <p className="subtle" style={{ marginBottom: 12 }}>⟳ Loading live predictions...</p>}
        {error && <p className="action-note">{error}</p>}
        <div className="kpi-grid">
          {runtimeKpis.map((card, i) => (
            <KpiCard key={card.label} {...card} index={i} />
          ))}
        </div>
      </section>

      {/* Chart */}
      <motion.section className="panel panel--span-8" {...fadeUp(0.15)}>
        <div className="panel__header">
          <h2><span className="panel__icon">📈</span>Trend Comparison</h2>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="gradYield" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f5c842" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f5c842" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradQuality" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <XAxis dataKey="shift" tick={{ fill: "#6b7897", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7897", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "0.8rem", color: "#6b7897" }} />
              <Area type="monotone" dataKey="yield" stroke="#f5c842" strokeWidth={2.5} fill="url(#gradYield)" dot={false} name="Yield" />
              <Area type="monotone" dataKey="quality" stroke="#10b981" strokeWidth={2.5} fill="url(#gradQuality)" dot={false} name="Quality" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      {/* Batch Status */}
      <motion.section className="panel panel--span-4" {...fadeUp(0.22)}>
        <div className="panel__header">
          <h2><span className="panel__icon">⬡</span>Batch Status</h2>
        </div>
        <div className="status-block">
          <span className={hasDeviation ? "status-indicator status-indicator--warn" : "status-indicator status-indicator--ok"} />
          <div>
            <p className="status-title">{hasDeviation ? "Deviation Detected" : "Within Golden Range"}</p>
            <p className="status-text">
              {hasDeviation
                ? "At least one objective is outside the active golden signature bounds."
                : "Current batch remains aligned with active golden signature targets."}
            </p>
          </div>
        </div>
      </motion.section>

      {/* Comparison Table */}
      <motion.section className="panel panel--span-12" {...fadeUp(0.3)}>
        <div className="panel__header">
          <h2><span className="panel__icon">⊞</span>Current Batch vs Golden Signature</h2>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Current Batch</th>
              <th>Golden Signature</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row) => (
              <tr key={row.metric}>
                <td style={{ fontWeight: 500 }}>{row.metric}</td>
                <td>{row.current}</td>
                <td style={{ color: "#f5c842" }}>{row.golden}</td>
                <td>
                  <span className={row.status === "Within" ? "badge badge--ok" : "badge badge--alert"}>
                    <span className="pulse-dot" style={{ width: 5, height: 5 }} />
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.section>
    </div>
  );
}

export default OverviewPage;
