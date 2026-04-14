/**
 * Forgot Password page — user enters their email to receive a reset link.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api";

export default function ForgotPasswordPage() {
    const [email, setEmail]     = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent]       = useState(false);
    const [error, setError]     = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await forgotPassword(email);
            setSent(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

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
                        Forgot your <span className="text-[#E8FF47]">password?</span>
                    </h2>
                    <p className="text-[15px] text-[#6B7A99]">
                        No problem. Enter your email and we'll send you a secure reset link that expires in 1 hour.
                    </p>
                </div>
                <div className="relative z-10">
                    <p className="font-mono text-[11px] text-[#3A4260] uppercase tracking-widest">Secure · Encrypted · Private</p>
                </div>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative min-h-screen lg:min-h-0">
                <div className="w-full max-w-[400px] mx-auto z-10 py-8 lg:py-0">
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
                        <img src="/audianalyzer-favicon.svg" alt="AudioAnalyzer" className="w-[36px] h-[36px] rounded-[10px]" />
                        <span className="font-display font-bold text-[20px] tracking-tight text-white">AudioAnalyzer</span>
                    </div>

                    {sent ? (
                        <div className="animate-[fade-in-up_0.5s_ease_forwards]">
                            <div className="text-[40px] mb-4">📬</div>
                            <h1 className="font-display font-extrabold text-[28px] tracking-tighter text-white mb-2">
                                Check your inbox
                            </h1>
                            <p className="text-[15px] text-[#6B7A99] mb-6">
                                If <span className="text-white">{email}</span> is registered, we've sent a reset link. Check your spam folder if you don't see it within a minute.
                            </p>
                            <Link to="/login" className="text-[14px] text-[#E8FF47] font-semibold hover:underline underline-offset-4">
                                ← Back to sign in
                            </Link>
                        </div>
                    ) : (
                        <div className="animate-[fade-in-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]">
                            <h1 className="font-display font-extrabold text-[32px] md:text-[38px] tracking-tighter leading-[1] text-white mb-2">
                                Reset password
                            </h1>
                            <p className="text-[15px] text-[#6B7A99] mb-8">
                                Enter your account email and we'll send a reset link.
                            </p>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                                {error && (
                                    <div className="bg-[#FF4757]/10 border border-[#FF4757]/20 text-[#FF4757] px-4 py-3 rounded-[12px] text-[13px]">
                                        {error}
                                    </div>
                                )}

                                <div className="flex flex-col gap-1.5">
                                    <label className="font-body font-semibold text-[10px] tracking-[0.1em] uppercase text-[#6B7A99]">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        required
                                        disabled={loading}
                                        className="w-full bg-[#141826] border border-white/5 rounded-[10px] py-[12px] px-[16px] font-body text-[14px] outline-none transition-all duration-300 hover:border-white/10 focus:border-[#E8FF47]/40 focus:ring-4 focus:ring-[#E8FF47]/5 placeholder:text-[#3A4260] disabled:opacity-50"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !email}
                                    className="group relative w-full h-[52px] overflow-hidden rounded-[10px] transition-all duration-300 hover:-translate-y-[1px] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed disabled:translate-y-0"
                                >
                                    <div className="absolute inset-0 bg-[#E8FF47] group-hover:bg-[#f5ff70] transition-colors duration-300" />
                                    <span className="relative font-display font-bold text-[15px] text-[#06080F]">
                                        {loading ? "Sending…" : "Send Reset Link"}
                                    </span>
                                </button>
                            </form>

                            <p className="text-center mt-6 text-[14px] text-[#6B7A99]">
                                Remembered it?{" "}
                                <Link to="/login" className="text-[#E8FF47] font-semibold hover:underline underline-offset-4">
                                    Sign in
                                </Link>
                            </p>
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
