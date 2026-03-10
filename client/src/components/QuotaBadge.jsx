/**
 * Quota badge — shows usage dots for regular users,
 * and an "∞ Unlimited" pill for admins (limit >= 9999).
 */

export default function QuotaBadge({ used, limit, remaining }) {
    const isUnlimited = limit >= 9999;

    if (isUnlimited) {
        return (
            <div className="quota-badge quota-unlimited">
                <span className="quota-unlimited-icon">∞</span>
                <span className="quota-unlimited-label">Unlimited</span>
            </div>
        );
    }

    return (
        <div className="quota-badge">
            <span className="quota-label">{used}/{limit} analyses</span>
            <div className="quota-dots">
                {Array.from({ length: limit }, (_, i) => (
                    <span
                        key={i}
                        className={`quota-dot ${i < used ? "used" : "free"}`}
                    />
                ))}
            </div>
            {remaining === 0 && (
                <span className="quota-exhausted">Limit reached</span>
            )}
        </div>
    );
}

