import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Supabase config ──
const SUPABASE_URL = "https://lwbhllwznsqniwtbrhqc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3YmhsbHd6bnNxbml3dGJyaHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MjI2MTUsImV4cCI6MjA5NDQ5ODYxNX0._DCPCFvwh4E-qSFCg4pLUmm17ORtFcyO80uM_tl5YaM";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const PIE_COLORS = ["#00e5cc","#ff4d8d","#ffb830","#00d68f","#a78bfa","#60a5fa","#f97316","#34d399","#fb7185","#818cf8","#fbbf24","#4ade80"];

const fmt = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
const pct = (a, b) => b === 0 ? 0 : Math.min(Math.round((a / b) * 100), 999);

const S = {
  app: { display:"flex", minHeight:"100vh", background:"#07091a", color:"#e8eaf6", fontFamily:"system-ui,sans-serif" },
  sidebar: { width:224, background:"#0d1130", borderRight:"1px solid rgba(255,255,255,0.07)", display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, height:"100vh", zIndex:100 },
  logoWrap: { padding:"24px 20px 20px", borderBottom:"1px solid rgba(255,255,255,0.07)" },
  logoText: { fontSize:22, fontWeight:800, background:"linear-gradient(135deg,#00e5cc,#ff4d8d)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" },
  logoSub: { fontSize:11, color:"#5a6490", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  navItem: (a) => ({ display:"flex", alignItems:"center", gap:11, padding:"11px 20px", cursor:"pointer", color:a?"#00e5cc":"#9ba5c9", fontSize:13.5, fontWeight:500, background:a?"rgba(0,229,204,0.08)":"transparent", borderLeft:a?"3px solid #00e5cc":"3px solid transparent", transition:"all .15s" }),
  main: { marginLeft:224, padding:"28px 32px", flex:1, minHeight:"100vh", paddingBottom:80 },
  topbar: { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:10 },
  h2: { fontSize:22, fontWeight:700 },
  sel: { background:"#131840", border:"1px solid rgba(255,255,255,0.1)", color:"#e8eaf6", padding:"7px 12px", borderRadius:8, fontSize:13, cursor:"pointer", outline:"none" },
  grid4: { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))", gap:14, marginBottom:22 },
  card: { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"18px 20px" },
  cardLabel: { fontSize:11, color:"#5a6490", textTransform:"uppercase", letterSpacing:".8px", marginBottom:8 },
  cardVal: (c) => ({ fontSize:22, fontWeight:700, color:c }),
  cardSub: { fontSize:11, color:"#5a6490", marginTop:4 },
  sec: { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"20px 24px", marginBottom:18 },
  secTitle: { fontSize:11, fontWeight:600, color:"#5a6490", textTransform:"uppercase", letterSpacing:".8px", marginBottom:14 },
  inp: { background:"#131840", border:"1px solid rgba(255,255,255,0.1)", color:"#e8eaf6", padding:"10px 14px", borderRadius:9, fontSize:14, outline:"none", fontFamily:"inherit", width:"100%", boxSizing:"border-box" },
  btnP: { padding:"10px 22px", borderRadius:9, border:"none", cursor:"pointer", fontSize:14, fontWeight:600, background:"linear-gradient(135deg,#00e5cc,#00b8a4)", color:"#07091a" },
  btnD: { padding:"5px 10px", borderRadius:7, border:"1px solid rgba(255,77,109,.3)", cursor:"pointer", fontSize:12, background:"rgba(255,77,109,.1)", color:"#ff4d6d" },
  btnG: { padding:"10px 18px", borderRadius:9, border:"1px solid rgba(255,255,255,.1)", cursor:"pointer", fontSize:13, background:"rgba(255,255,255,.04)", color:"#9ba5c9" },
  tbl: { width:"100%", borderCollapse:"collapse", fontSize:13.5 },
  th: { fontSize:11, color:"#5a6490", textTransform:"uppercase", letterSpacing:".7px", padding:"8px 10px", textAlign:"left", borderBottom:"1px solid rgba(255,255,255,.08)" },
  td: { padding:"10px 10px", borderBottom:"1px solid rgba(255,255,255,.04)", color:"#9ba5c9" },
  chip: { display:"inline-block", background:"rgba(255,255,255,.07)", color:"#9ba5c9", borderRadius:5, padding:"2px 8px", fontSize:11 },
  pbg: { height:6, background:"rgba(255,255,255,.07)", borderRadius:99, overflow:"hidden", marginTop:5 },
  pfill: (p,over) => ({ height:"100%", width:`${Math.min(p,100)}%`, background:over?"#ff4d6d":p>80?"#ffb830":"#00e5cc", borderRadius:99, transition:"width .5s" }),
};

