import { motion, AnimatePresence } from "framer-motion";

/**
 * Human-in-the-Loop decision confirmation modal.
 * Props:
 *   open       - bool
 *   onClose    - fn()
 *   onAccept   - fn()   → "Accept & Promote"
 *   onReprioritize - fn() → redirect to /targets
 *   item       - { id, mode, confidence, objectives: {yield, energy, quality, emission} }
 */
function ConfirmModal({ open, onClose, onAccept, onReprioritize, item }) {
    if (!item) return null;

    const obj = item.objectives || {};

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="modal-box"
                        initial={{ opacity: 0, scale: 0.92, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 24 }}
                        transition={{ duration: 0.28, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="modal-header">
                            <div>
                                <p className="modal-label">Human-in-the-Loop Decision</p>
                                <h2 className="modal-title">{item.id}</h2>
                                <span className="badge badge--ok" style={{ marginTop: 6, display: "inline-flex" }}>
                                    {item.mode}
                                </span>
                            </div>
                            <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
                        </div>

                        {/* Objective diff */}
                        <div className="modal-section-label">Projected Objectives</div>
                        <div className="modal-obj-grid">
                            {[
                                { key: "Yield", val: obj.yield, unit: "%", good: "↑" },
                                { key: "Energy", val: obj.energy, unit: " kWh", good: "↓" },
                                { key: "Quality", val: obj.quality, unit: "", good: "↑" },
                                { key: "Emission", val: obj.emission, unit: " kgCO2e", good: "↓" },
                            ].map(({ key, val, unit, good }) => (
                                <div key={key} className="modal-obj-card">
                                    <p className="modal-obj-label">{key}</p>
                                    <p className="modal-obj-value">
                                        {good} {Number(val ?? 0).toFixed(1)}{unit}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="modal-section-label">
                            Confidence: <strong style={{ color: "#f5c842" }}>{(item.confidence * 100).toFixed(0)}%</strong>
                        </div>

                        {/* Actions */}
                        <div className="modal-actions">
                            <button className="btn btn--primary" onClick={onAccept}>
                                ✓ Accept & Promote
                            </button>
                            <button className="btn" onClick={onReprioritize}>
                                ⊕ Reprioritize Targets
                            </button>
                            <button className="btn btn--text" onClick={onClose}>
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default ConfirmModal;
