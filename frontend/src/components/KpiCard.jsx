function KpiCard({ label, value, delta, positive }) {
  return (
    <article className="kpi-card">
      <p className="kpi-card__label">{label}</p>
      <p className="kpi-card__value">{value}</p>
      <p className={positive ? "kpi-card__delta kpi-card__delta--pos" : "kpi-card__delta kpi-card__delta--neg"}>
        {delta}
      </p>
    </article>
  );
}

export default KpiCard;
