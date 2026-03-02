import { useMemo, useState } from "react";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { motion } from "framer-motion";
import { simulateWhatIf, updateConstraints } from "../lib/api";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" },
});

const TIME_POINTS = ["T+1h", "T+2h", "T+4h", "T+8h", "T+12h", "T+24h"];
const BASE_ENERGY = 438;
const BASE_EMISSION = 123;

function RangeField({ label, value, min, max, unit, onChange }) {
  const pct = Math.round(((value - min) / (max - min)) * 100);
  return (
    <label className="field">
      <span>
        {label} &nbsp;
        <strong style={{ color: "#f5c842" }}>{value}{unit}</strong>
        <span style={{ marginLeft: 8, color: "var(--text-subtle)", fontSize: "0.72rem" }}>— {pct}% of range</span>
      </span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#161f33", border: "1px solid rgba(245,200,66,0.25)", borderRadius: 10, padding: "10px 14px", fontSize: "0.82rem" }}>
      <p style={{ color: "#f5c842", fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color, margin: "2px 0" }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

function TargetConfigPage() {
  const [yieldPriority, setYieldPriority] = useState(65);
  const [energyReduction, setEnergyReduction] = useState(22);
  const [emissionConstraint, setEmissionConstraint] = useState(130);
  const [regulatoryCap, setRegulatoryCap] = useState(150);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  // Live What-If preview — recomputed whenever any slider changes
  const whatIfData = useMemo(() => {
    const energyFactor = 1 - (energyReduction / 100) * 0.6;
    const emissionFactor = emissionConstraint / 150;
    return TIME_POINTS.map((t, i) => {
      const decay = 1 - i * 0.03;
      return {
        t,
        energy: Number((BASE_ENERGY * energyFactor * decay).toFixed(1)),
        emission: Number((BASE_EMISSION * emissionFactor * decay).toFixed(1)),
      };
    });
  }, [energyReduction, emissionConstraint]);

  const handleSave = async () => {
    setBusy(true);
    try {
      const response = await updateConstraints({
        emission_cap: regulatoryCap,
        min_quality: 70 + yieldPriority * 0.1,
        min_yield: 70 + yieldPriority * 0.12,
      });
      setFeedback(
        `✓ Targets saved — Emission cap ${response.emission_cap} kgCO2e, minimum yield ${Number(response.min_yield).toFixed(1)}.`
      );
    } catch (e) {
      setFeedback(`✗ Failed to save targets. (${e.message})`);
    } finally {
      setBusy(false);
    }
  };

  const handleSimulate = async () => {
    setBusy(true);
    try {
      const response = await simulateWhatIf({
        machine_count: 3, batches: 240,
        energy_price_low: 0.08, energy_price_high: 0.2,
        emission_cap: emissionConstraint,
      });
      setFeedback(
        `⟳ Simulation — Yield +${Number(response.yield_improvement_pct).toFixed(2)}% | Energy savings ${Number(response.energy_savings_kwh_per_batch).toFixed(2)} kWh/batch | ROI $${Math.round(Number(response.annual_roi_usd)).toLocaleString()}`
      );
    } catch (e) {
      setFeedback(`✗ Simulation failed. (${e.message})`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-grid">
      {/* Config Form */}
      <motion.section className="panel panel--span-8" {...fadeUp(0)}>
        <div className="panel__header">
          <h2><span className="panel__icon">⊕</span>Adaptive Target Configuration</h2>
        </div>
        <div className="form-grid">
          <RangeField label="Yield Priority" value={yieldPriority} min={0} max={100} unit="%" onChange={setYieldPriority} />
          <RangeField label="Energy Reduction Target" value={energyReduction} min={0} max={40} unit="%" onChange={setEnergyReduction} />
          <RangeField label="Soft Emission Constraint" value={emissionConstraint} min={80} max={180} unit=" kgCO2e" onChange={setEmissionConstraint} />
          <label className="field">
            <span>Hard Regulatory Cap <strong style={{ color: "#f5c842" }}>{regulatoryCap} kgCO2e</strong></span>
            <input type="number" value={regulatoryCap} onChange={(e) => setRegulatoryCap(Number(e.target.value))} />
          </label>
        </div>

        {/* What-If Preview Chart */}
        <div className="whatif-chart-wrap">
          <p className="whatif-chart-label">⟳ Live What-If Projection</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={whatIfData}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
              <XAxis dataKey="t" tick={{ fill: "#6b7897", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7897", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "0.78rem", color: "#6b7897" }} />
              <Line type="monotone" dataKey="energy" stroke="#f5c842" strokeWidth={2} dot={false} name="Energy (kWh)" />
              <Line type="monotone" dataKey="emission" stroke="#10b981" strokeWidth={2} dot={false} name="Emission (kg)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="actions">
          <button className="btn btn--primary" type="button" onClick={handleSave} disabled={busy}>
            {busy ? "Working..." : "✓ Save Targets"}
          </button>
          <button className="btn" type="button" onClick={handleSimulate} disabled={busy}>
            ⟳ Run Simulation
          </button>
        </div>

        {feedback && (
          <motion.p
            className="action-note"
            style={{ marginTop: 16 }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {feedback}
          </motion.p>
        )}
      </motion.section>

      {/* Constraint Summary */}
      <motion.section className="panel panel--span-4" {...fadeUp(0.12)}>
        <div className="panel__header">
          <h2><span className="panel__icon">≡</span>Constraint Summary</h2>
        </div>
        <ul className="summary-list">
          <li>Yield objective weight: <strong style={{ color: "#f5c842", marginLeft: "auto" }}>{(yieldPriority / 100).toFixed(2)}</strong></li>
          <li>Energy reduction target: <strong style={{ color: "#3b82f6", marginLeft: "auto" }}>{energyReduction}%</strong></li>
          <li>Soft emission boundary: <strong style={{ color: "#10b981", marginLeft: "auto" }}>{emissionConstraint} kgCO2e</strong></li>
          <li>Hard regulatory cap: <strong style={{ color: "var(--alert)", marginLeft: "auto" }}>{regulatoryCap} kgCO2e</strong></li>
        </ul>
      </motion.section>
    </div>
  );
}

export default TargetConfigPage;
