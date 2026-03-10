/**
 * Centralised API client with JWT auth and automatic token refresh.
 * Updated for multi-framework support.
 */

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://audio-analyzer-xziz.vercel.app" : "http://localhost:8000");

let accessToken = null;

export const setAccessToken = (token) => {
    accessToken = token;
};

export const getAccessToken = () => accessToken;

/**
 * Core fetch wrapper — handles auth headers and token refresh.
 */
async function apiFetch(path, options = {}) {
    const url = `${API_URL}${path}`;
    const headers = { ...options.headers };

    if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
    }

    // Don't set Content-Type for FormData (browser sets multipart boundary)
    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    let res = await fetch(url, { ...options, headers, credentials: "include" });

    // Token expired — try silent refresh
    if (res.status === 401 && accessToken) {
        const refreshed = await refreshToken();
        if (refreshed) {
            headers["Authorization"] = `Bearer ${accessToken}`;
            res = await fetch(url, { ...options, headers, credentials: "include" });
        }
    }

    return res;
}

async function refreshToken() {
    try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // send httpOnly cookie
        });
        if (!res.ok) throw new Error("Session expired");

        const data = await res.json();
        setAccessToken(data.access_token);
        return true;
    } catch (err) {
        setAccessToken(null);
        return false;
    }
}

export async function googleSignIn(idToken) {
    const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: idToken }),
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Google setup failed");
    return data;
}

function _parseError(err, defaultMsg) {
    if (Array.isArray(err.detail)) {
        return err.detail[0]?.msg || defaultMsg;
    }
    return err.detail?.message || err.detail || defaultMsg;
}

// ── Auth endpoints ──────────────────────────────────────────────────────────────

export async function signup(email, name, password) {
    const res = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
        credentials: "include",
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(_parseError(err, "Signup failed"));
    }
    return res.json();
}

export async function login(email, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(_parseError(err, "Login failed"));
    }
    return res.json();
}

export async function logout() {
    await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
    });
    accessToken = null;
}

export async function getMe() {
    const res = await apiFetch("/auth/me");
    if (!res.ok) return null;
    return res.json();
}

// ── Framework endpoints ─────────────────────────────────────────────────────────

export async function getFrameworks() {
    const res = await fetch(`${API_URL}/frameworks`);
    if (!res.ok) throw new Error("Failed to fetch frameworks");
    return res.json();
}

// ── Analysis endpoints ──────────────────────────────────────────────────────────

export async function startAnalysis(file, frameworkId = "rosenshine") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("framework_id", frameworkId);
    const res = await apiFetch("/analyze", { method: "POST", body: formData });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(_parseError(err, "Analysis failed"));
    }
    return res.json();
}

export async function getJobStatus(jobId) {
    const res = await apiFetch(`/status/${jobId}`);
    if (!res.ok) throw new Error("Failed to fetch status");
    return res.json();
}

export async function getResults(jobId) {
    const res = await apiFetch(`/results/${jobId}`);
    if (res.status === 202) throw new Error("Analysis not yet complete");
    if (!res.ok) {
        const err = await res.json();
        throw new Error(_parseError(err, "Failed to fetch results"));
    }
    return res.json();
}

export async function getHistory() {
    const res = await apiFetch("/history");
    if (!res.ok) throw new Error("Failed to fetch history");
    return res.json();
}

export async function getQuota() {
    const res = await apiFetch("/quota");
    if (!res.ok) throw new Error("Failed to fetch quota");
    return res.json();
}

export { refreshToken as tryRefresh };
