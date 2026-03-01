function Navbar() {
  return (
    <header className="topbar">
      <div>
        <h1 className="topbar__title">Golden Signature Multi-Objective Optimization Engine</h1>
        <p className="topbar__meta">Plant: Pune Site 2 | Shift: A | Last sync: 09:42</p>
      </div>
      <div className="topbar__right">
        <span className="badge badge--ok">System Healthy</span>
        <span className="topbar__user">Operator: R. Sharma</span>
      </div>
    </header>
  );
}

export default Navbar;
