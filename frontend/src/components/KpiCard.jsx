import { motion } from "framer-motion";

const accentClasses = ["kpi-card--1", "kpi-card--2", "kpi-card--3", "kpi-card--4"];

function KpiCard({ label, value, delta, positive, index = 0 }) {
  const arrow = positive ? "▲" : "▼";

  return (
    <motion.article
      className={`kpi-card ${accentClasses[index % 4]}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
      whileHover={{ scale: 1.02 }}
    >
      <p className="kpi-card__label">{label}</p>
      <p className="kpi-card__value">{value}</p>
      {delta && (
        <p className={positive ? "kpi-card__delta kpi-card__delta--pos" : "kpi-card__delta kpi-card__delta--neg"}>
          <span>{arrow}</span>
          {delta}
        </p>
      )}
    </motion.article>
  );
}

export default KpiCard;
