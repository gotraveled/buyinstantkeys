import axios from "axios";

// The frontend is a static site on Render (buyinstantkeys-frontend.onrender.com)
// and the FastAPI backend is a separate Render service. Default to the deployed
// backend so the built app reaches it with no env config. Override with
// REACT_APP_BACKEND_URL if the backend URL ever changes.
const DEFAULT_BACKEND = "https://buyinstantkeys-backend.onrender.com";
const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || DEFAULT_BACKEND).replace(/\/$/, "");
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
