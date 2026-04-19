/**
 * Authentication context — manages user state, login/signup/logout,
 * and automatic token restoration on app load.
 */

import { createContext, useContext, useEffect, useState } from "react";
import {
    login as apiLogin,
    signup as apiSignup,
    logout as apiLogout,
    getMe,
    setAccessToken,
    tryRefresh,
    googleSignIn,
    markSession,
    clearSession,
    hasSession,
} from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Try to restore session on mount (silent refresh) — only if a session was previously established
    useEffect(() => {
        (async () => {
            if (hasSession()) {
                const ok = await tryRefresh();
                if (ok) {
                    const me = await getMe();
                    if (me) setUser(me);
                } else {
                    clearSession();
                }
            }
            setLoading(false);
        })();
    }, []);

    const login = async (email, password) => {
        const data = await apiLogin(email, password);
        setAccessToken(data.access_token);
        setUser(data.user);
        markSession();
        return data;
    };

    const signup = async (email, name, password) => {
        const data = await apiSignup(email, name, password);
        setAccessToken(data.access_token);
        setUser(data.user);
        markSession();
        return data;
    };

    const googleLogin = async (idToken) => {
        const data = await googleSignIn(idToken);
        setAccessToken(data.access_token);
        setUser(data.user);
        markSession();
        return data;
    };

    const logout = async () => {
        await apiLogout();
        clearSession();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{ user, loading, login, signup, googleLogin, logout, isAuthenticated: !!user }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
