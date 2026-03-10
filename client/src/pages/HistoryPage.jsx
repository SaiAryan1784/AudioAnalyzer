/**
 * History page — Analysis list with framework filters, radar chart, line trend.
 * Updated for multi-framework architecture.
 */

import { useEffect, useState } from "react";
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { Link } from "react-router-dom";
import { getHistory, getFrameworks } from "../api";

const FRAMEWORK_ICONS = {
    rosenshine: "🎓",
    sales_spin: "📞",
    interview_star: "🎯",
    meeting_effectiveness: "🤝",
    public_speaking: "🎤",
};

function scoreClass(score) {
    if (score >= 0.7) return "high";
    if (score >= 0.4) return "mid";
    return "low";
}

function scoreColor(score) {
    if (score >= 0.7) return "var(--success)";
    if (score >= 0.4) return "var(--warning)";
    return "var(--danger)";
}

export default function HistoryPage() {
    const [analyses, setAnalyses] = useState([]);
    const [frameworks, setFrameworks] = useState({});
    const [selected, setSelected] = useState(null);
    const [filterFw, setFilterFw] = useState("all");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getHistory(), getFrameworks()])
            .then(([hist, fws]) => {
                setAnalyses(hist);
                const fwMap = {};
                fws.forEach((fw) => (fwMap[fw.id] = fw));
                setFrameworks(fwMap);
                if (hist.length > 0) setSelected(hist[0]);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="page-loader"><div className="spinner" /></div>;
    }

    if (analyses.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h2>No analyses yet</h2>
                <p>Upload your first recording to see insights here.</p>
                <Link to="/" className="btn-primary" style={{ textDecoration: "none", display: "inline-flex", marginTop: "1rem" }}>
                    Get started
                </Link>
            </div>
        );
    }

    // Framework IDs that appear in this user's history
    const usedFrameworks = [...new Set(analyses.map((a) => a.framework_id))];
    const filtered = filterFw === "all" ? analyses : analyses.filter((a) => a.framework_id === filterFw);

    // Radar data for selected analysis
    const radarData = selected?.dimension_scores
        ?.sort((a, b) => a.dimension_number - b.dimension_number)
        .map((ds) => ({
            dim: `D${ds.dimension_number}`,
            fullName: ds.dimension_name,
            score: parseFloat((ds.score * 10).toFixed(1)),
        })) || [];

    // Score trend
    const trendData = [...filtered].reverse().map((a) => ({
        date: new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        score: parseFloat((a.overall_score * 10).toFixed(1)),
        framework: a.framework_name,
    }));

    return (
        <div className="history-page">
            <div className="history-topbar">
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h1>Your Analyses</h1>
                    <p>Track improvement over time across all frameworks</p>
                </div>
                <Link to="/" className="btn-primary-sm">New Analysis</Link>
            </div>

            {/* Framework filter */}
            <div className="fw-filter-row">
                <button
                    className={`fw-filter-btn ${filterFw === "all" ? "active" : ""}`}
                    onClick={() => setFilterFw("all")}
                >All</button>
                {usedFrameworks.map((fwId) => (
                    <button
                        key={fwId}
                        className={`fw-filter-btn ${filterFw === fwId ? "active" : ""}`}
                        onClick={() => setFilterFw(fwId)}
                    >
                        {FRAMEWORK_ICONS[fwId] || "📊"} {frameworks[fwId]?.name || fwId}
                    </button>
                ))}
            </div>

            {/* Score trend */}
            {trendData.length > 1 && (
                <div className="chart-card" style={{ marginBottom: "1.5rem" }}>
                    <h3>Overall Score Trend</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={trendData}>
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                            <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                            <Tooltip
                                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px" }}
                                formatter={(val, _, props) => [`${val}/10`, props.payload.framework || "Score"]}
                            />
                            <Line
                                type="monotone"
                                dataKey="score"
                                stroke="var(--primary)"
                                strokeWidth={2}
                                dot={{ fill: "var(--primary)", r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            <div className="history-grid">
                {/* Analysis list */}
                <div className="analysis-list">
                    <h3>Sessions ({filtered.length})</h3>
                    {filtered.map((a) => (
                        <button
                            key={a.id}
                            className={`analysis-item ${selected?.id === a.id ? "active" : ""}`}
                            onClick={() => setSelected(a)}
                        >
                            <div className="item-fw-icon">
                                {FRAMEWORK_ICONS[a.framework_id] || "📊"}
                            </div>
                            <div className="item-score" style={{ color: scoreColor(a.overall_score) }}>
                                {(a.overall_score * 10).toFixed(1)}
                            </div>
                            <div className="item-details">
                                <span className="item-fw-name">{a.framework_name}</span>
                                <span className="item-date">
                                    {new Date(a.created_at).toLocaleDateString("en-US", {
                                        month: "short", day: "numeric", year: "numeric"
                                    })}
                                </span>
                                <span className="item-duration">
                                    {Math.round(a.duration_seconds / 60)} min
                                </span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Selected analysis detail */}
                {selected && (
                    <div className="analysis-detail">
                        {/* Radar */}
                        {radarData.length > 0 && (
                            <div className="chart-card">
                                <h3>Dimension Scores — {selected.framework_name}</h3>
                                <ResponsiveContainer width="100%" height={320}>
                                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                                        <PolarGrid stroke="var(--border)" />
                                        <PolarAngleAxis
                                            dataKey="dim"
                                            tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                                        />
                                        <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                                        <Radar
                                            dataKey="score"
                                            stroke="var(--primary)"
                                            fill="var(--primary)"
                                            fillOpacity={0.2}
                                            strokeWidth={2}
                                        />
                                        <Tooltip
                                            formatter={(val, _, props) => [
                                                `${val}/10`,
                                                props.payload.fullName,
                                            ]}
                                            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Summary card */}
                        <div className="detail-card">
                            <h3>Summary</h3>
                            <p>{selected.summary}</p>
                            <div className="detail-stats">
                                <div className="stat">
                                    <span className="stat-value" style={{ color: scoreColor(selected.overall_score) }}>
                                        {(selected.overall_score * 10).toFixed(1)}/10
                                    </span>
                                    <span className="stat-label">Overall Score</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">
                                        {Math.round((selected.teacher_talk_ratio || 0) * 100)}%
                                    </span>
                                    <span className="stat-label">Speaker Ratio</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">
                                        {Math.round(selected.duration_seconds / 60)} min
                                    </span>
                                    <span className="stat-label">Duration</span>
                                </div>
                            </div>
                        </div>

                        {/* Dimension breakdown */}
                        <div className="principles-list">
                            <h3>Dimension Breakdown</h3>
                            <Link
                                to={`/results/${selected.job_id}`}
                                className="view-full-btn"
                            >
                                View full results →
                            </Link>
                            {selected.dimension_scores
                                ?.sort((a, b) => a.dimension_number - b.dimension_number)
                                .map((ds) => (
                                    <div key={ds.dimension_number} className="principle-card">
                                        <div className="principle-header">
                                            <span className="principle-num">D{ds.dimension_number}</span>
                                            <span className="principle-name">{ds.dimension_name}</span>
                                            <span className={`principle-score ${scoreClass(ds.score)}`}>
                                                {(ds.score * 10).toFixed(1)}/10
                                            </span>
                                        </div>
                                        <div className="score-bar" style={{ height: "3px", marginBottom: "0.75rem" }}>
                                            <div
                                                className="score-bar-fill"
                                                style={{ width: `${ds.score * 100}%`, background: scoreColor(ds.score) }}
                                            />
                                        </div>
                                        {ds.evidence?.length > 0 && (
                                            <div className="principle-evidence">
                                                {ds.evidence.slice(0, 2).map((ev, i) => (
                                                    <blockquote key={i}>
                                                        <span className="ev-timestamp">▶ {
                                                            (() => {
                                                                const m = Math.floor((ev.timestamp || 0) / 60);
                                                                const s = Math.floor((ev.timestamp || 0) % 60);
                                                                return `${m}:${s.toString().padStart(2, "0")}`;
                                                            })()
                                                        }</span>
                                                        " {typeof ev === "string" ? ev : ev.text}"
                                                    </blockquote>
                                                ))}
                                            </div>
                                        )}
                                        <p className="principle-improvement">💡 {ds.improvement}</p>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
