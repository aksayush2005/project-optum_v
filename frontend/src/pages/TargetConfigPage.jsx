import { useState } from "react";
import { motion } from "framer-motion";
import { simulateWhatIf, updateConstraints } from "../lib/api";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" },
});

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

function TargetConfigPage() {
  const [yieldPriority, setYieldPriority] = useState(65);
  const [energyReduction, setEnergyReduction] = useState(22);
  const [emissionConstraint, setEmissionConstraint] = useState(130);
  const [regulatoryCap, setRegulatoryCap] = useState(150);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

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
        `⟳ Simulation complete — Yield +${Number(response.yield_improvement_pct).toFixed(2)}% | Energy savings ${Number(response.energy_savings_kwh_per_batch).toFixed(2)} kWh/batch | ROI $${Math.round(Number(response.annual_roi_usd)).toLocaleString()}`
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
            <input
              type="number"
              value={regulatoryCap}
              onChange={(e) => setRegulatoryCap(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="actions">
          <button className="btn btn--primary" type="button" onClick={handleSave} disabled={busy}>
            {busy ? "Working..." : "✓ Save Targets"}
          </button>
          <button className="btn" type="button" onClick={handleSimulate} disabled={busy}>
            ⟳ Simulate Impact
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
