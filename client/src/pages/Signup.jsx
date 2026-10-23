import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { signup } from "../services/authService";

export default function Signup() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const { establishSession } = useContext(AuthContext); const navigate = useNavigate();
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  async function submit(e) {
    e.preventDefault(); setError(""); setBusy(true);
    try { const data = await signup(form); establishSession(data); navigate("/app"); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <main className="auth-page"><div className="auth-decoration"><div className="auth-orb orb-one"/><div className="auth-orb orb-two"/><div className="auth-copy"><div className="brand brand-light"><span className="brand-mark">m</span> mingle</div><p className="eyebrow">MAKE YOURSELF AT HOME</p><h1>Find your people.<br/>Build your corner.</h1><p className="auth-subtitle">Bring your group chats, study buddies, and big ideas into one cosy space.</p><div className="bubble-stack"><span>👋</span><span>💬</span><span>✨</span><span>🚀</span><span className="bubble-caption">Your next favourite space starts here.</span></div></div></div>
    <section className="auth-panel"><div className="auth-form-wrap"><div className="mobile-brand brand"><span className="brand-mark">m</span> mingle</div><p className="eyebrow">LET'S GET YOU SET UP</p><h2>Create your account</h2><p className="muted">It takes less than a minute. Promise.</p>
      <form className="auth-form" onSubmit={submit}><label>Username<input name="username" autoComplete="username" placeholder="What should we call you?" value={form.username} onChange={change} minLength={2} maxLength={24} required/></label><label>Email address<input type="email" name="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={change} required/></label><label>Password<input type="password" name="password" autoComplete="new-password" placeholder="At least 8 characters" value={form.password} onChange={change} minLength={8} required/></label>{error && <div className="form-error" role="alert">{error}</div>}<button className="primary-btn full-btn" disabled={busy}>{busy ? "Creating account…" : "Create account"}<span>→</span></button></form>
      <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p><p className="auth-footnote">By joining, you agree to be kind to your fellow humans.</p></div></section></main>;
}
