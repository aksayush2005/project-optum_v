import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { energySavingsTrend, historyRows } from "../data/dummyData";
import { simulateWhatIf } from "../lib/api";

function HistoricalPage() {
  const [roiSummary, setRoiSummary] = useState(historyRows.reduce((sum, r) => sum + r.roi, 0));
  const [trend, setTrend] = useState(energySavingsTrend);
  const [note, setNote] = useState("");

  useEffect(() => {
    let active = true;
    simulateWhatIf({
      machine_count: 3,
      batches: 260,
      energy_price_low: 0.08,
      energy_price_high: 0.2,
      emission_cap: 150
    })
      .then((response) => {
        if (!active) return;
        setRoiSummary(Math.round(Number(response.annual_roi_usd)));
        const baseline = Number(response.energy_savings_kwh_per_batch) || 1;
        setTrend(
          energySavingsTrend.map((item, idx) => ({
            ...item,
            savings: Number((baseline * (0.7 + idx * 0.08)).toFixed(2))
          }))
        );
      })
      .catch((e) => {
        if (!active) return;
        setNote(`Live analytics unavailable. Showing fallback data. (${e.message})`);
      });
    return () => {
      active = false;
    };
  }, []);

  const exportCsv = () => {
    const header = ["Batch", "Machine", "Yield", "Quality", "Energy", "Emission", "ROI"];
    const body = historyRows.map((row) =>
      [row.batch, row.machine, row.yield, row.quality, row.energy, row.emission, row.roi].join(",")
    );
    const csv = [header.join(","), ...body].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "batch_performance.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-grid">
      <section className="panel panel--span-8">
        <div className="panel__header">
          <h2>Batch Performance History</h2>
          <button className="btn" type="button" onClick={exportCsv}>
            Export CSV
          </button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Batch</th>
              <th>Machine</th>
              <th>Yield</th>
              <th>Quality</th>
              <th>Energy</th>
              <th>Emission</th>
              <th>ROI Impact</th>
            </tr>
          </thead>
          <tbody>
            {historyRows.map((row) => (
              <tr key={row.batch}>
                <td>{row.batch}</td>
                <td>{row.machine}</td>
                <td>{row.yield}%</td>
                <td>{row.quality}</td>
                <td>{row.energy} kWh</td>
                <td>{row.emission} kgCO2e</td>
                <td>${row.roi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel panel--span-4">
        <div className="panel__header">
          <h2>ROI Summary</h2>
        </div>
        {note ? <p className="action-note">{note}</p> : null}
        <p className="big-number">${roiSummary.toLocaleString()}</p>
        <p className="subtle">Estimated cumulative impact over selected batches.</p>
      </section>

      <section className="panel panel--span-12">
        <div className="panel__header">
          <h2>Energy Savings Trend</h2>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trend}>
              <CartesianGrid stroke="#d7dce2" strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="savings" fill="#2f5d7c" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

export default HistoricalPage;
