/**
 * Reset Password page — user enters a new password after clicking an email link.
 * Token comes from URL query param: /reset-password?token=xxx
 */

import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api";

function EyeIcon({ open }) {
    if (open) {
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
            </svg>
        );
    }
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    );
}

export default function ResetPasswordPage() {
    const [searchParams]                      = useSearchParams();
    const token                               = searchParams.get("token") || "";
    const navigate                            = useNavigate();

    const [password, setPassword]             = useState("");
    const [confirm, setConfirm]               = useState("");
    const [showPassword, setShowPassword]     = useState(false);
    const [showConfirm, setShowConfirm]       = useState(false);
    const [loading, setLoading]               = useState(false);
    const [success, setSuccess]               = useState(false);
    const [error, setError]                   = useState(null);

    const confirmMismatch = confirm.length > 0 && password !== confirm;
    const canSubmit       = password.length >= 8 && !confirmMismatch && token && !loading;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setError(null);
        setLoading(true);
        try {
            await resetPassword(token, password);
            setSuccess(true);
            setTimeout(() => navigate("/login"), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-[#06080F] flex items-center justify-center p-6">
                <div className="text-center max-w-sm">
                    <div className="text-[48px] mb-4">⚠</div>
                    <h2 className="font-display font-bold text-[22px] text-white mb-2">Invalid link</h2>
                    <p className="text-[#6B7A99] mb-6 text-[14px]">This reset link is missing a token. Please request a new one.</p>
                    <Link to="/forgot-password" className="text-[#E8FF47] font-semibold hover:underline">
                        Request new reset link →
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen lg:overflow-hidden bg-[#06080F] text-[#F0EDE8] font-body selection:bg-[#E8FF47] selection:text-[#06080F]">
            {/* Left panel */}
            <div className="hidden lg:flex flex-col w-[42%] bg-[#0D1020] relative overflow-hidden p-12 justify-between border-r border-white/5">
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                />
                <div className="absolute -left-20 -top-20 w-[150%] h-[150%] opacity-20 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#E8FF47]/20 via-transparent to-transparent blur-[120px] animate-pulse" />
                </div>
                <div className="relative z-10 flex items-center gap-3">
                    <img src="/audianalyzer-favicon.svg" alt="AudioAnalyzer" className="w-[32px] h-[32px] rounded-[8px]" />
                    <span className="font-display font-bold text-[20px] tracking-tight">AudioAnalyzer</span>
                </div>
                <div className="relative z-10 flex flex-col gap-4 max-w-sm">
                    <h2 className="font-display font-bold text-[32px] leading-[1.1] tracking-tight text-white">
                        Choose a <span className="text-[#E8FF47]">new password.</span>
                    </h2>
                    <p className="text-[15px] text-[#6B7A99]">
                        Pick something secure. Use at least 8 characters with a mix of letters, numbers, and symbols.
                    </p>
                </div>
                <div className="relative z-10">
                    <p className="font-mono text-[11px] text-[#3A4260] uppercase tracking-widest">Encrypted · Bcrypt · Zero plaintext storage</p>
                </div>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative min-h-screen lg:min-h-0">
                <div className="w-full max-w-[400px] mx-auto z-10 py-8 lg:py-0">
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
                        <img src="/audianalyzer-favicon.svg" alt="AudioAnalyzer" className="w-[36px] h-[36px] rounded-[10px]" />
                        <span className="font-display font-bold text-[20px] tracking-tight text-white">AudioAnalyzer</span>
                    </div>

                    {success ? (
                        <div className="animate-[fade-in-up_0.5s_ease_forwards] text-center">
                            <div className="text-[48px] mb-4">✅</div>
                            <h1 className="font-display font-bold text-[26px] text-white mb-2">Password updated!</h1>
                            <p className="text-[#6B7A99] text-[14px]">Redirecting you to sign in…</p>
                        </div>
                    ) : (
                        <div className="animate-[fade-in-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]">
                            <h1 className="font-display font-extrabold text-[32px] md:text-[38px] tracking-tighter leading-[1] text-white mb-2">
                                New password
                            </h1>
                            <p className="text-[15px] text-[#6B7A99] mb-8">
                                Set a new password for your account.
                            </p>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                                {error && (
                                    <div className="bg-[#FF4757]/10 border border-[#FF4757]/20 text-[#FF4757] px-4 py-3 rounded-[12px] text-[13px]">
                                        {error}
                                    </div>
                                )}

                                {/* New password */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-body font-semibold text-[10px] tracking-[0.1em] uppercase text-[#6B7A99]">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••••••"
                                            required
                                            disabled={loading}
                                            className="w-full bg-[#141826] border border-white/5 rounded-[10px] py-[12px] px-[16px] pr-[44px] font-body text-[14px] outline-none transition-all duration-300 hover:border-white/10 focus:border-[#E8FF47]/40 focus:ring-4 focus:ring-[#E8FF47]/5 placeholder:text-[#3A4260] disabled:opacity-50"
                                        />
                                        <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7A99] hover:text-[#E8FF47] transition-colors focus:outline-none">
                                            <EyeIcon open={showPassword} />
                                        </button>
                                    </div>
                                    {password.length > 0 && password.length < 8 && (
                                        <p className="text-[11px] text-[#FF4757]">Must be at least 8 characters.</p>
                                    )}
                                </div>

                                {/* Confirm password */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-body font-semibold text-[10px] tracking-[0.1em] uppercase text-[#6B7A99]">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirm ? "text" : "password"}
                                            value={confirm}
                                            onChange={(e) => setConfirm(e.target.value)}
                                            placeholder="••••••••••••"
                                            required
                                            disabled={loading}
                                            className={`w-full bg-[#141826] border rounded-[10px] py-[12px] px-[16px] pr-[44px] font-body text-[14px] outline-none transition-all duration-300 hover:border-white/10 focus:ring-4 focus:ring-[#E8FF47]/5 placeholder:text-[#3A4260] disabled:opacity-50 ${confirmMismatch ? "border-[#FF4757]/50" : "border-white/5 focus:border-[#E8FF47]/40"}`}
                                        />
                                        <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7A99] hover:text-[#E8FF47] transition-colors focus:outline-none">
                                            <EyeIcon open={showConfirm} />
                                        </button>
                                    </div>
                                    {confirmMismatch && <p className="text-[11px] text-[#FF4757]">Passwords don't match.</p>}
                                    {confirm.length > 0 && !confirmMismatch && <p className="text-[11px] text-[#E8FF47]">✓ Passwords match</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={!canSubmit}
                                    className="group relative w-full h-[52px] mt-1 overflow-hidden rounded-[10px] transition-all duration-300 hover:-translate-y-[1px] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed disabled:translate-y-0"
                                >
                                    <div className="absolute inset-0 bg-[#E8FF47] group-hover:bg-[#f5ff70] transition-colors duration-300" />
                                    <span className="relative font-display font-bold text-[15px] text-[#06080F]">
                                        {loading ? "Updating…" : "Set New Password"}
                                    </span>
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fade-in-up {
                    0%   { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
