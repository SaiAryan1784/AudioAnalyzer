/**
 * Verify Email page.
 * Two states:
 *  1. No token in URL → "Check your inbox" holding page (after signup redirect)
 *  2. Token in URL   → Auto-verifies on mount, shows success/error
 */

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../api";

export default function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [state, setState] = useState("idle"); // idle | verifying | success | error
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (!token) return; // holding page — nothing to verify yet
        setState("verifying");
        verifyEmail(token)
            .then(() => setState("success"))
            .catch((err) => { setErrorMsg(err.message); setState("error"); });
    }, [token]);

    const content = (() => {
        if (!token) {
            return (
                <>
                    <div className="text-[56px] mb-4">📬</div>
                    <h1 className="font-display font-bold text-[28px] text-white mb-3">Check your inbox</h1>
                    <p className="text-[15px] text-[#6B7A99] leading-relaxed mb-6">
                        We've sent a verification link to your email. Click it to activate your account and start analyzing.
                    </p>
                    <p className="text-[13px] text-[#3A4260]">
                        Didn't receive it? Check your spam folder, or{" "}
                        <Link to="/signup" className="text-[#E8FF47] hover:underline">sign up again</Link>.
                    </p>
                    <div className="mt-8 pt-6 border-t border-white/5">
                        <Link to="/login" className="text-[14px] text-[#6B7A99] hover:text-white transition-colors">
                            ← Already verified? Sign in
                        </Link>
                    </div>
                </>
            );
        }
        if (state === "verifying") {
            return (
                <>
                    <div className="w-8 h-8 border-2 border-[#E8FF47] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                    <h1 className="font-display font-bold text-[24px] text-white mb-2">Verifying…</h1>
                    <p className="text-[14px] text-[#6B7A99]">Confirming your email address.</p>
                </>
            );
        }
        if (state === "success") {
            return (
                <>
                    <div className="text-[56px] mb-4">✅</div>
                    <h1 className="font-display font-bold text-[28px] text-white mb-3">Email verified!</h1>
                    <p className="text-[15px] text-[#6B7A99] mb-6">
                        Your account is ready. Start analyzing recordings right away.
                    </p>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 bg-[#E8FF47] text-[#06080F] font-bold text-[14px] px-6 py-3 rounded-[10px] hover:bg-[#f5ff70] transition-colors"
                    >
                        Go to Dashboard →
                    </Link>
                </>
            );
        }
        // error
        return (
            <>
                <div className="text-[56px] mb-4">⚠</div>
                <h1 className="font-display font-bold text-[26px] text-white mb-3">Verification failed</h1>
                <p className="text-[14px] text-[#FF4757] mb-6">{errorMsg || "This link is invalid or has expired."}</p>
                <p className="text-[13px] text-[#6B7A99] mb-4">Links expire after 24 hours. You can sign up again to receive a new one.</p>
                <Link to="/signup" className="text-[#E8FF47] font-semibold hover:underline text-[14px]">
                    Sign up again →
                </Link>
            </>
        );
    })();

    return (
        <div className="min-h-screen bg-[#06080F] flex items-center justify-center p-6">
            <div className="w-full max-w-[440px] text-center animate-[fade-in-up_0.5s_ease_forwards]">
                <div className="mb-6 flex items-center justify-center gap-3">
                    <img src="/audianalyzer-favicon.svg" alt="AudioAnalyzer" className="w-[32px] h-[32px] rounded-[8px]" />
                    <span className="font-display font-bold text-[18px] tracking-tight text-white">AudioAnalyzer</span>
                </div>

                <div className="bg-[#0D1020] border border-white/5 rounded-[20px] p-10">
                    {content}
                </div>
            </div>

            <style>{`
                @keyframes fade-in-up {
                    0%   { opacity: 0; transform: translateY(16px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
