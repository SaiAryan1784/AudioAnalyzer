/**
 * Processing page — Live step-by-step pipeline progress tracker.
 * Polls /status/:jobId every 3s and redirects to /results when complete.
 * Improvements: human-readable timer, network-error recovery, dynamic tips.
 */

import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getJobStatus } from "../api";

const STEPS = [
    { key: "preprocessing", label: "Preprocessing audio",  hint: "Compressing with ffmpeg for optimal transcription" },
    { key: "transcribing",  label: "Transcribing speech",  hint: "AssemblyAI converting audio to text with speaker diarization" },
    { key: "analyzing",     label: "Analyzing framework",  hint: "Groq LLM scoring each dimension against the framework rubric" },
    { key: "saving",        label: "Saving results",       hint: "Writing analysis to your account" },
    { key: "complete",      label: "Analysis complete",    hint: "Redirecting to results…" },
];

// Dynamic tips per stage — shown in the "While you wait" box
const STAGE_TIPS = {
    0: "Audio files are compressed to 64 kbps mono before transcription to minimize processing time and cost.",
    1: "AssemblyAI uses deep-learning models to identify and separate individual speakers automatically.",
    2: "The LLM evaluates each framework dimension independently and grounds each score with real transcript evidence.",
    3: "Your analysis history is saved privately — only you can access it.",
    4: "Analysis complete! Preparing your results dashboard…",
};

const STATUS_INDEX = {
    pending:       0,
    preprocessing: 0,
    transcribing:  1,
    diarizing:     1,
    analyzing:     2,
    saving:        3,
    complete:      4,
    failed:        -1,
};

function formatElapsed(seconds) {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
}

export default function ProcessingPage() {
    const { jobId }   = useParams();
    const navigate    = useNavigate();
    const [status, setStatus]   = useState("pending");
    const [error, setError]     = useState(null);
    const [elapsed, setElapsed] = useState(0);
    const [netErrors, setNetErrors] = useState(0);   // consecutive network failures
    const pollRef = useRef(null);

    // Elapsed timer
    useEffect(() => {
        const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!jobId) return;

        const doFetch = async () => {
            try {
                const data = await getJobStatus(jobId);
                setNetErrors(0);
                setStatus(data.status);

                if (data.status === "complete") {
                    clearInterval(pollRef.current);
                    setTimeout(() => navigate(`/results/${jobId}`), 800);
                }
                if (data.status === "failed") {
                    clearInterval(pollRef.current);
                    setError(data.error || "Analysis failed. Please try again.");
                }
            } catch {
                setNetErrors((n) => n + 1);
            }
        };

        // Initial immediate check
        doFetch();
        pollRef.current = setInterval(doFetch, 3000);

        return () => clearInterval(pollRef.current);
    }, [jobId, navigate]);

    const currentIndex = STATUS_INDEX[status] ?? 0;
    const connectionLost = netErrors >= 3;

    if (error) {
        return (
            <div className="processing-page">
                <div className="processing-error-card">
                    <div className="error-icon-lg">⚠</div>
                    <h2>Analysis Failed</h2>
                    <p className="error-detail">{error}</p>
                    <Link to="/" className="btn-primary">Try again</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="processing-page">
            <div className="processing-card">
                <div className="processing-header">
                    <div className="processing-spinner" />
                    <h2>Analyzing your recording…</h2>
                    <span className="elapsed-time">{formatElapsed(elapsed)}</span>
                </div>

                {/* Network warning banner */}
                {connectionLost && (
                    <div style={{
                        background: "rgba(255,165,2,0.1)",
                        border: "1px solid rgba(255,165,2,0.3)",
                        borderRadius: "8px",
                        padding: "0.6rem 1rem",
                        fontSize: "0.8rem",
                        color: "#FFA502",
                        marginBottom: "0.5rem",
                        textAlign: "center",
                    }}>
                        Connection lost — retrying… Analysis is still running in the background.
                    </div>
                )}

                <div className="pipeline-steps">
                    {STEPS.map((step, i) => {
                        const isDone   = i < currentIndex;
                        const isActive = i === currentIndex;
                        return (
                            <div
                                key={step.key}
                                className={`pipeline-step ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}
                            >
                                <div className="step-icon-col">
                                    <div className="step-circle">
                                        {isDone ? "✓" : isActive ? "●" : "○"}
                                    </div>
                                    {i < STEPS.length - 1 && <div className="step-connector" />}
                                </div>
                                <div className="step-text">
                                    <span className="step-label">{step.label}</span>
                                    {isActive && <span className="step-hint">{step.hint}</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="processing-tip">
                    <span className="tip-label">While you wait</span>
                    <p className="tip-text">{STAGE_TIPS[currentIndex] ?? STAGE_TIPS[0]}</p>
                </div>
            </div>
        </div>
    );
}
