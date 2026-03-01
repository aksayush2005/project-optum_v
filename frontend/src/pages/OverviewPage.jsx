import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import KpiCard from "../components/KpiCard";
import { batchVsSignature, kpiCards, trendData } from "../data/dummyData";
import { defaultMode, liveBatchRow } from "../data/livePayload";
import { compareBatch } from "../lib/api";

function OverviewPage() {
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    compareBatch({ row: liveBatchRow, mode: defaultMode })
      .then((data) => {
        if (!active) return;
        setComparison(data);
        setError("");
      })
      .catch((e) => {
        if (!active) return;
        setError(`Backend data unavailable. Showing fallback data. (${e.message})`);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const runtimeKpis = useMemo(() => {
    if (!comparison?.prediction) return kpiCards;
    const p = comparison.prediction;
    return [
      { label: "Current Yield", value: `${Number(p.yield).toFixed(1)}%`, delta: "Live", positive: true },
      { label: "Energy / Batch", value: `${Number(p.energy_kwh).toFixed(0)} kWh`, delta: "Live", positive: true },
      {
        label: "Emission Intensity",
        value: `${Number(p.emission_kgco2e).toFixed(0)} kgCO2e`,
        delta: "Live",
        positive: true
      },
      { label: "Quality Index", value: `${Number(p.quality_score).toFixed(1)}`, delta: "Live", positive: true }
    ];
  }, [comparison]);

  const comparisonRows = useMemo(() => {
    if (!comparison?.prediction || !comparison?.active_signature) return batchVsSignature;
    const p = comparison.prediction;
    const s = comparison.active_signature.objectives || {};
    return [
      {
        metric: "Yield (%)",
        current: Number(p.yield).toFixed(2),
        golden: Number(s.yield ?? 0).toFixed(2),
        status: Number(p.yield) >= Number(s.yield ?? p.yield) ? "Within" : "Deviation"
      },
      {
        metric: "Energy (kWh)",
        current: Number(p.energy_kwh).toFixed(2),
        golden: Number(s.energy_kwh ?? 0).toFixed(2),
        status: Number(p.energy_kwh) <= Number(s.energy_kwh ?? p.energy_kwh) ? "Within" : "Deviation"
      },
      {
        metric: "Quality Score",
        current: Number(p.quality_score).toFixed(2),
        golden: Number(s.quality_score ?? 0).toFixed(2),
        status: Number(p.quality_score) >= Number(s.quality_score ?? p.quality_score) ? "Within" : "Deviation"
      },
      {
        metric: "Emission (kgCO2e)",
        current: Number(p.emission_kgco2e).toFixed(2),
        golden: Number(s.emission_kgco2e ?? 0).toFixed(2),
        status: Number(p.emission_kgco2e) <= Number(s.emission_kgco2e ?? p.emission_kgco2e) ? "Within" : "Deviation"
      }
    ];
  }, [comparison]);

  const hasDeviation = comparisonRows.some((r) => r.status === "Deviation");

  return (
    <div className="page-grid">
      <section className="panel panel--span-12">
        {loading ? <p className="subtle">Loading live predictions...</p> : null}
        {error ? <p className="action-note">{error}</p> : null}
        <div className="kpi-grid">
          {runtimeKpis.map((card) => (
            <KpiCard key={card.label} {...card} />
          ))}
        </div>
      </section>

      <section className="panel panel--span-8">
        <div className="panel__header">
          <h2>Trend Comparison</h2>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid stroke="#d7dce2" strokeDasharray="3 3" />
              <XAxis dataKey="shift" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="yield" stroke="#2f5d7c" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="quality" stroke="#3f7a5e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel panel--span-4">
        <div className="panel__header">
          <h2>Batch Status</h2>
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
      </section>

      <section className="panel panel--span-12">
        <div className="panel__header">
          <h2>Current Batch vs Golden Signature</h2>
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
                <td>{row.metric}</td>
                <td>{row.current}</td>
                <td>{row.golden}</td>
                <td>
                  <span className={row.status === "Within" ? "badge badge--ok" : "badge badge--alert"}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default OverviewPage;
