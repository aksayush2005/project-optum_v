import { useState } from "react";
import { simulateWhatIf, updateConstraints } from "../lib/api";

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
        min_yield: 70 + yieldPriority * 0.12
      });
      setFeedback(
        `Targets saved. Emission cap ${response.emission_cap} kgCO2e, minimum yield ${Number(
          response.min_yield
        ).toFixed(1)}.`
      );
    } catch (e) {
      setFeedback(`Failed to save targets. (${e.message})`);
    } finally {
      setBusy(false);
    }
  };

  const handleSimulate = async () => {
    setBusy(true);
    try {
      const response = await simulateWhatIf({
        machine_count: 3,
        batches: 240,
        energy_price_low: 0.08,
        energy_price_high: 0.2,
        emission_cap: emissionConstraint
      });
      setFeedback(
        `Simulation complete. Yield +${Number(response.yield_improvement_pct).toFixed(
          2
        )}% | Energy savings ${Number(response.energy_savings_kwh_per_batch).toFixed(
          2
        )} kWh/batch | ROI $${Math.round(Number(response.annual_roi_usd)).toLocaleString()}.`
      );
    } catch (e) {
      setFeedback(`Simulation failed. (${e.message})`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-grid">
      <section className="panel panel--span-8">
        <div className="panel__header">
          <h2>Adaptive Target Configuration</h2>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Yield Priority ({yieldPriority}%)</span>
            <input
              type="range"
              min="0"
              max="100"
              value={yieldPriority}
              onChange={(e) => setYieldPriority(Number(e.target.value))}
            />
          </label>

          <label className="field">
            <span>Energy Reduction Target ({energyReduction}%)</span>
            <input
              type="range"
              min="0"
              max="40"
              value={energyReduction}
              onChange={(e) => setEnergyReduction(Number(e.target.value))}
            />
          </label>

          <label className="field">
            <span>Emission Constraint ({emissionConstraint} kgCO2e)</span>
            <input
              type="range"
              min="80"
              max="180"
              value={emissionConstraint}
              onChange={(e) => setEmissionConstraint(Number(e.target.value))}
            />
          </label>

          <label className="field">
            <span>Regulatory Emission Cap</span>
            <input
              type="number"
              value={regulatoryCap}
              onChange={(e) => setRegulatoryCap(Number(e.target.value))}
            />
          </label>
        </div>
        <div className="actions">
          <button className="btn btn--primary" type="button" onClick={handleSave} disabled={busy}>
            {busy ? "Working..." : "Save Targets"}
          </button>
          <button className="btn" type="button" onClick={handleSimulate} disabled={busy}>
            Simulate Impact
          </button>
        </div>
        {feedback ? <p className="action-note">{feedback}</p> : null}
      </section>

      <section className="panel panel--span-4">
        <div className="panel__header">
          <h2>Constraint Summary</h2>
        </div>
        <ul className="summary-list">
          <li>Yield objective weight: {yieldPriority / 100}</li>
          <li>Energy reduction target: {energyReduction}%</li>
          <li>Soft emission boundary: {emissionConstraint} kgCO2e</li>
          <li>Hard regulatory cap: {regulatoryCap} kgCO2e</li>
        </ul>
      </section>
    </div>
  );
}

export default TargetConfigPage;
