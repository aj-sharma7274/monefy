import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://lwbhllwznsqniwtbrhqc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3YmhsbHd6bnNxbml3dGJyaHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MjI2MTUsImV4cCI6MjA5NDQ5ODYxNX0._DCPCFvwh4E-qSFCg4pLUmm17ORtFcyO80uM_tl5YaM";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
// PIE_COLORS used in Dashboard via PIE_COLORS_DASH local const
const YEARS = [2024, 2025, 2026, 2027];

const fmt = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
const pct = (a, b) => b === 0 ? 0 : Math.min(Math.round((a / b) * 100), 999);
const timeAgo = (ts) => {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s/60) + "m ago";
  if (s < 86400) return Math.floor(s/3600) + "h ago";
  return Math.floor(s/86400) + "d ago";
};

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #07091a; color: #e8eaf6; font-family: system-ui, sans-serif; }
  input, select, button, textarea { font-family: inherit; }
  input[type=number]::-webkit-inner-spin-button { opacity: 1; }

  .mf-app { display: flex; min-height: 100vh; }

  .mf-sidebar {
    width: 220px; background: #0d1130;
    border-right: 1px solid rgba(255,255,255,.07);
    display: flex; flex-direction: column;
    position: fixed; top: 0; left: 0; height: 100vh; z-index: 200;
    transition: transform .25s;
  }
  .mf-logo-wrap { padding: 22px 18px 18px; border-bottom: 1px solid rgba(255,255,255,.07); }
  .mf-logo {
    font-size: 21px; font-weight: 800;
    background: linear-gradient(135deg,#00e5cc,#ff4d8d);
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent; color: transparent;
    display: inline-block;
  }
  .mf-logo-sub { font-size: 11px; color: #5a6490; margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .mf-nav { flex: 1; padding: 10px 0; overflow-y: auto; }
  .mf-nav-item {
    display: flex; align-items: center; gap: 11px;
    padding: 11px 18px; cursor: pointer; font-size: 13.5px; font-weight: 500;
    color: #9ba5c9; border-left: 3px solid transparent; transition: all .15s;
  }
  .mf-nav-item:hover { background: rgba(255,255,255,.03); color: #e8eaf6; }
  .mf-nav-item.active { background: rgba(0,229,204,.08); color: #00e5cc; border-left-color: #00e5cc; }
  .mf-nav-icon { font-size: 16px; width: 20px; text-align: center; }
  .mf-signout { padding: 14px 18px; border-top: 1px solid rgba(255,255,255,.06); display: flex; align-items: center; gap: 10px; cursor: pointer; color: #5a6490; font-size: 13px; }
  .mf-signout:hover { color: #ff4d6d; }

  .mf-hamburger {
    display: none; position: fixed; top: 14px; left: 14px; z-index: 300;
    background: #0d1130; border: 1px solid rgba(255,255,255,.1);
    border-radius: 8px; padding: 8px 10px; cursor: pointer; font-size: 18px; color: #e8eaf6;
  }
  .mf-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 150; }

  .mf-main { margin-left: 220px; padding: 28px 30px 100px; flex: 1; min-height: 100vh; }

  .mf-bottom-nav { display: none; position: fixed; bottom: 0; left: 0; right: 0; background: #0d1130; border-top: 1px solid rgba(255,255,255,.07); z-index: 200; padding: 6px 0; }
  .mf-bottom-nav-inner { display: flex; justify-content: space-around; }
  .mf-bottom-item { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 5px 4px; cursor: pointer; color: #5a6490; font-size: 8px; transition: color .15s; min-width: 0; }
  .mf-bottom-item.active { color: #00e5cc; }
  .mf-bottom-icon { font-size: 18px; }

  .mf-topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; flex-wrap: wrap; gap: 10px; }
  .mf-topbar h2 { font-size: 21px; font-weight: 700; }
  .mf-filters { display: flex; gap: 8px; flex-wrap: wrap; }

  .mf-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px,1fr)); gap: 14px; margin-bottom: 20px; }
  .mf-card { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07); border-radius: 14px; padding: 16px 18px; }
  .mf-card-label { font-size: 10px; color: #5a6490; text-transform: uppercase; letter-spacing: .8px; margin-bottom: 8px; }
  .mf-card-val { font-size: 20px; font-weight: 700; }
  .mf-card-sub { font-size: 10px; color: #5a6490; margin-top: 4px; }

  .mf-sec { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07); border-radius: 14px; padding: 18px 22px; margin-bottom: 16px; }
  .mf-sec-title { font-size: 10px; font-weight: 600; color: #5a6490; text-transform: uppercase; letter-spacing: .8px; margin-bottom: 14px; }

  .mf-inp { background: #131840; border: 1px solid rgba(255,255,255,.1); color: #e8eaf6; padding: 10px 14px; border-radius: 9px; font-size: 14px; outline: none; width: 100%; display: block; transition: border-color .2s; }
  .mf-inp:focus { border-color: #00e5cc; }
  .mf-textarea { background: #131840; border: 1px solid rgba(255,255,255,.1); color: #e8eaf6; padding: 10px 14px; border-radius: 9px; font-size: 14px; outline: none; width: 100%; display: block; transition: border-color .2s; resize: vertical; min-height: 80px; }
  .mf-textarea:focus { border-color: #00e5cc; }
  .mf-sel { background: #131840; border: 1px solid rgba(255,255,255,.1); color: #e8eaf6; padding: 7px 12px; border-radius: 8px; font-size: 13px; cursor: pointer; outline: none; }
  .mf-sel:focus { border-color: #00e5cc; }

  .mf-btn-p { padding: 10px 22px; border-radius: 9px; border: none; cursor: pointer; font-size: 14px; font-weight: 600; background: linear-gradient(135deg,#00e5cc,#00b8a4); color: #07091a; transition: opacity .15s, transform .15s; }
  .mf-btn-p:hover { opacity: .9; transform: translateY(-1px); }
  .mf-btn-p:disabled { opacity: .6; cursor: not-allowed; transform: none; }
  .mf-btn-d { padding: 5px 12px; border-radius: 7px; cursor: pointer; font-size: 12px; border: 1px solid rgba(255,77,109,.3); background: rgba(255,77,109,.1); color: #ff4d6d; white-space: nowrap; }
  .mf-btn-g { padding: 10px 18px; border-radius: 9px; cursor: pointer; font-size: 13px; border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.04); color: #9ba5c9; }
  .mf-btn-sm { padding: 6px 14px; border-radius: 7px; border: none; cursor: pointer; font-size: 12px; font-weight: 600; background: linear-gradient(135deg,#00e5cc,#00b8a4); color: #07091a; }

  .mf-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .mf-form-group { display: flex; flex-direction: column; gap: 6px; }
  .mf-form-group.full { grid-column: 1 / -1; }
  .mf-form-label { font-size: 11px; color: #5a6490; text-transform: uppercase; letter-spacing: .7px; }

  .mf-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .mf-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .mf-table th { font-size: 10px; color: #5a6490; text-transform: uppercase; letter-spacing: .7px; padding: 8px 10px; text-align: left; border-bottom: 1px solid rgba(255,255,255,.08); white-space: nowrap; }
  .mf-table td { padding: 10px 10px; border-bottom: 1px solid rgba(255,255,255,.04); color: #9ba5c9; }
  .mf-table tr:last-child td { border-bottom: none; }
  .mf-chip { display: inline-block; background: rgba(255,255,255,.07); color: #9ba5c9; border-radius: 5px; padding: 2px 8px; font-size: 11px; white-space: nowrap; }

  .mf-prog-item { margin-bottom: 12px; }
  .mf-prog-meta { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px; }
  .mf-prog-bg { height: 6px; background: rgba(255,255,255,.07); border-radius: 99px; overflow: hidden; }
  .mf-prog-fill { height: 100%; border-radius: 99px; transition: width .5s; }

  .mf-budget-row { display: grid; grid-template-columns: 1fr 120px auto; gap: 10px; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,.04); }
  .mf-budget-row:last-child { border-bottom: none; }
  .mf-budget-inp { background: #131840; border: 1px solid rgba(255,255,255,.1); color: #e8eaf6; padding: 6px 10px; border-radius: 7px; font-size: 13px; outline: none; width: 100%; }
  .mf-budget-inp:focus { border-color: #00e5cc; }

  .mf-chart-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }

  .mf-msg-ok  { font-size: 13px; color: #00d68f; margin-top: 10px; }
  .mf-msg-err { font-size: 13px; color: #ff4d6d; margin-top: 10px; }

  /* Feedback */
  .mf-thread-card { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07); border-radius: 12px; padding: 16px 20px; margin-bottom: 12px; cursor: pointer; transition: border-color .2s, background .2s; }
  .mf-thread-card:hover { border-color: rgba(0,229,204,.3); background: rgba(0,229,204,.04); }
  .mf-thread-title { font-size: 15px; font-weight: 600; color: #e8eaf6; margin-bottom: 6px; }
  .mf-thread-body { font-size: 13px; color: #9ba5c9; margin-bottom: 10px; line-height: 1.5; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .mf-thread-meta { display: flex; gap: 14px; font-size: 11px; color: #5a6490; flex-wrap: wrap; }
  .mf-tag { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 600; }
  .mf-tag-feature { background: rgba(0,229,204,.12); color: #00e5cc; }
  .mf-tag-bug { background: rgba(255,77,109,.12); color: #ff4d6d; }
  .mf-tag-complaint { background: rgba(255,184,48,.12); color: #ffb830; }
  .mf-tag-other { background: rgba(255,255,255,.08); color: #9ba5c9; }
  .mf-comment { display: flex; gap: 12px; padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,.05); }
  .mf-comment:last-child { border-bottom: none; }
  .mf-avatar { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; flex-shrink: 0; }
  .mf-back-btn { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; color: #5a6490; font-size: 13px; margin-bottom: 18px; padding: 6px 0; }
  .mf-back-btn:hover { color: #00e5cc; }

  /* Auth tabs */
  .mf-auth-tabs { display: flex; gap: 0; margin-bottom: 28px; border-radius: 10px; overflow: hidden; border: 1px solid rgba(255,255,255,.08); }
  .mf-auth-tab { flex: 1; padding: 10px; text-align: center; cursor: pointer; font-size: 13px; font-weight: 600; color: #5a6490; background: transparent; border: none; transition: all .2s; }
  .mf-auth-tab.active { background: rgba(0,229,204,.1); color: #00e5cc; }

  /* Profile */
  .mf-profile-avatar { width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; margin: 0 auto 16px; }
  .mf-divider { height: 1px; background: rgba(255,255,255,.07); margin: 20px 0; }

  /* Ledger */
  .mf-person-card { background:#0d1130; border:1px solid rgba(255,255,255,.07); border-radius:12px; padding:14px 16px; cursor:pointer; transition:border-color .2s; margin-bottom:10px; }
  .mf-person-card:hover { border-color:rgba(0,229,204,.3); }
  .mf-badge { display:inline-flex; align-items:center; padding:3px 10px; border-radius:99px; font-size:11px; font-weight:600; }
  .mf-badge-red { background:rgba(255,77,109,.15); color:#ff4d6d; }
  .mf-badge-green { background:rgba(0,214,143,.15); color:#00d68f; }
  .mf-badge-settled { background:rgba(255,255,255,.07); color:#5a6490; }
  .mf-entry-row { display:flex; align-items:flex-start; gap:12px; padding:12px 0; border-bottom:1px solid rgba(255,255,255,.05); }
  .mf-entry-row:last-child { border-bottom:none; }
  .mf-entry-icon { width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; }
  .mf-reminder-badge { display:inline-flex; align-items:center; gap:4px; font-size:10px; padding:2px 7px; border-radius:99px; background:rgba(255,184,48,.12); color:#ffb830; margin-top:4px; }
  .mf-attachment-thumb { width:48px; height:48px; border-radius:6px; object-fit:cover; border:1px solid rgba(255,255,255,.1); cursor:pointer; flex-shrink:0; }
  .mf-lightbox { position:fixed; inset:0; background:rgba(0,0,0,.85); z-index:500; display:flex; align-items:center; justify-content:center; padding:20px; }
  .mf-lightbox img { max-width:100%; max-height:90vh; border-radius:10px; }
  .mf-net-positive { color:#ff4d6d; }
  .mf-net-negative { color:#00d68f; }

    .mf-sidebar { transform: translateX(-100%); }
    .mf-sidebar.open { transform: translateX(0); box-shadow: 4px 0 30px rgba(0,0,0,.6); }
    .mf-overlay.open { display: block; }
    .mf-hamburger { display: flex; align-items: center; }
    .mf-logo-wrap { padding-top: 52px; }
    .mf-main { margin-left: 0; padding: 70px 16px 90px; }
    .mf-bottom-nav { display: flex; }
    .mf-form-grid { grid-template-columns: 1fr; }
    .mf-form-group.full { grid-column: 1; }
    .mf-chart-2col { grid-template-columns: 1fr; }
    .mf-topbar h2 { font-size: 18px; }
    .mf-cards { grid-template-columns: 1fr 1fr; }
    .mf-budget-row { grid-template-columns: 1fr auto; }
    .mf-add-row { flex-direction: column !important; }
  }
  @media (max-width: 480px) {
    .mf-cards { grid-template-columns: 1fr 1fr; gap: 10px; }
    .mf-card { padding: 12px 14px; }
    .mf-card-val { font-size: 17px; }
    .mf-sec { padding: 14px 14px; }
  }
  @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-10px)} 75%{transform:translateX(10px)} }
`;

// Avatar color from name
const avatarColor = (name) => {
  const colors = ["#00e5cc","#ff4d8d","#a78bfa","#60a5fa","#ffb830","#00d68f","#f97316"];
  let h = 0; for (let c of (name||"?")) h = c.charCodeAt(0) + ((h<<5)-h);
  return colors[Math.abs(h) % colors.length];
};
const avatarInitial = (name) => (name||"?")[0].toUpperCase();



/* ── Auth Screen (Login + Signup) ── */
function AuthScreen({ onLogin }) {
  const [tab, setTab] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const doLogin = async () => {
    if (!email||!password) { setError("Enter email and password"); return; }
    setLoading(true); setError("");
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError("Invalid email or password."); setShake(true); setTimeout(()=>setShake(false),500); }
    else onLogin(data.session);
  };

  const doSignup = async () => {
    if (!name.trim()||!email||!password) { setError("Please fill all fields"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError("");
    const { data, error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { display_name: name.trim() } }
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    // insert profile row
    if (data.user) {
      await supabase.from("profiles").upsert({ id: data.user.id, display_name: name.trim(), email });
    }
    if (data.session) { onLogin(data.session); }
    else {
      setSuccess("✅ Account created! Please check your email to confirm, then sign in.");
      setTab("login"); setName(""); setPassword("");
    }
  };

  return (
    <div style={{minHeight:"100vh",background:"#07091a",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-10px)}75%{transform:translateX(10px)}}`}</style>
      <div style={{background:"#0d1130",border:"1px solid rgba(255,255,255,.08)",borderRadius:20,padding:"40px 36px",width:"100%",maxWidth:400,textAlign:"center",animation:shake?"shake .4s ease":"none"}}>
        <div style={{width:58,height:58,borderRadius:"50%",background:"rgba(0,229,204,.1)",border:"1px solid rgba(0,229,204,.2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:26}}>💰</div>
        <div style={{fontSize:26,fontWeight:800,background:"linear-gradient(135deg,#00e5cc,#ff4d8d)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4,display:"inline-block"}}>Monefy</div>        <div style={{fontSize:13,color:"#5a6490",marginBottom:24}}>Personal finance tracker</div>

        <div className="mf-auth-tabs">
          <button className={`mf-auth-tab ${tab==="login"?"active":""}`} onClick={()=>{setTab("login");setError("");setSuccess("");}}>Sign In</button>
          <button className={`mf-auth-tab ${tab==="signup"?"active":""}`} onClick={()=>{setTab("signup");setError("");setSuccess("");}}>Sign Up</button>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:12,textAlign:"left"}}>
          {tab==="signup" && (
            <div className="mf-form-group">
              <label className="mf-form-label">Your Name</label>
              <input type="text" className="mf-inp" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Raj Sharma"/>
            </div>
          )}
          <div className="mf-form-group">
            <label className="mf-form-label">Email</label>
            <input type="email" className="mf-inp" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(tab==="login"?doLogin():doSignup())} placeholder="you@email.com" style={{borderColor:error?"#ff4d6d":undefined}}/>
          </div>
          <div className="mf-form-group">
            <label className="mf-form-label">Password</label>
            <div style={{position:"relative"}}>
              <input type={show?"text":"password"} className="mf-inp" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(tab==="login"?doLogin():doSignup())} placeholder="••••••••" style={{paddingRight:44,borderColor:error?"#ff4d6d":undefined}}/>
              <span onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:13,top:"50%",transform:"translateY(-50%)",cursor:"pointer",fontSize:15,color:"#5a6490"}}>{show?"🙈":"👁️"}</span>
            </div>
          </div>
        </div>

        {error && <div style={{color:"#ff4d6d",fontSize:12,marginTop:10,textAlign:"left"}}>{error}</div>}
        {success && <div style={{color:"#00d68f",fontSize:12,marginTop:10,textAlign:"left"}}>{success}</div>}

        <button className="mf-btn-p" onClick={tab==="login"?doLogin:doSignup} disabled={loading} style={{width:"100%",marginTop:18}}>
          {loading?(tab==="login"?"Signing in…":"Creating account…"):(tab==="login"?"Sign In":"Create Account")}
        </button>
        <div style={{marginTop:16,fontSize:11,color:"#2a304a"}}>🔒 Secured by Supabase Auth</div>
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div style={{minHeight:"100vh",background:"#07091a",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14}}>
      <div style={{fontSize:26,fontWeight:800,background:"linear-gradient(135deg,#00e5cc,#ff4d8d)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",display:"inline-block"}}>Monefy</div>
      <div style={{color:"#5a6490",fontSize:13}}>Loading…</div>
    </div>
  );
}

/* ══ PAGE COMPONENTS — all outside App to prevent remount/defocus ══ */

/* ── Smart rule-based insights engine ── */
function generateInsights(budget, spend, transactions, selMonth, selYear, totalBudget, totalSpent) {
  const insights = [];
  const daysInMonth = new Date(selYear, selMonth+1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getMonth()===selMonth && today.getFullYear()===selYear;
  const dayOfMonth = isCurrentMonth ? today.getDate() : daysInMonth;
  const daysLeft = isCurrentMonth ? daysInMonth - dayOfMonth : 0;
  const dailyAvg = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0;
  const projectedTotal = dailyAvg * daysInMonth;
  const pctMonth = Math.round((dayOfMonth / daysInMonth) * 100);
  const pctBudget = pct(totalSpent, totalBudget);

  // Over budget overall
  if (totalSpent > totalBudget) insights.push({ icon:"🚨", color:"#ff4d6d", text:`You are <strong>${fmt(totalSpent-totalBudget)} over</strong> your total budget this month.` });

  // Projection warning
  if (isCurrentMonth && projectedTotal > totalBudget && totalSpent <= totalBudget)
    insights.push({ icon:"⚠️", color:"#ffb830", text:`At this rate you'll spend <strong>${fmt(Math.round(projectedTotal))}</strong> by month end — <strong>${fmt(Math.round(projectedTotal-totalBudget))} over</strong> budget.` });

  // Spending pace vs month progress
  if (isCurrentMonth && pctBudget < pctMonth - 10)
    insights.push({ icon:"✅", color:"#00d68f", text:`You've used <strong>${pctBudget}%</strong> of budget with <strong>${pctMonth}%</strong> of month gone. You're spending well below pace.` });

  // Days left with remaining
  if (isCurrentMonth && daysLeft > 0 && totalSpent < totalBudget) {
    const remaining = totalBudget - totalSpent;
    const perDay = Math.round(remaining / daysLeft);
    insights.push({ icon:"📅", color:"#00e5cc", text:`<strong>${daysLeft} days left</strong> with ${fmt(remaining)} remaining — about <strong>${fmt(perDay)}/day</strong> to stay on budget.` });
  }

  // Most overspent category
  const overCats = Object.keys(budget).filter(c=>budget[c]>0&&(spend[c]||0)>budget[c]);
  if (overCats.length) {
    const worst = overCats.sort((a,b)=>((spend[b]||0)-budget[b])-((spend[a]||0)-budget[a]))[0];
    insights.push({ icon:"🔴", color:"#ff4d6d", text:`<strong>${worst}</strong> is over budget by <strong>${fmt((spend[worst]||0)-budget[worst])}</strong>.` });
  }

  // Best saved category
  const underCats = Object.keys(budget).filter(c=>budget[c]>0&&(spend[c]||0)<budget[c]*0.5);
  if (underCats.length) {
    const best = underCats.sort((a,b)=>(budget[b]-(spend[b]||0))-(budget[a]-(spend[a]||0)))[0];
    insights.push({ icon:"💚", color:"#00d68f", text:`<strong>${best}</strong> still has <strong>${fmt(budget[best]-(spend[best]||0))}</strong> left — well under budget.` });
  }

  // Biggest single transaction
  const monthTxns = transactions.filter(t=>{ const d=new Date(t.date); return d.getMonth()===selMonth&&d.getFullYear()===selYear; });
  if (monthTxns.length) {
    const biggest = monthTxns.reduce((a,b)=>a.amount>b.amount?a:b);
    insights.push({ icon:"💸", color:"#a78bfa", text:`Biggest expense: <strong>${biggest.description}</strong> — <strong>${fmt(biggest.amount)}</strong> on ${biggest.date}.` });
  }

  // Day of week with most spending
  const dowMap = [0,0,0,0,0,0,0];
  const dowCount = [0,0,0,0,0,0,0];
  monthTxns.forEach(t=>{ const dow=new Date(t.date).getDay(); dowMap[dow]+=t.amount; dowCount[dow]++; });
  const dowAvg = dowMap.map((v,i)=>dowCount[i]>0?v/dowCount[i]:0);
  const maxDow = dowAvg.indexOf(Math.max(...dowAvg));
  const dowNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  if (dowCount[maxDow]>0) insights.push({ icon:"📆", color:"#ffb830", text:`You spend most on <strong>${dowNames[maxDow]}s</strong> — avg <strong>${fmt(Math.round(dowAvg[maxDow]))}</strong> per transaction.` });

  // Compare with last month
  const prevMonth = selMonth===0?11:selMonth-1;
  const prevYear = selMonth===0?selYear-1:selYear;
  const prevTxns = transactions.filter(t=>{ const d=new Date(t.date); return d.getMonth()===prevMonth&&d.getFullYear()===prevYear; });
  const prevSpent = prevTxns.reduce((s,t)=>s+t.amount,0);
  if (prevSpent>0&&totalSpent>0) {
    const diff = totalSpent - prevSpent;
    const pctDiff = Math.abs(Math.round((diff/prevSpent)*100));
    if (diff<0) insights.push({ icon:"📉", color:"#00d68f", text:`Spending is <strong>${pctDiff}% lower</strong> than last month (${fmt(prevSpent)}). Keep it up!` });
    else if (diff>0) insights.push({ icon:"📈", color:"#ffb830", text:`Spending is <strong>${pctDiff}% higher</strong> than last month (${fmt(prevSpent)}).` });
  }

  return insights.slice(0, 5);
}

/* ── Chart manager — creates/destroys Chart.js instances ── */
let chartInstances = {};
function destroyChart(id) { if(chartInstances[id]){chartInstances[id].destroy();delete chartInstances[id];} }
function createChart(id, config) {
  destroyChart(id);
  const el = document.getElementById(id);
  if (!el) return;
  chartInstances[id] = new window.Chart(el, config);
}

function Dashboard({ budget, transactions, selMonth, setSelMonth, selYear, setSelYear }) {
  const [chartsReady, setChartsReady] = useState(false);

  const txns = transactions.filter(t=>{ const d=new Date(t.date); return d.getMonth()===selMonth&&d.getFullYear()===selYear; });
  const spend = {}; txns.forEach(t=>{spend[t.category]=(spend[t.category]||0)+t.amount;});
  const totalBudget = Object.values(budget).reduce((a,b)=>a+b,0);
  const totalSpent = Object.values(spend).reduce((a,b)=>a+b,0);
  const remaining = totalBudget - totalSpent;
  const activeCats = Object.keys(budget).filter(c=>budget[c]>0);
  const spentCats = activeCats.filter(c=>(spend[c]||0)>0);

  // Daily avg
  const today = new Date();
  const isCurrentMonth = today.getMonth()===selMonth&&today.getFullYear()===selYear;
  const dayOfMonth = isCurrentMonth ? today.getDate() : new Date(selYear,selMonth+1,0).getDate();
  const dailyAvg = dayOfMonth>0 ? Math.round(totalSpent/dayOfMonth) : 0;

  // Last month comparison
  const prevM = selMonth===0?11:selMonth-1, prevY = selMonth===0?selYear-1:selYear;
  const prevSpent = transactions.filter(t=>{const d=new Date(t.date);return d.getMonth()===prevM&&d.getFullYear()===prevY;}).reduce((s,t)=>s+t.amount,0);
  const spentDiff = prevSpent>0 ? Math.round(((totalSpent-prevSpent)/prevSpent)*100) : null;

  const recent = [...txns].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  const insights = generateInsights(budget, spend, transactions, selMonth, selYear, totalBudget, totalSpent);

  // Load Chart.js once
  useEffect(()=>{
    if (window.Chart) { setChartsReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    s.onload = () => setChartsReady(true);
    document.head.appendChild(s);
  },[]);

  // Draw all charts when data or month changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{
    if (!chartsReady || !window.Chart) return;

    // eslint-disable-next-line no-unused-vars
    const GRID = "rgba(255,255,255,0.06)";
    const TICK = "#5a6490";
    const fmtTick = v => v>=1000?"₹"+Math.round(v/1000)+"k":"₹"+v;

    // Chart 1 — Budget vs Actual horizontal
    createChart("mf-c1",{
      type:"bar",
      data:{
        labels: activeCats.map(c=>c.length>12?c.slice(0,11)+"…":c),
        datasets:[
          {label:"Budget", data:activeCats.map(c=>budget[c]||0), backgroundColor:"rgba(0,229,204,0.25)", borderColor:"#00e5cc", borderWidth:1.5, borderRadius:3},
          {label:"Actual", data:activeCats.map(c=>spend[c]||0), backgroundColor:activeCats.map(c=>(spend[c]||0)>(budget[c]||0)?"rgba(255,77,109,0.7)":"rgba(0,214,143,0.7)"), borderRadius:3},
        ]
      },
      options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},
        scales:{x:{ticks:{color:TICK,font:{size:10},callback:fmtTick},grid:{color:GRID}},y:{ticks:{color:TICK,font:{size:10}},grid:{display:false}}}}
    });

    // Chart 2 — Donut
    const PIE = ["#00e5cc","#ff4d8d","#ffb830","#00d68f","#a78bfa","#60a5fa","#f97316","#34d399","#fb7185","#818cf8"];
    createChart("mf-c2",{
      type:"doughnut",
      data:{labels:spentCats, datasets:[{data:spentCats.map(c=>spend[c]), backgroundColor:spentCats.map((_,i)=>PIE[i%PIE.length]), borderWidth:0, hoverOffset:6}]},
      options:{responsive:true,maintainAspectRatio:false,cutout:"62%",plugins:{legend:{display:false}}}
    });

    // Chart 3 — Daily spending this month
    const daysInMonth = new Date(selYear,selMonth+1,0).getDate();
    const dayLabels = Array.from({length:daysInMonth},(_,i)=>i+1);
    const dayData = dayLabels.map(d=>{
      const map={}; txns.forEach(t=>{const dd=new Date(t.date).getDate(); map[dd]=(map[dd]||0)+t.amount;});
      return map[d]||0;
    });
    const dailyLimit = totalBudget/daysInMonth;
    createChart("mf-c3",{
      type:"line",
      data:{labels:dayLabels,datasets:[
        {label:"Spent",data:dayData,borderColor:"#00e5cc",backgroundColor:"rgba(0,229,204,0.08)",fill:true,borderWidth:2,pointRadius:3,pointBackgroundColor:"#00e5cc",tension:0.3},
        {label:"Daily limit",data:dayLabels.map(()=>Math.round(dailyLimit)),borderColor:"#ff4d8d",borderDash:[5,4],borderWidth:1.5,pointRadius:0,fill:false},
      ]},
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{display:false}},
        scales:{x:{ticks:{color:TICK,font:{size:10},maxTicksLimit:10,autoSkip:true},grid:{color:GRID}},y:{ticks:{color:TICK,font:{size:10},callback:fmtTick},grid:{color:GRID}}}}
    });

    // Chart 4 — Day of week avg
    const dowTotals=[0,0,0,0,0,0,0], dowCounts=[0,0,0,0,0,0,0];
    txns.forEach(t=>{const dow=new Date(t.date).getDay(); dowTotals[dow]+=t.amount; dowCounts[dow]++;});
    const dowAvg = dowTotals.map((v,i)=>dowCounts[i]>0?Math.round(v/dowCounts[i]):0);
    const maxDow = Math.max(...dowAvg);
    createChart("mf-c4",{
      type:"bar",
      data:{labels:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
        datasets:[{label:"Avg spend",data:dowAvg,backgroundColor:dowAvg.map(v=>v===maxDow&&v>0?"#ff4d8d":"rgba(0,229,204,0.35)"),borderRadius:4,borderSkipped:false}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},
        scales:{x:{ticks:{color:TICK,font:{size:11}},grid:{display:false}},y:{ticks:{color:TICK,font:{size:10},callback:fmtTick},grid:{color:GRID}}}}
    });

    // Chart 5 — Last 6 months trend
    const months6 = Array.from({length:6},(_,i)=>{
      const d=new Date(selYear,selMonth-5+i,1); return {m:d.getMonth(),y:d.getFullYear(),label:MONTHS_SHORT[d.getMonth()]};
    });
    const m6data = months6.map(({m,y})=>transactions.filter(t=>{const d=new Date(t.date);return d.getMonth()===m&&d.getFullYear()===y;}).reduce((s,t)=>s+t.amount,0));
    createChart("mf-c5",{
      type:"line",
      data:{labels:months6.map(x=>x.label),datasets:[
        {label:"Spent",data:m6data,borderColor:"#ff4d8d",backgroundColor:"rgba(255,77,141,0.08)",fill:true,borderWidth:2,pointRadius:4,pointBackgroundColor:"#ff4d8d",tension:0.3},
        {label:"Budget",data:months6.map(()=>totalBudget),borderColor:"rgba(0,229,204,0.4)",borderDash:[5,4],borderWidth:1.5,pointRadius:0,fill:false},
      ]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},
        scales:{x:{ticks:{color:TICK,font:{size:11}},grid:{display:false}},y:{ticks:{color:TICK,font:{size:10},callback:fmtTick},grid:{color:GRID}}}}
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[chartsReady, selMonth, selYear, budget, transactions]);

  // Cleanup on unmount
  useEffect(()=>()=>{ ["mf-c1","mf-c2","mf-c3","mf-c4","mf-c5"].forEach(destroyChart); },[]);

  const PIE_COLORS_DASH = ["#00e5cc","#ff4d8d","#ffb830","#00d68f","#a78bfa","#60a5fa","#f97316","#34d399","#fb7185","#818cf8"];

  const CC = {
    card: {background:"#0d1130", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"16px 20px"},
    title: {fontSize:13, fontWeight:600, color:"#e8eaf6", marginBottom:4},
    sub:   {fontSize:11, color:"#5a6490", marginBottom:14},
    legend:{display:"flex", flexWrap:"wrap", gap:12, marginTop:10},
    legItem:{display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#9ba5c9"},
    legDot:{width:10, height:10, borderRadius:2, flexShrink:0},
  };

  return (
    <div>
      {/* Topbar */}
      <div className="mf-topbar">
        <h2>Dashboard</h2>
        <div className="mf-filters">
          <select className="mf-sel" value={selMonth} onChange={e=>setSelMonth(+e.target.value)}>{MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
          <select className="mf-sel" value={selYear} onChange={e=>setSelYear(+e.target.value)}>{YEARS.map(y=><option key={y} value={y}>{y}</option>)}</select>
        </div>
      </div>

      {/* ── 4 Summary Cards ── */}
      <div className="mf-cards" style={{marginBottom:18}}>
        {[
          {label:"Budget",    val:fmt(totalBudget), sub:MONTHS[selMonth]+" "+selYear,                                                      color:"#e8eaf6", subColor:"#5a6490"},
          {label:"Spent",     val:fmt(totalSpent),  sub:pct(totalSpent,totalBudget)+"% of budget",                                         color:"#e8eaf6", subColor:"#5a6490"},
          {label:"Remaining", val:fmt(Math.abs(remaining)), sub:remaining>=0?(txns.length+" transactions"):"Over budget",                  color:remaining>=0?"#e8eaf6":"#ff4d6d", subColor:remaining>=0?"#5a6490":"#ff4d6d"},
          {label:"Daily avg", val:fmt(dailyAvg),    sub:spentDiff!==null?(spentDiff<0?"↓ "+Math.abs(spentDiff)+"% vs last month":"↑ "+spentDiff+"% vs last month"):"no prior data", color:"#e8eaf6", subColor:spentDiff!==null&&spentDiff<0?"#00d68f":"#ffb830"},
        ].map((c,i)=>(
          <div key={i} style={{background:"#0d1130",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"14px 16px"}}>
            <div style={{fontSize:11,color:"#5a6490",marginBottom:6}}>{c.label}</div>
            <div style={{fontSize:20,fontWeight:700,color:c.color}}>{c.val}</div>
            <div style={{fontSize:11,color:c.subColor,marginTop:4}}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Charts grid: exact proposal layout ── */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}}>

        {/* Chart 1: Budget vs Actual — left */}
        <div style={CC.card}>
          <div style={CC.title}>Budget vs actual</div>
          <div style={CC.sub}>Overspend shown in red · this month</div>
          <div style={{position:"relative", height:Math.max(180, activeCats.length*36)}}>
            <canvas id="mf-c1" role="img" aria-label="Horizontal bar chart comparing budget vs actual spending by category">Budget vs actual spending by category.</canvas>
          </div>
          <div style={CC.legend}>
            {[{c:"rgba(0,229,204,0.5)",l:"Budget"},{c:"rgba(0,214,143,0.75)",l:"Under budget"},{c:"rgba(255,77,109,0.75)",l:"Over budget"}].map((x,i)=>(
              <span key={i} style={CC.legItem}><span style={{...CC.legDot,background:x.c}}/>{x.l}</span>
            ))}
          </div>
        </div>

        {/* Chart 2: Spending breakdown (donut) — right */}
        <div style={CC.card}>
          <div style={CC.title}>Spending breakdown</div>
          <div style={CC.sub}>Where your money goes · this month</div>
          <div style={{display:"flex", alignItems:"center", gap:16, flexWrap:"wrap"}}>
            <div style={{position:"relative", width:140, height:140, flexShrink:0}}>
              <canvas id="mf-c2" role="img" aria-label="Donut chart of spending by category">Spending by category.</canvas>
            </div>
            <div style={{display:"flex", flexDirection:"column", gap:8, flex:1, minWidth:100}}>
              {spentCats.slice(0,6).map((c,i)=>(
                <div key={c} style={{display:"flex", alignItems:"center", justifyContent:"space-between", fontSize:11, color:"#9ba5c9", gap:6}}>
                  <span style={{display:"flex", alignItems:"center", gap:6}}>
                    <span style={{...CC.legDot, width:8, height:8, background:PIE_COLORS_DASH[i%PIE_COLORS_DASH.length]}}/>
                    <span style={{overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:90}}>{c}</span>
                  </span>
                  <span style={{fontWeight:600, color:"#e8eaf6", flexShrink:0}}>{fmt(spend[c])}</span>
                </div>
              ))}
              {spentCats.length===0&&<div style={{color:"#5a6490",fontSize:12}}>No spending yet</div>}
            </div>
          </div>
        </div>

        {/* Chart 3: Daily spending — FULL WIDTH */}
        <div style={{...CC.card, gridColumn:"1 / -1"}}>
          <div style={CC.title}>Daily spending pattern</div>
          <div style={CC.sub}>How much you spend each day · this month · dotted = daily budget limit</div>
          <div style={{position:"relative", height:180}}>
            <canvas id="mf-c3" role="img" aria-label="Line chart of daily spending over the month with budget limit">Daily spending pattern.</canvas>
          </div>
          <div style={CC.legend}>
            <span style={CC.legItem}><span style={{width:14,height:2,background:"#00e5cc",borderRadius:2,flexShrink:0}}/> Daily spend</span>
            <span style={CC.legItem}><span style={{width:14,height:0,borderTop:"2px dashed #ff4d8d",flexShrink:0}}/> Daily limit</span>
          </div>
        </div>

        {/* Chart 4: Day of week — left */}
        <div style={CC.card}>
          <div style={CC.title}>Spending by day of week</div>
          <div style={CC.sub}>Which days you spend most · pink = highest</div>
          <div style={{position:"relative", height:180}}>
            <canvas id="mf-c4" role="img" aria-label="Bar chart of average spending per day of week">Day of week spending.</canvas>
          </div>
        </div>

        {/* Chart 5: Monthly trend — right */}
        <div style={CC.card}>
          <div style={CC.title}>Monthly trend</div>
          <div style={CC.sub}>Spent vs budget · last 6 months</div>
          <div style={{position:"relative", height:180}}>
            <canvas id="mf-c5" role="img" aria-label="Line chart of monthly spending vs budget over 6 months">Monthly spending trend.</canvas>
          </div>
          <div style={CC.legend}>
            <span style={CC.legItem}><span style={{width:14,height:2,background:"#ff4d8d",borderRadius:2,flexShrink:0}}/> Spent</span>
            <span style={CC.legItem}><span style={{width:14,height:0,borderTop:"2px dashed rgba(0,229,204,0.6)",flexShrink:0}}/> Budget</span>
          </div>
        </div>

        {/* Chart 6: Category budget usage — left */}
        <div style={CC.card}>
          <div style={CC.title}>Category budget usage</div>
          <div style={CC.sub}>% of budget used · this month</div>
          {activeCats.length===0
            ?<div style={{color:"#5a6490",fontSize:13}}>No budget set. Go to Budget page.</div>
            :activeCats.map(cat=>{
              const s=spend[cat]||0, b=budget[cat], p=pct(s,b), over=s>b;
              const barColor = over?"#D85A30":p>80?"#BA7517":"#1D9E75";
              const pctColor = over?"#ff4d6d":p>80?"#ffb830":"#9ba5c9";
              return (
                <div key={cat} style={{display:"flex", alignItems:"center", gap:10, marginBottom:10}}>
                  <span style={{fontSize:12, color:"#9ba5c9", width:120, flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{cat}</span>
                  <div style={{flex:1, height:7, background:"rgba(255,255,255,0.07)", borderRadius:99, overflow:"hidden"}}>
                    <div style={{height:"100%", width:`${Math.min(p,100)}%`, background:barColor, borderRadius:99}}/>
                  </div>
                  <span style={{fontSize:11, color:pctColor, width:36, textAlign:"right", flexShrink:0, fontWeight:over||p>80?600:400}}>{p}%</span>
                </div>
              );
            })
          }
        </div>

        {/* Chart 7: Smart Insights — right */}
        <div style={CC.card}>
          <div style={CC.title}>Smart insights</div>
          <div style={CC.sub}>Personalised observations</div>
          {insights.length===0
            ?<div style={{color:"#5a6490",fontSize:13}}>Add transactions to see insights.</div>
            :<div style={{display:"flex", flexDirection:"column", gap:9}}>
              {insights.map((ins,i)=>(
                <div key={i} style={{display:"flex", alignItems:"flex-start", gap:10, padding:"10px 12px", background:"rgba(255,255,255,0.03)", borderRadius:8, border:"1px solid rgba(255,255,255,0.05)"}}>
                  <span style={{fontSize:17, flexShrink:0, lineHeight:1.4}}>{ins.icon}</span>
                  <span style={{fontSize:12, color:"#9ba5c9", lineHeight:1.55}} dangerouslySetInnerHTML={{__html:ins.text.replace(/<strong>/g,`<strong style="color:#e8eaf6;font-weight:600">`)}}/>
                </div>
              ))}
            </div>
          }
        </div>

      </div>{/* end charts grid */}

      {/* Recent Transactions — below grid, full width */}
      <div style={{...CC.card, marginTop:14}}>
        <div style={CC.title}>Recent transactions</div>
        <div style={{...CC.sub, marginBottom:0}}>Latest expenses this month</div>
        {recent.length===0
          ?<div style={{color:"#5a6490",fontSize:13,padding:"20px 0",textAlign:"center"}}>No transactions this month</div>
          :recent.map(t=>(
            <div key={t.id} style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
              <div style={{minWidth:0, flex:1}}>
                <div style={{fontSize:13, color:"#e8eaf6", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{t.description}</div>
                <div style={{fontSize:11, color:"#5a6490", marginTop:2}}>{t.date} · <span style={{color:"#9ba5c9"}}>{t.category}</span></div>
              </div>
              <div style={{color:"#ff4d8d", fontWeight:700, fontSize:13, marginLeft:16, flexShrink:0}}>{fmt(t.amount)}</div>
            </div>
          ))
        }
      </div>

    </div>
  );
}

function AddExpense({ budget, onSaved }) {
  const cats = Object.keys(budget);
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState(cats[0]||"");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{ if(!cat&&cats.length) setCat(cats[0]); },[cats]);

  const save = async () => {
    if (!date||!amount||!desc||!cat){setMsg({t:"err",m:"Please fill all fields"});return;}
    setLoading(true);
    const {data:{session}} = await supabase.auth.getSession();
    const {error} = await supabase.from("transactions").insert({date,description:desc,category:cat,amount:parseFloat(amount),user_id:session.user.id});
    setLoading(false);
    if (error){setMsg({t:"err",m:"Error saving."});return;}
    setMsg({t:"ok",m:"Expense saved! ✓"});
    setAmount(""); setDesc("");
    onSaved();
    setTimeout(()=>setMsg(null),2500);
  };

  return (
    <div>
      <div className="mf-topbar"><h2>Add Expense</h2></div>
      <div className="mf-sec" style={{maxWidth:520}}>
        <div className="mf-form-grid">
          <div className="mf-form-group"><label className="mf-form-label">Date</label><input type="date" className="mf-inp" value={date} onChange={e=>setDate(e.target.value)}/></div>
          <div className="mf-form-group"><label className="mf-form-label">Amount (₹)</label><input type="number" className="mf-inp" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" min="0" step="0.01"/></div>
          <div className="mf-form-group full"><label className="mf-form-label">Description</label><input type="text" className="mf-inp" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="What did you spend on?"/></div>
          <div className="mf-form-group full"><label className="mf-form-label">Category</label>
            <select className="mf-inp" style={{cursor:"pointer"}} value={cat} onChange={e=>setCat(e.target.value)}>
              {cats.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{marginTop:18,display:"flex",gap:10,flexWrap:"wrap"}}>
          <button className="mf-btn-p" onClick={save} disabled={loading}>{loading?"Saving…":"Save Expense"}</button>
          <button className="mf-btn-g" onClick={()=>{setAmount("");setDesc("");}}>Clear</button>
        </div>
        {msg&&<div className={msg.t==="ok"?"mf-msg-ok":"mf-msg-err"}>{msg.m}</div>}
      </div>
    </div>
  );
}

function Transactions({ transactions, onDeleted }) {
  const now = new Date();
  const [m, setM] = useState(now.getMonth());
  const [y, setY] = useState(now.getFullYear());
  const { confirm, modal } = useConfirm();
  const txns = transactions.filter(t=>{const d=new Date(t.date);return d.getMonth()===m&&d.getFullYear()===y;}).sort((a,b)=>b.date.localeCompare(a.date));

  const del = async (id) => {
    const ok = await confirm({ icon:"🗑️", title:"Delete Transaction", message:"This transaction will be permanently removed.", confirmLabel:"Yes, Delete" });
    if (!ok) return;
    await supabase.from("transactions").delete().eq("id",id);
    onDeleted();
  };

  return (
    <div>
      {modal}
      <div className="mf-topbar">
        <h2>Transactions</h2>
        <div className="mf-filters">
          <select className="mf-sel" value={m} onChange={e=>setM(+e.target.value)}>{MONTHS.map((mo,i)=><option key={i} value={i}>{mo}</option>)}</select>
          <select className="mf-sel" value={y} onChange={e=>setY(+e.target.value)}>{YEARS.map(yr=><option key={yr} value={yr}>{yr}</option>)}</select>
        </div>
      </div>
      <div className="mf-sec">
        {txns.length===0
          ?<div style={{color:"#5a6490",fontSize:13,padding:"32px 0",textAlign:"center"}}>No transactions this month</div>
          :<div className="mf-table-wrap">
            <table className="mf-table">
              <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th></th></tr></thead>
              <tbody>{txns.map(t=>(
                <tr key={t.id}>
                  <td>{t.date}</td><td style={{color:"#e8eaf6"}}>{t.description}</td>
                  <td><span className="mf-chip">{t.category}</span></td>
                  <td style={{color:"#ff4d8d",fontWeight:600}}>{fmt(t.amount)}</td>
                  <td><button className="mf-btn-d" onClick={()=>del(t.id)}>Delete</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>}
      </div>
    </div>
  );
}

function BudgetPage({ budget, onSaved }) {
  const [local, setLocal] = useState({...budget});
  const [newCat, setNewCat] = useState("");
  const [newAmt, setNewAmt] = useState("");
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const { confirm, modal } = useConfirm();
  useEffect(()=>{setLocal({...budget});},[budget]);

  const save = async () => {
    setSaving(true);
    const {data:{session}} = await supabase.auth.getSession();
    const rows = Object.entries(local).map(([category,amount])=>({category,amount,user_id:session.user.id}));
    const {error} = await supabase.from("budget").upsert(rows,{onConflict:"category,user_id"});
    setSaving(false);
    if (error){setMsg({t:"err",m:"Error saving."});return;}
    setMsg({t:"ok",m:"Budget saved! ✓"});
    onSaved();
    setTimeout(()=>setMsg(null),2500);
  };

  const addCat = async () => {
    if (!newCat.trim()){setMsg({t:"err",m:"Enter category name"});return;}
    if (local[newCat.trim()]!==undefined){setMsg({t:"err",m:"Already exists"});return;}
    const {data:{session}} = await supabase.auth.getSession();
    const {error} = await supabase.from("budget").insert({category:newCat.trim(),amount:parseFloat(newAmt)||0,user_id:session.user.id});
    if (error){setMsg({t:"err",m:"Error adding."});return;}
    setNewCat(""); setNewAmt("");
    setMsg({t:"ok",m:"Category added!"});
    onSaved();
    setTimeout(()=>setMsg(null),2500);
  };

  const delCat = async (cat) => {
    const ok = await confirm({ icon:"🗑️", title:"Remove Category", message:`Remove "${cat}" from your budget? This won't delete past transactions.`, confirmLabel:"Remove" });
    if (!ok) return;
    const {data:{session}} = await supabase.auth.getSession();
    await supabase.from("budget").delete().eq("category",cat).eq("user_id",session.user.id);
    onSaved();
  };

  return (
    <div>
      {modal}
      <div className="mf-topbar">
        <h2>Budget Manager</h2>
        <button className="mf-btn-p" onClick={save} disabled={saving}>{saving?"Saving…":"Save Budget"}</button>
      </div>
      {msg&&<div className={msg.t==="ok"?"mf-msg-ok":"mf-msg-err"} style={{marginBottom:14}}>{msg.m}</div>}
      <div className="mf-sec" style={{maxWidth:600}}>
        <div className="mf-sec-title">Categories & Monthly Budget</div>
        {Object.entries(local).map(([cat,amt])=>(
          <div key={cat} className="mf-budget-row">
            <span style={{fontSize:14,color:"#e8eaf6"}}>{cat}</span>
            <input type="number" className="mf-budget-inp" value={amt} onChange={e=>setLocal(p=>({...p,[cat]:parseFloat(e.target.value)||0}))}/>
            <button className="mf-btn-d" onClick={()=>delCat(cat)}>Remove</button>
          </div>
        ))}
        <div className="mf-add-row" style={{marginTop:18,display:"flex",gap:10,alignItems:"center",paddingTop:16,borderTop:"1px solid rgba(255,255,255,.08)",flexWrap:"wrap"}}>
          <input type="text" className="mf-inp" value={newCat} onChange={e=>setNewCat(e.target.value)} placeholder="New category name" style={{flex:1,minWidth:160}}/>
          <input type="number" className="mf-inp" value={newAmt} onChange={e=>setNewAmt(e.target.value)} placeholder="₹ Budget" style={{width:120}}/>
          <button className="mf-btn-p" onClick={addCat}>Add</button>
        </div>
      </div>
    </div>
  );
}

/* ── Custom Confirm Modal (replaces window.confirm) ── */
const CONFIRM_CSS = `
  .mf-modal-backdrop { position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px; }
  .mf-modal { background:#0d1130;border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:28px 28px 22px;max-width:360px;width:100%;box-shadow:0 24px 60px rgba(0,0,0,.5); }
  .mf-modal-icon { font-size:32px;text-align:center;margin-bottom:12px; }
  .mf-modal-title { font-size:16px;font-weight:700;color:#e8eaf6;margin-bottom:8px;text-align:center; }
  .mf-modal-msg { font-size:13px;color:#9ba5c9;text-align:center;line-height:1.5;margin-bottom:22px; }
  .mf-modal-btns { display:flex;gap:10px;justify-content:center; }
  .mf-modal-cancel { padding:9px 22px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#9ba5c9;cursor:pointer;font-size:13px;font-weight:500; }
  .mf-modal-ok { padding:9px 22px;border-radius:8px;border:none;background:linear-gradient(135deg,#ff4d6d,#cc3a55);color:#fff;cursor:pointer;font-size:13px;font-weight:600; }
  .mf-modal-ok.cyan { background:linear-gradient(135deg,#00e5cc,#00b8a4);color:#07091a; }
`;

function ConfirmModal({ icon, title, message, confirmLabel="Delete", danger=true, onConfirm, onCancel }) {
  return (
    <div className="mf-modal-backdrop" onClick={onCancel}>
      <div className="mf-modal" onClick={e=>e.stopPropagation()}>
        <div className="mf-modal-icon">{icon}</div>
        <div className="mf-modal-title">{title}</div>
        <div className="mf-modal-msg">{message}</div>
        <div className="mf-modal-btns">
          <button className="mf-modal-cancel" onClick={onCancel}>Cancel</button>
          <button className={`mf-modal-ok ${danger?"":"cyan"}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// Hook to use confirm modal easily
function useConfirm() {
  const [opts, setOpts] = useState(null);
  const confirm = (options) => new Promise(resolve => {
    setOpts({ ...options, resolve });
  });
  const modal = opts ? (
    <ConfirmModal
      icon={opts.icon||"🗑️"}
      title={opts.title||"Are you sure?"}
      message={opts.message||"This action cannot be undone."}
      confirmLabel={opts.confirmLabel||"Delete"}
      danger={opts.danger!==false}
      onConfirm={()=>{ opts.resolve(true); setOpts(null); }}
      onCancel={()=>{ opts.resolve(false); setOpts(null); }}
    />
  ) : null;
  return { confirm, modal };
}


const isAdmin = (profile) => profile?.is_admin === true;

const PRESET_AVATARS = ["🧑","👩","👨","🧔","👩‍💻","👨‍💻","🧑‍🎨","👩‍🎨","🦊","🐯","🐻","🦁","🐸","🐧","🦋","🌟","🔥","💎","🚀","🎯"];

/* ── Avatar component — shows photo, preset emoji, or initial ── */
function Avatar({ profile, size=36, fontSize=15 }) {
  const color = avatarColor(profile?.display_name||"?");
  if (profile?.avatar_url) {
    return <img src={profile.avatar_url} alt="avatar" style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:`2px solid ${color}44`}}/>;
  }
  if (profile?.avatar_emoji) {
    return <div style={{width:size,height:size,borderRadius:"50%",background:color+"22",border:`2px solid ${color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.5,flexShrink:0}}>{profile.avatar_emoji}</div>;
  }
  return <div style={{width:size,height:size,borderRadius:"50%",background:color+"22",border:`2px solid ${color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:fontSize,fontWeight:700,color,flexShrink:0}}>{avatarInitial(profile?.display_name||"?")}</div>;
}

/* ── Profile Page ── */
function ProfilePage({ session, profile, onProfileUpdated }) {
  const [name, setName] = useState(profile?.display_name||"");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [nameMsg, setNameMsg] = useState(null);
  const [passMsg, setPassMsg] = useState(null);
  const [avatarMsg, setAvatarMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  useEffect(()=>{setName(profile?.display_name||"");},[profile]);

  const saveName = async () => {
    if (!name.trim()){setNameMsg({t:"err",m:"Name cannot be empty"});return;}
    setSaving(true);
    await supabase.from("profiles").upsert({id:session.user.id,display_name:name.trim(),email:session.user.email,avatar_url:profile?.avatar_url||null,avatar_emoji:profile?.avatar_emoji||null,is_admin:profile?.is_admin||false});
    await supabase.auth.updateUser({data:{display_name:name.trim()}});
    setSaving(false);
    setNameMsg({t:"ok",m:"Name updated! ✓"});
    onProfileUpdated();
    setTimeout(()=>setNameMsg(null),2500);
  };

  const savePass = async () => {
    if (!newPass||!confirmPass){setPassMsg({t:"err",m:"Fill both fields"});return;}
    if (newPass!==confirmPass){setPassMsg({t:"err",m:"Passwords don't match"});return;}
    if (newPass.length<6){setPassMsg({t:"err",m:"Min 6 characters"});return;}
    setSaving(true);
    const {error}=await supabase.auth.updateUser({password:newPass});
    setSaving(false);
    if (error){setPassMsg({t:"err",m:"Error updating password."});return;}
    setPassMsg({t:"ok",m:"Password updated! ✓"});
    setNewPass(""); setConfirmPass("");
    setTimeout(()=>setPassMsg(null),2500);
  };

  const uploadPhoto = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 2*1024*1024){setAvatarMsg({t:"err",m:"Max file size is 2MB"});return;}
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `avatars/${session.user.id}.${ext}`;
    const {error:upErr} = await supabase.storage.from("avatars").upload(path, file, {upsert:true});
    if (upErr){setAvatarMsg({t:"err",m:"Upload failed. Make sure avatars bucket exists."});setUploading(false);return;}
    const {data} = supabase.storage.from("avatars").getPublicUrl(path);
    const url = data.publicUrl+"?t="+Date.now();
    await supabase.from("profiles").upsert({id:session.user.id,display_name:profile?.display_name||name,email:session.user.email,avatar_url:url,avatar_emoji:null});
    setUploading(false);
    setAvatarMsg({t:"ok",m:"Photo updated! ✓"});
    onProfileUpdated();
    setTimeout(()=>setAvatarMsg(null),2500);
  };

  const pickEmoji = async (emoji) => {
    await supabase.from("profiles").upsert({id:session.user.id,display_name:profile?.display_name||name,email:session.user.email,avatar_url:null,avatar_emoji:emoji});
    setShowPresets(false);
    setAvatarMsg({t:"ok",m:"Avatar updated! ✓"});
    onProfileUpdated();
    setTimeout(()=>setAvatarMsg(null),2500);
  };

  const removeAvatar = async () => {
    await supabase.from("profiles").upsert({id:session.user.id,display_name:profile?.display_name||name,email:session.user.email,avatar_url:null,avatar_emoji:null});
    setAvatarMsg({t:"ok",m:"Avatar removed"});
    onProfileUpdated();
    setTimeout(()=>setAvatarMsg(null),2500);
  };

  return (
    <div>
      <div className="mf-topbar">
        <h2>Profile</h2>
        {isAdmin(profile)&&<span style={{background:"rgba(255,184,48,.15)",color:"#ffb830",padding:"4px 12px",borderRadius:99,fontSize:12,fontWeight:600}}>👑 Admin</span>}
      </div>
      <div className="mf-sec" style={{maxWidth:480}}>
        {/* Avatar section */}
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{position:"relative",display:"inline-block",marginBottom:12}}>
            <Avatar profile={profile} size={80} fontSize={30}/>
            {(profile?.avatar_url||profile?.avatar_emoji)&&(
              <button onClick={removeAvatar} style={{position:"absolute",top:-4,right:-4,width:20,height:20,borderRadius:"50%",background:"#ff4d6d",border:"none",cursor:"pointer",fontSize:11,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            )}
          </div>
          <div style={{fontSize:18,fontWeight:700,marginBottom:2}}>{profile?.display_name||"—"}</div>
          <div style={{fontSize:13,color:"#5a6490",marginBottom:16}}>{session.user.email}</div>

          <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
            <label style={{padding:"8px 16px",borderRadius:8,border:"1px solid rgba(0,229,204,.3)",background:"rgba(0,229,204,.08)",color:"#00e5cc",fontSize:13,cursor:"pointer",fontWeight:500}}>
              {uploading?"Uploading…":"📷 Upload Photo"}
              <input type="file" accept="image/*" onChange={uploadPhoto} style={{display:"none"}} disabled={uploading}/>
            </label>
            <button onClick={()=>setShowPresets(s=>!s)} style={{padding:"8px 16px",borderRadius:8,border:"1px solid rgba(167,139,250,.3)",background:"rgba(167,139,250,.08)",color:"#a78bfa",fontSize:13,cursor:"pointer",fontWeight:500}}>
              😀 Pick Emoji
            </button>
          </div>

          {showPresets&&(
            <div style={{marginTop:14,padding:14,background:"rgba(255,255,255,.04)",borderRadius:12,border:"1px solid rgba(255,255,255,.08)"}}>
              <div style={{fontSize:11,color:"#5a6490",textTransform:"uppercase",letterSpacing:".7px",marginBottom:10}}>Choose an avatar</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
                {PRESET_AVATARS.map(e=>(
                  <button key={e} onClick={()=>pickEmoji(e)} style={{width:40,height:40,borderRadius:8,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.04)",cursor:"pointer",fontSize:22,display:"flex",alignItems:"center",justifyContent:"center",transition:"background .15s"}}>{e}</button>
                ))}
              </div>
            </div>
          )}
          {avatarMsg&&<div className={avatarMsg.t==="ok"?"mf-msg-ok":"mf-msg-err"} style={{marginTop:10}}>{avatarMsg.m}</div>}
        </div>

        <div className="mf-divider"/>
        <div>
          <div className="mf-sec-title">Update Display Name</div>
          <input type="text" className="mf-inp" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" style={{marginBottom:10}}/>
          <button className="mf-btn-p" onClick={saveName} disabled={saving}>Save Name</button>
          {nameMsg&&<div className={nameMsg.t==="ok"?"mf-msg-ok":"mf-msg-err"}>{nameMsg.m}</div>}
        </div>

        <div className="mf-divider"/>
        <div>
          <div className="mf-sec-title">Change Password</div>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:10}}>
            <input type="password" className="mf-inp" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="New password"/>
            <input type="password" className="mf-inp" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} placeholder="Confirm new password"/>
          </div>
          <button className="mf-btn-p" onClick={savePass} disabled={saving}>Update Password</button>
          {passMsg&&<div className={passMsg.t==="ok"?"mf-msg-ok":"mf-msg-err"}>{passMsg.m}</div>}
        </div>
      </div>
    </div>
  );
}

/* ── Feedback Board ── */
const TAG_LABELS = { feature:"✨ Feature", bug:"🐛 Bug", complaint:"😤 Complaint", other:"💬 Other" };

function FeedbackBoard({ session, profile }) {
  const [threads, setThreads] = useState([]);
  const [openThread, setOpenThread] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("feature");
  const [posting, setPosting] = useState(false);
  const [msg, setMsg] = useState(null);
  const { confirm, modal } = useConfirm();
  const admin = isAdmin(profile);

  const loadThreads = useCallback(async () => {
    const {data} = await supabase.from("feedback_threads").select("*").order("created_at",{ascending:false});
    if (data) setThreads(data);
  },[]);

  useEffect(()=>{ loadThreads(); },[loadThreads]);

  const postThread = async () => {
    if (!title.trim()||!body.trim()){setMsg({t:"err",m:"Fill title and description"});return;}
    setPosting(true);
    const {error} = await supabase.from("feedback_threads").insert({
      title:title.trim(), body:body.trim(), tag,
      author_id:session.user.id,
      author_name:profile?.display_name||session.user.email,
    });
    setPosting(false);
    if (error){setMsg({t:"err",m:"Error posting."});return;}
    setTitle(""); setBody(""); setTag("feature"); setShowNew(false);
    loadThreads();
  };

  const deleteThread = async (e, id) => {
    e.stopPropagation();
    const ok = await confirm({ icon:"🗑️", title:"Delete Post", message:"This post and all its comments will be permanently deleted.", confirmLabel:"Delete Post" });
    if (!ok) return;
    await supabase.from("feedback_comments").delete().eq("thread_id",id);
    await supabase.from("feedback_threads").delete().eq("id",id);
    loadThreads();
  };

  if (openThread) return <ThreadDetail thread={openThread} session={session} profile={profile} onBack={()=>{setOpenThread(null);loadThreads();}}/>;

  return (
    <div>
      {modal}
      <div className="mf-topbar">
        <h2>Feedback Board</h2>
        <button className="mf-btn-p" onClick={()=>setShowNew(s=>!s)}>{showNew?"Cancel":"+ New Post"}</button>
      </div>

      {showNew && (
        <div className="mf-sec" style={{maxWidth:600,marginBottom:20}}>
          <div className="mf-sec-title">Create New Thread</div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div className="mf-form-group"><label className="mf-form-label">Title</label><input type="text" className="mf-inp" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Short summary of your post"/></div>
            <div className="mf-form-group"><label className="mf-form-label">Description</label><textarea className="mf-textarea" value={body} onChange={e=>setBody(e.target.value)} placeholder="Describe your feature request, bug, or feedback…"/></div>
            <div className="mf-form-group">
              <label className="mf-form-label">Category</label>
              <select className="mf-inp" style={{cursor:"pointer"}} value={tag} onChange={e=>setTag(e.target.value)}>
                <option value="feature">✨ Feature Request</option>
                <option value="bug">🐛 Bug Report</option>
                <option value="complaint">😤 Complaint</option>
                <option value="other">💬 Other</option>
              </select>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button className="mf-btn-p" onClick={postThread} disabled={posting}>{posting?"Posting…":"Post"}</button>
              <button className="mf-btn-g" onClick={()=>setShowNew(false)}>Cancel</button>
            </div>
            {msg&&<div className={msg.t==="ok"?"mf-msg-ok":"mf-msg-err"}>{msg.m}</div>}
          </div>
        </div>
      )}

      {threads.length===0
        ?<div className="mf-sec" style={{textAlign:"center",color:"#5a6490",padding:"40px 0"}}>No posts yet. Be the first to share feedback!</div>
        :threads.map(t=>(
          <div key={t.id} className="mf-thread-card" onClick={()=>setOpenThread(t)}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <span className={`mf-tag mf-tag-${t.tag}`}>{TAG_LABELS[t.tag]||t.tag}</span>
              {(admin||t.author_id===session.user.id)&&(
                <button className="mf-btn-d" style={{padding:"3px 10px",fontSize:11}} onClick={(e)=>deleteThread(e,t.id)}>🗑 Delete</button>
              )}
            </div>
            <div className="mf-thread-title">{t.title}</div>
            <div className="mf-thread-body">{t.body}</div>
            <div className="mf-thread-meta">
              <span>👤 {t.author_name}{admin&&t.author_id!==session.user.id&&" "}</span>
              <span>🕐 {timeAgo(t.created_at)}</span>
              <span>💬 {t.comment_count||0} comments</span>
              {admin&&<span style={{color:"#ffb830",fontSize:10}}>👑 admin view</span>}
            </div>
          </div>
        ))}
    </div>
  );
}

function ThreadDetail({ thread, session, profile, onBack }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [msg, setMsg] = useState(null);
  const [profiles, setProfiles] = useState({});
  const { confirm, modal } = useConfirm();
  const admin = isAdmin(profile);

  const loadComments = useCallback(async () => {
    const {data} = await supabase.from("feedback_comments").select("*").eq("thread_id",thread.id).order("created_at",{ascending:true});
    if (data) {
      setComments(data);
      // load profiles for avatars
      const ids=[...new Set(data.map(c=>c.author_id))];
      if (ids.length) {
        const {data:profs} = await supabase.from("profiles").select("*").in("id",ids);
        if (profs) { const map={}; profs.forEach(p=>{map[p.id]=p;}); setProfiles(map); }
      }
    }
  },[thread.id]);

  useEffect(()=>{ loadComments(); },[loadComments]);

  const postComment = async () => {
    if (!text.trim()){setMsg({t:"err",m:"Write something first"});return;}
    setPosting(true);
    const {error} = await supabase.from("feedback_comments").insert({
      thread_id:thread.id, body:text.trim(),
      author_id:session.user.id,
      author_name:profile?.display_name||session.user.email,
    });
    if (!error) await supabase.from("feedback_threads").update({comment_count:(thread.comment_count||0)+comments.length+1}).eq("id",thread.id);
    setPosting(false);
    if (error){setMsg({t:"err",m:"Error posting."});return;}
    setText(""); loadComments();
  };

  const deleteComment = async (id) => {
    const ok = await confirm({ icon:"💬", title:"Delete Comment", message:"This comment will be permanently removed.", confirmLabel:"Delete Comment" });
    if (!ok) return;
    await supabase.from("feedback_comments").delete().eq("id",id);
    loadComments();
  };

  // thread author profile for avatar
  const [threadProfile, setThreadProfile] = useState(null);
  useEffect(()=>{
    supabase.from("profiles").select("*").eq("id",thread.author_id).single().then(({data})=>setThreadProfile(data));
  },[thread.author_id]);

  return (
    <div>
      {modal}
      <div className="mf-back-btn" onClick={onBack}>← Back to Board</div>

      <div className="mf-sec" style={{marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <span className={`mf-tag mf-tag-${thread.tag}`}>{TAG_LABELS[thread.tag]||thread.tag}</span>
          {(admin||thread.author_id===session.user.id)&&(
            <button className="mf-btn-d" style={{padding:"3px 10px",fontSize:11}} onClick={async()=>{
              const ok = await confirm({ icon:"🗑️", title:"Delete Post", message:"This post and all its comments will be permanently deleted.", confirmLabel:"Delete Post" });
              if(!ok)return;
              await supabase.from("feedback_comments").delete().eq("thread_id",thread.id);
              await supabase.from("feedback_threads").delete().eq("id",thread.id);
              onBack();
            }}>🗑 Delete Post</button>
          )}
        </div>
        <h3 style={{fontSize:18,fontWeight:700,marginBottom:10,color:"#e8eaf6"}}>{thread.title}</h3>
        <p style={{fontSize:14,color:"#9ba5c9",lineHeight:1.6,marginBottom:14}}>{thread.body}</p>
        <div style={{display:"flex",gap:10,alignItems:"center",fontSize:11,color:"#5a6490"}}>
          <Avatar profile={threadProfile} size={24} fontSize={11}/>
          <span>{thread.author_name}</span>
          <span>·</span>
          <span>{timeAgo(thread.created_at)}</span>
          {admin&&thread.author_id!==session.user.id&&<span style={{color:"#ffb830",fontSize:10,marginLeft:4}}>👑</span>}
        </div>
      </div>

      <div className="mf-sec">
        <div className="mf-sec-title">{comments.length} Comment{comments.length!==1?"s":""}</div>
        {comments.length===0&&<div style={{color:"#5a6490",fontSize:13,padding:"12px 0"}}>No comments yet. Add the first one!</div>}
        {comments.map(c=>(
          <div key={c.id} className="mf-comment">
            <Avatar profile={profiles[c.author_id]} size={34} fontSize={14}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}>
                <span style={{fontSize:13,fontWeight:600,color:"#e8eaf6"}}>{c.author_name}</span>
                <span style={{fontSize:11,color:"#5a6490"}}>{timeAgo(c.created_at)}</span>
                {c.author_id===session.user.id&&<span style={{fontSize:10,color:"#5a6490",background:"rgba(255,255,255,.06)",padding:"1px 6px",borderRadius:4}}>You</span>}
                {admin&&c.author_id!==session.user.id&&<span style={{fontSize:10,color:"#ffb830"}}>👑</span>}
                {(admin||c.author_id===session.user.id)&&(
                  <button className="mf-btn-d" style={{padding:"2px 8px",fontSize:10,marginLeft:"auto"}} onClick={()=>deleteComment(c.id)}>🗑</button>
                )}
              </div>
              <p style={{fontSize:13,color:"#9ba5c9",lineHeight:1.6}}>{c.body}</p>
            </div>
          </div>
        ))}

        <div style={{marginTop:20,paddingTop:16,borderTop:"1px solid rgba(255,255,255,.06)"}}>
          <div className="mf-sec-title">Add a Comment</div>
          <textarea className="mf-textarea" value={text} onChange={e=>setText(e.target.value)} placeholder="Share your thoughts…" style={{marginBottom:10}}/>
          <button className="mf-btn-p" onClick={postComment} disabled={posting}>{posting?"Posting…":"Post Comment"}</button>
          {msg&&<div className={msg.t==="ok"?"mf-msg-ok":"mf-msg-err"}>{msg.m}</div>}
        </div>
      </div>
    </div>
  );
}

/* ══ LEDGER ══ */

const ENTRY_META = {
  given:        { label:"Given",        icon:"💸", bg:"rgba(255,77,109,.12)",  color:"#ff4d8d",  sign:+1 },
  received_back:{ label:"Received Back",icon:"✅", bg:"rgba(0,214,143,.12)",   color:"#00d68f",  sign:-1 },
  borrowed:     { label:"Borrowed",     icon:"🤝", bg:"rgba(0,229,204,.12)",   color:"#00e5cc",  sign:-1 },
  returned:     { label:"Returned",     icon:"↩️", bg:"rgba(167,139,250,.12)", color:"#a78bfa",  sign:+1 },
};

// Net balance per person:
// given → you should get back (+)
// received_back → reduces what they owe (-)
// borrowed → you owe them (+)
// returned → reduces what you owe (-)
function calcNet(entries) {
  return entries.filter(e=>!e.settled).reduce((sum,e)=>{
    if (e.type==="given") return sum + e.amount;
    if (e.type==="received_back") return sum - e.amount;
    if (e.type==="borrowed") return sum - e.amount;
    if (e.type==="returned") return sum + e.amount;
    return sum;
  },0);
}

function LedgerPage({ session }) {
  const [view, setView] = useState("list"); // list | person | add_person | add_entry
  const [people, setPeople] = useState([]);
  const [selPerson, setSelPerson] = useState(null);
  const [entries, setEntries] = useState([]);
  const [lightbox, setLightbox] = useState(null); // kept for list view compatibility
  const [overduePeople, setOverduePeople] = useState([]);
  const { confirm, modal } = useConfirm();

  // Person form
  const [pName, setPName] = useState(""); const [pPhone, setPPhone] = useState("");
  const [pNotes, setPNotes] = useState(""); const [pSaving, setPSaving] = useState(false);
  const [pMsg, setPMsg] = useState(null);

  // Entry form
  const [eType, setEType] = useState("given"); const [eAmount, setEAmount] = useState("");
  const [eNote, setENote] = useState(""); const [eDate, setEDate] = useState(new Date().toISOString().slice(0,10));
  const [eReminder, setEReminder] = useState(""); const [eFile, setEFile] = useState(null);
  const [eUploading, setEUploading] = useState(false); const [eMsg, setEMsg] = useState(null);

  const loadPeople = useCallback(async()=>{
    const {data}=await supabase.from("ledger_people").select("*").eq("user_id",session.user.id).order("name");
    if(data) setPeople(data);
  },[session]);

  const loadEntries = useCallback(async(personId)=>{
    const {data}=await supabase.from("ledger_entries").select("*").eq("person_id",personId).order("date",{ascending:false});
    if(data) setEntries(data);
  },[]);

  useEffect(()=>{ loadPeople(); },[loadPeople]);

  // Browser notification permission
  const requestNotifPermission = async()=>{
    if(!("Notification" in window)) return;
    if(Notification.permission==="default") await Notification.requestPermission();
  };
  useEffect(()=>{ requestNotifPermission(); },[]);

  // Check reminders across all entries
  useEffect(()=>{
    if(!people.length) return;
    const checkReminders = async()=>{
      const today=new Date().toISOString().slice(0,10);
      const {data}=await supabase.from("ledger_entries").select("*,ledger_people(name)")
        .eq("user_id",session.user.id).eq("settled",false).lte("reminder_date",today).not("reminder_date","is",null);
      if(data&&data.length){
        setOverduePeople(data);
        // Browser notification
        if(Notification.permission==="granted"){
          data.forEach(e=>{
            new Notification("Monefy Reminder 💰",{
              body:`${e.type==="given"?"💸":"🤝"} ${e.ledger_people?.name||"Someone"} — ${fmt(e.amount)} is due!`,
              icon:"/favicon.ico"
            });
          });
        }
      }
    };
    checkReminders();
  },[people,session]);

  const savePerson = async()=>{
    if(!pName.trim()){setPMsg({t:"err",m:"Name is required"});return;}
    setPSaving(true);
    const {error}=await supabase.from("ledger_people").insert({user_id:session.user.id,name:pName.trim(),phone:pPhone.trim()||null,notes:pNotes.trim()||null});
    setPSaving(false);
    if(error){setPMsg({t:"err",m:"Error saving."});return;}
    setPMsg({t:"ok",m:"Person added! ✓"});
    setPName(""); setPPhone(""); setPNotes("");
    loadPeople();
    setTimeout(()=>{setPMsg(null);setView("list");},1200);
  };

  const deletePerson = async(id)=>{
    const ok=await confirm({icon:"👤",title:"Remove Person",message:"This will delete all entries for this person too.",confirmLabel:"Remove"});
    if(!ok) return;
    await supabase.from("ledger_entries").delete().eq("person_id",id);
    await supabase.from("ledger_people").delete().eq("id",id);
    loadPeople(); setView("list");
  };

  const openPerson = async(p)=>{
    setSelPerson(p); setView("person"); await loadEntries(p.id);
  };

  const saveEntry = async()=>{
    if(!eAmount||!eDate){setEMsg({t:"err",m:"Amount and date are required"});return;}
    setEUploading(true);
    let attachment_url=null;
    if(eFile){
      const ext=eFile.name.split(".").pop();
      const path=`${session.user.id}/${Date.now()}.${ext}`;
      const {error:upErr}=await supabase.storage.from("ledger-attachments").upload(path,eFile,{upsert:true});
      if(!upErr){const {data}=supabase.storage.from("ledger-attachments").getPublicUrl(path);attachment_url=data.publicUrl;}
    }
    const {error}=await supabase.from("ledger_entries").insert({
      user_id:session.user.id, person_id:selPerson.id,
      type:eType, amount:parseFloat(eAmount), note:eNote.trim()||null,
      date:eDate, reminder_date:eReminder||null, attachment_url, settled:false
    });
    setEUploading(false);
    if(error){setEMsg({t:"err",m:"Error saving."});return;}
    setEMsg({t:"ok",m:"Entry saved! ✓"});
    setEAmount(""); setENote(""); setEReminder(""); setEFile(null);
    loadEntries(selPerson.id);
    setTimeout(()=>{setEMsg(null);setView("person");},1000);
  };

  const deleteEntry = async(id)=>{
    const ok=await confirm({icon:"🗑️",title:"Delete Entry",message:"This entry will be permanently removed.",confirmLabel:"Delete"});
    if(!ok) return;
    await supabase.from("ledger_entries").delete().eq("id",id);
    loadEntries(selPerson.id);
  };

  const CC={
    card:{background:"#0d1130",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,padding:"16px 18px"},
    sec:{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:14,padding:"18px 22px",marginBottom:16},
  };

  // ── Person List view ──
  if(view==="list") return (
    <div>
      {modal}
      {lightbox&&<div className="mf-lightbox" onClick={()=>setLightbox(null)} style={{zIndex:9998}}><img src={lightbox} alt="attachment"/></div>}


      <div className="mf-topbar">
        <h2>Ledger</h2>
        <button className="mf-btn-p" onClick={()=>setView("add_person")}>+ Add Person</button>
      </div>

      {/* Overdue reminders banner */}
      {overduePeople.length>0&&(
        <div style={{background:"rgba(255,184,48,.1)",border:"1px solid rgba(255,184,48,.3)",borderRadius:10,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>⏰</span>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:"#ffb830"}}>Payment Reminders Due</div>
            <div style={{fontSize:12,color:"#9ba5c9",marginTop:2}}>{overduePeople.length} {overduePeople.length===1?"entry":"entries"} past reminder date — check your ledger!</div>
          </div>
        </div>
      )}

      {/* Net worth summary across all people */}
      <NetWorthSummary session={session} people={people}/>

      {people.length===0
        ?<div style={{...CC.card,textAlign:"center",padding:"40px 20px"}}>
          <div style={{fontSize:40,marginBottom:12}}>🤝</div>
          <div style={{fontSize:15,fontWeight:600,color:"#e8eaf6",marginBottom:6}}>No people yet</div>
          <div style={{fontSize:13,color:"#5a6490",marginBottom:20}}>Add friends and family to track money given or received</div>
          <button className="mf-btn-p" onClick={()=>setView("add_person")}>Add First Person</button>
        </div>
        :<div>
          {people.map(p=><PersonCard key={p.id} person={p} session={session} onClick={()=>openPerson(p)} onDelete={()=>deletePerson(p.id)} overdue={overduePeople.some(e=>e.person_id===p.id)}/>)}
        </div>
      }
    </div>
  );

  // ── Add Person view ──
  if(view==="add_person") return (
    <div>
      {modal}
      <div className="mf-back-btn" onClick={()=>setView("list")}>← Back to Ledger</div>
      <div className="mf-topbar"><h2>Add Person</h2></div>
      <div style={{...CC.sec,maxWidth:500}}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div className="mf-form-group"><label className="mf-form-label">Name *</label><input type="text" className="mf-inp" value={pName} onChange={e=>setPName(e.target.value)} placeholder="e.g. Rahul, Papa"/></div>
          <div className="mf-form-group"><label className="mf-form-label">Phone</label><input type="tel" className="mf-inp" value={pPhone} onChange={e=>setPPhone(e.target.value)} placeholder="+91 98765 43210"/></div>
          <div className="mf-form-group"><label className="mf-form-label">Notes</label><textarea className="mf-textarea" value={pNotes} onChange={e=>setPNotes(e.target.value)} placeholder="Any notes about this person…" style={{minHeight:70}}/></div>
        </div>
        <div style={{marginTop:16,display:"flex",gap:10}}>
          <button className="mf-btn-p" onClick={savePerson} disabled={pSaving}>{pSaving?"Saving…":"Save Person"}</button>
          <button className="mf-btn-g" onClick={()=>setView("list")}>Cancel</button>
        </div>
        {pMsg&&<div className={pMsg.t==="ok"?"mf-msg-ok":"mf-msg-err"}>{pMsg.m}</div>}
      </div>
    </div>
  );

  // ── Add Entry view ──
  if(view==="add_entry") return (
    <div>
      {modal}
      <div className="mf-back-btn" onClick={()=>setView("person")}>← Back to {selPerson?.name}</div>
      <div className="mf-topbar"><h2>Add Entry</h2></div>
      <div style={{...CC.sec,maxWidth:520}}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div className="mf-form-group">
            <label className="mf-form-label">Type</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {Object.entries(ENTRY_META).map(([k,v])=>(
                <button key={k} onClick={()=>setEType(k)} style={{padding:"10px 12px",borderRadius:9,border:`1px solid ${eType===k?v.color:"rgba(255,255,255,.1)"}`,background:eType===k?v.bg:"transparent",color:eType===k?v.color:"#9ba5c9",cursor:"pointer",fontSize:13,fontWeight:500,display:"flex",alignItems:"center",gap:6,transition:"all .15s"}}>
                  <span>{v.icon}</span>{v.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mf-form-grid">
            <div className="mf-form-group"><label className="mf-form-label">Amount (₹) *</label><input type="number" className="mf-inp" value={eAmount} onChange={e=>setEAmount(e.target.value)} placeholder="0.00" min="0" step="0.01"/></div>
            <div className="mf-form-group"><label className="mf-form-label">Date *</label><input type="date" className="mf-inp" value={eDate} onChange={e=>setEDate(e.target.value)}/></div>
          </div>
          <div className="mf-form-group"><label className="mf-form-label">Note</label><input type="text" className="mf-inp" value={eNote} onChange={e=>setENote(e.target.value)} placeholder="What is this for?"/></div>

          {/* Reminder date with clear button */}
          <div className="mf-form-group">
            <label className="mf-form-label">Reminder Date <span style={{color:"#5a6490",fontWeight:400}}>(optional)</span></label>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <input type="date" className="mf-inp" value={eReminder} onChange={e=>setEReminder(e.target.value)} style={{flex:1}}/>
              {eReminder&&(
                <button onClick={()=>setEReminder("")} style={{padding:"9px 14px",borderRadius:9,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.06)",color:"#9ba5c9",cursor:"pointer",fontSize:12,flexShrink:0,whiteSpace:"nowrap"}}>✕ Clear</button>
              )}
            </div>
            {eReminder&&<div style={{fontSize:11,color:"#ffb830",marginTop:4}}>⏰ You'll be reminded on {eReminder}</div>}
          </div>

          {/* Attachment */}
          <div className="mf-form-group">
            <label className="mf-form-label">Attachment <span style={{color:"#5a6490",fontWeight:400}}>(screenshot, optional)</span></label>
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              <label style={{padding:"8px 14px",borderRadius:8,border:"1px solid rgba(0,229,204,.3)",background:"rgba(0,229,204,.08)",color:"#00e5cc",fontSize:12,cursor:"pointer",fontWeight:500,flexShrink:0}}>
                📎 Choose File
                <input type="file" accept="image/*,application/pdf" onChange={e=>setEFile(e.target.files[0])} style={{display:"none"}}/>
              </label>
              {eFile
                ?<div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:11,color:"#00d68f"}}>📎 {eFile.name}</span>
                    <button onClick={()=>setEFile(null)} style={{padding:"3px 8px",borderRadius:6,border:"1px solid rgba(255,77,109,.3)",background:"rgba(255,77,109,.1)",color:"#ff4d6d",cursor:"pointer",fontSize:11}}>✕</button>
                  </div>
                :<span style={{fontSize:11,color:"#5a6490"}}>No file chosen</span>
              }
            </div>
          </div>
        </div>
        <div style={{marginTop:16,display:"flex",gap:10,flexWrap:"wrap"}}>
          <button className="mf-btn-p" onClick={saveEntry} disabled={eUploading}>{eUploading?"Uploading…":"Save Entry"}</button>
          <button className="mf-btn-g" onClick={()=>setView("person")}>Cancel</button>
        </div>
        {eMsg&&<div className={eMsg.t==="ok"?"mf-msg-ok":"mf-msg-err"}>{eMsg.m}</div>}
      </div>
    </div>
  );

  // ── Person Detail view ──
  if(view==="person"&&selPerson) {
    const youOweTotal = entries.filter(e=>!e.settled&&(e.type==="borrowed"||e.type==="returned")).reduce((s,e)=>e.type==="borrowed"?s+e.amount:s-e.amount,0);
    const theyOweTotal = entries.filter(e=>!e.settled&&(e.type==="given"||e.type==="received_back")).reduce((s,e)=>e.type==="given"?s+e.amount:s-e.amount,0);
    const activeEntries=entries.filter(e=>!e.settled);
    const settledEntries=entries.filter(e=>e.settled);
    const today=new Date().toISOString().slice(0,10);

    return (
      <div>
        {modal}
        <div className="mf-back-btn" onClick={()=>{setView("list");loadPeople();}}>← Back to Ledger</div>

        {/* Person header */}
        <div style={{...CC.card,marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:48,height:48,borderRadius:"50%",background:"rgba(0,229,204,.12)",border:"1px solid rgba(0,229,204,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:"#00e5cc",flexShrink:0}}>
              {selPerson.name[0].toUpperCase()}
            </div>
            <div>
              <div style={{fontSize:17,fontWeight:700,color:"#e8eaf6"}}>{selPerson.name}</div>
              {selPerson.phone&&<div style={{fontSize:12,color:"#5a6490",marginTop:2}}>📞 {selPerson.phone}</div>}
              {selPerson.notes&&<div style={{fontSize:12,color:"#9ba5c9",marginTop:2}}>{selPerson.notes}</div>}
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="mf-btn-p" onClick={()=>setView("add_entry")}>+ Add Entry</button>
            <button className="mf-btn-d" onClick={()=>deletePerson(selPerson.id)}>Remove</button>
          </div>
        </div>

        {/* Balance summary — 2 cards per person */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          <div style={{background:"#0d1130",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,padding:"14px 16px",textAlign:"center"}}>
            <div style={{fontSize:11,color:"#5a6490",marginBottom:6}}>They Owe You</div>
            <div style={{fontSize:20,fontWeight:700,color:theyOweTotal>0?"#ff4d8d":"#5a6490"}}>{fmt(Math.max(0,theyOweTotal))}</div>
            <div style={{fontSize:11,color:"#5a6490",marginTop:4}}>pending receivable</div>
          </div>
          <div style={{background:"#0d1130",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,padding:"14px 16px",textAlign:"center"}}>
            <div style={{fontSize:11,color:"#5a6490",marginBottom:6}}>You Owe Them</div>
            <div style={{fontSize:20,fontWeight:700,color:youOweTotal>0?"#00e5cc":"#5a6490"}}>{fmt(Math.max(0,youOweTotal))}</div>
            <div style={{fontSize:11,color:"#5a6490",marginTop:4}}>pending payable</div>
          </div>
        </div>

        {/* Active entries */}
        <div style={CC.sec}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div className="mf-sec-title" style={{marginBottom:0}}>Active Entries ({activeEntries.length})</div>
          </div>
          {activeEntries.length===0
            ?<div style={{color:"#5a6490",fontSize:13,padding:"16px 0",textAlign:"center"}}>No active entries. Add one above!</div>
            :activeEntries.map(e=><EntryRow key={e.id} entry={e} onDelete={deleteEntry} today={today}/>)
          }
        </div>

        {/* Settled entries */}
        {settledEntries.length>0&&(
          <div style={CC.sec}>
            <div className="mf-sec-title">Settled History ({settledEntries.length})</div>
            {settledEntries.map(e=><EntryRow key={e.id} entry={e} onDelete={deleteEntry} today={today}/>)}
          </div>
        )}
      </div>
    );
  }
  return null;
}

/* ── NetWorthSummary — shown on ledger list page ── */
function NetWorthSummary({ session, people }) {
  const [totals, setTotals] = useState({owedToMe:0, iOwe:0});
  useEffect(()=>{
    if(!people.length) return;
    supabase.from("ledger_entries").select("type,amount,settled")
      .eq("user_id",session.user.id).eq("settled",false)
      .then(({data})=>{
        if(!data) return;
        let owedToMe=0, iOwe=0;
        data.forEach(e=>{
          if(e.type==="given") owedToMe+=e.amount;
          if(e.type==="received_back") owedToMe-=e.amount;
          if(e.type==="borrowed") iOwe+=e.amount;
          if(e.type==="returned") iOwe-=e.amount;
        });
        setTotals({owedToMe:Math.max(0,owedToMe), iOwe:Math.max(0,iOwe)});
      });
  },[people, session]);

  if(!people.length) return null;
  const net = totals.owedToMe - totals.iOwe;

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
      <div style={{background:"rgba(255,77,141,.08)",border:"1px solid rgba(255,77,141,.2)",borderRadius:12,padding:"14px 16px",textAlign:"center"}}>
        <div style={{fontSize:10,color:"#5a6490",textTransform:"uppercase",letterSpacing:".8px",marginBottom:6}}>Total Owed to You</div>
        <div style={{fontSize:20,fontWeight:700,color:"#ff4d8d"}}>{fmt(totals.owedToMe)}</div>
        <div style={{fontSize:10,color:"#5a6490",marginTop:4}}>across all people</div>
      </div>
      <div style={{background:"rgba(0,229,204,.08)",border:"1px solid rgba(0,229,204,.2)",borderRadius:12,padding:"14px 16px",textAlign:"center"}}>
        <div style={{fontSize:10,color:"#5a6490",textTransform:"uppercase",letterSpacing:".8px",marginBottom:6}}>You Owe Others</div>
        <div style={{fontSize:20,fontWeight:700,color:"#00e5cc"}}>{fmt(totals.iOwe)}</div>
        <div style={{fontSize:10,color:"#5a6490",marginTop:4}}>across all people</div>
      </div>
      <div style={{background:net>0?"rgba(0,214,143,.08)":net<0?"rgba(255,77,109,.08)":"rgba(255,255,255,.04)",border:`1px solid ${net>0?"rgba(0,214,143,.2)":net<0?"rgba(255,77,109,.2)":"rgba(255,255,255,.08)"}`,borderRadius:12,padding:"14px 16px",textAlign:"center"}}>
        <div style={{fontSize:10,color:"#5a6490",textTransform:"uppercase",letterSpacing:".8px",marginBottom:6}}>Net Position</div>
        <div style={{fontSize:20,fontWeight:700,color:net>0?"#00d68f":net<0?"#ff4d6d":"#5a6490"}}>
          {net===0?"Balanced ✓":net>0?`+${fmt(net)}`:`-${fmt(Math.abs(net))}`}
        </div>
        <div style={{fontSize:10,color:net>0?"#00d68f":net<0?"#ff4d6d":"#5a6490",marginTop:4}}>
          {net>0?"in your favour":net<0?"you owe more":"all clear"}
        </div>
      </div>
    </div>
  );
}

/* ── PersonCard — shown in list view ── */
function PersonCard({ person, onClick, onDelete, overdue }) {
  const [net, setNet] = useState(null);
  useEffect(()=>{
    supabase.from("ledger_entries").select("type,amount,settled").eq("person_id",person.id).then(({data})=>{
      if(data) setNet(calcNet(data));
    });
  },[person.id]);

  const color = net===null?"#5a6490":net>0?"#ff4d8d":net<0?"#00e5cc":"#00d68f";
  const label = net===null?"Loading…":net>0?`${fmt(net)} to receive`:net<0?`${fmt(Math.abs(net))} you owe`:"Settled ✓";

  return (
    <div className="mf-person-card" onClick={onClick}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}>
          <div style={{width:40,height:40,borderRadius:"50%",background:"rgba(0,229,204,.1)",border:"1px solid rgba(0,229,204,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"#00e5cc",flexShrink:0}}>
            {person.name[0].toUpperCase()}
          </div>
          <div style={{minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
              <span style={{fontSize:14,fontWeight:600,color:"#e8eaf6"}}>{person.name}</span>
              {overdue&&<span style={{fontSize:10,background:"rgba(255,184,48,.15)",color:"#ffb830",padding:"1px 6px",borderRadius:99}}>⏰ Due</span>}
            </div>
            {person.phone&&<div style={{fontSize:11,color:"#5a6490"}}>📞 {person.phone}</div>}
            {person.notes&&<div style={{fontSize:11,color:"#9ba5c9",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:180}}>{person.notes}</div>}
          </div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:14,fontWeight:700,color}}>{label}</div>
          <div style={{fontSize:10,color:"#5a6490",marginTop:2}}>tap to view →</div>
        </div>
      </div>
    </div>
  );
}

/* ── EntryRow — self-contained lightbox, no parent dependency ── */
function EntryRow({ entry, onDelete, today }) {
  const meta = ENTRY_META[entry.type]||ENTRY_META.given;
  const isOverdue = entry.reminder_date&&entry.reminder_date<=today&&!entry.settled;
  const [lightbox, setLightbox] = useState(false);

  return (
    <>
      {/* Self-contained lightbox */}
      {lightbox&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.9)",zIndex:9999,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,gap:14}} onClick={()=>setLightbox(false)}>
          <img src={entry.attachment_url} alt="attachment" style={{maxWidth:"100%",maxHeight:"75vh",borderRadius:10,boxShadow:"0 8px 40px rgba(0,0,0,.6)"}} onClick={e=>e.stopPropagation()}/>
          <div style={{display:"flex",gap:12}}>
            <button onClick={()=>setLightbox(false)} style={{padding:"8px 24px",borderRadius:8,border:"1px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.08)",color:"#e8eaf6",cursor:"pointer",fontSize:13}}>✕ Close</button>
            <a href={entry.attachment_url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{padding:"8px 24px",borderRadius:8,border:"1px solid rgba(0,229,204,.3)",background:"rgba(0,229,204,.08)",color:"#00e5cc",cursor:"pointer",fontSize:13,textDecoration:"none",display:"inline-flex",alignItems:"center"}}>🔗 Open Original</a>
          </div>
        </div>
      )}

      <div className="mf-entry-row">
        <div className="mf-entry-icon" style={{background:meta.bg,marginTop:2}}>
          <span>{meta.icon}</span>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:3}}>
            <span style={{fontSize:12,fontWeight:600,color:meta.color}}>{meta.label}</span>
            <span style={{fontSize:15,fontWeight:700,color:"#e8eaf6"}}>{fmt(entry.amount)}</span>
            {entry.settled&&<span style={{fontSize:10,background:"rgba(0,214,143,.12)",color:"#00d68f",padding:"2px 7px",borderRadius:99,fontWeight:600}}>✓ Settled</span>}
          </div>
          {entry.note&&<div style={{fontSize:12,color:"#9ba5c9",marginBottom:3}}>{entry.note}</div>}
          <div style={{fontSize:11,color:"#5a6490"}}>📅 {entry.date}</div>
          {entry.reminder_date&&(
            <div style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,padding:"2px 7px",borderRadius:99,background:isOverdue?"rgba(255,77,109,.12)":"rgba(255,184,48,.12)",color:isOverdue?"#ff4d6d":"#ffb830",marginTop:4}}>
              ⏰ Reminder: {entry.reminder_date}{isOverdue&&<strong> — OVERDUE</strong>}
            </div>
          )}
          {/* Attachment thumbnail + view button */}
          {entry.attachment_url&&(
            <div style={{marginTop:8,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <img
                src={entry.attachment_url}
                alt="attachment preview"
                style={{width:48,height:48,borderRadius:7,objectFit:"cover",border:"1px solid rgba(255,255,255,.12)",cursor:"pointer",flexShrink:0,transition:"opacity .15s"}}
                onClick={()=>setLightbox(true)}
              />
              <button
                onClick={()=>setLightbox(true)}
                style={{padding:"5px 12px",borderRadius:7,border:"1px solid rgba(0,229,204,.3)",background:"rgba(0,229,204,.08)",color:"#00e5cc",cursor:"pointer",fontSize:11,fontWeight:600,display:"flex",alignItems:"center",gap:4}}
              >🔍 View Attachment</button>
            </div>
          )}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end",flexShrink:0,paddingLeft:8}}>
          <button className="mf-btn-d" style={{fontSize:11,padding:"4px 10px"}} onClick={()=>onDelete(entry.id)}>🗑 Delete</button>
        </div>
      </div>
    </>
  );
}

/* ══ INVESTMENTS ══ */

const INV_TYPES = {
  fd:        { label:"Fixed Deposit",   icon:"🏦", color:"#00e5cc" },
  rd:        { label:"Recurring Deposit",icon:"📅", color:"#60a5fa" },
  ppf:       { label:"PPF",             icon:"🏛️", color:"#a78bfa" },
  mutualfund:{ label:"Mutual Fund",     icon:"📈", color:"#00d68f" },
  stocks:    { label:"Stocks",          icon:"📊", color:"#ffb830" },
  committee: { label:"Committee",       icon:"🤝", color:"#ff4d8d" },
};

function InvestmentsPage({ session }) {
  const [investments, setInvestments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selInv, setSelInv] = useState(null);
  const [addingType, setAddingType] = useState(null);
  const [addingTxn, setAddingTxn] = useState(false);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const { confirm, modal } = useConfirm();

  // Investment form fields
  const [fName, setFName] = useState("");
  const [fAmount, setFAmount] = useState("");
  const [fStartDate, setFStartDate] = useState("");
  const [fMatDate, setFMatDate] = useState("");
  const [fMatAmount, setFMatAmount] = useState("");
  const [fNotes, setFNotes] = useState("");
  const [fCurrentValue, setFCurrentValue] = useState("");
  const [fFundName, setFFundName] = useState("");

  // Transaction form
  const [tDate, setTDate] = useState(new Date().toISOString().slice(0,10));
  const [tAmount, setTAmount] = useState("");
  const [tNote, setTNote] = useState("");
  const [tRecurring, setTRecurring] = useState(false);
  const [tWithdrawal, setTWithdrawal] = useState(false);
  const [tMsg, setTMsg] = useState(null);
  const [editingVal, setEditingVal] = useState(false);
  const [newVal, setNewVal] = useState("");

  const load = useCallback(async()=>{
    const {data:inv} = await supabase.from("investments").select("*").eq("user_id",session.user.id).order("created_at",{ascending:false});
    const {data:txn} = await supabase.from("investment_txns").select("*").eq("user_id",session.user.id).order("date",{ascending:false});
    if(inv) setInvestments(inv);
    if(txn) setTransactions(txn);
  },[session]);

  useEffect(()=>{ load(); },[load]);

  const loadTxns = useCallback(async(invId)=>{
    const {data} = await supabase.from("investment_txns").select("*").eq("investment_id",invId).order("date",{ascending:false});
    if(data) setTransactions(data);
  },[]);

  const resetForm = ()=>{ setFName("");setFAmount("");setFStartDate("");setFMatDate("");setFMatAmount("");setFNotes("");setFCurrentValue("");setFFundName(""); };

  const saveInvestment = async()=>{
    if(!fName.trim()||!fStartDate){setMsg({t:"err",m:"Name and start date are required"});return;}
    setSaving(true);
    const payload = {
      user_id:session.user.id, type:addingType, name:fName.trim(),
      amount:parseFloat(fAmount)||0, start_date:fStartDate,
      maturity_date:fMatDate||null, maturity_amount:parseFloat(fMatAmount)||0,
      current_value:parseFloat(fCurrentValue)||parseFloat(fAmount)||0,
      fund_name:fFundName.trim()||null, notes:fNotes.trim()||null,
      status:"active",
    };
    const {error} = await supabase.from("investments").insert(payload);
    setSaving(false);
    if(error){setMsg({t:"err",m:"Error saving."});return;}
    setMsg({t:"ok",m:"Investment added! ✓"});
    resetForm(); setAddingType(null);
    load();
    setTimeout(()=>setMsg(null),1500);
  };

  const updateCurrentValue = async(id, val)=>{
    await supabase.from("investments").update({current_value:parseFloat(val)||0}).eq("id",id);
    load();
  };

  const markWithdrawn = async(inv)=>{
    const ok = await confirm({icon:"✅",title:"Mark as Withdrawn",message:`Mark "${inv.name}" as withdrawn? It will no longer count in active portfolio.`,confirmLabel:"Withdraw",danger:false});
    if(!ok) return;
    await supabase.from("investments").update({status:"withdrawn"}).eq("id",inv.id);
    load();
  };

  const deleteInvestment = async(id)=>{
    const ok = await confirm({icon:"🗑️",title:"Delete Investment",message:"This will delete the investment and all its transaction records.",confirmLabel:"Delete"});
    if(!ok) return;
    await supabase.from("investment_txns").delete().eq("investment_id",id);
    await supabase.from("investments").delete().eq("id",id);
    setSelInv(null); load();
  };

  const saveTxn = async()=>{
    if(!tAmount||!tDate){setTMsg({t:"err",m:"Amount and date required"});return;}
    setSaving(true);
    const {error} = await supabase.from("investment_txns").insert({
      user_id:session.user.id, investment_id:selInv.id,
      date:tDate, amount:parseFloat(tAmount), note:tNote.trim()||null,
      recurring:tRecurring, is_withdrawal:tWithdrawal,
    });
    setSaving(false);
    if(error){setTMsg({t:"err",m:"Error saving."});return;}
    setTMsg({t:"ok",m:"Transaction added! ✓"});
    setTAmount(""); setTNote(""); setTWithdrawal(false);
    loadTxns(selInv.id); load();
    setTimeout(()=>{setTMsg(null);setAddingTxn(false);},1200);
  };

  const deleteTxn = async(id)=>{
    const ok = await confirm({icon:"🗑️",title:"Delete Transaction",message:"Remove this transaction record?",confirmLabel:"Delete"});
    if(!ok) return;
    await supabase.from("investment_txns").delete().eq("id",id);
    loadTxns(selInv.id); load();
  };

  // ── Computed totals ──
  const active = investments.filter(i=>i.status==="active");
  const withdrawn = investments.filter(i=>i.status==="withdrawn");
  const totalInvested = active.reduce((s,i)=>s+i.amount,0);
  const totalCurrentValue = active.reduce((s,i)=>s+i.current_value,0);
  const totalGain = totalCurrentValue - totalInvested;

  const CARD = {background:"#0d1130",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,padding:"14px 16px"};
  const SEC  = {background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:14,padding:"18px 22px",marginBottom:14};

  // ── Add Investment Form ──
  if(addingType) {
    const meta = INV_TYPES[addingType];
    return (
      <div>
        {modal}
        <div className="mf-back-btn" onClick={()=>{setAddingType(null);resetForm();}}>← Back</div>
        <div className="mf-topbar"><h2>Add {meta.label}</h2></div>
        <div style={{...SEC,maxWidth:540}}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div className="mf-form-group"><label className="mf-form-label">Name / Label *</label><input type="text" className="mf-inp" value={fName} onChange={e=>setFName(e.target.value)} placeholder={`e.g. SBI FD 2026, ${meta.label}`}/></div>
            {addingType==="mutualfund"&&<div className="mf-form-group"><label className="mf-form-label">Fund Name</label><input type="text" className="mf-inp" value={fFundName} onChange={e=>setFFundName(e.target.value)} placeholder="e.g. PARAG PARIKH FLEXI CAP FUND"/></div>}
            <div className="mf-form-grid">
              <div className="mf-form-group"><label className="mf-form-label">Invested Amount (₹)</label><input type="number" className="mf-inp" value={fAmount} onChange={e=>setFAmount(e.target.value)} placeholder="0"/></div>
              {(addingType==="mutualfund"||addingType==="stocks")&&<div className="mf-form-group"><label className="mf-form-label">Current Value (₹)</label><input type="number" className="mf-inp" value={fCurrentValue} onChange={e=>setFCurrentValue(e.target.value)} placeholder="0"/></div>}
              {(addingType==="fd"||addingType==="rd")&&<div className="mf-form-group"><label className="mf-form-label">Maturity Amount (₹)</label><input type="number" className="mf-inp" value={fMatAmount} onChange={e=>setFMatAmount(e.target.value)} placeholder="0"/></div>}
            </div>
            <div className="mf-form-grid">
              <div className="mf-form-group"><label className="mf-form-label">Start Date *</label><input type="date" className="mf-inp" value={fStartDate} onChange={e=>setFStartDate(e.target.value)}/></div>
              {addingType!=="stocks"&&addingType!=="mutualfund"&&<div className="mf-form-group"><label className="mf-form-label">Maturity / End Date</label><input type="date" className="mf-inp" value={fMatDate} onChange={e=>setFMatDate(e.target.value)}/></div>}
            </div>
            <div className="mf-form-group"><label className="mf-form-label">Notes</label><textarea className="mf-textarea" value={fNotes} onChange={e=>setFNotes(e.target.value)} placeholder="Any notes…" style={{minHeight:60}}/></div>
          </div>
          <div style={{marginTop:16,display:"flex",gap:10}}>
            <button className="mf-btn-p" onClick={saveInvestment} disabled={saving}>{saving?"Saving…":"Save"}</button>
            <button className="mf-btn-g" onClick={()=>{setAddingType(null);resetForm();}}>Cancel</button>
          </div>
          {msg&&<div className={msg.t==="ok"?"mf-msg-ok":"mf-msg-err"}>{msg.m}</div>}
        </div>
      </div>
    );
  }

  // ── Individual Investment Detail ──
  if(selInv) {
    const meta = INV_TYPES[selInv.type]||INV_TYPES.fd;
    const invTxns = transactions.filter(t=>t.investment_id===selInv.id);
    const totalContrib = invTxns.filter(t=>!t.is_withdrawal).reduce((s,t)=>s+t.amount,0);
    const totalWithdrawn = invTxns.filter(t=>t.is_withdrawal).reduce((s,t)=>s+t.amount,0);

    return (
      <div>
        {modal}
        <div className="mf-back-btn" onClick={()=>{setSelInv(null);setAddingTxn(false);load();}}>← Back to Investments</div>

        {/* Header */}
        <div style={{...CARD,marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,borderRadius:10,background:meta.color+"22",border:`1px solid ${meta.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{meta.icon}</div>
            <div>
              <div style={{fontSize:16,fontWeight:700,color:"#e8eaf6"}}>{selInv.name}</div>
              <div style={{fontSize:12,color:meta.color,fontWeight:500}}>{meta.label}{selInv.fund_name&&` · ${selInv.fund_name}`}</div>
              {selInv.status==="withdrawn"&&<span style={{fontSize:10,background:"rgba(255,255,255,.07)",color:"#5a6490",padding:"1px 6px",borderRadius:99}}>Withdrawn</span>}
            </div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {selInv.status==="active"&&<button className="mf-btn-p" onClick={()=>setAddingTxn(t=>!t)}>+ Add Entry</button>}
            {selInv.status==="active"&&<button onClick={()=>markWithdrawn(selInv)} style={{padding:"8px 14px",borderRadius:9,border:"1px solid rgba(0,214,143,.3)",background:"rgba(0,214,143,.08)",color:"#00d68f",cursor:"pointer",fontSize:13,fontWeight:500}}>✓ Withdrawn</button>}
            <button className="mf-btn-d" onClick={()=>deleteInvestment(selInv.id)}>🗑 Delete</button>
          </div>
        </div>

        {/* Summary cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:14}}>
          <div style={{...CARD,textAlign:"center"}}>
            <div style={{fontSize:10,color:"#5a6490",marginBottom:5}}>Invested</div>
            <div style={{fontSize:18,fontWeight:700,color:"#e8eaf6"}}>{fmt(selInv.amount)}</div>
          </div>
          {(selInv.type==="mutualfund"||selInv.type==="stocks")&&(
            <div style={{...CARD,textAlign:"center"}}>
              <div style={{fontSize:10,color:"#5a6490",marginBottom:5}}>Current Value</div>
              {editingVal
                ?<div style={{display:"flex",gap:6,alignItems:"center",justifyContent:"center"}}>
                  <input type="number" className="mf-inp" value={newVal} onChange={e=>setNewVal(e.target.value)} style={{width:100,padding:"4px 8px",fontSize:13}}/>
                  <button className="mf-btn-sm" onClick={async()=>{await updateCurrentValue(selInv.id,newVal);setSelInv(p=>({...p,current_value:parseFloat(newVal)||0}));setEditingVal(false);}}>✓</button>
                </div>
                :<div>
                  <div style={{fontSize:18,fontWeight:700,color:selInv.current_value>=selInv.amount?"#00d68f":"#ff4d8d"}}>{fmt(selInv.current_value)}</div>
                  <button onClick={()=>setEditingVal(true)} style={{fontSize:10,color:"#00e5cc",background:"none",border:"none",cursor:"pointer",marginTop:3}}>✏️ Update</button>
                </div>
              }
            </div>
          )}
          {selInv.maturity_amount>0&&<div style={{...CARD,textAlign:"center"}}>
            <div style={{fontSize:10,color:"#5a6490",marginBottom:5}}>Maturity Amount</div>
            <div style={{fontSize:18,fontWeight:700,color:"#00e5cc"}}>{fmt(selInv.maturity_amount)}</div>
          </div>}
          {(selInv.type==="mutualfund"||selInv.type==="stocks")&&selInv.current_value>0&&<div style={{...CARD,textAlign:"center"}}>
            <div style={{fontSize:10,color:"#5a6490",marginBottom:5}}>Gain / Loss</div>
            <div style={{fontSize:18,fontWeight:700,color:selInv.current_value-selInv.amount>=0?"#00d68f":"#ff4d6d"}}>
              {selInv.current_value-selInv.amount>=0?"+":""}{fmt(selInv.current_value-selInv.amount)}
            </div>
          </div>}
          {selInv.start_date&&<div style={{...CARD,textAlign:"center"}}>
            <div style={{fontSize:10,color:"#5a6490",marginBottom:5}}>Start Date</div>
            <div style={{fontSize:13,fontWeight:600,color:"#e8eaf6"}}>{selInv.start_date}</div>
          </div>}
          {selInv.maturity_date&&<div style={{...CARD,textAlign:"center"}}>
            <div style={{fontSize:10,color:"#5a6490",marginBottom:5}}>Maturity Date</div>
            <div style={{fontSize:13,fontWeight:600,color:"#ffb830"}}>{selInv.maturity_date}</div>
          </div>}
        </div>

        {/* Add transaction inline */}
        {addingTxn&&(
          <div style={{...SEC}}>
            <div style={{fontSize:11,fontWeight:600,color:"#5a6490",textTransform:"uppercase",letterSpacing:".8px",marginBottom:12}}>Add Transaction</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div className="mf-form-grid">
                <div className="mf-form-group"><label className="mf-form-label">Date</label><input type="date" className="mf-inp" value={tDate} onChange={e=>setTDate(e.target.value)}/></div>
                <div className="mf-form-group"><label className="mf-form-label">Amount (₹)</label><input type="number" className="mf-inp" value={tAmount} onChange={e=>setTAmount(e.target.value)} placeholder="0"/></div>
              </div>
              <div className="mf-form-group"><label className="mf-form-label">Note</label><input type="text" className="mf-inp" value={tNote} onChange={e=>setTNote(e.target.value)} placeholder="Monthly SIP, Bonus investment…"/></div>
              <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
                <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#9ba5c9",cursor:"pointer"}}>
                  <input type="checkbox" checked={tRecurring} onChange={e=>setTRecurring(e.target.checked)}/> Recurring
                </label>
                <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#ff4d8d",cursor:"pointer"}}>
                  <input type="checkbox" checked={tWithdrawal} onChange={e=>setTWithdrawal(e.target.checked)}/> Withdrawal
                </label>
              </div>
            </div>
            <div style={{marginTop:12,display:"flex",gap:8}}>
              <button className="mf-btn-p" onClick={saveTxn} disabled={saving}>{saving?"Saving…":"Save"}</button>
              <button className="mf-btn-g" onClick={()=>setAddingTxn(false)}>Cancel</button>
            </div>
            {tMsg&&<div className={tMsg.t==="ok"?"mf-msg-ok":"mf-msg-err"}>{tMsg.m}</div>}
          </div>
        )}

        {/* Transaction history */}
        <div style={SEC}>
          <div style={{fontSize:11,fontWeight:600,color:"#5a6490",textTransform:"uppercase",letterSpacing:".8px",marginBottom:14}}>
            Transaction History ({invTxns.length}) · Contrib: {fmt(totalContrib)} · Withdrawn: {fmt(totalWithdrawn)}
          </div>
          {invTxns.length===0
            ?<div style={{color:"#5a6490",fontSize:13,padding:"16px 0",textAlign:"center"}}>No transactions yet</div>
            :invTxns.map(t=>(
              <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid rgba(255,255,255,.05)"}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:13,fontWeight:600,color:t.is_withdrawal?"#ff4d8d":"#00d68f"}}>{t.is_withdrawal?"↩ Withdrawal":"↓ Contribution"}</span>
                    <span style={{fontSize:14,fontWeight:700,color:"#e8eaf6"}}>{fmt(t.amount)}</span>
                    {t.recurring&&<span style={{fontSize:10,background:"rgba(96,165,250,.12)",color:"#60a5fa",padding:"1px 6px",borderRadius:99}}>🔄 Recurring</span>}
                  </div>
                  <div style={{fontSize:11,color:"#5a6490",marginTop:2}}>📅 {t.date}{t.note&&` · ${t.note}`}</div>
                </div>
                <button className="mf-btn-d" style={{fontSize:11,padding:"3px 8px"}} onClick={()=>deleteTxn(t.id)}>🗑</button>
              </div>
            ))
          }
        </div>

        {selInv.notes&&<div style={SEC}>
          <div style={{fontSize:11,fontWeight:600,color:"#5a6490",textTransform:"uppercase",letterSpacing:".8px",marginBottom:8}}>Notes</div>
          <div style={{fontSize:13,color:"#9ba5c9",lineHeight:1.6}}>{selInv.notes}</div>
        </div>}
      </div>
    );
  }

  // ── Overview / List ──
  return (
    <div>
      {modal}
      <div className="mf-topbar">
        <h2>Investments</h2>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {Object.entries(INV_TYPES).map(([k,v])=>(
            <button key={k} onClick={()=>setAddingType(k)} style={{padding:"7px 12px",borderRadius:8,border:`1px solid ${v.color}44`,background:`${v.color}11`,color:v.color,cursor:"pointer",fontSize:12,fontWeight:500,display:"flex",alignItems:"center",gap:4}}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Portfolio summary */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:18}}>
        <div style={{...CARD,background:"rgba(0,229,204,.06)",border:"1px solid rgba(0,229,204,.2)"}}>
          <div style={{fontSize:10,color:"#5a6490",textTransform:"uppercase",letterSpacing:".8px",marginBottom:6}}>Total Invested</div>
          <div style={{fontSize:20,fontWeight:700,color:"#00e5cc"}}>{fmt(totalInvested)}</div>
          <div style={{fontSize:10,color:"#5a6490",marginTop:4}}>{active.length} active investments</div>
        </div>
        <div style={{...CARD,background:"rgba(0,214,143,.06)",border:"1px solid rgba(0,214,143,.2)"}}>
          <div style={{fontSize:10,color:"#5a6490",textTransform:"uppercase",letterSpacing:".8px",marginBottom:6}}>Current Value</div>
          <div style={{fontSize:20,fontWeight:700,color:"#00d68f"}}>{fmt(totalCurrentValue)}</div>
          <div style={{fontSize:10,color:"#5a6490",marginTop:4}}>portfolio value</div>
        </div>
        <div style={{...CARD,background:totalGain>=0?"rgba(0,214,143,.06)":"rgba(255,77,109,.06)",border:`1px solid ${totalGain>=0?"rgba(0,214,143,.2)":"rgba(255,77,109,.2)"}`}}>
          <div style={{fontSize:10,color:"#5a6490",textTransform:"uppercase",letterSpacing:".8px",marginBottom:6}}>Total Gain / Loss</div>
          <div style={{fontSize:20,fontWeight:700,color:totalGain>=0?"#00d68f":"#ff4d6d"}}>{totalGain>=0?"+":""}{fmt(totalGain)}</div>
          <div style={{fontSize:10,color:totalGain>=0?"#00d68f":"#ff4d6d",marginTop:4}}>{totalInvested>0?Math.round((totalGain/totalInvested)*100):0}% returns</div>
        </div>
        {withdrawn.length>0&&<div style={{...CARD}}>
          <div style={{fontSize:10,color:"#5a6490",textTransform:"uppercase",letterSpacing:".8px",marginBottom:6}}>Withdrawn</div>
          <div style={{fontSize:20,fontWeight:700,color:"#5a6490"}}>{withdrawn.length}</div>
          <div style={{fontSize:10,color:"#5a6490",marginTop:4}}>completed</div>
        </div>}
      </div>

      {/* By type */}
      {Object.entries(INV_TYPES).map(([type,meta])=>{
        const list = investments.filter(i=>i.type===type);
        if(!list.length) return null;
        return (
          <div key={type} style={{...SEC}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <span style={{fontSize:16}}>{meta.icon}</span>
              <span style={{fontSize:11,fontWeight:600,color:meta.color,textTransform:"uppercase",letterSpacing:".8px"}}>{meta.label}</span>
              <span style={{fontSize:11,color:"#5a6490",marginLeft:"auto"}}>{list.filter(i=>i.status==="active").length} active</span>
            </div>
            {list.map(inv=>{
              const gain = inv.current_value - inv.amount;
              const isWithdrawn = inv.status==="withdrawn";
              return (
                <div key={inv.id} onClick={()=>{setSelInv(inv);loadTxns(inv.id);setEditingVal(false);setNewVal(String(inv.current_value||0));}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 0",borderBottom:"1px solid rgba(255,255,255,.05)",cursor:"pointer",opacity:isWithdrawn?.6:1}}>
                  <div style={{minWidth:0,flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <span style={{fontSize:13,fontWeight:600,color:"#e8eaf6"}}>{inv.name}</span>
                      {inv.fund_name&&<span style={{fontSize:11,color:"#5a6490",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:160}}>{inv.fund_name}</span>}
                      {isWithdrawn&&<span style={{fontSize:10,background:"rgba(255,255,255,.06)",color:"#5a6490",padding:"1px 5px",borderRadius:99}}>Withdrawn</span>}
                    </div>
                    <div style={{fontSize:11,color:"#5a6490",marginTop:2}}>
                      Started {inv.start_date}{inv.maturity_date&&` · Matures ${inv.maturity_date}`}
                    </div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#e8eaf6"}}>{fmt(inv.amount)}</div>
                    {(type==="mutualfund"||type==="stocks")&&inv.current_value>0&&(
                      <div style={{fontSize:11,color:gain>=0?"#00d68f":"#ff4d6d",marginTop:1}}>{gain>=0?"+":""}{fmt(gain)}</div>
                    )}
                    {inv.maturity_amount>0&&<div style={{fontSize:11,color:"#00e5cc",marginTop:1}}>→ {fmt(inv.maturity_amount)}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {investments.length===0&&(
        <div style={{...CARD,textAlign:"center",padding:"48px 20px"}}>
          <div style={{fontSize:40,marginBottom:12}}>📈</div>
          <div style={{fontSize:15,fontWeight:600,color:"#e8eaf6",marginBottom:6}}>No investments yet</div>
          <div style={{fontSize:13,color:"#5a6490"}}>Track your FDs, mutual funds, stocks, PPF and more</div>
        </div>
      )}
    </div>
  );
}

/* ══ ROOT APP ══ */
export default function App() {
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [budget, setBudget] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [selYear, setSelYear] = useState(now.getFullYear());

  useEffect(()=>{
    const el=document.createElement("style"); el.textContent=CSS+CONFIRM_CSS; document.head.appendChild(el);
    return ()=>document.head.removeChild(el);
  },[]);

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>setSession(data.session??null));
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,s)=>setSession(s));
    return ()=>subscription.unsubscribe();
  },[]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{ if(session){loadBudget();loadTransactions();loadProfile();} },[session]);

  const loadProfile = useCallback(async()=>{
    if (!session) return;
    const {data}=await supabase.from("profiles").select("*").eq("id",session.user.id).single();
    if (data) setProfile(data);
    else {
      // auto-create profile from auth metadata
      const name = session.user.user_metadata?.display_name||session.user.email.split("@")[0];
      await supabase.from("profiles").upsert({id:session.user.id,display_name:name,email:session.user.email});
      setProfile({display_name:name,email:session.user.email});
    }
  },[session]);

  const loadBudget = useCallback(async()=>{
    const {data}=await supabase.from("budget").select("*").order("category");
    if (data){const obj={};data.forEach(r=>{obj[r.category]=r.amount;});setBudget(obj);}
  },[]);

  const loadTransactions = useCallback(async()=>{
    const {data}=await supabase.from("transactions").select("*").order("date",{ascending:false});
    if (data) setTransactions(data);
  },[]);

  const signOut = async()=>{await supabase.auth.signOut();setSession(null);setProfile(null);setBudget({});setTransactions([]);};
  const navigate = (p)=>{setPage(p);setSidebarOpen(false);};

  if (session===undefined) return <Loader/>;
  if (session===null) return <AuthScreen onLogin={setSession}/>;

  const NAV = [
    {id:"dashboard",   icon:"📊", label:"Dashboard"},
    {id:"add",         icon:"➕", label:"Add"},
    {id:"transactions",icon:"📋", label:"Transactions"},
    {id:"budget",      icon:"🎯", label:"Budget"},
    {id:"investments", icon:"📈", label:"Invest"},
    {id:"ledger",      icon:"🤝", label:"Ledger"},
    {id:"feedback",    icon:"💬", label:"Feedback"},
    {id:"profile",     icon:"👤", label:"Profile"},
  ];

  return (
    <div className="mf-app">
      <div className={`mf-overlay ${sidebarOpen?"open":""}`} onClick={()=>setSidebarOpen(false)}/>
      <button className="mf-hamburger" onClick={()=>setSidebarOpen(s=>!s)}>☰</button>

      <nav className={`mf-sidebar ${sidebarOpen?"open":""}`}>
        <div className="mf-logo-wrap">
          <div><span className="mf-logo">Monefy</span><span style={{marginLeft:6,fontSize:20}}>💰</span></div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10}}>
            <Avatar profile={profile} size={28} fontSize={12}/>
            <div style={{minWidth:0}}>
              <div className="mf-logo-sub" style={{color:"#e8eaf6",fontSize:12}}>{profile?.display_name||session.user.email}</div>
              {isAdmin(profile)&&<div style={{fontSize:10,color:"#ffb830"}}>👑 Admin</div>}
            </div>
          </div>
        </div>
        <div className="mf-nav">
          {NAV.map(n=>(
            <div key={n.id} className={`mf-nav-item ${page===n.id?"active":""}`} onClick={()=>navigate(n.id)}>
              <span className="mf-nav-icon">{n.icon}</span> {n.label}
            </div>
          ))}
        </div>
        <div className="mf-signout" onClick={signOut}>🚪 Sign Out</div>
      </nav>

      <main className="mf-main">
        {page==="dashboard"    && <Dashboard budget={budget} transactions={transactions} selMonth={selMonth} setSelMonth={setSelMonth} selYear={selYear} setSelYear={setSelYear}/>}
        {page==="add"          && <AddExpense budget={budget} onSaved={loadTransactions}/>}
        {page==="transactions" && <Transactions transactions={transactions} onDeleted={loadTransactions}/>}
        {page==="budget"       && <BudgetPage budget={budget} onSaved={loadBudget}/>}
        {page==="investments"  && <InvestmentsPage session={session}/>}
        {page==="ledger"       && <LedgerPage session={session}/>}
        {page==="feedback"     && <FeedbackBoard session={session} profile={profile}/>}
        {page==="profile"      && <ProfilePage session={session} profile={profile} onProfileUpdated={loadProfile}/>}
      </main>

      <div className="mf-bottom-nav">
        <div className="mf-bottom-nav-inner">
          {NAV.map(n=>(
            <div key={n.id} className={`mf-bottom-item ${page===n.id?"active":""}`} onClick={()=>navigate(n.id)}>
              <span className="mf-bottom-icon">{n.icon}</span>{n.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
