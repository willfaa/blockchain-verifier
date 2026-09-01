// frontend/lib/api.ts
import axios from "axios";

import { getApiBase } from "./utils";

const api = axios.create();

api.interceptors.request.use(
  (config) => {
    config.baseURL = `${getApiBase()}/api`;
    
    // Always inject tunnel bypass & JSON accept headers
    if (!config.headers) {
      config.headers = {} as any;
    }
    config.headers["ngrok-skip-browser-warning"] = "69420";
    config.headers["Bypass-Tunnel-Reminder"] = "true";
    config.headers["bypass-tunnel-reminder"] = "1";
    config.headers["Accept"] = "application/json";

    if (typeof window !== "undefined") {
      const storedData = localStorage.getItem("chainnesa_user");
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          const token = parsed.token;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (e) {
          console.error("Error parsing token", e);
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add Response Interceptor: Auto-fallback from dead tunnel + Handle 401
api.interceptors.response.use(
  (response) => response,
  async (error: any) => {
    const config = error.config;

    // Intelligent Failover: If external tunnel/Ngrok is dead, silently fallback to internal Vercel serverless backend
    const isTunnelDead =
      !error.response ||
      error.code === "ERR_NETWORK" ||
      error.code === "ECONNABORTED" ||
      error.response?.status === 502 ||
      error.response?.status === 503 ||
      error.response?.status === 504;

    if (isTunnelDead && config && !config._isRetry && typeof window !== "undefined") {
      const isExternalBase =
        config.baseURL &&
        !config.baseURL.includes("/_/backend") &&
        !config.baseURL.includes("localhost") &&
        !config.baseURL.includes("127.0.0.1");

      if (isExternalBase) {
        config._isRetry = true;
        config.baseURL = `${window.location.origin}/_/backend/api`;
        console.warn(`[Tunnel Offline] Auto-switching request to Vercel Serverless Cloud: ${config.url}`);
        return api(config);
      }
    }

    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      // Token expired, invalid, or access denied
      if (typeof window !== "undefined") {
        console.warn(
          "Session expired or Access Denied (401/403). Logging out..."
        );
        if (!window.location.pathname.includes("/login")) {
          localStorage.removeItem("chainnesa_user");
          const isOverwrite = error.response.data?.code === "SESSION_OVERWRITTEN";
          const errorParam = isOverwrite ? "session_overwritten" : "session_expired";
          window.location.href = `/login?error=${errorParam}`;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
