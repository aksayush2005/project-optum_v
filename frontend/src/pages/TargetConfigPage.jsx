import { useState } from "react";

function TargetConfigPage() {
  const [yieldPriority, setYieldPriority] = useState(65);
  const [energyReduction, setEnergyReduction] = useState(22);
  const [emissionConstraint, setEmissionConstraint] = useState(130);
  const [regulatoryCap, setRegulatoryCap] = useState(150);

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
          <button className="btn btn--primary" type="button">
            Save Targets
          </button>
          <button className="btn" type="button">
            Simulate Impact
          </button>
        </div>
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
