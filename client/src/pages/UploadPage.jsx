/**
 * Upload page — Framework-specific file upload screen.
 * Reads framework from URL query param (?framework=rosenshine).
 * Redirects to /processing/:jobId after submitting.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { startAnalysis, getFrameworks } from "../api";

const ACCEPTED = ".mp3,.wav,.m4a,.webm,.ogg,.flac";

export default function UploadPage() {
    const [searchParams] = useSearchParams();
    const frameworkId = searchParams.get("framework") || "rosenshine";
    const navigate = useNavigate();

    const [framework, setFramework] = useState(null);
    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);

    // Redirect to home if no framework selected
    useEffect(() => {
        if (!searchParams.get("framework")) {
            navigate("/");
            return;
        }
        getFrameworks().then((fws) => {
            const fw = fws.find((f) => f.id === frameworkId);
            if (!fw) { navigate("/"); return; }
            setFramework(fw);
        }).catch(() => navigate("/"));
    }, [frameworkId, navigate, searchParams]);

    const handleFile = (f) => {
        if (f) { setFile(f); setError(null); }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragActive(false);
        handleFile(e.dataTransfer?.files?.[0]);
    };

    const handleSubmit = async () => {
        if (!file) return;
        setError(null);
        setLoading(true);
        try {
            const data = await startAnalysis(file, frameworkId);
            navigate(`/processing/${data.job_id}`);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    if (!framework) {
        return <div className="page-loader"><div className="spinner" /></div>;
    }

    return (
        <div className="upload-page">
            {/* Framework header */}
            <div className="upload-framework-header">
                <Link to="/" className="back-btn">← Back</Link>
                <div className="upload-fw-info">
                    <span className="upload-fw-icon">{framework.icon}</span>
                    <div>
                        <h1 className="upload-fw-name">{framework.name}</h1>
                        <p className="upload-fw-desc">{framework.description}</p>
                    </div>
                </div>
            </div>

            {/* Drop zone */}
            <div
                className={`drop-zone ${dragActive ? "active" : ""} ${file ? "has-file" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => !file && inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPTED}
                    onChange={(e) => handleFile(e.target.files[0])}
                    hidden
                />
                {file ? (
                    <div className="file-preview">
                        <div className="file-icon">🎵</div>
                        <div className="file-info">
                            <span className="file-name">{file.name}</span>
                            <span className="file-size">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                        </div>
                        <button
                            className="btn-remove"
                            onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        >✕</button>
                    </div>
                ) : (
                    <div className="drop-prompt">
                        <div className="drop-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        </div>
                        <p className="drop-text">
                            Drop audio here or <span onClick={() => inputRef.current?.click()}>browse</span>
                        </p>
                        <p className="drop-hint">MP3, WAV, M4A, WEBM, OGG, FLAC — max 100 MB, 60 min</p>
                    </div>
                )}
            </div>

            {/* Dimensions preview */}
            <div className="upload-dimensions">
                <h3 className="dimensions-heading">What gets analyzed ({framework.dimension_count} dimensions)</h3>
                <div className="dimensions-grid">
                    {framework.dimensions.map((d) => (
                        <div key={d.number} className="dim-preview">
                            <span className="dim-preview-num">D{d.number}</span>
                            <div>
                                <span className="dim-preview-name">{d.name}</span>
                                <span className="dim-preview-desc">{d.description}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="error-banner">
                    <span className="error-icon">✕</span>
                    <span>{error}</span>
                </div>
            )}

            {/* Submit */}
            {file && (
                <button
                    className="btn-primary btn-analyze"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? "Starting…" : `🔬 Analyze with ${framework.name}`}
                </button>
            )}
        </div>
    );
}
