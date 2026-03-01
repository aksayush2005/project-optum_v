import { liveParameters, recommendations } from "../data/dummyData";

function MonitoringPage() {
  return (
    <div className="page-grid">
      <section className="panel panel--span-6">
        <div className="panel__header">
          <h2>Live Batch Parameters</h2>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {liveParameters.map((item) => (
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
        <table className="table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Current</th>
              <th>Recommended</th>
              <th>Confidence</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {recommendations.map((row) => (
              <tr key={row.parameter}>
                <td>{row.parameter}</td>
                <td>
                  {row.current} {row.unit}
                </td>
                <td>
                  {row.recommended} {row.unit}
                </td>
                <td>{row.confidence}</td>
                <td>
                  <button className="btn btn--primary" type="button">
                    Apply
                  </button>
                  <button className="btn btn--text" type="button">
                    Override
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default MonitoringPage;
