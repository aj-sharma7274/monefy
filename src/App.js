import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://lwbhllwznsqniwtbrhqc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3YmhsbHd6bnNxbml3dGJyaHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MjI2MTUsImV4cCI6MjA5NDQ5ODYxNX0._DCPCFvwh4E-qSFCg4pLUmm17ORtFcyO80uM_tl5YaM";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const PIE_COLORS = ["#00e5cc","#ff4d8d","#ffb830","#00d68f","#a78bfa","#60a5fa","#f97316","#34d399","#fb7185","#818cf8","#fbbf24","#4ade80"];
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

  @media (max-width: 768px) {
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

/* ── SVG Charts ── */
function BarChart({ labels, datasets, height = 260 }) {
  const maxVal = Math.max(...datasets.flatMap(d => d.data), 1);
  const barW = Math.max(6, Math.min(22, Math.floor(480 / labels.length / datasets.length - 3)));
  const groupW = barW * datasets.length + 4;
  const [pL, pB, pT, pR] = [68, 50, 16, 16];
  const W = Math.max(480, labels.length * (groupW + 8) + pL + pR);
  const cH = height - pT - pB;
  return (
    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      <svg viewBox={`0 0 ${W} ${height}`} width="100%" style={{ height, minWidth: 300 }}>
        {[0,.25,.5,.75,1].map((f,i) => {
          const v = Math.round(maxVal*f), y = pT+cH-f*cH;
          return <g key={i}>
            <line x1={pL} x2={W-pR} y1={y} y2={y} stroke="rgba(255,255,255,.05)" strokeWidth={0.5}/>
            <text x={pL-5} y={y+4} textAnchor="end" fontSize={9} fill="#5a6490">₹{v>=1000?Math.round(v/1000)+"k":v}</text>
          </g>;
        })}
        {labels.map((lbl,li) => {
          const gx = pL+li*(groupW+8);
          return <g key={li}>
            {datasets.map((ds,di) => {
              const val=ds.data[li]||0, bh=Math.max(2,(val/maxVal)*cH);
              return <rect key={di} x={gx+di*(barW+2)} y={pT+cH-bh} width={barW} height={bh} rx={2} fill={ds.colors?ds.colors[li]:ds.color} opacity={0.85}/>;
            })}
            <text x={gx+groupW/2} y={height-pB+16} textAnchor="middle" fontSize={9} fill="#5a6490"
              transform={labels.length>8?`rotate(-38,${gx+groupW/2},${height-pB+16})`:""}>
              {lbl.length>9?lbl.slice(0,8)+"…":lbl}
            </text>
          </g>;
        })}
      </svg>
      <div style={{display:"flex",gap:14,flexWrap:"wrap",marginTop:6}}>
        {datasets.map((ds,i) => (
          <span key={i} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#9ba5c9"}}>
            <span style={{width:10,height:10,borderRadius:2,background:ds.color,display:"inline-block"}}/>
            {ds.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ labels, data, colors }) {
  const total = data.reduce((a,b)=>a+b,0)||1;
  let angle = -Math.PI/2;
  const [cx,cy,r,inn] = [110,110,80,50];
  const slices = data.map((v,i) => {
    const sw=(v/total)*2*Math.PI;
    const x1=cx+r*Math.cos(angle),y1=cy+r*Math.sin(angle);
    angle+=sw;
    const x2=cx+r*Math.cos(angle),y2=cy+r*Math.sin(angle);
    const xi1=cx+inn*Math.cos(angle-sw),yi1=cy+inn*Math.sin(angle-sw);
    const xi2=cx+inn*Math.cos(angle),yi2=cy+inn*Math.sin(angle);
    return {path:`M${x1},${y1} A${r},${r},0,${sw>Math.PI?1:0},1,${x2},${y2} L${xi2},${yi2} A${inn},${inn},0,${sw>Math.PI?1:0},0,${xi1},${yi1} Z`,color:colors[i%colors.length],label:labels[i],val:v};
  });
  return (
    <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
      <svg viewBox="0 0 220 220" width={150} height={150}>
        {slices.map((s,i)=><path key={i} d={s.path} fill={s.color} opacity={0.9}/>)}
        <text x={cx} y={cy-5} textAnchor="middle" fontSize={11} fill="#9ba5c9">Total</text>
        <text x={cx} y={cy+13} textAnchor="middle" fontSize={13} fontWeight={600} fill="#e8eaf6">₹{Math.round(total/1000)}k</text>
      </svg>
      <div style={{display:"flex",flexDirection:"column",gap:7,flex:1,minWidth:120}}>
        {slices.map((s,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#9ba5c9"}}>
            <span style={{width:8,height:8,borderRadius:2,background:s.color,flexShrink:0}}/>
            <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.label}</span>
            <span style={{fontWeight:500,color:"#e8eaf6",flexShrink:0}}>{fmt(s.val)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineChart({ labels, datasets, height = 200 }) {
  const maxVal = Math.max(...datasets.flatMap(d=>d.data),1);
  const [pL,pB,pT,pR] = [60,34,14,16];
  const W=560, cW=W-pL-pR, cH=height-pT-pB;
  const xStep=cW/(labels.length-1||1);
  const pathD = (data) => data.map((v,i)=>`${i===0?"M":"L"}${pL+i*xStep},${pT+cH-(v/maxVal)*cH}`).join(" ");
  return (
    <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
      <svg viewBox={`0 0 ${W} ${height}`} width="100%" style={{height,minWidth:280}}>
        {[0,.25,.5,.75,1].map((f,i)=>{
          const v=Math.round(maxVal*f),y=pT+cH-f*cH;
          return <g key={i}>
            <line x1={pL} x2={W-pR} y1={y} y2={y} stroke="rgba(255,255,255,.05)" strokeWidth={0.5}/>
            <text x={pL-5} y={y+4} textAnchor="end" fontSize={9} fill="#5a6490">₹{v>=1000?Math.round(v/1000)+"k":v}</text>
          </g>;
        })}
        {datasets.map((ds,di)=>{
          const pts=ds.data.map((v,i)=>({x:pL+i*xStep,y:pT+cH-(v/maxVal)*cH}));
          const area=`${pathD(ds.data)} L${pL+(labels.length-1)*xStep},${pT+cH} L${pL},${pT+cH} Z`;
          return <g key={di}>
            {ds.fill&&<path d={area} fill={ds.color} opacity={0.1}/>}
            <path d={pathD(ds.data)} fill="none" stroke={ds.color} strokeWidth={2} strokeDasharray={ds.dash?"5,4":undefined}/>
            {!ds.dash&&pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={3} fill={ds.color}/>)}
          </g>;
        })}
        {labels.map((l,i)=><text key={i} x={pL+i*xStep} y={height-pB+14} textAnchor="middle" fontSize={9} fill="#5a6490">{l}</text>)}
      </svg>
      <div style={{display:"flex",gap:14,flexWrap:"wrap",marginTop:6}}>
        {datasets.map((ds,i)=>(
          <span key={i} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#9ba5c9"}}>
            <span style={{width:10,height:3,background:ds.color,display:"inline-block",borderRadius:2}}/>
            {ds.label}
          </span>
        ))}
      </div>
    </div>
  );
}

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

function Dashboard({ budget, transactions, selMonth, setSelMonth, selYear, setSelYear }) {
  const txns = transactions.filter(t=>{ const d=new Date(t.date); return d.getMonth()===selMonth&&d.getFullYear()===selYear; });
  const spend = {}; txns.forEach(t=>{spend[t.category]=(spend[t.category]||0)+t.amount;});
  const totalBudget = Object.values(budget).reduce((a,b)=>a+b,0);
  const totalSpent = Object.values(spend).reduce((a,b)=>a+b,0);
  const remaining = totalBudget-totalSpent;
  const overCats = Object.keys(budget).filter(c=>(spend[c]||0)>budget[c]&&budget[c]>0).length;
  const recent = [...txns].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);
  const activeCats = Object.keys(budget).filter(c=>budget[c]>0);

  return (
    <div>
      <div className="mf-topbar">
        <h2>Dashboard</h2>
        <div className="mf-filters">
          <select className="mf-sel" value={selMonth} onChange={e=>setSelMonth(+e.target.value)}>{MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
          <select className="mf-sel" value={selYear} onChange={e=>setSelYear(+e.target.value)}>{YEARS.map(y=><option key={y} value={y}>{y}</option>)}</select>
        </div>
      </div>
      <div className="mf-cards">
        {[
          {label:"Total Budget",val:fmt(totalBudget),sub:MONTHS[selMonth]+" "+selYear,color:"#00e5cc"},
          {label:"Total Spent",val:fmt(totalSpent),sub:pct(totalSpent,totalBudget)+"% used",color:"#ff4d8d"},
          {label:remaining>=0?"Remaining":"Over Budget",val:fmt(Math.abs(remaining)),sub:txns.length+" transactions",color:remaining>=0?"#00d68f":"#ff4d6d"},
          {label:"Over Budget",val:overCats+" cats",sub:"need attention",color:"#ffb830"},
        ].map((c,i)=>(
          <div key={i} className="mf-card">
            <div className="mf-card-label">{c.label}</div>
            <div className="mf-card-val" style={{color:c.color}}>{c.val}</div>
            <div className="mf-card-sub">{c.sub}</div>
          </div>
        ))}
      </div>
      <div className="mf-sec">
        <div className="mf-sec-title">Budget vs Actual</div>
        {activeCats.length===0&&<div style={{color:"#5a6490",fontSize:13}}>No budget yet. Go to Budget to add categories.</div>}
        {activeCats.map(cat=>{
          const s=spend[cat]||0,b=budget[cat],p=pct(s,b),over=s>b;
          return (
            <div key={cat} className="mf-prog-item">
              <div className="mf-prog-meta">
                <span style={{color:"#e8eaf6"}}>{cat}</span>
                <span style={{color:"#9ba5c9"}}>{fmt(s)} / {fmt(b)}</span>
              </div>
              <div className="mf-prog-bg"><div className="mf-prog-fill" style={{width:`${Math.min(p,100)}%`,background:over?"#ff4d6d":p>80?"#ffb830":"#00e5cc"}}/></div>
            </div>
          );
        })}
      </div>
      <div className="mf-sec">
        <div className="mf-sec-title">Recent Transactions</div>
        {recent.length===0
          ?<div style={{color:"#5a6490",fontSize:13,padding:"20px 0",textAlign:"center"}}>No transactions this month</div>
          :<div className="mf-table-wrap">
            <table className="mf-table">
              <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th></tr></thead>
              <tbody>{recent.map(t=>(
                <tr key={t.id}>
                  <td>{t.date}</td><td style={{color:"#e8eaf6"}}>{t.description}</td>
                  <td><span className="mf-chip">{t.category}</span></td>
                  <td style={{color:"#ff4d8d",fontWeight:600}}>{fmt(t.amount)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>}
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

function Charts({ budget, transactions }) {
  const now = new Date();
  const [view, setView] = useState("monthly");
  const [m, setM] = useState(now.getMonth());
  const [y, setY] = useState(now.getFullYear());
  const cats = Object.keys(budget);
  const totalBudgetAll = Object.values(budget).reduce((a,b)=>a+b,0);
  const txns = view==="monthly" ? transactions.filter(t=>{const d=new Date(t.date);return d.getMonth()===m&&d.getFullYear()===y;}) : transactions.filter(t=>new Date(t.date).getFullYear()===y);
  const spend={}; txns.forEach(t=>{spend[t.category]=(spend[t.category]||0)+t.amount;});
  const activeCats=cats.filter(c=>budget[c]>0||(spend[c]||0)>0);
  const spentCats=activeCats.filter(c=>(spend[c]||0)>0);
  const dayLabels=view==="monthly"?Array.from({length:31},(_,i)=>String(i+1)):MONTHS_SHORT;
  const dayData=view==="monthly"?dayLabels.map(d=>{const map={};txns.forEach(t=>{const dd=new Date(t.date).getDate();map[dd]=(map[dd]||0)+t.amount;});return map[+d]||0;}):MONTHS_SHORT.map((_,mi)=>transactions.filter(t=>{const dt=new Date(t.date);return dt.getFullYear()===y&&dt.getMonth()===mi;}).reduce((s,t)=>s+t.amount,0));
  const monthlyTotals=MONTHS_SHORT.map((_,mi)=>transactions.filter(t=>{const dt=new Date(t.date);return dt.getFullYear()===y&&dt.getMonth()===mi;}).reduce((s,t)=>s+t.amount,0));
  const over=activeCats.filter(c=>(spend[c]||0)>budget[c]&&budget[c]>0).map(c=>({cat:c,diff:(spend[c]||0)-budget[c]})).sort((a,b)=>b.diff-a.diff);
  const under=activeCats.filter(c=>(spend[c]||0)<budget[c]&&budget[c]>0).map(c=>({cat:c,diff:budget[c]-(spend[c]||0)})).sort((a,b)=>b.diff-a.diff);

  return (
    <div>
      <div className="mf-topbar">
        <h2>Charts & Insights</h2>
        <div className="mf-filters">
          <select className="mf-sel" value={view} onChange={e=>setView(e.target.value)}><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select>
          {view==="monthly"&&<select className="mf-sel" value={m} onChange={e=>setM(+e.target.value)}>{MONTHS.map((mo,i)=><option key={i} value={i}>{mo}</option>)}</select>}
          <select className="mf-sel" value={y} onChange={e=>setY(+e.target.value)}>{YEARS.map(yr=><option key={yr} value={yr}>{yr}</option>)}</select>
        </div>
      </div>
      <div className="mf-sec">
        <div className="mf-sec-title">Budget vs Actual (₹)</div>
        {activeCats.length?<BarChart labels={activeCats} datasets={[{label:"Budget",data:activeCats.map(c=>budget[c]||0),color:"#00e5cc"},{label:"Actual",data:activeCats.map(c=>spend[c]||0),colors:activeCats.map(c=>(spend[c]||0)>(budget[c]||0)?"#ff4d6d":"#00d68f"),color:"#00d68f"}]} height={280}/>:<div style={{color:"#5a6490",fontSize:13}}>No data yet</div>}
      </div>
      <div className="mf-chart-2col">
        <div className="mf-sec">
          <div className="mf-sec-title">Spending by Category</div>
          {spentCats.length?<DonutChart labels={spentCats} data={spentCats.map(c=>spend[c])} colors={PIE_COLORS}/>:<div style={{color:"#5a6490",fontSize:13,padding:"20px 0"}}>No spending data</div>}
        </div>
        <div className="mf-sec">
          <div className="mf-sec-title">{view==="monthly"?"Day-wise":"Month-wise"} Spending</div>
          <BarChart labels={dayLabels} datasets={[{label:"Spent",data:dayData,color:"#ffb830"}]} height={220}/>
        </div>
      </div>
      <div className="mf-sec">
        <div className="mf-sec-title">Monthly Trend {y}</div>
        <LineChart labels={MONTHS_SHORT} datasets={[{label:"Spent",data:monthlyTotals,color:"#ff4d8d",fill:true},{label:"Budget",data:MONTHS_SHORT.map(()=>totalBudgetAll),color:"#00e5cc",dash:true}]} height={200}/>
      </div>
      <div className="mf-sec">
        <div className="mf-sec-title">Over / Under Budget Summary</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          <div>
            <div style={{fontSize:11,color:"#ff4d6d",textTransform:"uppercase",letterSpacing:".8px",marginBottom:10}}>🔴 Over Budget</div>
            {over.length?over.map(({cat,diff})=>(<div key={cat} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.04)",fontSize:13}}><span style={{color:"#e8eaf6"}}>{cat}</span><span style={{color:"#ff4d6d",fontWeight:600}}>+{fmt(diff)}</span></div>)):<div style={{color:"#5a6490",fontSize:13,padding:"12px 0"}}>All good! 🎉</div>}
          </div>
          <div>
            <div style={{fontSize:11,color:"#00d68f",textTransform:"uppercase",letterSpacing:".8px",marginBottom:10}}>🟢 Under Budget</div>
            {under.map(({cat,diff})=>(<div key={cat} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.04)",fontSize:13}}><span style={{color:"#e8eaf6"}}>{cat}</span><span style={{color:"#00d68f",fontWeight:600}}>{fmt(diff)} left</span></div>))}
          </div>
        </div>
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
    {id:"dashboard",icon:"📊",label:"Dashboard"},
    {id:"add",icon:"➕",label:"Add"},
    {id:"transactions",icon:"📋",label:"Transactions"},
    {id:"charts",icon:"📈",label:"Charts"},
    {id:"budget",icon:"🎯",label:"Budget"},
    {id:"feedback",icon:"💬",label:"Feedback"},
    {id:"profile",icon:"👤",label:"Profile"},
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
        {page==="charts"       && <Charts budget={budget} transactions={transactions}/>}
        {page==="budget"       && <BudgetPage budget={budget} onSaved={loadBudget}/>}
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
