/**
 * Signup page — name, email, password form.
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await signup(email, name, password);
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
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <span className="auth-icon">◉</span>
                    <h1>Create your account</h1>
                    <p>Start analyzing classroom audio instantly</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="form-error">{error}</div>}

                    <div className="google-btn-wrap" style={{ position: "relative" }}>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError("Google Sign-Up failed.")}
                            theme="filled_black"
                            text="continue_with"
                        />
                        {loading && (
                            <div style={{
                                position: "absolute",
                                inset: 0,
                                background: "rgba(10, 11, 15, 0.7)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "4px",
                                zIndex: 10
                            }}>
                                <div className="spinner" style={{ width: "20px", height: "20px", borderWidth: "2px" }} />
                            </div>
                        )}
                    </div>

                    <div className="oauth-divider">
                        <span>or continue with email</span>
                    </div>

                    <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            required
                            autoComplete="name"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min 8 characters"
                            required
                            minLength={8}
                            autoComplete="new-password"
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? "Creating account…" : "Create account"}
                    </button>
                </form>

                <p className="auth-footer-text">
                    Already have an account?{" "}
                    <Link to="/login" className="auth-link">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
