import { useEffect, useMemo, useState } from "react";
import { proposedUpdates, signatures } from "../data/dummyData";
import { defaultMode, liveBatchRow } from "../data/livePayload";
import { getActiveSignatures, promoteSignature } from "../lib/api";

function GoldenSignaturePage() {
  const [updates, setUpdates] = useState(
    proposedUpdates.map((item) => ({ ...item, decision: "Pending" }))
  );
  const [lastAction, setLastAction] = useState("");
  const [liveSignatures, setLiveSignatures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  useEffect(() => {
    let active = true;
    setLoading(true);
    getActiveSignatures(defaultMode)
      .then((data) => {
        if (!active) return;
        setLiveSignatures(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!active) return;
        setError(`Could not load signature registry from backend. (${e.message})`);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handlePromote = async (item, approved) => {
    setLoading(true);
    setError("");
    try {
      const payload = {
        mode: defaultMode,
        params: {
          ...liveBatchRow,
          mixing_speed: liveBatchRow.mixing_speed - (approved ? 8 : 2),
          temperature: liveBatchRow.temperature - (approved ? 0.8 : 0.2)
        },
        outcomes: {
          yield: liveBatchRow.yield + item.expectedYieldGain,
          quality_score: liveBatchRow.quality_score + 0.2,
          energy_kwh: liveBatchRow.energy_kwh - item.expectedEnergyReduction,
          emission_kgco2e: liveBatchRow.emission_kgco2e - item.expectedEnergyReduction * 0.3,
          throughput_units_hr: liveBatchRow.throughput_units_hr + 0.7
        },
        constraints_snapshot: {
          emission_cap: 150,
          min_quality: 70,
          min_yield: 75
        },
        confidence: item.confidence,
        approved
      };

      await promoteSignature(payload);
      handleUpdateDecision(item.id, approved ? "Accepted" : "Rejected");
      const refreshed = await getActiveSignatures(defaultMode);
      setLiveSignatures(Array.isArray(refreshed) ? refreshed : []);
    } catch (e) {
      setError(`Unable to submit benchmark decision. (${e.message})`);
    } finally {
      setLoading(false);
    }
  };

  const signatureRows =
    liveSignatures.length > 0
      ? liveSignatures.map((s) => ({
          id: s.signature_id,
          mode: s.mode,
          version: `v${s.version}`,
          yield: Number(s.objectives?.yield ?? 0).toFixed(2),
          energy: Number(s.objectives?.energy_kwh ?? 0).toFixed(2),
          quality: Number(s.objectives?.quality_score ?? 0).toFixed(2),
          emission: Number(s.objectives?.emission_kgco2e ?? 0).toFixed(2),
          state: s.active ? "Active" : "Inactive",
          approvedBy: s.approved ? "Approved" : "Pending",
          createdAt: (s.created_at || "").slice(0, 10)
        }))
      : signatures;

  return (
    <div className="page-grid">
      <section className="panel panel--span-12">
        <div className="panel__header">
          <h2>Golden Signature Registry</h2>
        </div>
        {loading ? <p className="subtle">Syncing signature registry...</p> : null}
        {error ? <p className="action-note">{error}</p> : null}
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
            {signatureRows.map((s) => (
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
                  onClick={() => handlePromote(item, true)}
                >
                  Accept
                </button>
                <button
                  className="btn"
                  type="button"
                  onClick={() => handlePromote(item, false)}
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
