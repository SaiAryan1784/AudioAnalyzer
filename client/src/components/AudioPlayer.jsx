/**
 * AudioPlayer — Sticky audio player with timestamp markers for evidence items.
 *
 * Props:
 *   audioUrl:        URL of the audio file to play (blob URL or remote URL)
 *   analysisResults: AnalysisResponse object with dimension_scores
 *   seekTime:        float | null — controlled seek signal from parent
 *   onSeek:          () => void — callback to clear seekTime after seeking
 */

import { useState, useRef, useEffect, useCallback } from "react";

function formatTime(s) {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({ audioUrl, analysisResults, seekTime, onSeek }) {
    const audioRef = useRef(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeEvidence, setActiveEvidence] = useState(null);
    const [volume, setVolume] = useState(1);

    // Collect ALL evidence timestamps across all dimensions, sorted
    const allTimestamps = (analysisResults?.dimension_scores || []).flatMap((dim) =>
        (dim.evidence || []).map((ev) => ({
            ...ev,
            dimensionName: dim.dimension_name,
            score: dim.score,
        }))
    ).sort((a, b) => a.timestamp - b.timestamp);

    // Seek to a specific second
    const seekTo = useCallback((seconds) => {
        if (audioRef.current) {
            audioRef.current.currentTime = seconds;
            audioRef.current.play();
            setIsPlaying(true);
        }
    }, []);

    // Handle parent-controlled seek
    useEffect(() => {
        if (seekTime !== null && seekTime !== undefined) {
            seekTo(seekTime);
            onSeek?.();
        }
    }, [seekTime, seekTo, onSeek]);

    // Polling active evidence
    useEffect(() => {
        const interval = setInterval(() => {
            if (audioRef.current) {
                const t = audioRef.current.currentTime;
                setCurrentTime(t);

                const active = allTimestamps.find(
                    (ev) => Math.abs(ev.timestamp - t) < 3
                );
                setActiveEvidence(active || null);
            }
        }, 200);
        return () => clearInterval(interval);
    }, [allTimestamps]);

    const handleProgressClick = (e) => {
        if (!duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        seekTo(ratio * duration);
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
    };

    const handleVolumeChange = (e) => {
        const v = parseFloat(e.target.value);
        setVolume(v);
        if (audioRef.current) audioRef.current.volume = v;
    };

    const skip = (delta) => {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + delta));
        }
    };

    const progressPercent = duration ? (currentTime / duration) * 100 : 0;
    const scoreColor = (score) => {
        if (!score) return "var(--primary)";
        if (score >= 0.7) return "var(--success)";
        if (score >= 0.4) return "var(--warning)";
        return "var(--danger)";
    };

    if (!audioUrl) return null;

    return (
        <div className="audio-player">
            <audio
                ref={audioRef}
                src={audioUrl}
                onLoadedMetadata={(e) => setDuration(e.target.duration)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
            />

            {/* Active evidence callout */}
            {activeEvidence && (
                <div className="evidence-callout">
                    <span
                        className="callout-dimension"
                        style={{ color: scoreColor(activeEvidence.score) }}
                    >
                        {activeEvidence.dimensionName}
                    </span>
                    <span className="callout-quote">"{activeEvidence.text}"</span>
                    <span className="callout-note">{activeEvidence.note}</span>
                </div>
            )}

            {/* Player bar */}
            <div className="player-controls">
                <div className="player-left">
                    <button className="player-btn" onClick={() => skip(-10)} title="Back 10s">⏮</button>
                    <button className="player-btn player-play" onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
                        {isPlaying ? "⏸" : "▶"}
                    </button>
                    <button className="player-btn" onClick={() => skip(10)} title="Forward 10s">⏭</button>
                    <span className="time-display">{formatTime(currentTime)} / {formatTime(duration)}</span>
                </div>

                <div className="player-track-wrap">
                    <div
                        className="player-track"
                        onClick={handleProgressClick}
                        title="Click to seek"
                    >
                        {/* Progress fill */}
                        <div className="player-fill" style={{ width: `${progressPercent}%` }} />

                        {/* Timestamp markers */}
                        {duration > 0 && allTimestamps.map((ev, i) => (
                            <div
                                key={i}
                                className={`ts-marker ${activeEvidence === ev ? "ts-active" : ""}`}
                                style={{
                                    left: `${(ev.timestamp / duration) * 100}%`,
                                    background: scoreColor(ev.score),
                                }}
                                onClick={(e) => { e.stopPropagation(); seekTo(ev.timestamp); }}
                                title={`${ev.dimensionName}: ${ev.text?.substring(0, 60)}...`}
                            />
                        ))}
                    </div>
                </div>

                <div className="player-right">
                    <span className="volume-icon">🔊</span>
                    <input
                        type="range"
                        className="volume-slider"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volume}
                        onChange={handleVolumeChange}
                    />
                    <span className="evidence-count">{allTimestamps.length} markers</span>
                </div>
            </div>
        </div>
    );
}
