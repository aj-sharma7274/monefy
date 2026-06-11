export const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
export const MONTHS_SHORT = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec"
];
export const YEARS = [2024, 2025, 2026, 2027];

export const PIE_COLORS = [
  "#00e5cc","#ff4d8d","#ffb830","#00d68f","#a78bfa",
  "#60a5fa","#f97316","#34d399","#fb7185","#818cf8","#fbbf24","#4ade80"
];

export const fmt  = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
export const pct  = (a, b) => b === 0 ? 0 : Math.min(Math.round((a / b) * 100), 999);

export const timeAgo = (ts) => {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60)    return "just now";
  if (s < 3600)  return Math.floor(s / 60)   + "m ago";
  if (s < 86400) return Math.floor(s / 3600)  + "h ago";
  return Math.floor(s / 86400) + "d ago";
};

export const avatarColor = (name) => {
  const colors = ["#00e5cc","#ff4d8d","#a78bfa","#60a5fa","#ffb830","#00d68f","#f97316"];
  let h = 0;
  for (let c of (name || "?")) h = c.charCodeAt(0) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
};
export const avatarInitial = (name) => (name || "?")[0].toUpperCase();

export const ADMIN_EMAIL_CHECK = (profile) => profile?.is_admin === true;

// Global CSS string
export const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #07091a; color: #e8eaf6; font-family: system-ui, sans-serif; }
  input, select, button, textarea { font-family: inherit; }
  input[type=number]::-webkit-inner-spin-button { opacity: 1; }

  .mf-app { display: flex; min-height: 100vh; }
  .mf-sidebar { width:220px; background:#0d1130; border-right:1px solid rgba(255,255,255,.07); display:flex; flex-direction:column; position:fixed; top:0; left:0; height:100vh; z-index:200; transition:transform .25s; }
  .mf-logo-wrap { padding:22px 18px 18px; border-bottom:1px solid rgba(255,255,255,.07); }
  .mf-logo { font-size:21px; font-weight:800; background:linear-gradient(135deg,#00e5cc,#ff4d8d); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; color:transparent; display:inline-block; }
  .mf-logo-sub { font-size:11px; color:#5a6490; margin-top:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .mf-nav { flex:1; padding:10px 0; overflow-y:auto; }
  .mf-nav-item { display:flex; align-items:center; gap:11px; padding:11px 18px; cursor:pointer; font-size:13.5px; font-weight:500; color:#9ba5c9; border-left:3px solid transparent; transition:all .15s; }
  .mf-nav-item:hover { background:rgba(255,255,255,.03); color:#e8eaf6; }
  .mf-nav-item.active { background:rgba(0,229,204,.08); color:#00e5cc; border-left-color:#00e5cc; }
  .mf-nav-icon { font-size:16px; width:20px; text-align:center; }
  .mf-signout { padding:14px 18px; border-top:1px solid rgba(255,255,255,.06); display:flex; align-items:center; gap:10px; cursor:pointer; color:#5a6490; font-size:13px; }
  .mf-signout:hover { color:#ff4d6d; }
  .mf-hamburger { display:none; position:fixed; top:14px; left:14px; z-index:300; background:#0d1130; border:1px solid rgba(255,255,255,.1); border-radius:8px; padding:8px 10px; cursor:pointer; font-size:18px; color:#e8eaf6; }
  .mf-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:150; }
  .mf-main { margin-left:220px; padding:28px 30px 100px; flex:1; min-height:100vh; }
  .mf-bottom-nav { display:none; position:fixed; bottom:0; left:0; right:0; background:#0d1130; border-top:1px solid rgba(255,255,255,.07); z-index:200; padding:6px 0; }
  .mf-bottom-nav-inner { display:flex; justify-content:space-around; }
  .mf-bottom-item { display:flex; flex-direction:column; align-items:center; gap:2px; padding:5px 4px; cursor:pointer; color:#5a6490; font-size:8px; transition:color .15s; min-width:0; }
  .mf-bottom-item.active { color:#00e5cc; }
  .mf-bottom-icon { font-size:18px; }
  .mf-topbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:22px; flex-wrap:wrap; gap:10px; }
  .mf-topbar h2 { font-size:21px; font-weight:700; }
  .mf-filters { display:flex; gap:8px; flex-wrap:wrap; }
  .mf-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:14px; margin-bottom:20px; }
  .mf-card { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); border-radius:14px; padding:16px 18px; }
  .mf-card-label { font-size:10px; color:#5a6490; text-transform:uppercase; letter-spacing:.8px; margin-bottom:8px; }
  .mf-card-val { font-size:20px; font-weight:700; }
  .mf-card-sub { font-size:10px; color:#5a6490; margin-top:4px; }
  .mf-sec { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); border-radius:14px; padding:18px 22px; margin-bottom:16px; }
  .mf-sec-title { font-size:10px; font-weight:600; color:#5a6490; text-transform:uppercase; letter-spacing:.8px; margin-bottom:14px; }
  .mf-inp { background:#131840; border:1px solid rgba(255,255,255,.1); color:#e8eaf6; padding:10px 14px; border-radius:9px; font-size:14px; outline:none; width:100%; display:block; transition:border-color .2s; }
  .mf-inp:focus { border-color:#00e5cc; }
  .mf-textarea { background:#131840; border:1px solid rgba(255,255,255,.1); color:#e8eaf6; padding:10px 14px; border-radius:9px; font-size:14px; outline:none; width:100%; display:block; transition:border-color .2s; resize:vertical; min-height:80px; }
  .mf-textarea:focus { border-color:#00e5cc; }
  .mf-sel { background:#131840; border:1px solid rgba(255,255,255,.1); color:#e8eaf6; padding:7px 12px; border-radius:8px; font-size:13px; cursor:pointer; outline:none; }
  .mf-sel:focus { border-color:#00e5cc; }
  .mf-btn-p { padding:10px 22px; border-radius:9px; border:none; cursor:pointer; font-size:14px; font-weight:600; background:linear-gradient(135deg,#00e5cc,#00b8a4); color:#07091a; transition:opacity .15s,transform .15s; }
  .mf-btn-p:hover { opacity:.9; transform:translateY(-1px); }
  .mf-btn-p:disabled { opacity:.6; cursor:not-allowed; transform:none; }
  .mf-btn-d { padding:5px 12px; border-radius:7px; cursor:pointer; font-size:12px; border:1px solid rgba(255,77,109,.3); background:rgba(255,77,109,.1); color:#ff4d6d; white-space:nowrap; }
  .mf-btn-g { padding:10px 18px; border-radius:9px; cursor:pointer; font-size:13px; border:1px solid rgba(255,255,255,.1); background:rgba(255,255,255,.04); color:#9ba5c9; }
  .mf-btn-sm { padding:6px 14px; border-radius:7px; border:none; cursor:pointer; font-size:12px; font-weight:600; background:linear-gradient(135deg,#00e5cc,#00b8a4); color:#07091a; }
  .mf-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .mf-form-group { display:flex; flex-direction:column; gap:6px; }
  .mf-form-group.full { grid-column:1 / -1; }
  .mf-form-label { font-size:11px; color:#5a6490; text-transform:uppercase; letter-spacing:.7px; }
  .mf-table-wrap { overflow-x:auto; -webkit-overflow-scrolling:touch; }
  .mf-table { width:100%; border-collapse:collapse; font-size:13px; }
  .mf-table th { font-size:10px; color:#5a6490; text-transform:uppercase; letter-spacing:.7px; padding:8px 10px; text-align:left; border-bottom:1px solid rgba(255,255,255,.08); white-space:nowrap; }
  .mf-table td { padding:10px 10px; border-bottom:1px solid rgba(255,255,255,.04); color:#9ba5c9; }
  .mf-table tr:last-child td { border-bottom:none; }
  .mf-chip { display:inline-block; background:rgba(255,255,255,.07); color:#9ba5c9; border-radius:5px; padding:2px 8px; font-size:11px; white-space:nowrap; }
  .mf-prog-item { margin-bottom:12px; }
  .mf-prog-meta { display:flex; justify-content:space-between; font-size:12px; margin-bottom:5px; }
  .mf-prog-bg { height:6px; background:rgba(255,255,255,.07); border-radius:99px; overflow:hidden; }
  .mf-prog-fill { height:100%; border-radius:99px; transition:width .5s; }
  .mf-back-btn { display:inline-flex; align-items:center; gap:6px; cursor:pointer; color:#5a6490; font-size:13px; margin-bottom:18px; padding:6px 0; }
  .mf-back-btn:hover { color:#00e5cc; }
  .mf-msg-ok  { font-size:13px; color:#00d68f; margin-top:10px; }
  .mf-msg-err { font-size:13px; color:#ff4d6d; margin-top:10px; }
  .mf-divider { height:1px; background:rgba(255,255,255,.07); margin:20px 0; }
  .mf-auth-tabs { display:flex; gap:0; margin-bottom:28px; border-radius:10px; overflow:hidden; border:1px solid rgba(255,255,255,.08); }
  .mf-auth-tab { flex:1; padding:10px; text-align:center; cursor:pointer; font-size:13px; font-weight:600; color:#5a6490; background:transparent; border:none; transition:all .2s; }
  .mf-auth-tab.active { background:rgba(0,229,204,.1); color:#00e5cc; }
  .mf-person-card { background:#0d1130; border:1px solid rgba(255,255,255,.07); border-radius:12px; padding:14px 16px; cursor:pointer; transition:border-color .2s; margin-bottom:10px; }
  .mf-person-card:hover { border-color:rgba(0,229,204,.3); }
  .mf-entry-row { display:flex; align-items:flex-start; gap:12px; padding:12px 0; border-bottom:1px solid rgba(255,255,255,.05); }
  .mf-entry-row:last-child { border-bottom:none; }
  .mf-entry-icon { width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; }
  .mf-thread-card { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); border-radius:12px; padding:16px 20px; margin-bottom:12px; cursor:pointer; transition:border-color .2s,background .2s; }
  .mf-thread-card:hover { border-color:rgba(0,229,204,.3); background:rgba(0,229,204,.04); }
  .mf-thread-title { font-size:15px; font-weight:600; color:#e8eaf6; margin-bottom:6px; }
  .mf-thread-body { font-size:13px; color:#9ba5c9; margin-bottom:10px; line-height:1.5; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
  .mf-thread-meta { display:flex; gap:14px; font-size:11px; color:#5a6490; flex-wrap:wrap; }
  .mf-tag { display:inline-block; padding:2px 8px; border-radius:99px; font-size:10px; font-weight:600; }
  .mf-tag-feature   { background:rgba(0,229,204,.12);   color:#00e5cc; }
  .mf-tag-bug       { background:rgba(255,77,109,.12);   color:#ff4d6d; }
  .mf-tag-complaint { background:rgba(255,184,48,.12);   color:#ffb830; }
  .mf-tag-other     { background:rgba(255,255,255,.08);  color:#9ba5c9; }
  .mf-comment { display:flex; align-items:flex-start; gap:12px; padding:14px 0; border-bottom:1px solid rgba(255,255,255,.05); }
  .mf-comment:last-child { border-bottom:none; }
  .mf-modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.6); z-index:1000; display:flex; align-items:center; justify-content:center; padding:16px; }
  .mf-modal { background:#0d1130; border:1px solid rgba(255,255,255,.1); border-radius:16px; padding:28px 28px 22px; max-width:360px; width:100%; box-shadow:0 24px 60px rgba(0,0,0,.5); }
  .mf-modal-icon { font-size:32px; text-align:center; margin-bottom:12px; }
  .mf-modal-title { font-size:16px; font-weight:700; color:#e8eaf6; margin-bottom:8px; text-align:center; }
  .mf-modal-msg { font-size:13px; color:#9ba5c9; text-align:center; line-height:1.5; margin-bottom:22px; }
  .mf-modal-btns { display:flex; gap:10px; justify-content:center; }
  .mf-modal-cancel { padding:9px 22px; border-radius:8px; border:1px solid rgba(255,255,255,.1); background:rgba(255,255,255,.04); color:#9ba5c9; cursor:pointer; font-size:13px; font-weight:500; }
  .mf-modal-ok { padding:9px 22px; border-radius:8px; border:none; background:linear-gradient(135deg,#ff4d6d,#cc3a55); color:#fff; cursor:pointer; font-size:13px; font-weight:600; }
  .mf-modal-ok.cyan { background:linear-gradient(135deg,#00e5cc,#00b8a4); color:#07091a; }
  @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-10px)} 75%{transform:translateX(10px)} }
  @media (max-width:768px) {
    .mf-sidebar { transform:translateX(-100%); }
    .mf-sidebar.open { transform:translateX(0); box-shadow:4px 0 30px rgba(0,0,0,.6); }
    .mf-overlay.open { display:block; }
    .mf-hamburger { display:flex; align-items:center; }
    .mf-logo-wrap { padding-top:52px; }
    .mf-main { margin-left:0; padding:70px 16px 90px; }
    .mf-bottom-nav { display:flex; }
    .mf-form-grid { grid-template-columns:1fr; }
    .mf-form-group.full { grid-column:1; }
    .mf-topbar h2 { font-size:18px; }
    .mf-cards { grid-template-columns:1fr 1fr; }
  }
  @media (max-width:480px) {
    .mf-cards { gap:10px; }
    .mf-card { padding:12px 14px; }
    .mf-card-val { font-size:17px; }
    .mf-sec { padding:14px 14px; }
  }
`;