import { useEffect, useRef, useState } from "react";
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { motion } from "framer-motion";
import { energySavingsTrend, historyRows, reliabilityMap } from "../data/dummyData";
import { simulateWhatIf } from "../lib/api";
import Skeleton from "../components/Skeleton";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" },
});

const GOLD_SHADES = ["#f5c842", "#e0a820", "#c98f18", "#b57a12", "#9f6a0e", "#8a5a0a"];

// Rich hover tooltip for bar chart
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? 0;
  return (
    <div style={{
      background: "linear-gradient(135deg, #111827 0%, #1a2540 100%)",
      border: "1px solid rgba(245,200,66,0.35)",
      borderRadius: 12,
      padding: "12px 16px",
      fontSize: "0.82rem",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      minWidth: 160,
    }}>
      <p style={{ color: "#f5c842", fontWeight: 700, letterSpacing: "0.04em", marginBottom: 8, fontSize: "0.75rem", textTransform: "uppercase" }}>
        {label}
      </p>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <span style={{ color: "#6b7897" }}>Energy Saved</span>
        <strong style={{ color: "#e8eaf0" }}>{val} kWh</strong>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginTop: 4 }}>
        <span style={{ color: "#6b7897" }}>vs. baseline</span>
        <strong style={{ color: "#10b981" }}>+{(val * 0.22).toFixed(1)}%</strong>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginTop: 4 }}>
        <span style={{ color: "#6b7897" }}>CO₂ avoided</span>
        <strong style={{ color: "#3b82f6" }}>{(val * 0.42).toFixed(1)} kg</strong>
      </div>
    </div>
  );
};

function ReliabilityBadge({ batch }) {
  const info = reliabilityMap[batch];
  if (!info) return null;
  const dot = info.label === "High" ? "●" : info.label === "Medium" ? "◐" : "○";
  return (
    <span className="reliability-badge" style={{ color: info.color }}>
      {dot} {info.label}
    </span>
  );
}

