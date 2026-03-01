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

function OverviewPage() {
  return (
    <div className="page-grid">
      <section className="panel panel--span-12">
        <div className="kpi-grid">
          {kpiCards.map((card) => (
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
          <span className="status-indicator status-indicator--warn" />
          <div>
            <p className="status-title">Deviation Detected</p>
            <p className="status-text">Energy and emission indicators are above current golden signature envelope.</p>
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
            {batchVsSignature.map((row) => (
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
