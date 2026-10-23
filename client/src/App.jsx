import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { useContext } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ChatPage from "./pages/ChatPage";
import "./App.css";

function ProtectedRoute({ children }) {
  const { token, checking } = useContext(AuthContext);
  if (checking) return <div className="loading-screen"><div className="brand-mark">m</div><p>Getting your workspace ready…</p></div>;
  return token ? children : <Navigate to="/login" replace />;
}
function PublicRoute({ children }) {
  const { token, checking } = useContext(AuthContext);
  if (checking) return <div className="loading-screen"><div className="brand-mark">m</div><p>One moment…</p></div>;
  return token ? <Navigate to="/app" replace /> : children;
}
export default function App() {
  return <BrowserRouter><AuthProvider><Routes>
    <Route path="/" element={<Navigate to="/app" replace />} />
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
    <Route path="/app" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/app" replace />} />
  </Routes></AuthProvider></BrowserRouter>;
}
