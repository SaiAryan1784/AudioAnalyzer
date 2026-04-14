/**
 * History page — Analysis list with framework filters, radar chart, line trend.
 * Improvements: sort options, expandable evidence, consistent icons map.
 */

import { useEffect, useState } from "react";
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { Link } from "react-router-dom";
import { getHistory, getFrameworks } from "../api";

// Covers existing + new frameworks
const FRAMEWORK_ICONS = {
    rosenshine:             "🎓",
    sales_spin:             "📞",
    interview_star:         "🎯",
    meeting_effectiveness:  "🤝",
    public_speaking:        "🎤",
    customer_service:       "🎧",
    podcast:                "🎙",
    language_speaking:      "🌐",
    counseling:             "🧠",
};

const SORT_OPTIONS = [
    { value: "newest",  label: "Newest first" },
    { value: "oldest",  label: "Oldest first" },
    { value: "highest", label: "Highest score" },
    { value: "lowest",  label: "Lowest score" },
];

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
function fmtTimestamp(s) {
    const m = Math.floor((s || 0) / 60);
    const sec = Math.floor((s || 0) % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
}

function sortAnalyses(list, sortBy) {
    const copy = [...list];
    switch (sortBy) {
        case "oldest":  return copy.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        case "highest": return copy.sort((a, b) => b.overall_score - a.overall_score);
        case "lowest":  return copy.sort((a, b) => a.overall_score - b.overall_score);
        default:        return copy.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
}

// Dimension card in the detail panel — with expandable evidence
function DimensionCard({ ds }) {
    const [expanded, setExpanded] = useState(false);
    const evidence = (ds.evidence || []).filter((ev) => typeof ev === "object");
    const visible  = expanded ? evidence : evidence.slice(0, 2);
    const hasMore  = evidence.length > 2;

    return (
        <div className="principle-card">
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
            {visible.length > 0 && (
                <div className="principle-evidence">
                    {visible.map((ev, i) => (
                        <blockquote key={i}>
                            <span className="ev-timestamp">{fmtTimestamp(ev.timestamp)}</span>
                            " {ev.text}"
                        </blockquote>
                    ))}
                    {hasMore && (
                        <button
                            onClick={() => setExpanded((e) => !e)}
                            style={{
                                background: "none",
                                border: "1px solid var(--border)",
                                borderRadius: "6px",
                                color: "var(--text-muted)",
                                fontSize: "0.72rem",
                                padding: "0.2rem 0.6rem",
                                cursor: "pointer",
                                marginTop: "0.25rem",
                            }}
                        >
                            {expanded ? "Show less" : `Show ${evidence.length - 2} more`}
                        </button>
                    )}
                </div>
            )}
            <p className="principle-improvement">💡 {ds.improvement}</p>
        </div>
    );
}

export default function HistoryPage() {
    const [analyses, setAnalyses] = useState([]);
    const [frameworks, setFrameworks] = useState({});
    const [selected, setSelected]   = useState(null);
    const [filterFw, setFilterFw]   = useState("all");
    const [sortBy, setSortBy]       = useState("newest");
    const [loading, setLoading]     = useState(true);

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

    if (loading) return <div className="page-loader"><div className="spinner" /></div>;

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

    const usedFrameworks = [...new Set(analyses.map((a) => a.framework_id))];
    const afterFilter    = filterFw === "all" ? analyses : analyses.filter((a) => a.framework_id === filterFw);
    const filtered       = sortAnalyses(afterFilter, sortBy);

    const radarData = selected?.dimension_scores
        ?.sort((a, b) => a.dimension_number - b.dimension_number)
        .map((ds) => ({
            dim:      `D${ds.dimension_number}`,
            fullName: ds.dimension_name,
            score:    parseFloat((ds.score * 10).toFixed(1)),
        })) || [];

    // Trend always chronological for the chart
    const trendData = [...afterFilter]
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .map((a) => ({
            date:      new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            score:     parseFloat((a.overall_score * 10).toFixed(1)),
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

            {/* Filter + Sort row */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <div className="fw-filter-row" style={{ margin: 0, flex: 1 }}>
                    <button className={`fw-filter-btn ${filterFw === "all" ? "active" : ""}`} onClick={() => setFilterFw("all")}>
                        All
                    </button>
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

                {/* Sort dropdown */}
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--text-muted)",
                        fontSize: "0.78rem",
                        padding: "0.4rem 0.75rem",
                        outline: "none",
                        cursor: "pointer",
                        flexShrink: 0,
                    }}
                    aria-label="Sort analyses"
                >
                    {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
            </div>

            {/* Score trend chart */}
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
                            <div className="item-fw-icon">{FRAMEWORK_ICONS[a.framework_id] || "📊"}</div>
                            <div className="item-score" style={{ color: scoreColor(a.overall_score) }}>
                                {(a.overall_score * 10).toFixed(1)}
                            </div>
                            <div className="item-details">
                                <span className="item-fw-name">{a.framework_name}</span>
                                <span className="item-date">
                                    {new Date(a.created_at).toLocaleDateString("en-US", {
                                        month: "short", day: "numeric", year: "numeric",
                                    })}
                                </span>
                                <span className="item-duration">{Math.round(a.duration_seconds / 60)} min</span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Selected analysis detail */}
                {selected && (
                    <div className="analysis-detail">
                        {radarData.length > 0 && (
                            <div className="chart-card">
                                <h3>Dimension Scores — {selected.framework_name}</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                                        <PolarGrid stroke="var(--border)" />
                                        <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
                                        <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                                        <Radar
                                            dataKey="score"
                                            stroke="var(--primary)"
                                            fill="var(--primary)"
                                            fillOpacity={0.2}
                                            strokeWidth={2}
                                        />
                                        <Tooltip
                                            formatter={(val, _, props) => [`${val}/10`, props.payload.fullName]}
                                            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

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
                                    <span className="stat-value">{Math.round(selected.duration_seconds / 60)} min</span>
                                    <span className="stat-label">Duration</span>
                                </div>
                            </div>
                        </div>

                        <div className="principles-list">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                                <h3 style={{ margin: 0 }}>Dimension Breakdown</h3>
                                <Link to={`/results/${selected.job_id}`} className="view-full-btn">
                                    View full results →
                                </Link>
                            </div>
                            {selected.dimension_scores
                                ?.sort((a, b) => a.dimension_number - b.dimension_number)
                                .map((ds) => <DimensionCard key={ds.dimension_number} ds={ds} />)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
