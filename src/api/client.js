import axios from "axios";

const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

// ── Public API (no auth) ──────────────────────────────────────────────────────
export const publicApi = axios.create({
  baseURL: BASE,
  timeout: 60000, // 60s — video upload can be slow
});

// ── Admin API (auto-attaches stored credentials) ──────────────────────────────
export const adminApi = axios.create({
  baseURL: BASE,
  timeout: 60000,
});

adminApi.interceptors.request.use((config) => {
  const email = localStorage.getItem("ss_admin_email");
  const key   = localStorage.getItem("ss_admin_key");
  if (email) config.headers["X-Admin-Email"] = email;
  if (key)   config.headers["X-Admin-Key"]   = key;
  return config;
});

// ── Response error helper ─────────────────────────────────────────────────────
export function extractError(err) {
  return (
    err?.response?.data?.detail ||
    err?.message ||
    "Something went wrong."
  );
}