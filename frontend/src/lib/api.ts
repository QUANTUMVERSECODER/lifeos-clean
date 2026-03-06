import axios from "axios";

/*
  Automatically switch between:
  - Local development
  - Production (Railway backend)
*/

const BACKEND_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://lifeos-clean-production.up.railway.app/api/v1"
    : "http://localhost:8000/api/v1";

const ML_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://lifeos-clean-production.up.railway.app/ml"
    : "http://localhost:8001/ml";

// ===============================
// MAIN API
// ===============================
export const api = axios.create({
  baseURL: BACKEND_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // IMPORTANT: disable for now (fixes CORS issue)
});

// Attach JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 (optional future refresh logic)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ===============================
// ML API
// ===============================
export const mlApi = axios.create({
  baseURL: ML_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

mlApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
})