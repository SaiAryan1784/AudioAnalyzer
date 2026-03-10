/**
 * Enhanced Signup page — premium aesthetics, animated spectrum, fixed viewport.
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";

export default function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { signup, googleLogin } = useAuth();
    const navigate = useNavigate();

    // Password strength logic
    const getPasswordStrength = (pass) => {
        if (!pass) return { score: 0, label: "", color: "bg-white/10" };
        let score = 0;
        if (pass.length > 8) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;

        if (score <= 1) return { score: 1, label: "Weak", color: "bg-[#FF4757]" };
        if (score === 2) return { score: 2, label: "Medium", color: "bg-[#FFA502]" };
        return { score: 3, label: "Strong", color: "bg-[#E8FF47]" };
    };

    const strength = getPasswordStrength(password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }
        setError(null);
        setLoading(true);
        try {
            await signup(name, email, password);
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
            {/* Left Panel - Dynamic Brand Showcase (Mirrors Login) */}
            <div className="hidden lg:flex flex-col w-[42%] bg-[#0D1020] relative overflow-hidden p-12 justify-between border-r border-white/5">
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                ></div>

                <div className="absolute -left-20 -top-20 w-[150%] h-[150%] opacity-20 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#E8FF47]/20 via-transparent to-transparent blur-[120px] animate-pulse"></div>
                </div>

                <div className="relative z-10 flex items-center gap-3">
                    <img src="/audianalyzer-favicon.svg" alt="AudioAnalyzer" className="w-[32px] h-[32px] rounded-[8px] shadow-lg shadow-[#E8FF47]/10" />
                    <span className="font-display font-bold text-[20px] tracking-tight text-white">AudioAnalyzer</span>
                </div>

                {/* Animated Spectrum Visualization */}
                <div className="absolute inset-x-0 bottom-0 h-[45%] flex items-end justify-center gap-1.5 px-8 opacity-40 overflow-hidden">
                    {[...Array(24)].map((_, i) => (
                        <div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-[#E8FF47] to-[#E8FF47]/40 rounded-t-[4px] shadow-[0_0_15px_rgba(232,255,71,0.2)]"
                            style={{
                                height: `${Math.random() * 80 + 20}%`,
                                animation: `spectrum-pulse ${1.8 + Math.random() * 1.5}s ease-in-out infinite alternate`,
                                animationDelay: `${i * 0.12}s`
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10 flex flex-col gap-6 mt-4 max-w-sm">
                    <h2 className="font-display font-bold text-[30px] md:text-[34px] leading-[1.1] tracking-tight text-white">
                        Join the future of <span className="text-[#E8FF47]">audio intelligence.</span>
                    </h2>
                    <ul className="flex flex-col gap-3">
                        {[
                            { icon: "✨", text: "Create unlimited analysis reports" },
                            { icon: "🔒", text: "Secure cloud data vault" },
                            { icon: "👥", text: "Collaborative scoring workflows" }
                        ].map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-3 text-[14px] text-[#6B7A99] group cursor-default">
                                <span className="text-[18px] group-hover:scale-125 transition-transform duration-300">{feature.icon}</span>
                                <span className="group-hover:text-white transition-colors duration-300">{feature.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="relative z-10 flex items-center gap-2 mt-auto">
                    <div className="h-[1px] w-8 bg-[#E8FF47]" />
                    <p className="font-display font-bold text-[12px] text-white tracking-widest uppercase">Version 2.0 Deployment</p>
                </div>
            </div>

            {/* Right Panel - Auth Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative min-h-screen lg:min-h-0 overflow-y-auto">
                <div className="w-full max-w-[440px] mx-auto z-10 py-8 lg:py-0">
                    <div className="animate-[fade-in-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]">
                        {/* Header */}
                        <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
                            <img src="/audianalyzer-favicon.svg" alt="AudioAnalyzer" className="w-[36px] h-[36px] rounded-[10px]" />
                            <span className="font-display font-bold text-[20px] tracking-tight text-white">AudioAnalyzer</span>
                        </div>
                        <h1 className="font-display font-extrabold text-[32px] md:text-[38px] tracking-tighter leading-[1] text-white mb-1">
                            Create account
                        </h1>
                        <p className="text-[15px] text-[#6B7A99] mb-6">
                            Build your profile and start analyzing today.
                        </p>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {error && (
                                <div className="bg-[#FF4757]/10 border border-[#FF4757]/20 text-[#FF4757] px-4 py-2.5 rounded-[10px] text-[13px] animate-shake">
                                    {error}
                                </div>
                            )}

                            {/* Google Button */}
                            <div className="relative w-full h-[48px] group hover:-translate-y-[1px] active:translate-y-0 transition-all duration-300">
                                <div className="absolute inset-0 bg-[#E8FF47]/5 group-hover:bg-[#E8FF47]/10 rounded-[10px] border border-white/10 group-hover:border-[#E8FF47]/30 transition-all duration-300 pointer-events-none" />
                                <div className="absolute inset-0 flex items-center justify-center pl-1 pt-1 opacity-0 hover:opacity-10 scale-[1.02] pointer-events-none overflow-hidden blur-[2px]">
                                    <GoogleLogin onSuccess={() => { }} />
                                </div>
                                <div className="relative z-10 pointer-events-auto h-full w-full opacity-[0.01] overflow-hidden">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => setError("Google Sign-In failed.")}
                                        theme="filled_black"
                                        text="continue_with"
                                        width={440}
                                    />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center gap-3 pointer-events-none">
                                    <svg width="18" height="18" viewBox="0 0 24 24" className="text-white">
                                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    <span className="font-body font-medium text-[14px] text-white">Continue with Google</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 my-0.5">
                                <div className="flex-1 h-[1px] bg-white/5"></div>
                                <span className="font-mono text-[9px] tracking-[0.15em] text-[#3A4260] uppercase">Secure Sign up</span>
                                <div className="flex-1 h-[1px] bg-white/5"></div>
                            </div>

                            {/* Inputs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-body font-semibold text-[10px] tracking-[0.1em] uppercase text-[#6B7A99]">Full Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="John Wick"
                                        required
                                        className="w-full bg-[#141826] border border-white/5 rounded-[10px] py-[10px] px-[14px] font-body text-[14px] outline-none transition-all duration-300 hover:border-white/10 focus:border-[#E8FF47]/40 placeholder:text-[#3A4260]"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-body font-semibold text-[10px] tracking-[0.1em] uppercase text-[#6B7A99]">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="wick@highon.com"
                                        required
                                        className="w-full bg-[#141826] border border-white/5 rounded-[10px] py-[10px] px-[14px] font-body text-[14px] outline-none transition-all duration-300 hover:border-white/10 focus:border-[#E8FF47]/40 placeholder:text-[#3A4260]"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="font-body font-semibold text-[10px] tracking-[0.1em] uppercase text-[#6B7A99]">Choose Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    required
                                    className="w-full bg-[#141826] border border-white/5 rounded-[10px] py-[12px] px-[16px] font-body text-[15px] outline-none transition-all duration-300 hover:border-white/10 focus:border-[#E8FF47]/40 focus:ring-4 focus:ring-[#E8FF47]/5 placeholder:text-[#3A4260]"
                                />

                                {/* Password Strength Visualizer */}
                                {password && (
                                    <div className="mt-0.5">
                                        <div className="flex gap-1 h-1 w-full">
                                            {[1, 2, 3].map((step) => (
                                                <div
                                                    key={step}
                                                    className={`flex-1 rounded-full transition-all duration-500 ${strength.score >= step ? strength.color : "bg-white/5"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex justify-between mt-1.5">
                                            <p className="text-[9px] text-[#6B7A99] font-mono uppercase tracking-widest">Strength: <span style={{ color: strength.color.replace('bg-', '') }}>{strength.label}</span></p>
                                            <p className="text-[9px] text-[#3A4260] font-mono uppercase tracking-widest">Min 8 chars</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || password.length < 8}
                                className="group relative w-full h-[52px] mt-2 overflow-hidden rounded-[10px] transition-all duration-300 hover:-translate-y-[1px] active:translate-y-0 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                            >
                                <div className="absolute inset-0 bg-[#E8FF47]" />
                                <span className="relative font-display font-bold text-[15px] text-[#06080F]">
                                    {loading ? "Initializing..." : "Create instrument account"}
                                </span>
                            </button>
                        </form>

                        <p className="text-center mt-6 text-[14px] text-[#6B7A99]">
                            Already have an account?{" "}
                            <Link to="/login" className="text-[#E8FF47] font-semibold hover:underline underline-offset-4 decoration-2">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spectrum-pulse {
                    0% { transform: scaleY(0.4); }
                    100% { transform: scaleY(1.3); }
                }
                @keyframes fade-in-up {
                    0% { opacity: 0; transform: translateY(30px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
