import { useEffect, useMemo, useState } from "react";
import { liveParameters, recommendations } from "../data/dummyData";
import { defaultMode, liveBatchRow } from "../data/livePayload";
import { getRecommendation } from "../lib/api";

function MonitoringPage() {
  const [rows, setRows] = useState(recommendations);
  const [message, setMessage] = useState("");
  const [params, setParams] = useState(liveParameters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasPending = useMemo(() => rows.some((r) => !r.decision), [rows]);

  const handleDecision = (parameter, decision) => {
    setRows((prev) =>
      prev.map((row) =>
        row.parameter === parameter
          ? {
              ...row,
              decision
            }
          : row
      )
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
        row: liveBatchRow,
        mode: defaultMode,
        energy_price: 0.12,
        carbon_price: 0.04
      });

      const newRows = [
        { parameter: "Mixing Speed", key: "mixing_speed", unit: "rpm" },
        { parameter: "Temperature", key: "temperature", unit: "C" },
        { parameter: "Pressure", key: "pressure", unit: "bar" }
      ].map((item) => ({
        parameter: item.parameter,
        current: Number(liveBatchRow[item.key]).toFixed(2),
        recommended: Number(rec.parameters?.[item.key] ?? liveBatchRow[item.key]).toFixed(2),
        unit: item.unit,
        confidence: `${Math.max(
          70,
          Math.min(99, Math.round((1 - Number(rec.drift_score ?? 0) / 10) * 100))
        )}%`
      }));

      setRows(newRows);
      setParams([
        { key: "Temperature", value: `${Number(liveBatchRow.temperature).toFixed(1)} C`, status: "Within" },
        { key: "Pressure", value: `${Number(liveBatchRow.pressure).toFixed(1)} bar`, status: "Within" },
        {
          key: "Mixing Speed",
          value: `${Number(liveBatchRow.mixing_speed).toFixed(0)} rpm`,
          status:
            Number(rec.parameters?.mixing_speed ?? liveBatchRow.mixing_speed) === Number(liveBatchRow.mixing_speed)
              ? "Within"
              : "Deviation"
        },
        { key: "Batch Size", value: `${Number(liveBatchRow.batch_size).toFixed(0)} kg`, status: "Within" }
      ]);
      setMessage("Live recommendation pulled from optimization service.");
    } catch (e) {
      setError(`Unable to load live recommendation. Showing fallback data. (${e.message})`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendation();
  }, []);

  return (
    <div className="page-grid">
      <section className="panel panel--span-6">
        <div className="panel__header">
          <h2>Live Batch Parameters</h2>
          <button className="btn" type="button" onClick={fetchRecommendation}>
            Refresh
          </button>
        </div>
        {loading ? <p className="subtle">Loading live recommendation...</p> : null}
        {error ? <p className="action-note">{error}</p> : null}
        <table className="table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {params.map((item) => (
              <tr key={item.key}>
                <td>{item.key}</td>
                <td>{item.value}</td>
                <td>
                  <span className={item.status === "Within" ? "badge badge--ok" : "badge badge--alert"}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel panel--span-6">
        <div className="panel__header">
          <h2>Deviation Alerts</h2>
        </div>
        <div className="alert-card">
          <h3>Mixing Speed High</h3>
          <p>Observed 338 rpm, threshold upper bound 330 rpm under current material profile.</p>
          <p className="alert-card__time">First detected: 09:31 | Open for: 11 min</p>
        </div>
      </section>

      <section className="panel panel--span-12">
        <div className="panel__header">
          <h2>Recommended Parameter Adjustments</h2>
        </div>
        {message ? <p className="action-note">{message}</p> : null}
        <table className="table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Current</th>
              <th>Recommended</th>
              <th>Confidence</th>
              <th>Decision</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.parameter}>
                <td>{row.parameter}</td>
                <td>
                  {row.current} {row.unit}
                </td>
                <td>
                  {row.recommended} {row.unit}
                </td>
                <td>{row.confidence}</td>
                <td>{row.decision || "Pending"}</td>
                <td>
                  <button
                    className="btn btn--primary"
                    type="button"
                    onClick={() => handleDecision(row.parameter, "Applied")}
                  >
                    Apply
                  </button>
                  <button
                    className="btn btn--text"
                    type="button"
                    onClick={() => handleDecision(row.parameter, "Overridden")}
                  >
                    Override
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!hasPending ? <p className="subtle">All recommendations reviewed for this batch.</p> : null}
      </section>
    </div>
  );
}

export default MonitoringPage;
