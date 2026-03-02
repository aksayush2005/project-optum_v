/**
 * Gold-tinted shimmer skeleton — use while panels are loading
 * Props: rows (int), height (px per row), wide (bool full-width)
 */
function Skeleton({ rows = 3, height = 18, wide = false }) {
    return (
        <div className="skeleton-wrap" role="status" aria-label="Loading">
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="skeleton-line"
                    style={{
                        height,
                        width: wide ? "100%" : `${70 + Math.sin(i * 1.7) * 25}%`,
                        animationDelay: `${i * 0.12}s`,
                    }}
                />
            ))}
        </div>
    );
}

export default Skeleton;
