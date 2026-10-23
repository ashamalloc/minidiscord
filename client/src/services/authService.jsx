import { api } from "./api";
export const signup = (userData) => api("/api/auth/signup", { method: "POST", body: JSON.stringify(userData) });
export const login = (userData) => api("/api/auth/login", { method: "POST", body: JSON.stringify(userData) });
export const getMe = () => api("/api/auth/me");
