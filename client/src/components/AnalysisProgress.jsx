/**
 * Analysis progress indicator — polls /status/{jobId} and shows step names.
 */

import { useEffect, useState } from "react";
import { getJobStatus } from "../api";

const STEP_LABELS = {
    pending: "Queued",
    preprocessing: "Compressing audio…",
    transcribing: "Transcribing & diarizing…",
    analyzing: "Evaluating Rosenshine principles…",
    complete: "Complete",
    failed: "Failed",
};

const STEP_ORDER = ["pending", "preprocessing", "transcribing", "analyzing", "complete"];

export default function AnalysisProgress({ jobId, onComplete, onError }) {
    const [status, setStatus] = useState("pending");
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!jobId) return;

        const poll = setInterval(async () => {
            try {
                const data = await getJobStatus(jobId);
                setStatus(data.status);

                if (data.status === "complete") {
                    clearInterval(poll);
                    onComplete?.();
                } else if (data.status === "failed") {
                    clearInterval(poll);
                    setError(data.error || "Analysis failed");
                    onError?.(data.error);
                }
            } catch {
                clearInterval(poll);
                setError("Lost connection to server");
                onError?.("Lost connection");
            }
        }, 3000);

        return () => clearInterval(poll);
    }, [jobId, onComplete, onError]);

    const currentIdx = STEP_ORDER.indexOf(status);
    const progress = status === "complete" ? 100 : Math.max(5, (currentIdx / (STEP_ORDER.length - 1)) * 100);

    return (
        <div className="progress-container">
            <div className="progress-bar-track">
                <div
                    className="progress-bar-fill"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="progress-steps">
                {STEP_ORDER.map((step, i) => (
                    <div
                        key={step}
                        className={`progress-step ${i <= currentIdx ? "active" : ""} ${step === status ? "current" : ""
                            }`}
                    >
                        <div className="step-dot" />
                        <span className="step-label">{STEP_LABELS[step]}</span>
                    </div>
                ))}
            </div>

            {error && (
                <div className="progress-error">
                    <span className="error-icon">✕</span>
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
