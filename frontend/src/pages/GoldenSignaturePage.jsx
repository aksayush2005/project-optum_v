import { useMemo, useState } from "react";
import { proposedUpdates, signatures } from "../data/dummyData";

function GoldenSignaturePage() {
  const [updates, setUpdates] = useState(
    proposedUpdates.map((item) => ({ ...item, decision: "Pending" }))
  );
  const [lastAction, setLastAction] = useState("");

  const pendingCount = useMemo(
    () => updates.filter((item) => item.decision === "Pending").length,
    [updates]
  );

  const handleUpdateDecision = (id, decision) => {
    setUpdates((prev) =>
      prev.map((item) => (item.id === id ? { ...item, decision } : item))
    );
    setLastAction(`${id} marked as ${decision.toLowerCase()}.`);
  };

  return (
    <div className="page-grid">
      <section className="panel panel--span-12">
        <div className="panel__header">
          <h2>Golden Signature Registry</h2>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Signature ID</th>
              <th>Objective Mode</th>
              <th>Version</th>
              <th>Yield</th>
              <th>Energy</th>
              <th>Quality</th>
              <th>Emission</th>
              <th>Status</th>
              <th>Approved By</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {signatures.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.mode}</td>
                <td>{s.version}</td>
                <td>{s.yield}%</td>
                <td>{s.energy} kWh</td>
                <td>{s.quality}</td>
                <td>{s.emission} kgCO2e</td>
                <td>{s.state}</td>
                <td>{s.approvedBy}</td>
                <td>{s.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel panel--span-12">
        <div className="panel__header">
          <h2>Proposed Benchmark Updates</h2>
        </div>
        <p className="subtle">Pending reviews: {pendingCount}</p>
        {lastAction ? <p className="action-note">{lastAction}</p> : null}
        <div className="action-list">
          {updates.map((item) => (
            <div className="action-row" key={item.id}>
              <div className="action-row__meta">
                <strong>{item.id}</strong>
                <span>{item.mode}</span>
                <span>Confidence: {(item.confidence * 100).toFixed(0)}%</span>
                <span>Yield +{item.expectedYieldGain}%</span>
                <span>Energy -{item.expectedEnergyReduction} kWh</span>
                <span>Decision: {item.decision}</span>
              </div>
              <div className="action-row__buttons">
                <button
                  className="btn btn--primary"
                  type="button"
                  onClick={() => handleUpdateDecision(item.id, "Accepted")}
                >
                  Accept
                </button>
                <button
                  className="btn"
                  type="button"
                  onClick={() => handleUpdateDecision(item.id, "Rejected")}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default GoldenSignaturePage;
