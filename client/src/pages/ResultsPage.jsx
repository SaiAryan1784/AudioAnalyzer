/**
 * Results page — Redesigned with a full-width summary strip at the top
 * and spacious dimension cards below. More breathing room throughout.
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    ResponsiveContainer,
} from "recharts";
import { getResults } from "../api";

function formatDuration(s) {
    if (!s) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
}

function formatTimestamp(s) {
    if (!s && s !== 0) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
}

function scoreColor(score) {
    if (score >= 0.7) return "var(--success)";
    if (score >= 0.4) return "var(--warning)";
    return "var(--danger)";
}

function scoreClass(score) {
    if (score >= 0.7) return "high";
    if (score >= 0.4) return "mid";
    return "low";
}

const FW_ICONS = {
    rosenshine: "🎓",
    sales_spin: "📞",
    interview_star: "🎯",
    meeting_effectiveness: "🤝",
    public_speaking: "🎤",
};

export default function ResultsPage() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copiedKey, setCopiedKey] = useState(null);

    useEffect(() => {
        if (!jobId) return;
        let retries = 0;
        const tryFetch = async () => {
            try {
                const data = await getResults(jobId);
                setAnalysis(data);
                setLoading(false);
            } catch (err) {
                if (err.message === "Analysis not yet complete" && retries < 10) {
                    retries++;
                    setTimeout(tryFetch, 3000);
                } else {
                    setError(err.message);
                    setLoading(false);
                }
            }
        };
        tryFetch();
    }, [jobId]);

    const copyEvidence = useCallback((key, timestamp, text) => {
        const label = `${formatTimestamp(timestamp)} — "${text}"`;
        navigator.clipboard.writeText(label).then(() => {
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 2000);
        });
    }, []);

    if (loading) {
        return (
            <div className="page-loader">
                <div className="spinner" />
                <p style={{ color: "var(--text-muted)", marginTop: "1rem" }}>Loading results…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="results-error">
                <h2>⚠ Could not load results</h2>
                <p>{error}</p>
                <button className="btn-primary" onClick={() => navigate("/")}>Back to home</button>
            </div>
        );
    }

    if (!analysis) return null;

    const scores = analysis.dimension_scores || [];
    const overallDisplay = (analysis.overall_score * 10).toFixed(1);
    const talkPct = Math.round((analysis.teacher_talk_ratio || 0) * 100);
    const radarData = scores.map((d) => ({
        dim: d.dimension_name.split(" ").slice(0, 2).join(" "),
        score: parseFloat((d.score * 10).toFixed(1)),
        fullMark: 10,
    }));

    return (
        <div className="results-page">
            {/* ── Top nav bar ─────────────────────────────────────────── */}
            <div className="results-topbar">
                <Link to="/" className="back-btn">← Back</Link>
                <div className="results-meta">
                    <span>{FW_ICONS[analysis.framework_id] || "📊"}</span>
                    <span className="results-framework-name">{analysis.framework_name}</span>
                    <span className="results-separator">·</span>
                    <span className="results-duration">{formatDuration(analysis.duration_seconds)}</span>
                </div>
            </div>

            {/* ── Full-width summary strip ─────────────────────────── */}
            <div className="results-summary-strip">
                {/* Score block */}
                <div className="rss-score-block">
                    <div className="rss-score-label">Overall Score</div>
                    <div className="rss-score-num">
                        <span className="rss-score-big">{overallDisplay}</span>
                        <span className="rss-score-den">/10</span>
                    </div>
                </div>

                {/* Divider */}
                <div className="rss-divider" />

                {/* Radar chart */}
                <div className="rss-radar">
                    <ResponsiveContainer width="100%" height={190}>
                        <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                            <PolarGrid stroke="var(--border)" />
                            <PolarAngleAxis
                                dataKey="dim"
                                tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                            />
                            <Radar
                                dataKey="score"
                                fill="var(--primary)"
                                fillOpacity={0.18}
                                stroke="var(--primary)"
                                strokeWidth={2}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                {/* Divider */}
                <div className="rss-divider" />

                {/* Stats + summary */}
                <div className="rss-meta">
                    <div className="rss-stats">
                        <div className="rss-stat">
                            <span className="rss-stat-val">{talkPct}%</span>
                            <span className="rss-stat-label">Speaker ratio</span>
                        </div>
                        <div className="rss-stat">
                            <span className="rss-stat-val">{formatDuration(analysis.duration_seconds)}</span>
                            <span className="rss-stat-label">Duration</span>
                        </div>
                        <div className="rss-stat">
                            <span className="rss-stat-val">{scores.length}</span>
                            <span className="rss-stat-label">Dimensions</span>
                        </div>
                    </div>
                    <p className="rss-summary">{analysis.summary}</p>
                </div>
            </div>

            {/* ── Score navigation tabs ─────────────────────────────── */}
            <div className="dim-tabs">
                {scores.map((d) => (
                    <a
                        key={d.dimension_number}
                        href={`#dim-${d.dimension_number}`}
                        className="dim-tab"
                        style={{ borderBottomColor: scoreColor(d.score) }}
                        title={d.dimension_name}
                    >
                        <span className="dim-tab-num">D{d.dimension_number}</span>
                        <span className="dim-tab-name">{d.dimension_name}</span>
                        <span className="dim-tab-score" style={{ color: scoreColor(d.score) }}>
                            {(d.score * 10).toFixed(1)}
                        </span>
                    </a>
                ))}
            </div>

            {/* ── Dimension cards ───────────────────────────────────── */}
            <div className="dim-cards">
                {scores.map((d) => (
                    <div key={d.dimension_number} id={`dim-${d.dimension_number}`} className="dim-card">
                        {/* Card header */}
                        <div className="dim-card-header">
                            <div className="dim-card-title-row">
                                <span className="dim-num-badge">D{d.dimension_number}</span>
                                <h3 className="dim-card-title">{d.dimension_name}</h3>
                                <span
                                    className={`dim-card-score-badge ${scoreClass(d.score)}`}
                                    style={{ color: scoreColor(d.score) }}
                                >
                                    {(d.score * 10).toFixed(1)}/10
                                </span>
                            </div>
                            <div className="score-bar">
                                <div
                                    className="score-bar-fill"
                                    style={{ width: `${d.score * 100}%`, background: scoreColor(d.score) }}
                                />
                            </div>
                        </div>

                        {/* Evidence + suggestion side-by-side on wide screens */}
                        <div className="dim-card-body">
                            {/* Evidence column */}
                            <div className="dim-evidence-col">
                                <div className="dim-col-heading">Evidence from transcript</div>
                                <div className="evidence-list">
                                    {(d.evidence || []).filter(ev => typeof ev === "object").map((ev, i) => {
                                        const key = `${d.dimension_number}-${i}`;
                                        const copied = copiedKey === key;
                                        return (
                                            <div key={i} className="evidence-item" style={{ cursor: "default" }}>
                                                <div className="ts-badge">{formatTimestamp(ev.timestamp)}</div>
                                                <div className="evidence-content" style={{ flex: 1 }}>
                                                    <span className="evidence-speaker">Speaker {ev.speaker}</span>
                                                    <span className="evidence-quote">"{ev.text}"</span>
                                                    {ev.note && <span className="evidence-note">{ev.note}</span>}
                                                </div>
                                                <button
                                                    onClick={() => copyEvidence(key, ev.timestamp, ev.text)}
                                                    title="Copy to clipboard"
                                                    style={{
                                                        flexShrink: 0,
                                                        background: "none",
                                                        border: "none",
                                                        cursor: "pointer",
                                                        color: copied ? "var(--primary)" : "var(--text-muted)",
                                                        fontSize: "0.75rem",
                                                        padding: "2px 4px",
                                                        transition: "color 0.2s",
                                                    }}
                                                    aria-label="Copy evidence"
                                                >
                                                    {copied ? "✓" : "⎘"}
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {(!d.evidence || d.evidence.filter(ev => typeof ev === "object").length === 0) && (
                                        <p className="no-evidence">No transcript evidence recorded.</p>
                                    )}
                                </div>
                            </div>

                            {/* Suggestion column */}
                            <div className="dim-suggestion-col">
                                <div className="dim-col-heading">Coaching suggestion</div>
                                <div className="improvement-box">
                                    <p>{d.improvement}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Privacy note ─────────────────────────────────────── */}
            <div style={{
                textAlign: "center",
                padding: "1.5rem 1rem 3rem",
                color: "var(--text-muted)",
                fontSize: "0.75rem",
                opacity: 0.6,
            }}>
                🔒 Audio files are deleted immediately after analysis and are never stored.
            </div>
        </div>
    );
}
