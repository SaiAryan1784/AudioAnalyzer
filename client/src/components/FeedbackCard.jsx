/**
 * Feedback card — displays a single Rosenshine principle score.
 * Used in the analysis results view.
 */

export default function FeedbackCard({
  principleNumber,
  principleName,
  score,
  evidence,
  improvement,
  timestampStart,
  onSeek,
}) {
  const pct = (score * 100).toFixed(0);
  const level = score >= 0.7 ? "high" : score >= 0.4 ? "mid" : "low";

  return (
    <div className="feedback-card">
      <div className="feedback-header">
        <button
          onClick={() => onSeek?.(timestampStart)}
          className="feedback-timestamp"
          title="Seek to this moment"
        >
          {Math.floor(timestampStart / 60)}:
          {String(Math.floor(timestampStart % 60)).padStart(2, "0")}
        </button>
        <div className="feedback-title">
          <span className="feedback-num">P{principleNumber}</span>
          <span className="feedback-name">{principleName}</span>
        </div>
        <span className={`feedback-score ${level}`}>{pct}%</span>
      </div>

      {evidence?.length > 0 && (
        <div className="feedback-evidence">
          {evidence.map((e, i) => (
            <blockquote key={i}>"{e}"</blockquote>
          ))}
        </div>
      )}

      {improvement && (
        <p className="feedback-improvement">💡 {improvement}</p>
      )}
    </div>
  );
}
