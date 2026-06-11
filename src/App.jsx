import { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase";
import { CSS } from "./constants";

// Shared
import Loader   from "./components/shared/Loader";
import Avatar   from "./components/shared/Avatar";

// Pages
import Auth         from "./components/Auth";
import AddExpense   from "./components/AddExpense";
import Transactions from "./components/Transactions";
import Budget       from "./components/Budget";

// Lazy imports for feature-flagged pages (loaded only when needed)
import { lazy, Suspense } from "react";
const Dashboard   = lazy(() => import("./components/Dashboard"));
const Investments = lazy(() => import("./components/Investments"));
const Ledger      = lazy(() => import("./components/Ledger"));
const Feedback    = lazy(() => import("./components/Feedback"));
const Profile     = lazy(() => import("./components/Profile"));

const ALL_NAV = [
  { id: "dashboard",    icon: "📊", label: "Dashboard",    feature: "dashboard"    },
  { id: "add",          icon: "➕", label: "Add",           feature: "add_expense"  },
  { id: "transactions", icon: "📋", label: "Transactions",  feature: "transactions" },
  { id: "budget",       icon: "🎯", label: "Budget",        feature: "budget"       },
  { id: "investments",  icon: "📈", label: "Invest",        feature: "investments"  },
  { id: "ledger",       icon: "🤝", label: "Ledger",        feature: "ledger"       },
  { id: "feedback",     icon: "💬", label: "Feedback",      feature: "feedback"     },
  { id: "profile",      icon: "👤", label: "Profile",       feature: "profile"      },
];

export default function App() {
  const [session,     setSession]     = useState(undefined);
  const [profile,     setProfile]     = useState(null);
  const [page,        setPage]        = useState("dashboard");
  const [budget,      setBudget]      = useState({});
  const [transactions,setTransactions]= useState([]);
  const [flags,       setFlags]       = useState({});   // { feature: { enabled, admin_only } }
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [selYear,  setSelYear]  = useState(now.getFullYear());

  // Inject CSS once
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // Load feature flags (public — no auth needed)
  useEffect(() => {
    supabase.from("feature_flags").select("*").then(({ data }) => {
      if (data) {
        const map = {};
        data.forEach(f => { map[f.feature] = { enabled: f.enabled, admin_only: f.admin_only }; });
        setFlags(map);
      }
    });
  }, []);

  // Load data when logged in
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (session) { loadBudget(); loadTransactions(); loadProfile(); } }, [session]);

  const loadProfile = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    if (data) {
      setProfile(data);
    } else {
      const name = session.user.user_metadata?.display_name || session.user.email.split("@")[0];
      await supabase.from("profiles").upsert({ id: session.user.id, display_name: name, email: session.user.email, is_admin: false });
      setProfile({ display_name: name, email: session.user.email, is_admin: false });
    }
  }, [session]);

  const loadBudget = useCallback(async () => {
    const { data } = await supabase.from("budget").select("*").order("category");
    if (data) { const obj = {}; data.forEach(r => { obj[r.category] = r.amount; }); setBudget(obj); }
  }, []);

  const loadTransactions = useCallback(async () => {
    const { data } = await supabase.from("transactions").select("*").order("date", { ascending: false });
    if (data) setTransactions(data);
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null); setProfile(null); setBudget({}); setTransactions([]);
  };

  const navigate = (p) => { setPage(p); setSidebarOpen(false); };

  // ── Feature flag check ──
  // A nav item is visible if:
  //   1. Flag is enabled
  //   2. If admin_only: user must be admin
  const isVisible = (feature) => {
    const flag = flags[feature];
    if (!flag) return false;
    if (!flag.enabled) return false;
    if (flag.admin_only && !profile?.is_admin) return false;
    return true;
  };

  const NAV = ALL_NAV.filter(n => isVisible(n.feature));

  // Redirect to first visible page if current page becomes hidden
  useEffect(() => {
    if (NAV.length && !NAV.find(n => n.id === page)) {
      setPage(NAV[0].id);
    }
  }, [flags, profile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auth states
  if (session === undefined) return <Loader />;
  if (session === null)      return <Auth onLogin={setSession} />;

  return (
    <div className="mf-app">
      {/* Mobile overlay */}
      <div className={`mf-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* Hamburger */}
      <button className="mf-hamburger" onClick={() => setSidebarOpen(s => !s)}>☰</button>

      {/* Sidebar */}
      <nav className={`mf-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="mf-logo-wrap">
          <div><span className="mf-logo">Monefy</span><span style={{ marginLeft: 6, fontSize: 20 }}>💰</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
            <Avatar profile={profile} size={28} fontSize={12} />
            <div style={{ minWidth: 0 }}>
              <div className="mf-logo-sub" style={{ color: "#e8eaf6", fontSize: 12 }}>{profile?.display_name || session.user.email}</div>
              {profile?.is_admin && <div style={{ fontSize: 10, color: "#ffb830" }}>👑 Admin</div>}
            </div>
          </div>
        </div>

        <div className="mf-nav">
          {NAV.map(n => (
            <div key={n.id} className={`mf-nav-item ${page === n.id ? "active" : ""}`} onClick={() => navigate(n.id)}>
              <span className="mf-nav-icon">{n.icon}</span> {n.label}
            </div>
          ))}
        </div>

        <div className="mf-signout" onClick={signOut}>🚪 Sign Out</div>
      </nav>

      {/* Main content */}
      <main className="mf-main">
        <Suspense fallback={<div style={{ color: "#5a6490", padding: 40, textAlign: "center" }}>Loading…</div>}>
          {page === "dashboard"    && <Dashboard   budget={budget} transactions={transactions} selMonth={selMonth} setSelMonth={setSelMonth} selYear={selYear} setSelYear={setSelYear} />}
          {page === "add"          && <AddExpense   budget={budget} onSaved={loadTransactions} />}
          {page === "transactions" && <Transactions transactions={transactions} onDeleted={loadTransactions} />}
          {page === "budget"       && <Budget       budget={budget} onSaved={loadBudget} />}
          {page === "investments"  && <Investments  session={session} />}
          {page === "ledger"       && <Ledger       session={session} />}
          {page === "feedback"     && <Feedback     session={session} profile={profile} />}
          {page === "profile"      && <Profile      session={session} profile={profile} onProfileUpdated={loadProfile} />}
        </Suspense>
      </main>

      {/* Mobile bottom nav */}
      <div className="mf-bottom-nav">
        <div className="mf-bottom-nav-inner">
          {NAV.map(n => (
            <div key={n.id} className={`mf-bottom-item ${page === n.id ? "active" : ""}`} onClick={() => navigate(n.id)}>
              <span className="mf-bottom-icon">{n.icon}</span>{n.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}