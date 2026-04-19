/**
 * Protected route wrapper — redirects unauthenticated users to /login.
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();
    const [slowLoad, setSlowLoad] = useState(false);

    useEffect(() => {
        if (!loading) return;
        const t = setTimeout(() => setSlowLoad(true), 2000);
        return () => clearTimeout(t);
    }, [loading]);

    if (loading) {
        return (
            <div className="page-loader">
                <div className="spinner" />
                {slowLoad && (
                    <p style={{ marginTop: "12px", fontSize: "0.85rem", color: "#888" }}>
                        Connecting to server…
                    </p>
                )}
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}