function AnnotationCell({ batchId }) {
  const storageKey = `annotation_${batchId}`;
  const [note, setNote] = useState(() => localStorage.getItem(storageKey) || "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note);
  const inputRef = useRef(null);

  const save = () => {
    const trimmed = draft.trim();
    localStorage.setItem(storageKey, trimmed);
    setNote(trimmed);
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") save();
    if (e.key === "Escape") setEditing(false);
  };

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  if (editing) {
    return (
      <div className="annotation-input-wrap">
        <input
          ref={inputRef}
          className="annotation-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add note…"
          maxLength={120}
        />
        <button className="btn btn--primary" style={{ padding: "4px 10px", fontSize: "0.74rem" }} onClick={save}>Save</button>
        <button className="btn btn--text" style={{ padding: "4px 8px", fontSize: "0.74rem" }} onClick={() => setEditing(false)}>✕</button>
      </div>
    );
  }

  return note ? (
    <span className="annotation-chip" onClick={() => { setDraft(note); setEditing(true); }} title="Click to edit">
      💬 {note}
    </span>
  ) : (
    <button className="btn btn--text" style={{ padding: "2px 8px", fontSize: "0.74rem" }} onClick={() => setEditing(true)}>
      + Note
    </button>
  );
}

function HistoricalPage() {
  const [roiSummary, setRoiSummary] = useState(null);
  const [simData, setSimData] = useState(null);   // full simulation response
  const [trend, setTrend] = useState(energySavingsTrend);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    simulateWhatIf({ machine_count: 3, batches: 260, energy_price_low: 0.08, energy_price_high: 0.2, emission_cap: 150 })
      .then((response) => {
        if (!active) return;
        setRoiSummary(Math.round(Number(response.annual_roi_usd)));
        setSimData(response);
        const baseline = Number(response.energy_savings_kwh_per_batch) || 1;
        setTrend(energySavingsTrend.map((item, idx) => ({
          ...item,
          savings: Number((baseline * (0.7 + idx * 0.08)).toFixed(2)),
        })));
      })
      .catch((e) => {
        if (!active) return;
        setNote(`Live analytics unavailable — showing fallback data. (${e.message})`);
        setRoiSummary(historyRows.reduce((sum, r) => sum + r.roi, 0));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const exportCsv = () => {
    const header = ["Batch", "Machine", "Yield", "Quality", "Energy", "Emission", "ROI", "Reliability"];
    const body = historyRows.map((row) =>
      [row.batch, row.machine, row.yield, row.quality, row.energy, row.emission, row.roi,
      reliabilityMap[row.batch]?.label ?? "N/A"].join(",")
    );
    const csv = [header.join(","), ...body].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "batch_performance.csv";
    document.body.appendChild(link); link.click();
    document.body.removeChild(link); URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  // Computed metrics — use live sim data when available
  const totalEnergy = historyRows.reduce((s, r) => s + r.energy, 0);
  const totalEmission = historyRows.reduce((s, r) => s + r.emission, 0);
  const avgYield = (historyRows.reduce((s, r) => s + r.yield, 0) / historyRows.length).toFixed(1);
  const roiDisplay = roiSummary ?? historyRows.reduce((s, r) => s + r.roi, 0);
  const yieldImprove = simData ? Number(simData.yield_improvement_pct).toFixed(2) : null;
  const energySavings = simData ? Number(simData.energy_savings_kwh_per_batch).toFixed(2) : null;
  const emissionCap = simData ? Number(simData.emission_cap_utilization_pct ?? 0).toFixed(1) : null;

  return (
    <div className="page-grid">
      {/* History Table */}
      <motion.section className="panel panel--span-8" {...fadeUp(0)}>
        <div className="panel__header">
          <h2><span className="panel__icon">◷</span>Batch Performance History</h2>
          <button className="btn" type="button" onClick={exportCsv}>↓ Export CSV</button>
        </div>
        {loading ? (
          <Skeleton rows={5} height={22} wide />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Batch</th><th>Machine</th><th>Yield</th><th>Quality</th>
                <th>Energy</th><th>Emission</th><th>ROI Impact</th><th>Reliability</th><th>Note</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.map((row) => (
                <tr key={row.batch}>
                  <td style={{ color: "#f5c842", fontWeight: 600, fontFamily: "monospace" }}>{row.batch}</td>
                  <td>{row.machine}</td>
                  <td style={{ color: "#10b981" }}>{row.yield}%</td>
                  <td>{row.quality}</td>
                  <td>{row.energy} kWh</td>
                  <td>{row.emission} kgCO2e</td>
                  <td style={{ color: "#f5c842", fontWeight: 600 }}>${row.roi}</td>
                  <td><ReliabilityBadge batch={row.batch} /></td>
                  <td><AnnotationCell batchId={row.batch} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.section>

      {/* ROI Summary + Export */}
      <motion.section className="panel panel--span-4 print-target" {...fadeUp(0.1)}>
        <div className="panel__header">
          <h2><span className="panel__icon">$</span>ROI &amp; Simulation Summary</h2>
        </div>
        {note && <p className="action-note">{note}</p>}
        {loading ? (
          <Skeleton rows={2} height={28} wide />
        ) : (
          <p className="big-number">${roiDisplay.toLocaleString()}</p>
        )}
        <p className="subtle" style={{ marginBottom: 16 }}>Estimated annual impact from optimization engine.</p>

        {/* ROI Export Panel — includes live sim data when available */}
        <div className="roi-export-panel">
          <h3>📊 Optimization Benefits</h3>
          <div className="roi-row"><span>Avg Batch Yield</span><strong>{avgYield}%</strong></div>
          {yieldImprove && (
            <div className="roi-row"><span>Yield Improvement</span><strong>+{yieldImprove}%</strong></div>
          )}
          {energySavings && (
            <div className="roi-row"><span>Energy Savings / Batch</span><strong>{energySavings} kWh</strong></div>
          )}
          {emissionCap && (
            <div className="roi-row"><span>Emission Cap Used</span><strong>{emissionCap}%</strong></div>
          )}
          <div className="roi-row"><span>Total Energy (history)</span><strong>{totalEnergy} kWh</strong></div>
          <div className="roi-row"><span>Total Emissions (history)</span><strong>{totalEmission} kgCO2e</strong></div>
          <div className="roi-row"><span>Batch ROI Sum</span><strong>${historyRows.reduce((s, r) => s + r.roi, 0).toLocaleString()}</strong></div>
          <div className="roi-row"><span>Annual Projected ROI</span><strong>${roiDisplay.toLocaleString()}</strong></div>
        </div>

        <button
          className="btn btn--primary"
          style={{ width: "100%", marginTop: 12 }}
          type="button"
          onClick={handlePrint}
        >
          ↓ Download ROI Summary
        </button>
      </motion.section>

      {/* Bar Chart */}
      <motion.section className="panel panel--span-12" {...fadeUp(0.2)}>
        <div className="panel__header">
          <h2><span className="panel__icon">⬛</span>Weekly Energy Savings Trend</h2>
        </div>
        {loading ? (
          <Skeleton rows={4} height={40} wide />
        ) : (
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={trend} barSize={28}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: "#6b7897", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7897", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(245,200,66,0.06)", radius: 6 }} />
                <Bar dataKey="savings" radius={[6, 6, 0, 0]} maxBarSize={44}>
                  {trend.map((_, i) => <Cell key={i} fill={GOLD_SHADES[i % GOLD_SHADES.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.section>
    </div>
  );
}

export default HistoricalPage;
