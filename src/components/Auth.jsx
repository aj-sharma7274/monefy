import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Auth({ onLogin }) {
  const [tab, setTab]           = useState("login");
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow]         = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [shake, setShake]       = useState(false);

  const doLogin = async () => {
    if (!email || !password) { setError("Enter email and password"); return; }
    setLoading(true); setError("");
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError("Invalid email or password."); setShake(true); setTimeout(() => setShake(false), 500); }
    else onLogin(data.session);
  };

  const doSignup = async () => {
    if (!name.trim() || !email || !password) { setError("Please fill all fields"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError("");
    const { data, error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { display_name: name.trim() } }
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    if (data.user) {
      await supabase.from("profiles").upsert({ id: data.user.id, display_name: name.trim(), email, is_admin: false });
    }
    if (data.session) { onLogin(data.session); }
    else {
      setSuccess("✅ Account created! Please check your email to confirm, then sign in.");
      setTab("login"); setName(""); setPassword("");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#07091a", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-10px)}75%{transform:translateX(10px)}}`}</style>
      <div style={{ background: "#0d1130", border: "1px solid rgba(255,255,255,.08)", borderRadius: 20, padding: "40px 36px", width: "100%", maxWidth: 400, textAlign: "center", animation: shake ? "shake .4s ease" : "none" }}>
        <div style={{ width: 58, height: 58, borderRadius: "50%", background: "rgba(0,229,204,.1)", border: "1px solid rgba(0,229,204,.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 26 }}>💰</div>
        <div style={{ fontSize: 26, fontWeight: 800, background: "linear-gradient(135deg,#00e5cc,#ff4d8d)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 4, display: "inline-block" }}>Monefy</div>
        <div style={{ fontSize: 13, color: "#5a6490", marginBottom: 24 }}>Personal finance tracker</div>

        <div className="mf-auth-tabs">
          <button className={`mf-auth-tab ${tab === "login" ? "active" : ""}`} onClick={() => { setTab("login"); setError(""); setSuccess(""); }}>Sign In</button>
          <button className={`mf-auth-tab ${tab === "signup" ? "active" : ""}`} onClick={() => { setTab("signup"); setError(""); setSuccess(""); }}>Sign Up</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
          {tab === "signup" && (
            <div className="mf-form-group">
              <label className="mf-form-label">Your Name</label>
              <input type="text" className="mf-inp" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Raj Sharma" />
            </div>
          )}
          <div className="mf-form-group">
            <label className="mf-form-label">Email</label>
            <input type="email" className="mf-inp" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && (tab === "login" ? doLogin() : doSignup())} placeholder="you@email.com" style={{ borderColor: error ? "#ff4d6d" : undefined }} />
          </div>
          <div className="mf-form-group">
            <label className="mf-form-label">Password</label>
            <div style={{ position: "relative" }}>
              <input type={show ? "text" : "password"} className="mf-inp" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && (tab === "login" ? doLogin() : doSignup())} placeholder="••••••••" style={{ paddingRight: 44, borderColor: error ? "#ff4d6d" : undefined }} />
              <span onClick={() => setShow(s => !s)} style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", cursor: "pointer", fontSize: 15, color: "#5a6490" }}>{show ? "🙈" : "👁️"}</span>
            </div>
          </div>
        </div>

        {error   && <div style={{ color: "#ff4d6d", fontSize: 12, marginTop: 10, textAlign: "left" }}>{error}</div>}
        {success && <div style={{ color: "#00d68f", fontSize: 12, marginTop: 10, textAlign: "left" }}>{success}</div>}

        <button className="mf-btn-p" onClick={tab === "login" ? doLogin : doSignup} disabled={loading} style={{ width: "100%", marginTop: 18 }}>
          {loading ? (tab === "login" ? "Signing in…" : "Creating account…") : (tab === "login" ? "Sign In" : "Create Account")}
        </button>
        <div style={{ marginTop: 16, fontSize: 11, color: "#2a304a" }}>🔒 Secured by Supabase Auth</div>
      </div>
    </div>
  );
}