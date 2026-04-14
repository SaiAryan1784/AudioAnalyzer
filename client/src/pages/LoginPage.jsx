/**
 * Login page — premium aesthetics with full UX: password toggle,
 * inline email validation, proper disabled states, wired forgot-password.
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Eye / Eye-off icons as inline SVG to avoid adding a dependency
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

export default function LoginPage() {
    const [email, setEmail]               = useState("");
    const [emailTouched, setEmailTouched] = useState(false);
    const [password, setPassword]         = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError]               = useState(null);
    const [loading, setLoading]           = useState(false);
    const { login, googleLogin }          = useAuth();
    const navigate                        = useNavigate();

    const emailValid = EMAIL_RE.test(email);
    const emailError = emailTouched && !emailValid && email.length > 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login(email, password);
            navigate("/");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError(null);
        setLoading(true);
        try {
            await googleLogin(credentialResponse.credential);
            navigate("/");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen lg:overflow-hidden bg-[#06080F] text-[#F0EDE8] font-body selection:bg-[#E8FF47] selection:text-[#06080F]">
            {/* ── Left Panel ── */}
            <div className="hidden lg:flex flex-col w-[42%] bg-[#0D1020] relative overflow-hidden p-12 justify-between border-r border-white/5">
                {/* Noise texture */}
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                />
                {/* Gradient aura */}
                <div className="absolute -left-20 -top-20 w-[150%] h-[150%] opacity-20 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#E8FF47]/20 via-transparent to-transparent blur-[120px] animate-pulse" />
                </div>

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <img src="/audianalyzer-favicon.svg" alt="AudioAnalyzer" className="w-[32px] h-[32px] rounded-[8px] shadow-lg shadow-[#E8FF47]/10" />
                    <span className="font-display font-bold text-[20px] tracking-tight">AudioAnalyzer</span>
                </div>

                {/* Spectrum animation */}
                <div className="absolute inset-x-0 bottom-0 h-[50%] flex items-end justify-center gap-1.5 px-8 opacity-40 overflow-hidden">
                    {[...Array(24)].map((_, i) => (
                        <div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-[#E8FF47] to-[#E8FF47]/40 rounded-t-[4px] shadow-[0_0_15px_rgba(232,255,71,0.2)]"
                            style={{
                                height: `${Math.random() * 80 + 20}%`,
                                animation: `spectrum-pulse ${1.5 + Math.random() * 2}s ease-in-out infinite alternate`,
                                animationDelay: `${i * 0.1}s`,
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10 flex flex-col gap-8 mt-4 max-w-sm">
                    <h2 className="font-display font-bold text-[32px] md:text-[36px] leading-[1.1] tracking-tight text-white">
                        Analyze audio with <span className="text-[#E8FF47]">clinical precision.</span>
                    </h2>
                    <ul className="flex flex-col gap-4">
                        {[
                            { icon: "🎯", text: "9 industry-standard frameworks" },
                            { icon: "📊", text: "Granular 1–10 dimensional metrics" },
                            { icon: "📈", text: "Historical trend visualization" },
                            { icon: "⚡", text: "Sub-60-second AI synthesis" },
                        ].map((f, idx) => (
                            <li key={idx} className="flex items-center gap-3 text-[14px] text-[#6B7A99] group cursor-default">
                                <span className="text-[20px] group-hover:scale-125 transition-transform duration-300">{f.icon}</span>
                                <span className="group-hover:text-white transition-colors duration-300">{f.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-1 mb-1">
                        {[...Array(5)].map((_, i) => <span key={i} className="text-[#E8FF47] text-[10px]">★</span>)}
                    </div>
                    <p className="font-display font-bold text-[14px] text-white tracking-tight">Trusted by 2,000+ educators</p>
                </div>
            </div>

            {/* ── Right Panel ── */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative min-h-screen lg:min-h-0 overflow-y-auto">
                <div className="lg:hidden absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-[#E8FF47]/10 blur-[100px] pointer-events-none" />

                <div className="w-full max-w-[400px] mx-auto z-10 py-8 lg:py-0">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
                        <img src="/audianalyzer-favicon.svg" alt="AudioAnalyzer" className="w-[36px] h-[36px] rounded-[10px]" />
                        <span className="font-display font-bold text-[20px] tracking-tight text-white">AudioAnalyzer</span>
                    </div>

                    <div className="animate-[fade-in-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]">
                        <h1 className="font-display font-extrabold text-[32px] md:text-[38px] tracking-tighter leading-[1] text-white mb-2">
                            Welcome back
                        </h1>
                        <p className="text-[15px] text-[#6B7A99] mb-8">
                            Enter your credentials to access your dashboard.
                        </p>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            {/* Server error banner */}
                            {error && (
                                <div className="bg-[#FF4757]/10 border border-[#FF4757]/20 text-[#FF4757] px-4 py-3 rounded-[12px] text-[13px] animate-shake">
                                    {error}
                                </div>
                            )}

                            {/* Google button */}
                            <div className="relative w-full h-[48px] group hover:-translate-y-[1px] active:translate-y-0 transition-all duration-300">
                                <div className="absolute inset-0 bg-[#E8FF47]/5 group-hover:bg-[#E8FF47]/10 rounded-[10px] border border-white/10 group-hover:border-[#E8FF47]/30 transition-all duration-300 pointer-events-none" />
                                <div className="relative z-10 pointer-events-auto h-full w-full opacity-[0.01] overflow-hidden">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => setError("Google Sign-In failed.")}
                                        theme="filled_black"
                                        text="continue_with"
                                        width={400}
                                    />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center gap-3 pointer-events-none">
                                    <svg width="18" height="18" viewBox="0 0 24 24">
                                        <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                        <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    <span className="font-body font-medium text-[14px] text-white">Continue with Google</span>
                                </div>
                                {loading && (
                                    <div className="absolute inset-0 bg-[#06080F]/80 flex items-center justify-center z-20 rounded-[10px]">
                                        <div className="w-4 h-4 border-2 border-[#E8FF47] border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="flex items-center gap-4 my-1">
                                <div className="flex-1 h-[1px] bg-white/5" />
                                <span className="font-mono text-[9px] tracking-[0.15em] text-[#3A4260] uppercase">Or login with email</span>
                                <div className="flex-1 h-[1px] bg-white/5" />
                            </div>

                            {/* Email field */}
                            <div className="flex flex-col gap-1.5">
                                <label className="font-body font-semibold text-[10px] tracking-[0.1em] uppercase text-[#6B7A99]">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onBlur={() => setEmailTouched(true)}
                                        placeholder="your@email.com"
                                        required
                                        disabled={loading}
                                        className={`w-full bg-[#141826] border rounded-[10px] py-[12px] px-[16px] pr-[40px] font-body text-[14px] outline-none transition-all duration-300 hover:border-white/10 focus:ring-4 focus:ring-[#E8FF47]/5 placeholder:text-[#3A4260] disabled:opacity-50 disabled:cursor-not-allowed ${
                                            emailError
                                                ? "border-[#FF4757]/50 focus:border-[#FF4757]/70"
                                                : emailTouched && emailValid
                                                    ? "border-[#E8FF47]/30 focus:border-[#E8FF47]/50"
                                                    : "border-white/5 focus:border-[#E8FF47]/40"
                                        }`}
                                    />
                                    {/* Validation icon */}
                                    {email.length > 0 && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                            {emailValid
                                                ? <span className="text-[#E8FF47] text-[13px]">✓</span>
                                                : emailTouched && <span className="text-[#FF4757] text-[13px]">✕</span>
                                            }
                                        </div>
                                    )}
                                </div>
                                {emailError && (
                                    <p className="text-[11px] text-[#FF4757]">Please enter a valid email address.</p>
                                )}
                            </div>

                            {/* Password field */}
                            <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="font-body font-semibold text-[10px] tracking-[0.1em] uppercase text-[#6B7A99]">
                                        Password
                                    </label>
                                    <Link
                                        to="/forgot-password"
                                        className="text-[10px] text-[#E8FF47] uppercase tracking-wider font-semibold hover:underline"
                                    >
                                        Forgot?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••••••"
                                        required
                                        disabled={loading}
                                        className="w-full bg-[#141826] border border-white/5 rounded-[10px] py-[12px] px-[16px] pr-[44px] font-body text-[14px] outline-none transition-all duration-300 hover:border-white/10 focus:border-[#E8FF47]/40 focus:ring-4 focus:ring-[#E8FF47]/5 placeholder:text-[#3A4260] disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        tabIndex={-1}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7A99] hover:text-[#E8FF47] transition-colors duration-200 focus:outline-none"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        <EyeIcon open={showPassword} />
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full h-[52px] mt-1 overflow-hidden rounded-[10px] transition-all duration-300 hover:-translate-y-[1px] active:translate-y-0 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed disabled:translate-y-0"
                            >
                                <div className="absolute inset-0 bg-[#E8FF47] transition-all duration-300 group-hover:bg-[#f5ff70]" />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <span className="relative font-display font-bold text-[15px] text-[#06080F]">
                                    {loading ? "Authenticating…" : "Sign in to Dashboard"}
                                </span>
                            </button>
                        </form>

                        <p className="text-center mt-6 text-[14px] text-[#6B7A99]">
                            New here?{" "}
                            <Link to="/signup" className="text-[#E8FF47] font-semibold hover:underline underline-offset-4 decoration-2">
                                Create a free account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spectrum-pulse {
                    0%   { transform: scaleY(0.4); }
                    100% { transform: scaleY(1.2); }
                }
                @keyframes fade-in-up {
                    0%   { opacity: 0; transform: translateY(30px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25%      { transform: translateX(-4px); }
                    75%      { transform: translateX(4px); }
                }
                .animate-shake { animation: shake 0.4s ease-in-out; }
            `}</style>
        </div>
    );
}
