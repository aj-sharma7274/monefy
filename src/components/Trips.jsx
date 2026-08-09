import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { fmt } from "../constants";
import { useConfirm } from "./shared/ConfirmModal";

const EXPENSE_CATEGORIES = [
  { id: "food",       label: "🍽️ Food",        },
  { id: "transport",  label: "🚗 Transport",    },
  { id: "stay",       label: "🏨 Stay",         },
  { id: "activity",   label: "🎯 Activity",     },
  { id: "shopping",   label: "🛍️ Shopping",     },
  { id: "fuel",       label: "⛽ Fuel",         },
  { id: "misc",       label: "📦 Misc",         },
];

const CAT_LABEL = Object.fromEntries(EXPENSE_CATEGORIES.map(c => [c.id, c.label]));

const CARD = { background: "#0d1130", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, padding: "14px 16px" };
const SEC  = { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 14, padding: "18px 22px", marginBottom: 14 };

// ── PDF Export ──
function exportTripPDF(trip, members, expenses) {
  const load = (src) => new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
    const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s);
  });

  const run = async () => {
    if (!window.jspdf) await load("https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js");
    if (!window.jspdf?.jsPDF?.API?.autoTable) await load("https://unpkg.com/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pFmt = (n) => "Rs. " + Math.round(Number(n) || 0).toLocaleString("en-IN");
    const totalExpenses   = expenses.reduce((s, e) => s + e.amount, 0);
    const totalContrib    = members.reduce((s, m) => s + m.contribution, 0);

    // Header
    doc.setFontSize(18); doc.setTextColor(0, 150, 136);
    doc.text("Monefy - Trip Expense Report", 14, 18);
    doc.setFontSize(11); doc.setTextColor(60, 60, 60);
    doc.text(`Trip: ${trip.title}`, 14, 28);
    if (trip.from_place && trip.to_place) doc.text(`Route: ${trip.from_place} → ${trip.to_place}`, 14, 34);
    if (trip.start_date) doc.text(`Dates: ${trip.start_date}${trip.end_date ? ` to ${trip.end_date}` : ""}`, 14, 40);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 46);

    doc.setFontSize(11); doc.setTextColor(0, 150, 136);
    doc.text(`Total Collected: ${pFmt(totalContrib)}`, 14, 54);
    doc.setTextColor(255, 77, 109);
    doc.text(`Total Spent: ${pFmt(totalExpenses)}`, 90, 54);
    doc.setTextColor(totalContrib - totalExpenses >= 0 ? 0 : 255, totalContrib - totalExpenses >= 0 ? 150 : 77, totalContrib - totalExpenses >= 0 ? 136 : 109);
    doc.text(`Balance: ${pFmt(totalContrib - totalExpenses)}`, 160, 54);

    let y = 62;

    // Members table
    doc.autoTable({
      startY: y,
      head: [["Member", "Contribution"]],
      body: members.map(m => [m.name, pFmt(m.contribution)]),
      headStyles: { fillColor: [0, 150, 136] },
      styles: { fontSize: 9 },
      margin: { left: 14 },
      tableWidth: 80,
    });
    y = doc.lastAutoTable.finalY + 8;

    // Expenses table
    doc.autoTable({
      startY: y,
      head: [["Date", "Title", "Category", "Paid By", "Amount"]],
      body: expenses.sort((a, b) => a.date.localeCompare(b.date)).map(e => [
        e.date, e.title, CAT_LABEL[e.category] || e.category, e.paid_by || "-", pFmt(e.amount)
      ]),
      foot: [["", "", "", "Total", pFmt(totalExpenses)]],
      headStyles: { fillColor: [0, 150, 136] },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
      styles: { fontSize: 9 },
    });
    y = doc.lastAutoTable.finalY + 8;

    // Split calculation
    const perHead = totalExpenses / (members.length || 1);
    const splitRows = members.map(m => {
      const paidDirect = expenses.filter(e => e.paid_by === m.name).reduce((s, e) => s + e.amount, 0);
      const share      = perHead;
      const balance    = m.contribution - share;
      return [
        m.name,
        pFmt(m.contribution),
        pFmt(paidDirect) + " (info)",
        pFmt(Math.round(share)),
        balance >= 0 ? `+${pFmt(Math.abs(Math.round(balance)))}` : `-${pFmt(Math.abs(Math.round(balance)))}`,
        balance > 0 ? "Gets back" : balance < 0 ? "Owes more" : "Settled",
      ];
    });

    doc.autoTable({
      startY: y,
      head: [["Member", "Contributed", "Paid For (info)", "Equal Share", "Balance", "Status"]],
      body: splitRows,
      headStyles: { fillColor: [80, 60, 180] },
      styles: { fontSize: 9 },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 4) {
          const val = data.cell.raw;
          data.cell.styles.textColor = val.startsWith("+") ? [0, 150, 100] : [200, 50, 50];
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    doc.save(`Monefy_Trip_${trip.title.replace(/\s+/g, "_")}.pdf`);
  };

  run().catch(err => { console.error("PDF failed:", err); alert("PDF export failed. Check console."); });
}

// ── Main Component ──
export default function Trips({ session }) {
  const [view,     setView]     = useState("list"); // list | detail | add_trip | add_expense | add_member
  const [trips,    setTrips]    = useState([]);
  const [selTrip,  setSelTrip]  = useState(null);
  const [members,  setMembers]  = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [tab,      setTab]      = useState("overview"); // overview | expenses | split
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState(null);
  const { confirm, modal } = useConfirm();

  // Trip form
  const [fTitle,   setFTitle]   = useState("");
  const [fFrom,    setFFrom]    = useState("");
  const [fTo,      setFTo]      = useState("");
  const [fStart,   setFStart]   = useState("");
  const [fEnd,     setFEnd]     = useState("");
  const [fNotes,   setFNotes]   = useState("");

  // Member form
  const [mName,   setMName]   = useState("");
  const [mAmount, setMAmount] = useState("");
  const [mMsg,    setMMsg]    = useState(null);

  // Expense form
  const [eTitle,    setETitle]    = useState("");
  const [eAmount,   setEAmount]   = useState("");
  const [eCategory, setECategory] = useState("food");
  const [eDate,     setEDate]     = useState(new Date().toISOString().slice(0, 10));
  const [ePaidBy,   setEPaidBy]   = useState("");
  const [eNotes,    setENotes]    = useState("");
  const [eMsg,      setEMsg]      = useState(null);

  const loadTrips = useCallback(async () => {
    const { data } = await supabase.from("trips").select("*").eq("user_id", session.user.id).order("start_date", { ascending: false });
    if (data) setTrips(data);
  }, [session]);

  const loadDetail = useCallback(async (trip) => {
    const [{ data: mem }, { data: exp }] = await Promise.all([
      supabase.from("trip_members").select("*").eq("trip_id", trip.id).order("created_at"),
      supabase.from("trip_expenses").select("*").eq("trip_id", trip.id).order("date"),
    ]);
    if (mem) setMembers(mem);
    if (exp) setExpenses(exp);
  }, []);

  useEffect(() => { loadTrips(); }, [loadTrips]);

  const openTrip = (trip) => { setSelTrip(trip); setTab("overview"); loadDetail(trip); setView("detail"); };

  const resetTripForm = () => { setFTitle(""); setFFrom(""); setFTo(""); setFStart(""); setFEnd(""); setFNotes(""); };

  const saveTrip = async () => {
    if (!fTitle.trim()) { setMsg({ t: "err", m: "Trip title is required" }); return; }
    setSaving(true);
    const { data, error } = await supabase.from("trips").insert({
      user_id: session.user.id, title: fTitle.trim(),
      from_place: fFrom.trim() || null, to_place: fTo.trim() || null,
      start_date: fStart || null, end_date: fEnd || null,
      notes: fNotes.trim() || null, status: "active",
    }).select().single();
    setSaving(false);
    if (error) { setMsg({ t: "err", m: "Error saving trip." }); return; }
    resetTripForm();
    await loadTrips();
    openTrip(data);
  };

  const deleteTrip = async (id) => {
    const ok = await confirm({ icon: "🗑️", title: "Delete Trip", message: "This will delete the trip and all its members and expenses.", confirmLabel: "Delete Trip" });
    if (!ok) return;
    await supabase.from("trip_expenses").delete().eq("trip_id", id);
    await supabase.from("trip_members").delete().eq("trip_id", id);
    await supabase.from("trips").delete().eq("id", id);
    setView("list"); loadTrips();
  };

  const markCompleted = async () => {
    const ok = await confirm({ icon: "✅", title: "Mark as Completed", message: "Mark this trip as completed?", confirmLabel: "Complete", danger: false });
    if (!ok) return;
    await supabase.from("trips").update({ status: "completed" }).eq("id", selTrip.id);
    setSelTrip(p => ({ ...p, status: "completed" })); loadTrips();
  };

  const saveMember = async () => {
    if (!mName.trim()) { setMMsg({ t: "err", m: "Name is required" }); return; }
    setSaving(true);
    const { error } = await supabase.from("trip_members").insert({ trip_id: selTrip.id, name: mName.trim(), contribution: parseFloat(mAmount) || 0 });
    setSaving(false);
    if (error) { setMMsg({ t: "err", m: "Error saving." }); return; }
    setMName(""); setMAmount("");
    setMMsg({ t: "ok", m: "Member added! ✓" });
    loadDetail(selTrip);
    setTimeout(() => { setMMsg(null); setView("detail"); }, 1000);
  };

  const deleteMember = async (id) => {
    const ok = await confirm({ icon: "👤", title: "Remove Member", message: "Remove this member from the trip?", confirmLabel: "Remove" });
    if (!ok) return;
    await supabase.from("trip_members").delete().eq("id", id);
    loadDetail(selTrip);
  };

  const saveExpense = async () => {
    if (!eTitle.trim() || !eAmount || !eDate) { setEMsg({ t: "err", m: "Title, amount and date are required" }); return; }
    setSaving(true);
    const { error } = await supabase.from("trip_expenses").insert({
      trip_id: selTrip.id, title: eTitle.trim(), amount: parseFloat(eAmount),
      category: eCategory, date: eDate, paid_by: ePaidBy || null,
      notes: eNotes.trim() || null,
    });
    setSaving(false);
    if (error) { setEMsg({ t: "err", m: "Error saving." }); return; }
    setETitle(""); setEAmount(""); setECategory("food"); setENotes(""); setEPaidBy("");
    setEMsg({ t: "ok", m: "Expense added! ✓" });
    loadDetail(selTrip);
    setTimeout(() => { setEMsg(null); setView("detail"); }, 1000);
  };

  const deleteExpense = async (id) => {
    const ok = await confirm({ icon: "🗑️", title: "Delete Expense", message: "Remove this expense?", confirmLabel: "Delete" });
    if (!ok) return;
    await supabase.from("trip_expenses").delete().eq("id", id);
    loadDetail(selTrip);
  };

  // ── Computed split ──
  // Contribution = advance collected upfront
  // Paid By = informational only (who handled the cash from pool)
  // Balance = Contribution − Equal Share
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalContrib  = members.reduce((s, m) => s + m.contribution, 0);
  const perHead       = members.length ? totalExpenses / members.length : 0;

  const splitData = members.map(m => {
    const share      = perHead;
    const balance    = m.contribution - share; // purely contribution vs share
    const paidDirect = expenses
      .filter(e => e.paid_by === m.name)
      .reduce((s, e) => s + e.amount, 0);
    return { ...m, paidDirect, share, balance };
  });

  // ────────────────────────────────────────────────────────
  // ── VIEWS ──
  // ────────────────────────────────────────────────────────

  // ── Add Trip ──
  if (view === "add_trip") return (
    <div>
      {modal}
      <div className="mf-back-btn" onClick={() => { setView("list"); setMsg(null); }}>← Back to Trips</div>
      <div className="mf-topbar"><h2>New Trip</h2></div>
      <div style={{ ...SEC, maxWidth: 540 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="mf-form-group">
            <label className="mf-form-label">Trip Title *</label>
            <input type="text" className="mf-inp" value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="e.g. Goa Trip 2026, Manali Adventure" />
          </div>
          <div className="mf-form-grid">
            <div className="mf-form-group">
              <label className="mf-form-label">From</label>
              <input type="text" className="mf-inp" value={fFrom} onChange={e => setFFrom(e.target.value)} placeholder="e.g. Bhopal" />
            </div>
            <div className="mf-form-group">
              <label className="mf-form-label">To</label>
              <input type="text" className="mf-inp" value={fTo} onChange={e => setFTo(e.target.value)} placeholder="e.g. Goa" />
            </div>
            <div className="mf-form-group">
              <label className="mf-form-label">Start Date</label>
              <input type="date" className="mf-inp" value={fStart} onChange={e => setFStart(e.target.value)} />
            </div>
            <div className="mf-form-group">
              <label className="mf-form-label">End Date</label>
              <input type="date" className="mf-inp" value={fEnd} onChange={e => setFEnd(e.target.value)} />
            </div>
          </div>
          <div className="mf-form-group">
            <label className="mf-form-label">Notes</label>
            <textarea className="mf-textarea" value={fNotes} onChange={e => setFNotes(e.target.value)} placeholder="Any notes about this trip…" style={{ minHeight: 60 }} />
          </div>
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <button className="mf-btn-p" onClick={saveTrip} disabled={saving}>{saving ? "Saving…" : "Create Trip"}</button>
          <button className="mf-btn-g" onClick={() => { setView("list"); resetTripForm(); }}>Cancel</button>
        </div>
        {msg && <div className={msg.t === "ok" ? "mf-msg-ok" : "mf-msg-err"}>{msg.m}</div>}
      </div>
    </div>
  );

  // ── Add Member ──
  if (view === "add_member") return (
    <div>
      {modal}
      <div className="mf-back-btn" onClick={() => setView("detail")}>← Back to {selTrip?.title}</div>
      <div className="mf-topbar"><h2>Add Member</h2></div>
      <div style={{ ...SEC, maxWidth: 460 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="mf-form-group">
            <label className="mf-form-label">Member Name *</label>
            <input type="text" className="mf-inp" value={mName} onChange={e => setMName(e.target.value)} placeholder="e.g. Rahul, Priya" />
          </div>
          <div className="mf-form-group">
            <label className="mf-form-label">Contribution (₹)</label>
            <input type="number" className="mf-inp" value={mAmount} onChange={e => setMAmount(e.target.value)} placeholder="0" />
          </div>
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <button className="mf-btn-p" onClick={saveMember} disabled={saving}>{saving ? "Saving…" : "Add Member"}</button>
          <button className="mf-btn-g" onClick={() => setView("detail")}>Cancel</button>
        </div>
        {mMsg && <div className={mMsg.t === "ok" ? "mf-msg-ok" : "mf-msg-err"}>{mMsg.m}</div>}
      </div>
    </div>
  );

  // ── Add Expense ──
  if (view === "add_expense") return (
    <div>
      {modal}
      <div className="mf-back-btn" onClick={() => setView("detail")}>← Back to {selTrip?.title}</div>
      <div className="mf-topbar"><h2>Add Expense</h2></div>
      <div style={{ ...SEC, maxWidth: 520 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="mf-form-group">
            <label className="mf-form-label">Title *</label>
            <input type="text" className="mf-inp" value={eTitle} onChange={e => setETitle(e.target.value)} placeholder="e.g. Dinner at beach, Cab to airport" />
          </div>
          <div className="mf-form-grid">
            <div className="mf-form-group">
              <label className="mf-form-label">Amount (₹) *</label>
              <input type="number" className="mf-inp" value={eAmount} onChange={e => setEAmount(e.target.value)} placeholder="0" />
            </div>
            <div className="mf-form-group">
              <label className="mf-form-label">Date *</label>
              <input type="date" className="mf-inp" value={eDate} onChange={e => setEDate(e.target.value)} />
            </div>
          </div>
          <div className="mf-form-grid">
            <div className="mf-form-group">
              <label className="mf-form-label">Category</label>
              <select className="mf-inp" value={eCategory} onChange={e => setECategory(e.target.value)}>
                {EXPENSE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="mf-form-group">
              <label className="mf-form-label">Paid By</label>
              <select className="mf-inp" value={ePaidBy} onChange={e => setEPaidBy(e.target.value)}>
                <option value="">— Select member —</option>
                {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div className="mf-form-group">
            <label className="mf-form-label">Notes</label>
            <input type="text" className="mf-inp" value={eNotes} onChange={e => setENotes(e.target.value)} placeholder="Any additional note…" />
          </div>
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <button className="mf-btn-p" onClick={saveExpense} disabled={saving}>{saving ? "Saving…" : "Add Expense"}</button>
          <button className="mf-btn-g" onClick={() => setView("detail")}>Cancel</button>
        </div>
        {eMsg && <div className={eMsg.t === "ok" ? "mf-msg-ok" : "mf-msg-err"}>{eMsg.m}</div>}
      </div>
    </div>
  );

  // ── Trip Detail ──
  if (view === "detail" && selTrip) {
    const byCategory = EXPENSE_CATEGORIES.map(c => ({
      ...c, total: expenses.filter(e => e.category === c.id).reduce((s, e) => s + e.amount, 0)
    })).filter(c => c.total > 0);

    return (
      <div>
        {modal}
        <div className="mf-back-btn" onClick={() => { setView("list"); setSelTrip(null); }}>← Back to Trips</div>

        {/* Trip header */}
        <div style={{ ...CARD, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#e8eaf6" }}>{selTrip.title}</h2>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: selTrip.status === "completed" ? "rgba(0,214,143,.12)" : "rgba(0,229,204,.12)", color: selTrip.status === "completed" ? "#00d68f" : "#00e5cc", fontWeight: 600 }}>
                  {selTrip.status === "completed" ? "✓ Completed" : "● Active"}
                </span>
              </div>
              {selTrip.from_place && selTrip.to_place && <div style={{ fontSize: 13, color: "#9ba5c9" }}>📍 {selTrip.from_place} → {selTrip.to_place}</div>}
              {selTrip.start_date && <div style={{ fontSize: 12, color: "#5a6490", marginTop: 3 }}>📅 {selTrip.start_date}{selTrip.end_date && ` to ${selTrip.end_date}`}</div>}
              {selTrip.notes && <div style={{ fontSize: 12, color: "#9ba5c9", marginTop: 4 }}>{selTrip.notes}</div>}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {selTrip.status === "active" && <button onClick={markCompleted} style={{ padding: "8px 14px", borderRadius: 9, border: "1px solid rgba(0,214,143,.3)", background: "rgba(0,214,143,.08)", color: "#00d68f", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>✓ Complete</button>}
              <button className="mf-btn-d" onClick={() => deleteTrip(selTrip.id)}>🗑 Delete</button>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, marginBottom: 14 }}>
          <div style={{ ...CARD, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#5a6490", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 6 }}>Total Collected</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#00e5cc" }}>{fmt(totalContrib)}</div>
            <div style={{ fontSize: 10, color: "#5a6490", marginTop: 4 }}>{members.length} members</div>
          </div>
          <div style={{ ...CARD, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#5a6490", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 6 }}>Total Spent</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#ff4d8d" }}>{fmt(totalExpenses)}</div>
            <div style={{ fontSize: 10, color: "#5a6490", marginTop: 4 }}>{expenses.length} expenses</div>
          </div>
          <div style={{ ...CARD, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#5a6490", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 6 }}>Remaining</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: totalContrib - totalExpenses >= 0 ? "#00d68f" : "#ff4d6d" }}>{fmt(Math.abs(totalContrib - totalExpenses))}</div>
            <div style={{ fontSize: 10, color: totalContrib - totalExpenses >= 0 ? "#00d68f" : "#ff4d6d", marginTop: 4 }}>{totalContrib - totalExpenses >= 0 ? "surplus" : "overspent"}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 16, background: "#0d1130", borderRadius: 10, border: "1px solid rgba(255,255,255,.07)", overflow: "hidden" }}>
          {[["overview", "👥 Overview"], ["expenses", "💸 Expenses"], ["split", "⚖️ Split"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "10px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: tab === id ? "rgba(0,229,204,.12)" : "transparent", color: tab === id ? "#00e5cc" : "#5a6490", transition: "all .15s" }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {tab === "overview" && (
          <div>
            <div style={SEC}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div className="mf-sec-title" style={{ marginBottom: 0 }}>Members & Contributions</div>
                <button className="mf-btn-p" onClick={() => setView("add_member")}>+ Add Member</button>
              </div>
              {members.length === 0
                ? <div style={{ color: "#5a6490", fontSize: 13, padding: "16px 0", textAlign: "center" }}>No members yet. Add members to track contributions.</div>
                : members.map(m => (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(0,229,204,.1)", border: "1px solid rgba(0,229,204,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#00e5cc", flexShrink: 0 }}>
                          {m.name[0].toUpperCase()}
                        </div>
                        <span style={{ fontSize: 14, color: "#e8eaf6", fontWeight: 500 }}>{m.name}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#00e5cc" }}>{fmt(m.contribution)}</span>
                        <button className="mf-btn-d" style={{ fontSize: 11, padding: "3px 8px" }} onClick={() => deleteMember(m.id)}>🗑</button>
                      </div>
                    </div>
                  ))
              }
            </div>
            {byCategory.length > 0 && (
              <div style={SEC}>
                <div className="mf-sec-title">Spending by Category</div>
                {byCategory.map(c => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: "#9ba5c9", width: 110, flexShrink: 0 }}>{c.label}</span>
                    <div style={{ flex: 1, height: 7, background: "rgba(255,255,255,.07)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(100, (c.total / totalExpenses) * 100)}%`, background: "#00e5cc", borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 12, color: "#e8eaf6", fontWeight: 600, flexShrink: 0, width: 80, textAlign: "right" }}>{fmt(c.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Expenses Tab ── */}
        {tab === "expenses" && (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <button className="mf-btn-p" onClick={() => setView("add_expense")}>+ Add Expense</button>
            </div>
            <div style={SEC}>
              <div className="mf-sec-title">{expenses.length} Expense{expenses.length !== 1 ? "s" : ""}</div>
              {expenses.length === 0
                ? <div style={{ color: "#5a6490", fontSize: 13, padding: "16px 0", textAlign: "center" }}>No expenses yet. Add the first one!</div>
                : [...expenses].sort((a, b) => a.date.localeCompare(b.date)).map(e => (
                    <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.05)", gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#e8eaf6" }}>{e.title}</span>
                          <span style={{ fontSize: 10, background: "rgba(255,255,255,.06)", color: "#9ba5c9", padding: "1px 6px", borderRadius: 99 }}>{CAT_LABEL[e.category] || e.category}</span>
                          {e.paid_by && <span style={{ fontSize: 10, background: "rgba(0,229,204,.08)", color: "#00e5cc", padding: "1px 6px", borderRadius: 99 }}>💳 {e.paid_by}</span>}
                        </div>
                        <div style={{ fontSize: 11, color: "#5a6490", marginTop: 2 }}>📅 {e.date}{e.notes && ` · ${e.notes}`}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#ff4d8d" }}>{fmt(e.amount)}</span>
                        <button className="mf-btn-d" style={{ fontSize: 11, padding: "3px 8px" }} onClick={() => deleteExpense(e.id)}>🗑</button>
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>
        )}

        {/* ── Split Tab ── */}
        {tab === "split" && (
          <div>
            {/* Summary + PDF export */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
              <div style={{ fontSize: 13, color: "#9ba5c9" }}>
                Equal split · <strong style={{ color: "#e8eaf6" }}>{fmt(Math.round(perHead))}</strong> per person · {members.length} members
              </div>
              <button className="mf-btn-g" onClick={() => exportTripPDF(selTrip, members, expenses)}>📄 Export PDF</button>
            </div>

            {/* Overall summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div style={{ ...CARD, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#5a6490", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 6 }}>Total Collected</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#00e5cc" }}>{fmt(totalContrib)}</div>
              </div>
              <div style={{ ...CARD, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#5a6490", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 6 }}>Total Spent</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#ff4d8d" }}>{fmt(totalExpenses)}</div>
              </div>
              <div style={{ ...CARD, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#5a6490", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 6 }}>Pool Balance</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: totalContrib - totalExpenses >= 0 ? "#00d68f" : "#ff4d6d" }}>
                  {totalContrib - totalExpenses >= 0 ? "+" : ""}{fmt(totalContrib - totalExpenses)}
                </div>
              </div>
            </div>

            {members.length === 0
              ? <div style={{ ...CARD, textAlign: "center", padding: "32px 20px", color: "#5a6490" }}>Add members first to calculate the split.</div>
              : (
                <div style={SEC}>
                  <div className="mf-sec-title">Per Member Settlement</div>
                  {splitData.map(m => (
                    <div key={m.id} style={{ padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,229,204,.1)", border: "1px solid rgba(0,229,204,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#00e5cc", flexShrink: 0 }}>
                            {m.name[0].toUpperCase()}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#e8eaf6" }}>{m.name}</span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: m.balance >= 0 ? "#00d68f" : "#ff4d6d" }}>
                            {m.balance >= 0 ? "+" : ""}{fmt(Math.abs(Math.round(m.balance)))}
                          </div>
                          <div style={{ fontSize: 11, color: m.balance >= 0 ? "#00d68f" : "#ff4d6d", marginTop: 2 }}>
                            {m.balance > 0 ? "gets back" : m.balance < 0 ? "needs to pay" : "settled ✓"}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                        {[
                          { label: "Contributed", val: fmt(m.contribution), color: "#00e5cc" },
                          { label: "Equal Share", val: fmt(Math.round(m.share)), color: "#ff4d8d" },
                          { label: "Paid for Group", val: fmt(m.paidDirect), color: "#9ba5c9", note: "informational" },
                        ].map((s, i) => (
                          <div key={i} style={{ background: "rgba(255,255,255,.03)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                            <div style={{ fontSize: 9, color: "#5a6490", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 4 }}>{s.label}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: s.color }}>{s.val}</div>
                            {s.note && <div style={{ fontSize: 9, color: "#5a6490", marginTop: 2 }}>({s.note})</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}
      </div>
    );
  }

  // ── Trip List ──
  return (
    <div>
      {modal}
      <div className="mf-topbar">
        <h2>Trips</h2>
        <button className="mf-btn-p" onClick={() => { resetTripForm(); setView("add_trip"); }}>+ New Trip</button>
      </div>

      {trips.length === 0
        ? <div style={{ ...CARD, textAlign: "center", padding: "48px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✈️</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#e8eaf6", marginBottom: 6 }}>No trips yet</div>
            <div style={{ fontSize: 13, color: "#5a6490", marginBottom: 20 }}>Create a trip to start tracking shared expenses</div>
            <button className="mf-btn-p" onClick={() => { resetTripForm(); setView("add_trip"); }}>Create First Trip</button>
          </div>
        : trips.map(trip => {
            const isCompleted = trip.status === "completed";
            return (
              <div key={trip.id} onClick={() => openTrip(trip)} style={{ ...CARD, cursor: "pointer", marginBottom: 12, transition: "border-color .2s", borderColor: "rgba(255,255,255,.07)" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(0,229,204,.3)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.07)"}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#e8eaf6" }}>{trip.title}</span>
                      <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 99, background: isCompleted ? "rgba(0,214,143,.12)" : "rgba(0,229,204,.1)", color: isCompleted ? "#00d68f" : "#00e5cc", fontWeight: 600 }}>
                        {isCompleted ? "✓ Completed" : "● Active"}
                      </span>
                    </div>
                    {trip.from_place && trip.to_place && <div style={{ fontSize: 12, color: "#9ba5c9" }}>📍 {trip.from_place} → {trip.to_place}</div>}
                    {trip.start_date && <div style={{ fontSize: 11, color: "#5a6490", marginTop: 2 }}>📅 {trip.start_date}{trip.end_date && ` to ${trip.end_date}`}</div>}
                  </div>
                  <div style={{ fontSize: 12, color: "#5a6490", flexShrink: 0 }}>tap to view →</div>
                </div>
              </div>
            );
          })
      }
    </div>
  );
}