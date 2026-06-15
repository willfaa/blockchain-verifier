// frontend/lib/api.ts
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
const API_URL = `${API_BASE}/api`;

const api = axios.create({
  baseURL: API_URL,
  // Do NOT default Content-Type to application/json, as it breaks FormData.
  // Axios automatically sets application/json for objects and multipart/form-data for FormData.
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      // Logic menyesuaikan AuthContext Anda:
      // Token ada di dalam object JSON "chainnesa_user"
      const storedData = localStorage.getItem("chainnesa_user");
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          const token = parsed.token; // Backend mengirim user + token
          if (token && config.headers) {
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

// Add Response Interceptor to handle 401 (Token Expired/Invalid)
api.interceptors.response.use(
  (response) => response,
  (error: any) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      // Token expired, invalid, or access denied
      if (typeof window !== "undefined") {
        console.warn(
          "Session expired or Access Denied (401/403). Logging out..."
        );
        // Prevent infinite loop if login page itself throws 401 (unlikely for login)
        if (!window.location.pathname.includes("/login")) {
          localStorage.removeItem("chainnesa_user");
          window.location.href = "/login?error=session_expired";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
