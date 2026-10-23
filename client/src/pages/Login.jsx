import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { login as loginApi } from "../services/authService";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const { establishSession } = useContext(AuthContext); const navigate = useNavigate();
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  async function submit(e) {
    e.preventDefault(); setError(""); setBusy(true);
    try { const data = await loginApi(form); establishSession(data); navigate("/app"); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <main className="auth-page"><div className="auth-decoration"><div className="auth-orb orb-one"/><div className="auth-orb orb-two"/><div className="auth-copy"><div className="brand brand-light"><span className="brand-mark">m</span> mingle</div><p className="eyebrow">YOUR PEOPLE. YOUR SPACE.</p><h1>Good conversations<br/>start somewhere.</h1><p className="auth-subtitle">A little corner of the internet for your favourite people, projects, and ideas.</p><div className="floating-chat"><span className="avatar avatar-purple">A</span><div><b>Study squad</b><p>that actually gets things done ✨</p></div><span className="online-dot"/></div></div></div>
    <section className="auth-panel"><div className="auth-form-wrap"><div className="mobile-brand brand"><span className="brand-mark">m</span> mingle</div><p className="eyebrow">WELCOME BACK</p><h2>Sign in to your space</h2><p className="muted">Pick up right where your conversations left off.</p>
      <form className="auth-form" onSubmit={submit}><label>Email address<input type="email" name="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={change} required/></label><label>Password<input type="password" name="password" autoComplete="current-password" placeholder="Enter your password" value={form.password} onChange={change} required/></label>{error && <div className="form-error" role="alert">{error}</div>}<button className="primary-btn full-btn" disabled={busy}>{busy ? "Signing in…" : "Sign in"}<span>→</span></button></form>
      <p className="auth-switch">New around here? <Link to="/signup">Create an account</Link></p><p className="auth-footnote">A calmer place to catch up, collaborate, and belong.</p></div></section></main>;
}