// ── SVG Bar Chart ──
function BarChart({ labels, datasets, height=260 }) {
  const maxVal = Math.max(...datasets.flatMap(d=>d.data), 1);
  const barW = Math.max(6, Math.min(22, Math.floor(480/labels.length/datasets.length - 3)));
  const groupW = barW*datasets.length+4;
  const [pL,pB,pT,pR] = [68,48,16,16];
  const W = Math.max(480, labels.length*(groupW+8)+pL+pR);
  const cH = height-pT-pB;
  return (
    <div style={{overflowX:"auto"}}>
      <svg viewBox={`0 0 ${W} ${height}`} width="100%" style={{height}}>
        {[0,.25,.5,.75,1].map((f,i)=>{
          const v=Math.round(maxVal*f), y=pT+cH-f*cH;
          return <g key={i}>
            <line x1={pL} x2={W-pR} y1={y} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={0.5}/>
            <text x={pL-5} y={y+4} textAnchor="end" fontSize={9} fill="#5a6490">₹{v>=1000?Math.round(v/1000)+"k":v}</text>
          </g>;
        })}
        {labels.map((lbl,li)=>{
          const gx=pL+li*(groupW+8);
          return <g key={li}>
            {datasets.map((ds,di)=>{
              const val=ds.data[li]||0, bh=Math.max(2,(val/maxVal)*cH);
              return <rect key={di} x={gx+di*(barW+2)} y={pT+cH-bh} width={barW} height={bh} rx={2} fill={ds.colors?ds.colors[li]:ds.color} opacity={0.85}/>;
            })}
            <text x={gx+groupW/2} y={height-pB+15} textAnchor="middle" fontSize={9} fill="#5a6490"
              transform={labels.length>8?`rotate(-38,${gx+groupW/2},${height-pB+15})`:""}>
              {lbl.length>9?lbl.slice(0,8)+"…":lbl}
            </text>
          </g>;
        })}
      </svg>
      <div style={{display:"flex",gap:14,flexWrap:"wrap",marginTop:6}}>
        {datasets.map((ds,i)=>(
          <span key={i} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#9ba5c9"}}>
            <span style={{width:10,height:10,borderRadius:2,background:ds.color,display:"inline-block"}}/>
            {ds.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── SVG Donut ──
function DonutChart({ labels, data, colors }) {
  const total = data.reduce((a,b)=>a+b,0)||1;
  let angle = -Math.PI/2;
  const [cx,cy,r,inn] = [110,110,80,50];
  const slices = data.map((v,i)=>{
    const sw=(v/total)*2*Math.PI;
    const x1=cx+r*Math.cos(angle),y1=cy+r*Math.sin(angle);
    angle+=sw;
    const x2=cx+r*Math.cos(angle),y2=cy+r*Math.sin(angle);
    const xi1=cx+inn*Math.cos(angle-sw),yi1=cy+inn*Math.sin(angle-sw);
    const xi2=cx+inn*Math.cos(angle),yi2=cy+inn*Math.sin(angle);
    return {path:`M${x1},${y1} A${r},${r},0,${sw>Math.PI?1:0},1,${x2},${y2} L${xi2},${yi2} A${inn},${inn},0,${sw>Math.PI?1:0},0,${xi1},${yi1} Z`,color:colors[i%colors.length],label:labels[i],val:v};
  });
  return (
    <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
      <svg viewBox="0 0 220 220" width={170} height={170}>
        {slices.map((s,i)=><path key={i} d={s.path} fill={s.color} opacity={0.9}/>)}
        <text x={cx} y={cy-5} textAnchor="middle" fontSize={11} fill="#9ba5c9">Total</text>
        <text x={cx} y={cy+13} textAnchor="middle" fontSize={13} fontWeight={600} fill="#e8eaf6">₹{Math.round(total/1000)}k</text>
      </svg>
      <div style={{display:"flex",flexDirection:"column",gap:7,flex:1}}>
        {slices.map((s,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:7,fontSize:11,color:"#9ba5c9"}}>
            <span style={{width:8,height:8,borderRadius:2,background:s.color,flexShrink:0}}/>
            <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.label}</span>
            <span style={{fontWeight:500,color:"#e8eaf6"}}>{fmt(s.val)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SVG Line Chart ──
function LineChart({ labels, datasets, height=200 }) {
  const maxVal = Math.max(...datasets.flatMap(d=>d.data),1);
  const [pL,pB,pT,pR] = [60,34,14,16];
  const W=560, cW=W-pL-pR, cH=height-pT-pB;
  const xStep=cW/(labels.length-1||1);
  const pathD = (data) => data.map((v,i)=>`${i===0?"M":"L"}${pL+i*xStep},${pT+cH-(v/maxVal)*cH}`).join(" ");
  return (
    <div style={{overflowX:"auto"}}>
      <svg viewBox={`0 0 ${W} ${height}`} width="100%" style={{height}}>
        {[0,.25,.5,.75,1].map((f,i)=>{
          const v=Math.round(maxVal*f),y=pT+cH-f*cH;
          return <g key={i}>
            <line x1={pL} x2={W-pR} y1={y} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={0.5}/>
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

// ── Login Screen ──
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const login = async () => {
    if (!email||!password) { setError("Enter email and password"); return; }
    setLoading(true); setError("");
    const { data, error:err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError("Invalid email or password."); setShake(true); setTimeout(()=>setShake(false),500); }
    else onLogin(data.session);
  };

  return (
    <div style={{minHeight:"100vh",background:"#07091a",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif"}}>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-10px)}75%{transform:translateX(10px)}}`}</style>
      <div style={{background:"#0d1130",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,padding:"48px 40px",width:"100%",maxWidth:380,textAlign:"center",animation:shake?"shake .4s ease":"none"}}>
        <div style={{width:64,height:64,borderRadius:"50%",background:"rgba(0,229,204,0.1)",border:"1px solid rgba(0,229,204,0.2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:28}}>💰</div>
        <div style={{fontSize:26,fontWeight:800,background:"linear-gradient(135deg,#00e5cc,#ff4d8d)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4}}>Monefy</div>
        <div style={{fontSize:13,color:"#5a6490",marginBottom:32}}>Your personal finance tracker</div>
        <div style={{display:"flex",flexDirection:"column",gap:12,textAlign:"left"}}>
          <div>
            <div style={{fontSize:11,color:"#5a6490",textTransform:"uppercase",letterSpacing:".7px",marginBottom:6}}>Email</div>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="you@email.com" style={{...S.inp,borderColor:error?"#ff4d6d":"rgba(255,255,255,0.1)"}}/>
          </div>
          <div>
            <div style={{fontSize:11,color:"#5a6490",textTransform:"uppercase",letterSpacing:".7px",marginBottom:6}}>Password</div>
            <div style={{position:"relative"}}>
              <input type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="••••••••" style={{...S.inp,paddingRight:44,borderColor:error?"#ff4d6d":"rgba(255,255,255,0.1)"}}/>
              <span onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",cursor:"pointer",fontSize:15,color:"#5a6490"}}>{show?"🙈":"👁️"}</span>
            </div>
          </div>
        </div>
        {error&&<div style={{color:"#ff4d6d",fontSize:12,marginTop:10}}>{error}</div>}
        <button onClick={login} disabled={loading} style={{...S.btnP,width:"100%",marginTop:20,opacity:loading?.7:1}}>
          {loading?"Signing in…":"Sign In"}
        </button>
        <div style={{marginTop:20,fontSize:11,color:"#2a304a"}}>🔒 Secured by Supabase Auth</div>
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div style={{minHeight:"100vh",background:"#07091a",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{fontSize:26,fontWeight:800,background:"linear-gradient(135deg,#00e5cc,#ff4d8d)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Monefy</div>
      <div style={{color:"#5a6490",fontSize:13}}>Loading your data…</div>
    </div>
  );
}

// ── Main App ──
export default function App() {
  const [session, setSession] = useState(undefined);
  const [page, setPage] = useState("dashboard");
  const [budget, setBudget] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [selYear,  setSelYear]  = useState(now.getFullYear());
  const [txnM, setTxnM] = useState(now.getMonth());
  const [txnY, setTxnY] = useState(now.getFullYear());
  const [chartView, setChartView] = useState("monthly");
  const [chartM, setChartM] = useState(now.getMonth());
  const [chartY, setChartY] = useState(now.getFullYear());

  const [txnDate, setTxnDate] = useState(now.toISOString().slice(0,10));
  const [txnAmt,  setTxnAmt]  = useState("");
  const [txnDesc, setTxnDesc] = useState("");
  const [txnCat,  setTxnCat]  = useState("");
  const [addMsg,  setAddMsg]  = useState(null);
  const [newCat,    setNewCat]    = useState("");
  const [newCatAmt, setNewCatAmt] = useState("");
  const [budgetMsg, setBudgetMsg] = useState(null);
  const [localBudget, setLocalBudget] = useState({});

  useEffect(() => {
    supabase.auth.getSession().then(({data})=>setSession(data.session??null));
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,s)=>setSession(s));
    return ()=>subscription.unsubscribe();
  }, []);

  useEffect(() => { if(session){loadBudget();loadTransactions();} }, [session]);

  const loadBudget = async () => {
    const {data} = await supabase.from("budget").select("*").order("category");
    if (data) {
      const obj={};
      data.forEach(r=>{obj[r.category]=r.amount;});
      setBudget(obj); setLocalBudget(obj);
      if (!txnCat && data.length) setTxnCat(data[0].category);
    }
  };

  const loadTransactions = async () => {
    const {data} = await supabase.from("transactions").select("*").order("date",{ascending:false});
    if (data) setTransactions(data);
  };

  const getMonthTxn = (m,y) => transactions.filter(t=>{const d=new Date(t.date);return d.getMonth()===m&&d.getFullYear()===y;});
  const getCatSpend = (txns) => {const r={};txns.forEach(t=>{r[t.category]=(r[t.category]||0)+t.amount;});return r;};
  const signOut = async () => {await supabase.auth.signOut();setSession(null);setBudget({});setTransactions([]);};

  if (session===undefined) return <Loader/>;
  if (session===null) return <LoginScreen onLogin={setSession}/>;

  const addTransaction = async () => {
    if (!txnDate||!txnAmt||!txnDesc||!txnCat){setAddMsg({t:"err",m:"Please fill all fields"});return;}
    setLoading(true);
    const {error} = await supabase.from("transactions").insert({date:txnDate,description:txnDesc,category:txnCat,amount:parseFloat(txnAmt),user_id:session.user.id});
    setLoading(false);
    if (error){setAddMsg({t:"err",m:"Error saving. Try again."});return;}
    setAddMsg({t:"ok",m:"Expense saved! ✓"});
    setTxnAmt("");setTxnDesc("");
    loadTransactions();
    setTimeout(()=>setAddMsg(null),2000);
  };

  const deleteTxn = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    await supabase.from("transactions").delete().eq("id",id);
    loadTransactions();
  };

  const saveBudget = async () => {
    const rows = Object.entries(localBudget).map(([category,amount])=>({category,amount,user_id:session.user.id}));
    const {error} = await supabase.from("budget").upsert(rows,{onConflict:"category,user_id"});
    if (error){setBudgetMsg({t:"err",m:"Error saving budget."});return;}
    setBudget({...localBudget});
    setBudgetMsg({t:"ok",m:"Budget saved! ✓"});
    setTimeout(()=>setBudgetMsg(null),2000);
  };

  const addCategory = async () => {
    if (!newCat.trim()){setBudgetMsg({t:"err",m:"Enter category name"});return;}
    if (localBudget[newCat.trim()]!==undefined){setBudgetMsg({t:"err",m:"Already exists"});return;}
    const {error} = await supabase.from("budget").insert({category:newCat.trim(),amount:parseFloat(newCatAmt)||0,user_id:session.user.id});
    if (error){setBudgetMsg({t:"err",m:"Error adding category."});return;}
    setNewCat("");setNewCatAmt("");
    loadBudget();
    setBudgetMsg({t:"ok",m:"Category added!"});
    setTimeout(()=>setBudgetMsg(null),2000);
  };

  const deleteCategory = async (cat) => {
    if (!window.confirm(`Remove "${cat}"?`)) return;
    await supabase.from("budget").delete().eq("category",cat).eq("user_id",session.user.id);
    loadBudget();
  };

  const cats = Object.keys(budget);
  const totalBudgetAll = Object.values(budget).reduce((a,b)=>a+b,0);

  const NAV = [
    {id:"dashboard",icon:"📊",label:"Dashboard"},
    {id:"add",icon:"➕",label:"Add Expense"},
    {id:"transactions",icon:"📋",label:"Transactions"},
    {id:"charts",icon:"📈",label:"Charts"},
    {id:"budget",icon:"🎯",label:"Budget"},
  ];

  // ── DASHBOARD ──
  const Dashboard = () => {
    const txns=getMonthTxn(selMonth,selYear);
    const spend=getCatSpend(txns);
    const totalSpent=Object.values(spend).reduce((a,b)=>a+b,0);
    const remaining=totalBudgetAll-totalSpent;
    const overCats=cats.filter(c=>(spend[c]||0)>budget[c]&&budget[c]>0).length;
    const recent=[...txns].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);
    const activeCats=cats.filter(c=>budget[c]>0);
    return (
      <div>
        <div style={S.topbar}>
          <h2 style={S.h2}>Dashboard</h2>
          <div style={{display:"flex",gap:8}}>
            <select style={S.sel} value={selMonth} onChange={e=>setSelMonth(+e.target.value)}>{MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
            <select style={S.sel} value={selYear}  onChange={e=>setSelYear(+e.target.value)}>{[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}</select>
          </div>
        </div>
        <div style={S.grid4}>
          {[
            {label:"Total Budget",val:fmt(totalBudgetAll),sub:MONTHS[selMonth]+" "+selYear,color:"#00e5cc"},
            {label:"Total Spent",val:fmt(totalSpent),sub:pct(totalSpent,totalBudgetAll)+"% used",color:"#ff4d8d"},
            {label:remaining>=0?"Remaining":"Over Budget",val:fmt(Math.abs(remaining)),sub:txns.length+" transactions",color:remaining>=0?"#00d68f":"#ff4d6d"},
            {label:"Over Budget",val:overCats+" cats",sub:"need attention",color:"#ffb830"},
          ].map((c,i)=>(
            <div key={i} style={S.card}>
              <div style={S.cardLabel}>{c.label}</div>
              <div style={S.cardVal(c.color)}>{c.val}</div>
              <div style={S.cardSub}>{c.sub}</div>
            </div>
          ))}
        </div>
        <div style={S.sec}>
          <div style={S.secTitle}>Budget vs Actual</div>
          {activeCats.length===0&&<div style={{color:"#5a6490",fontSize:13}}>No budget yet. Go to Budget page to add categories.</div>}
          {activeCats.map(cat=>{
            const s=spend[cat]||0,b=budget[cat],p=pct(s,b),over=s>b;
            return (
              <div key={cat} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12.5,marginBottom:4}}>
                  <span style={{color:"#e8eaf6"}}>{cat}</span>
                  <span style={{color:"#9ba5c9"}}>{fmt(s)} / {fmt(b)}</span>
                </div>
                <div style={S.pbg}><div style={S.pfill(p,over)}/></div>
              </div>
            );
          })}
        </div>
        <div style={S.sec}>
          <div style={S.secTitle}>Recent Transactions</div>
          {recent.length===0
            ?<div style={{color:"#5a6490",fontSize:13,padding:"20px 0",textAlign:"center"}}>No transactions this month</div>
            :<div style={{overflowX:"auto"}}>
              <table style={S.tbl}>
                <thead><tr><th style={S.th}>Date</th><th style={S.th}>Description</th><th style={S.th}>Category</th><th style={S.th}>Amount</th></tr></thead>
                <tbody>{recent.map(t=>(
                  <tr key={t.id}>
                    <td style={S.td}>{t.date}</td>
                    <td style={{...S.td,color:"#e8eaf6"}}>{t.description}</td>
                    <td style={S.td}><span style={S.chip}>{t.category}</span></td>
                    <td style={{...S.td,color:"#ff4d8d",fontWeight:600}}>{fmt(t.amount)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          }
        </div>
      </div>
    );
  };

  // ── ADD EXPENSE ──
  const AddExpense = () => (
    <div>
      <div style={S.topbar}><h2 style={S.h2}>Add Expense</h2></div>
      <div style={{...S.sec,maxWidth:520}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          {[
            {label:"Date",type:"date",val:txnDate,set:setTxnDate,full:false},
            {label:"Amount (₹)",type:"number",val:txnAmt,set:setTxnAmt,placeholder:"0.00",full:false},
          ].map(f=>(
            <div key={f.label} style={{display:"flex",flexDirection:"column",gap:6}}>
              <label style={{fontSize:11,color:"#5a6490",textTransform:"uppercase",letterSpacing:".7px"}}>{f.label}</label>
              <input type={f.type} style={S.inp} value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.placeholder}/>
            </div>
          ))}
          <div style={{display:"flex",flexDirection:"column",gap:6,gridColumn:"1/-1"}}>
            <label style={{fontSize:11,color:"#5a6490",textTransform:"uppercase",letterSpacing:".7px"}}>Description</label>
            <input type="text" style={S.inp} value={txnDesc} onChange={e=>setTxnDesc(e.target.value)} placeholder="What did you spend on?"/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6,gridColumn:"1/-1"}}>
            <label style={{fontSize:11,color:"#5a6490",textTransform:"uppercase",letterSpacing:".7px"}}>Category</label>
            <select style={{...S.inp,cursor:"pointer"}} value={txnCat} onChange={e=>setTxnCat(e.target.value)}>
              {cats.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{marginTop:18,display:"flex",gap:10}}>
          <button style={{...S.btnP,opacity:loading?.7:1}} onClick={addTransaction} disabled={loading}>{loading?"Saving…":"Save Expense"}</button>
          <button style={S.btnG} onClick={()=>{setTxnAmt("");setTxnDesc("");}}>Clear</button>
        </div>
        {addMsg&&<div style={{marginTop:10,fontSize:13,color:addMsg.t==="ok"?"#00d68f":"#ff4d6d"}}>{addMsg.m}</div>}
      </div>
    </div>
  );

  // ── TRANSACTIONS ──
  const Transactions = () => {
    const txns=getMonthTxn(txnM,txnY).sort((a,b)=>b.date.localeCompare(a.date));
    return (
      <div>
        <div style={S.topbar}>
          <h2 style={S.h2}>Transactions</h2>
          <div style={{display:"flex",gap:8}}>
            <select style={S.sel} value={txnM} onChange={e=>setTxnM(+e.target.value)}>{MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
            <select style={S.sel} value={txnY} onChange={e=>setTxnY(+e.target.value)}>{[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}</select>
          </div>
        </div>
        <div style={S.sec}>
          {txns.length===0
            ?<div style={{color:"#5a6490",fontSize:13,padding:"32px 0",textAlign:"center"}}>No transactions this month</div>
            :<div style={{overflowX:"auto"}}>
              <table style={S.tbl}>
                <thead><tr><th style={S.th}>Date</th><th style={S.th}>Description</th><th style={S.th}>Category</th><th style={S.th}>Amount</th><th style={S.th}></th></tr></thead>
                <tbody>{txns.map(t=>(
                  <tr key={t.id}>
                    <td style={S.td}>{t.date}</td>
                    <td style={{...S.td,color:"#e8eaf6"}}>{t.description}</td>
                    <td style={S.td}><span style={S.chip}>{t.category}</span></td>
                    <td style={{...S.td,color:"#ff4d8d",fontWeight:600}}>{fmt(t.amount)}</td>
                    <td style={S.td}><button style={S.btnD} onClick={()=>deleteTxn(t.id)}>Delete</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          }
        </div>
      </div>
    );
  };

  // ── CHARTS ──
  const Charts = () => {
    const txns=chartView==="monthly"?getMonthTxn(chartM,chartY):transactions.filter(t=>new Date(t.date).getFullYear()===chartY);
    const spend=getCatSpend(txns);
    const activeCats=cats.filter(c=>budget[c]>0||(spend[c]||0)>0);
    const spentCats=activeCats.filter(c=>(spend[c]||0)>0);
    const dayLabels=chartView==="monthly"?Array.from({length:31},(_,i)=>String(i+1)):MONTHS_SHORT;
    const dayData=chartView==="monthly"
      ?dayLabels.map(d=>{const m={};txns.forEach(t=>{const dd=new Date(t.date).getDate();m[dd]=(m[dd]||0)+t.amount;});return m[+d]||0;})
      :MONTHS_SHORT.map((_,mi)=>transactions.filter(t=>{const dt=new Date(t.date);return dt.getFullYear()===chartY&&dt.getMonth()===mi;}).reduce((s,t)=>s+t.amount,0));
    const monthlyTotals=MONTHS_SHORT.map((_,mi)=>transactions.filter(t=>{const dt=new Date(t.date);return dt.getFullYear()===chartY&&dt.getMonth()===mi;}).reduce((s,t)=>s+t.amount,0));
    const over=activeCats.filter(c=>(spend[c]||0)>budget[c]&&budget[c]>0).map(c=>({cat:c,diff:(spend[c]||0)-budget[c]})).sort((a,b)=>b.diff-a.diff);
    const under=activeCats.filter(c=>(spend[c]||0)<budget[c]&&budget[c]>0).map(c=>({cat:c,diff:budget[c]-(spend[c]||0)})).sort((a,b)=>b.diff-a.diff);
    return (
      <div>
        <div style={S.topbar}>
          <h2 style={S.h2}>Charts & Insights</h2>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select style={S.sel} value={chartView} onChange={e=>setChartView(e.target.value)}><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select>
            {chartView==="monthly"&&<select style={S.sel} value={chartM} onChange={e=>setChartM(+e.target.value)}>{MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>}
            <select style={S.sel} value={chartY} onChange={e=>setChartY(+e.target.value)}>{[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}</select>
          </div>
        </div>
        <div style={S.sec}>
          <div style={S.secTitle}>Budget vs Actual (₹)</div>
          {activeCats.length?<BarChart labels={activeCats} datasets={[
            {label:"Budget",data:activeCats.map(c=>budget[c]||0),color:"#00e5cc"},
            {label:"Actual",data:activeCats.map(c=>spend[c]||0),colors:activeCats.map(c=>(spend[c]||0)>(budget[c]||0)?"#ff4d6d":"#00d68f"),color:"#00d68f"},
          ]} height={280}/>:<div style={{color:"#5a6490",fontSize:13}}>No data yet</div>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
          <div style={S.sec}>
            <div style={S.secTitle}>Spending by Category</div>
            {spentCats.length?<DonutChart labels={spentCats} data={spentCats.map(c=>spend[c])} colors={PIE_COLORS}/>:<div style={{color:"#5a6490",fontSize:13,padding:"20px 0"}}>No spending data</div>}
          </div>
          <div style={S.sec}>
            <div style={S.secTitle}>{chartView==="monthly"?"Day-wise":"Month-wise"} Spending</div>
            <BarChart labels={dayLabels} datasets={[{label:"Spent",data:dayData,color:"#ffb830"}]} height={220}/>
          </div>
        </div>
        <div style={S.sec}>
          <div style={S.secTitle}>Monthly Trend {chartY}</div>
          <LineChart labels={MONTHS_SHORT} datasets={[
            {label:"Spent",data:monthlyTotals,color:"#ff4d8d",fill:true},
            {label:"Budget",data:MONTHS_SHORT.map(()=>totalBudgetAll),color:"#00e5cc",dash:true},
          ]} height={200}/>
        </div>
        <div style={S.sec}>
          <div style={S.secTitle}>Over / Under Budget Summary</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
            <div>
              <div style={{fontSize:11,color:"#ff4d6d",textTransform:"uppercase",letterSpacing:".8px",marginBottom:10}}>🔴 Over Budget</div>
              {over.length?over.map(({cat,diff})=>(
                <div key={cat} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.04)",fontSize:13}}>
                  <span style={{color:"#e8eaf6"}}>{cat}</span><span style={{color:"#ff4d6d",fontWeight:600}}>+{fmt(diff)}</span>
                </div>
              )):<div style={{color:"#5a6490",fontSize:13,padding:"12px 0"}}>All good! 🎉</div>}
            </div>
            <div>
              <div style={{fontSize:11,color:"#00d68f",textTransform:"uppercase",letterSpacing:".8px",marginBottom:10}}>🟢 Under Budget</div>
              {under.map(({cat,diff})=>(
                <div key={cat} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.04)",fontSize:13}}>
                  <span style={{color:"#e8eaf6"}}>{cat}</span><span style={{color:"#00d68f",fontWeight:600}}>{fmt(diff)} left</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── BUDGET ──
  const Budget = () => (
    <div>
      <div style={S.topbar}>
        <h2 style={S.h2}>Budget Manager</h2>
        <button style={S.btnP} onClick={saveBudget}>Save Budget</button>
      </div>
      <div style={{...S.sec,maxWidth:580}}>
        <div style={S.secTitle}>Categories & Monthly Budget</div>
        {Object.entries(localBudget).map(([cat,amt])=>(
          <div key={cat} style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:12,alignItems:"center",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
            <span style={{fontSize:14,color:"#e8eaf6"}}>{cat}</span>
            <input type="number" value={amt} onChange={e=>setLocalBudget(p=>({...p,[cat]:parseFloat(e.target.value)||0}))}
              style={{background:"#131840",border:"1px solid rgba(255,255,255,.1)",color:"#e8eaf6",padding:"6px 10px",borderRadius:7,fontSize:13,outline:"none",width:130,fontFamily:"inherit"}}/>
            <button style={S.btnD} onClick={()=>deleteCategory(cat)}>Remove</button>
          </div>
        ))}
        <div style={{marginTop:18,display:"flex",gap:10,alignItems:"center",paddingTop:16,borderTop:"1px solid rgba(255,255,255,.08)"}}>
          <input type="text" style={{...S.inp,flex:1}} value={newCat} onChange={e=>setNewCat(e.target.value)} placeholder="New category name"/>
          <input type="number" style={{...S.inp,width:130}} value={newCatAmt} onChange={e=>setNewCatAmt(e.target.value)} placeholder="₹ Budget"/>
          <button style={S.btnP} onClick={addCategory}>Add</button>
        </div>
        {budgetMsg&&<div style={{marginTop:10,fontSize:13,color:budgetMsg.t==="ok"?"#00d68f":"#ff4d6d"}}>{budgetMsg.m}</div>}
      </div>
    </div>
  );

  return (
    <div style={S.app}>
      <nav style={S.sidebar}>
        <div style={S.logoWrap}>
          <div style={S.logoText}>Monefy 💰</div>
          <div style={S.logoSub}>{session.user.email}</div>
        </div>
        <div style={{padding:"12px 0",flex:1}}>
          {NAV.map(n=>(
            <div key={n.id} style={S.navItem(page===n.id)} onClick={()=>setPage(n.id)}>
              <span style={{fontSize:15}}>{n.icon}</span> {n.label}
            </div>
          ))}
        </div>
        <div style={{padding:"16px 20px",borderTop:"1px solid rgba(255,255,255,.06)"}}>
          <div onClick={signOut} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",color:"#5a6490",fontSize:13,padding:"6px 0"}}>
            <span>🚪</span> Sign Out
          </div>
        </div>
      </nav>

      <main style={S.main}>
        {page==="dashboard"    && <Dashboard/>}
        {page==="add"          && <AddExpense/>}
        {page==="transactions" && <Transactions/>}
        {page==="charts"       && <Charts/>}
        {page==="budget"       && <Budget/>}
      </main>

      {/* Mobile bottom nav */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#0d1130",borderTop:"1px solid rgba(255,255,255,.07)",zIndex:200,padding:"6px 0",display:"flex",justifyContent:"space-around"}}>
        {NAV.map(n=>(
          <div key={n.id} onClick={()=>setPage(n.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"5px 8px",cursor:"pointer",color:page===n.id?"#00e5cc":"#5a6490",fontSize:9}}>
            <span style={{fontSize:18}}>{n.icon}</span>{n.label}
          </div>
        ))}
      </div>
    </div>
  );
}
