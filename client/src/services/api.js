const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
export function getToken() { return localStorage.getItem("token"); }
export async function api(path, options = {}) {
  const headers = { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}), ...options.headers };
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error("Could not reach the server. Check that the backend is running.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed.");
  return data;
}
export { API_URL };
