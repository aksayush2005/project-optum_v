import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import { energySavingsTrend, historyRows } from "../data/dummyData";
import { simulateWhatIf } from "../lib/api";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" },
});

const GOLD_SHADES = ["#f5c842", "#e0a820", "#c98f18", "#b57a12", "#9f6a0e", "#8a5a0a"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#161f33",
      border: "1px solid rgba(245,200,66,0.25)",
      borderRadius: 10,
      padding: "10px 14px",
      fontSize: "0.82rem",
    }}>
      <p style={{ color: "#f5c842", fontWeight: 600, marginBottom: 4 }}>{label}</p>
      <p style={{ color: "#e8eaf0" }}>Savings: <strong>{payload[0]?.value} kWh</strong></p>
    </div>
  );
};

function HistoricalPage() {
  const [roiSummary, setRoiSummary] = useState(historyRows.reduce((sum, r) => sum + r.roi, 0));
  const [trend, setTrend] = useState(energySavingsTrend);
  const [note, setNote] = useState("");

  useEffect(() => {
    let active = true;
    simulateWhatIf({ machine_count: 3, batches: 260, energy_price_low: 0.08, energy_price_high: 0.2, emission_cap: 150 })
      .then((response) => {
        if (!active) return;
        setRoiSummary(Math.round(Number(response.annual_roi_usd)));
        const baseline = Number(response.energy_savings_kwh_per_batch) || 1;
        setTrend(energySavingsTrend.map((item, idx) => ({
          ...item,
          savings: Number((baseline * (0.7 + idx * 0.08)).toFixed(2)),
        })));
      })
      .catch((e) => {
        if (!active) return;
        setNote(`Live analytics unavailable — showing fallback data. (${e.message})`);
      });
    return () => { active = false; };
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
      {/* History Table */}
      <motion.section className="panel panel--span-8" {...fadeUp(0)}>
        <div className="panel__header">
          <h2><span className="panel__icon">◷</span>Batch Performance History</h2>
          <button className="btn" type="button" onClick={exportCsv}>
            ↓ Export CSV
          </button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Batch</th><th>Machine</th><th>Yield</th>
              <th>Quality</th><th>Energy</th><th>Emission</th><th>ROI Impact</th>
            </tr>
          </thead>
          <tbody>
            {historyRows.map((row) => (
              <tr key={row.batch}>
                <td style={{ color: "#f5c842", fontWeight: 600, fontFamily: "monospace" }}>{row.batch}</td>
                <td>{row.machine}</td>
                <td style={{ color: "#10b981" }}>{row.yield}%</td>
                <td>{row.quality}</td>
                <td>{row.energy} kWh</td>
                <td>{row.emission} kgCO2e</td>
                <td style={{ color: "#f5c842", fontWeight: 600 }}>${row.roi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.section>

      {/* ROI Summary */}
      <motion.section className="panel panel--span-4" {...fadeUp(0.1)}>
        <div className="panel__header">
          <h2><span className="panel__icon">$</span>ROI Summary</h2>
        </div>
        {note && <p className="action-note">{note}</p>}
        <p className="big-number">${roiSummary.toLocaleString()}</p>
        <p className="subtle">Estimated cumulative annual impact across selected batches.</p>
      </motion.section>

      {/* Bar Chart */}
      <motion.section className="panel panel--span-12" {...fadeUp(0.2)}>
        <div className="panel__header">
          <h2><span className="panel__icon">⬛</span>Weekly Energy Savings Trend</h2>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trend} barSize={28}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: "#6b7897", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7897", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="savings" radius={[6, 6, 0, 0]}>
                {trend.map((_, i) => (
                  <Cell key={i} fill={GOLD_SHADES[i % GOLD_SHADES.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.section>
    </div>
  );
}

export default HistoricalPage;
