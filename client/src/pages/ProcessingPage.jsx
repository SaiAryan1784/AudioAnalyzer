/**
 * Processing page — Live step-by-step pipeline progress tracker.
 * Polls /status/:jobId every 3s and redirects to /results when complete.
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getJobStatus } from "../api";

const STEPS = [
    { key: "preprocessing", label: "Preprocessing audio", hint: "Compressing with ffmpeg for optimal transcription" },
    { key: "transcribing", label: "Transcribing speech", hint: "AssemblyAI converting audio to text" },
    { key: "analyzing", label: "Analyzing framework", hint: "Groq LLM scoring each dimension" },
    { key: "saving", label: "Saving results", hint: "Writing analysis to database" },
    { key: "complete", label: "Analysis complete", hint: "Redirecting to results..." },
];

const STATUS_INDEX = {
    pending: 0,
    preprocessing: 0,
    transcribing: 1,
    diarizing: 1,
    analyzing: 2,
    saving: 3,
    complete: 4,
    failed: -1,
};

export default function ProcessingPage() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("pending");
    const [error, setError] = useState(null);
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!jobId) return;

        const poll = setInterval(async () => {
            try {
                const data = await getJobStatus(jobId);
                setStatus(data.status);

                if (data.status === "complete") {
                    clearInterval(poll);
                    setTimeout(() => navigate(`/results/${jobId}`), 800);
                }
                if (data.status === "failed") {
                    clearInterval(poll);
                    setError(data.error || "Analysis failed. Please try again.");
                }
            } catch {
                // Polling errors are transient — keep trying
            }
        }, 3000);

        // Initial check immediately
        getJobStatus(jobId)
            .then((data) => setStatus(data.status))
            .catch(() => { });

        return () => clearInterval(poll);
    }, [jobId, navigate]);

    const currentIndex = STATUS_INDEX[status] ?? 0;

    if (error) {
        return (
            <div className="processing-page">
                <div className="processing-error-card">
                    <div className="error-icon-lg">⚠</div>
                    <h2>Analysis Failed</h2>
                    <p className="error-detail">{error}</p>
                    <button className="btn-primary" onClick={() => navigate("/")}>
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="processing-page">
            <div className="processing-card">
                <div className="processing-header">
                    <div className="processing-spinner" />
                    <h2>Analyzing your recording...</h2>
                    <span className="elapsed-time">{elapsed}s</span>
                </div>

                <div className="pipeline-steps">
                    {STEPS.map((step, i) => {
                        const isDone = i < currentIndex;
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
                                    {isActive && (
                                        <span className="step-hint">{step.hint}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="processing-tip">
                    <span className="tip-label">While you wait</span>
                    <p className="tip-text">
                        This analysis uses AssemblyAI for transcription and Groq's Llama 3.3 for multi-dimensional scoring.
                        Average processing time is 30–90 seconds depending on audio length.
                    </p>
                </div>
            </div>
        </div>
    );
}
