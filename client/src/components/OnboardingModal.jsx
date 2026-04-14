/**
 * OnboardingModal — 3-step first-run experience.
 * Step 1: Role selection
 * Step 2: Sample analysis preview
 * Step 3: CTA to upload first file
 *
 * Shown once on first login. Dismissed by calling completeOnboarding() API.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { completeOnboarding } from "../api";

const ROLES = [
    { icon: "🎓", label: "Teacher / Educator",    fw: "rosenshine" },
    { icon: "📞", label: "Sales Professional",     fw: "sales_spin" },
    { icon: "🎯", label: "Interviewer / Recruiter", fw: "interview_star" },
    { icon: "🤝", label: "Meeting Facilitator",    fw: "meeting_effectiveness" },
    { icon: "🎤", label: "Public Speaker",         fw: "public_speaking" },
    { icon: "✨", label: "Other / Exploring",      fw: null },
];

const SAMPLE_SCORES = [
    { label: "Engagement",  score: 8.2 },
    { label: "Clarity",     score: 7.5 },
    { label: "Structure",   score: 9.1 },
    { label: "Questioning", score: 6.8 },
];

export default function OnboardingModal({ onClose }) {
    const [step, setStep]     = useState(0);  // 0, 1, 2
    const [role, setRole]     = useState(null);
    const [closing, setClosing] = useState(false);
    const navigate             = useNavigate();

    const dismiss = async (goToUpload = false, fw = null) => {
        setClosing(true);
        try { await completeOnboarding(); } catch { /* non-critical */ }
        onClose();
        if (goToUpload && fw) navigate(`/upload?framework=${fw}`);
        else if (goToUpload) navigate("/");
    };

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${closing ? "opacity-0" : "opacity-100"}`}
            style={{ background: "rgba(6,8,15,0.85)", backdropFilter: "blur(8px)" }}
        >
            <div
                className={`relative w-full max-w-[520px] bg-[#0D1020] border border-white/8 rounded-[24px] overflow-hidden shadow-2xl transition-transform duration-300 ${closing ? "scale-95" : "scale-100"}`}
                style={{ animation: "modal-in 0.4s cubic-bezier(0.16,1,0.3,1) forwards" }}
            >
                {/* Skip button */}
                <button
                    onClick={() => dismiss()}
                    className="absolute top-4 right-4 text-[#3A4260] hover:text-[#6B7A99] text-[12px] uppercase tracking-widest font-mono transition-colors z-10"
                >
                    Skip
                </button>

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-2 pt-6 pb-2">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="rounded-full transition-all duration-300"
                            style={{
                                width:  i === step ? "20px" : "6px",
                                height: "6px",
                                background: i === step ? "#E8FF47" : "rgba(255,255,255,0.1)",
                            }}
                        />
                    ))}
                </div>

                {/* ── Step 0: Role selection ── */}
                {step === 0 && (
                    <div className="p-8">
                        <h2 className="font-display font-bold text-[24px] text-white mb-1 tracking-tight">
                            What best describes you?
                        </h2>
                        <p className="text-[14px] text-[#6B7A99] mb-6">
                            We'll highlight the most relevant framework for your first analysis.
                        </p>
                        <div className="grid grid-cols-2 gap-2.5">
                            {ROLES.map((r) => (
                                <button
                                    key={r.label}
                                    onClick={() => setRole(r)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-[12px] border text-left transition-all duration-200"
                                    style={{
                                        background:   role?.label === r.label ? "rgba(232,255,71,0.08)" : "rgba(255,255,255,0.03)",
                                        borderColor:  role?.label === r.label ? "rgba(232,255,71,0.4)"  : "rgba(255,255,255,0.06)",
                                        color:        role?.label === r.label ? "#E8FF47" : "#F0EDE8",
                                    }}
                                >
                                    <span className="text-[20px]">{r.icon}</span>
                                    <span className="text-[13px] font-medium leading-tight">{r.label}</span>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setStep(1)}
                            disabled={!role}
                            className="w-full mt-5 h-[48px] rounded-[12px] font-display font-bold text-[14px] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background: role ? "#E8FF47" : "rgba(232,255,71,0.3)", color: "#06080F" }}
                        >
                            Continue →
                        </button>
                    </div>
                )}

                {/* ── Step 1: Sample preview ── */}
                {step === 1 && (
                    <div className="p-8">
                        <h2 className="font-display font-bold text-[24px] text-white mb-1 tracking-tight">
                            Here's what your analysis looks like
                        </h2>
                        <p className="text-[14px] text-[#6B7A99] mb-6">
                            Each recording gets a radar chart, per-dimension scores, evidence from the transcript, and coaching suggestions.
                        </p>

                        {/* Mini sample result card */}
                        <div className="bg-[#06080F] border border-white/5 rounded-[16px] p-5 mb-5">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[13px] text-[#6B7A99]">Overall Score</span>
                                <span className="font-display font-bold text-[22px] text-[#E8FF47]">7.9<span className="text-[14px] text-[#6B7A99]">/10</span></span>
                            </div>
                            <div className="flex flex-col gap-2.5">
                                {SAMPLE_SCORES.map((s) => (
                                    <div key={s.label} className="flex items-center gap-3">
                                        <span className="text-[12px] text-[#6B7A99] w-[90px] shrink-0">{s.label}</span>
                                        <div className="flex-1 h-[4px] bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${s.score * 10}%`,
                                                    background: s.score >= 7 ? "#E8FF47" : s.score >= 5 ? "#FFA502" : "#FF4757",
                                                }}
                                            />
                                        </div>
                                        <span className="text-[12px] font-mono text-white w-[30px] text-right">{s.score}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <p className="text-[11px] text-[#6B7A99] italic">
                                    💡 "Try increasing wait time after questions — students need 3–5 seconds to formulate responses."
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setStep(0)} className="flex-1 h-[44px] rounded-[12px] border border-white/10 text-[14px] text-[#6B7A99] hover:border-white/20 hover:text-white transition-all">
                                ← Back
                            </button>
                            <button onClick={() => setStep(2)} className="flex-1 h-[44px] rounded-[12px] font-display font-bold text-[14px] bg-[#E8FF47] text-[#06080F] hover:bg-[#f5ff70] transition-colors">
                                Looks great →
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Step 2: CTA ── */}
                {step === 2 && (
                    <div className="p-8 text-center">
                        <div className="text-[52px] mb-4">🎙</div>
                        <h2 className="font-display font-bold text-[24px] text-white mb-2 tracking-tight">
                            Ready to analyze your first recording?
                        </h2>
                        <p className="text-[14px] text-[#6B7A99] mb-6 leading-relaxed">
                            Upload any audio file (MP3, WAV, M4A) and get a full AI analysis in under 60 seconds.
                            {role && <> We've picked <strong className="text-white">{role.label}</strong> as your starting framework.</>}
                        </p>

                        <button
                            onClick={() => dismiss(true, role?.fw)}
                            className="w-full h-[52px] rounded-[12px] font-display font-bold text-[15px] bg-[#E8FF47] text-[#06080F] hover:bg-[#f5ff70] transition-colors mb-3"
                        >
                            {role?.fw ? `Upload & Analyze (${role.label})` : "Choose Framework & Upload"}
                        </button>
                        <button
                            onClick={() => dismiss()}
                            className="w-full h-[40px] rounded-[12px] text-[13px] text-[#6B7A99] hover:text-white transition-colors"
                        >
                            I'll explore on my own
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes modal-in {
                    0%   { opacity: 0; transform: scale(0.94) translateY(12px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>
    );
}
