import { createContext, useEffect, useState } from "react";
import { getMe } from "../services/authService";

export const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(localStorage.getItem("token")));

  useEffect(() => {
    let active = true;
    if (!token) { setUser(null); setChecking(false); return () => { active = false; }; }
    setChecking(true);
    getMe().then(({ user: currentUser }) => { if (active) setUser(currentUser); })
      .catch(() => { localStorage.removeItem("token"); if (active) { setToken(null); setUser(null); } })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [token]);

  const establishSession = (data) => {
    localStorage.setItem("token", data.token);
    setUser(data.user);
    setToken(data.token);
  };
  const logout = () => { localStorage.removeItem("token"); setToken(null); setUser(null); };
  return <AuthContext.Provider value={{ token, user, checking, establishSession, logout }}>{children}</AuthContext.Provider>;
}
