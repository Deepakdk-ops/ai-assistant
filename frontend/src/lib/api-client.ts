import axios from "axios";

let accessToken: string | null = localStorage.getItem("ai_access_token");
export function getAccessToken() { return accessToken; }
export function setAccessToken(token: string | null) { accessToken = token; if (token) localStorage.setItem("ai_access_token", token); else localStorage.removeItem("ai_access_token"); }

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1",
  timeout: 30_000,
  headers: { Accept: "application/json" },
});

// Bearer tokens are short-lived. Prefer a backend-for-frontend + HttpOnly cookies for higher-risk deployments.
apiClient.interceptors.request.use((config) => { if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`; return config; });
// Never place provider API keys in VITE_* variables; they are exposed to the browser.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.detail ??
      error?.message ??
      "Unexpected API error";
    return Promise.reject(new Error(String(message)));
  },
);
