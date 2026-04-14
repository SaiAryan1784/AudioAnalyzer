/**
 * Home page — Framework selector grid.
 * First thing a logged-in user sees: pick what type of recording to analyze.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFrameworks } from "../api";
import { useAuth } from "../context/AuthContext";
import OnboardingModal from "../components/OnboardingModal";

export default function HomePage() {
    const [frameworks, setFrameworks] = useState([]);
    const [loading, setLoading]       = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    const load = () => {
        setFetchError(false);
        setLoading(true);
        getFrameworks()
            .then(setFrameworks)
            .catch(() => setFetchError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    // Show onboarding modal for new users who haven't completed it yet
    useEffect(() => {
        if (user && user.onboarding_completed === false) {
            setShowOnboarding(true);
        }
    }, [user]);

    const handleSelect = (frameworkId) => {
        navigate(`/upload?framework=${frameworkId}`);
    };

    if (loading) {
        return (
            <div className="page-loader">
                <div className="spinner" />
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="empty-state">
                <div className="empty-icon">⚠</div>
                <h2>Could not load frameworks</h2>
                <p>Check your connection and try again.</p>
                <button className="btn-primary" onClick={load} style={{ marginTop: "1rem" }}>
                    Retry
                </button>
            </div>
        );
    }

    if (!loading && frameworks.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h2>No frameworks available</h2>
                <p>Contact support if this persists.</p>
            </div>
        );
    }

    return (
        <>
        {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
        <div className="home-page">
            <div className="home-header">
                <h1>What are you analyzing today?</h1>
                <p>Choose a framework to get started. Each one uses a specialised AI coaching model.</p>
            </div>

            <div className="framework-grid">
                {frameworks.map((fw) => (
                    <button
                        key={fw.id}
                        className="framework-card"
                        onClick={() => handleSelect(fw.id)}
                        id={`framework-${fw.id}`}
                    >
                        <div className="framework-card-icon">{fw.icon}</div>
                        <div className="framework-card-body">
                            <h3 className="framework-card-name">{fw.name}</h3>
                            <p className="framework-card-desc">{fw.description}</p>
                        </div>
                        <div className="framework-card-footer">
                            <span className="dimension-pill">{fw.dimension_count} dimensions</span>
                            <span className="speaker-pill">🎙 {fw.target_speaker}</span>
                        </div>
                    </button>
                ))}
            </div>

            <div className="home-recent-hint">
                <a href="/history" className="recent-link">
                    View past analyses →
                </a>
            </div>
        </div>
        </>
    );
}
