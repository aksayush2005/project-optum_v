import { proposedUpdates, signatures } from "../data/dummyData";

function GoldenSignaturePage() {
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
        <div className="action-list">
          {proposedUpdates.map((item) => (
            <div className="action-row" key={item.id}>
              <div className="action-row__meta">
                <strong>{item.id}</strong>
                <span>{item.mode}</span>
                <span>Confidence: {(item.confidence * 100).toFixed(0)}%</span>
                <span>Yield +{item.expectedYieldGain}%</span>
                <span>Energy -{item.expectedEnergyReduction} kWh</span>
              </div>
              <div className="action-row__buttons">
                <button className="btn btn--primary" type="button">
                  Accept
                </button>
                <button className="btn" type="button">
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
