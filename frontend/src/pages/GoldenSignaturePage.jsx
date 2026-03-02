import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { proposedUpdates, signatures } from "../data/dummyData";
import { defaultMode, liveBatchRow } from "../data/livePayload";
import { getActiveSignatures, promoteSignature } from "../lib/api";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" },
});

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
      .then((data) => { if (active) setLiveSignatures(Array.isArray(data) ? data : []); })
      .catch((e) => { if (active) setError(`Could not load signature registry. (${e.message})`); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
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
          temperature: liveBatchRow.temperature - (approved ? 0.8 : 0.2),
        },
        outcomes: {
          yield: liveBatchRow.yield + item.expectedYieldGain,
          quality_score: liveBatchRow.quality_score + 0.2,
          energy_kwh: liveBatchRow.energy_kwh - item.expectedEnergyReduction,
          emission_kgco2e: liveBatchRow.emission_kgco2e - item.expectedEnergyReduction * 0.3,
          throughput_units_hr: liveBatchRow.throughput_units_hr + 0.7,
        },
        constraints_snapshot: { emission_cap: 150, min_quality: 70, min_yield: 75 },
        confidence: item.confidence,
        approved,
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
        createdAt: (s.created_at || "").slice(0, 10),
      }))
      : signatures;

  return (
    <div className="page-grid">
      {/* Signature Registry */}
      <motion.section className="panel panel--span-12" {...fadeUp(0)}>
        <div className="panel__header">
          <h2><span className="panel__icon">✦</span>Golden Signature Registry</h2>
          {loading && <span className="subtle" style={{ fontSize: "0.78rem" }}>⟳ Syncing...</span>}
        </div>
        {error && <p className="action-note">{error}</p>}
        <table className="table">
          <thead>
            <tr>
              <th>Signature ID</th>
              <th>Mode</th>
              <th>Version</th>
              <th>Yield</th>
              <th>Energy</th>
              <th>Quality</th>
              <th>Emission</th>
              <th>Status</th>
              <th>Approval</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {signatureRows.map((s) => (
              <tr key={s.id}>
                <td style={{ color: "#f5c842", fontWeight: 600, fontFamily: "monospace", fontSize: "0.8rem" }}>{s.id}</td>
                <td><span className="badge badge--ok">{s.mode}</span></td>
                <td style={{ color: "#a78bfa" }}>{s.version}</td>
                <td>{s.yield}%</td>
                <td>{s.energy} kWh</td>
                <td>{s.quality}</td>
                <td>{s.emission} kgCO2e</td>
                <td>
                  <span className={s.state === "Active" ? "badge badge--ok" : "badge badge--alert"}>
                    {s.state}
                  </span>
                </td>
                <td style={{ color: s.approvedBy === "Approved" ? "var(--ok)" : "var(--text-muted)" }}>
                  {s.approvedBy}
                </td>
                <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{s.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.section>

      {/* Proposed Updates */}
      <motion.section className="panel panel--span-12" {...fadeUp(0.15)}>
        <div className="panel__header">
          <h2><span className="panel__icon">⊕</span>Proposed Benchmark Updates</h2>
          <span className="badge badge--alert">{pendingCount} Pending</span>
        </div>
        {lastAction && <p className="action-note">{lastAction}</p>}
        <div className="action-list">
          {updates.map((item, i) => (
            <motion.div
              key={item.id}
              className="action-row"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.07, duration: 0.35 }}
            >
              <div className="action-row__meta">
                <strong>{item.id}</strong>
                <span className="badge badge--ok">{item.mode}</span>
                <span>Confidence: <strong style={{ color: "#f5c842" }}>{(item.confidence * 100).toFixed(0)}%</strong></span>
                <span style={{ color: "#10b981" }}>Yield +{item.expectedYieldGain}%</span>
                <span style={{ color: "#3b82f6" }}>Energy −{item.expectedEnergyReduction} kWh</span>
                <span>
                  Decision:{" "}
                  <strong style={{
                    color: item.decision === "Accepted" ? "var(--ok)" : item.decision === "Rejected" ? "var(--alert)" : "var(--text-muted)"
                  }}>
                    {item.decision}
                  </strong>
                </span>
              </div>
              <div className="action-row__buttons">
                <button className="btn btn--primary" type="button" onClick={() => handlePromote(item, true)}>
                  ✓ Accept
                </button>
                <button className="btn btn--danger" type="button" onClick={() => handlePromote(item, false)}>
                  ✗ Reject
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}

export default GoldenSignaturePage;
