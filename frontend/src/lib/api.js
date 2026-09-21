import axios from "axios";

// Default to same-origin ("") so the built app calls "/api" on whatever host
// serves it. The FastAPI backend serves the frontend build itself, so no
// separate backend URL is required in production. Set REACT_APP_BACKEND_URL
// only when the API is hosted on a different origin.
const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

// Helps diagnose "products not loading": check the console for the resolved base.
if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.info(`[BuyInstantKeys] API base: ${API || "/api (same-origin)"}`);
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bik_admin_token");
  if (token && config.url && config.url.startsWith("/admin")) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
