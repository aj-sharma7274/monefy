import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { fmt } from "../constants";
import { useConfirm } from "./shared/ConfirmModal";

const INV_TYPES = {
  fd:         { label: "Fixed Deposit",    icon: "🏦", color: "#00e5cc" },
  rd:         { label: "Recurring Deposit",icon: "📅", color: "#60a5fa" },
  ppf:        { label: "PPF",              icon: "🏛️", color: "#a78bfa" },
  mutualfund: { label: "Mutual Fund",      icon: "📈", color: "#00d68f" },
  stocks:     { label: "Stocks",           icon: "📊", color: "#ffb830" },
  committee:  { label: "Committee",        icon: "🤝", color: "#ff4d8d" },
};

const CARD = { background: "#0d1130", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, padding: "14px 16px" };
const SEC  = { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 14, padding: "18px 22px", marginBottom: 14 };

// FD current value: simple daily-accrued interest from start_date to today (capped at maturity_date)
function calcFDCurrentValue(inv) {
  if (!inv.start_date || !inv.interest_rate) return inv.amount;
  const start = new Date(inv.start_date);
  const end   = inv.maturity_date ? new Date(inv.maturity_date) : null;
  const today = new Date();
  const asOf  = end && today > end ? end : today;
  const daysElapsed = Math.max(0, Math.floor((asOf - start) / 86400000));
  const dailyRate = (inv.interest_rate / 100) / 365;
  const value = inv.amount * (1 + dailyRate * daysElapsed);
  return Math.round(value);
}

export default function Investments({ session }) {
  const [investments,  setInvestments]  = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selInv,       setSelInv]       = useState(null);
  const [addingType,   setAddingType]   = useState(null);
  const [addingTxn,    setAddingTxn]    = useState(false);
  const [msg,          setMsg]          = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [editingVal,   setEditingVal]   = useState(false);
  const [newVal,       setNewVal]       = useState("");
  const { confirm, modal } = useConfirm();

  // Investment form
  const [fName,         setFName]         = useState("");
  const [fAmount,       setFAmount]       = useState("");
  const [fStartDate,    setFStartDate]    = useState("");
  const [fMatDate,      setFMatDate]      = useState("");
  const [fMatAmount,    setFMatAmount]    = useState("");
  const [fNotes,        setFNotes]        = useState("");
  const [fCurrentValue, setFCurrentValue] = useState("");
  const [fFundName,     setFFundName]     = useState("");
  const [fInterestRate, setFInterestRate] = useState("");

  // Transaction form
  const [tDate,       setTDate]       = useState(new Date().toISOString().slice(0, 10));
  const [tAmount,     setTAmount]     = useState("");
  const [tNote,       setTNote]       = useState("");
  const [tRecurring,  setTRecurring]  = useState(false);
  const [tWithdrawal, setTWithdrawal] = useState(false);
  const [tMsg,        setTMsg]        = useState(null);

  const load = useCallback(async () => {
    const { data: inv } = await supabase.from("investments").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false });
    const { data: txn } = await supabase.from("investment_txns").select("*").eq("user_id", session.user.id).order("date", { ascending: false });
    if (inv) setInvestments(inv);
    if (txn) setTransactions(txn);
  }, [session]);

  useEffect(() => { load(); }, [load]);

  const loadTxns = useCallback(async (invId) => {
    const { data } = await supabase.from("investment_txns").select("*").eq("investment_id", invId).order("date", { ascending: false });
    if (data) setTransactions(data);
  }, []);

  const resetForm = () => { setFName(""); setFAmount(""); setFStartDate(""); setFMatDate(""); setFMatAmount(""); setFNotes(""); setFCurrentValue(""); setFFundName(""); setFInterestRate(""); };

  const saveInvestment = async () => {
    if (!fName.trim() || !fStartDate) { setMsg({ t: "err", m: "Name and start date are required" }); return; }
    if (addingType === "fd" && !fMatDate) { setMsg({ t: "err", m: "Maturity date is required for Fixed Deposits" }); return; }
    setSaving(true);
    const { error } = await supabase.from("investments").insert({
      user_id: session.user.id, type: addingType, name: fName.trim(),
      amount: parseFloat(fAmount) || 0, start_date: fStartDate,
      maturity_date: fMatDate || null, maturity_amount: parseFloat(fMatAmount) || 0,
      current_value: parseFloat(fCurrentValue) || parseFloat(fAmount) || 0,
      interest_rate: parseFloat(fInterestRate) || null,
      fund_name: fFundName.trim() || null, notes: fNotes.trim() || null, status: "active",
    });
    setSaving(false);
    if (error) { setMsg({ t: "err", m: "Error saving." }); return; }
    setMsg({ t: "ok", m: "Investment added! ✓" });
    resetForm(); setAddingType(null); load();
    setTimeout(() => setMsg(null), 1500);
  };

  const updateCurrentValue = async (id, val) => {
    await supabase.from("investments").update({ current_value: parseFloat(val) || 0 }).eq("id", id);
    setSelInv(p => ({ ...p, current_value: parseFloat(val) || 0 }));
    setEditingVal(false); load();
  };

  const markWithdrawn = async (inv) => {
    const ok = await confirm({ icon: "✅", title: "Mark as Withdrawn", message: `Mark "${inv.name}" as withdrawn? It won't count in active portfolio.`, confirmLabel: "Withdraw", danger: false });
    if (!ok) return;
    await supabase.from("investments").update({ status: "withdrawn" }).eq("id", inv.id);
    setSelInv(p => (p && p.id === inv.id) ? { ...p, status: "withdrawn" } : p);
    load();
  };

  const deleteInvestment = async (id) => {
    const ok = await confirm({ icon: "🗑️", title: "Delete Investment", message: "This will delete the investment and all its records.", confirmLabel: "Delete" });
    if (!ok) return;
    await supabase.from("investment_txns").delete().eq("investment_id", id);
    await supabase.from("investments").delete().eq("id", id);
    setSelInv(null); load();
  };

  const saveTxn = async () => {
    if (!tAmount || !tDate) { setTMsg({ t: "err", m: "Amount and date required" }); return; }
    setSaving(true);
    const { error } = await supabase.from("investment_txns").insert({
      user_id: session.user.id, investment_id: selInv.id,
      date: tDate, amount: parseFloat(tAmount), note: tNote.trim() || null,
      recurring: tRecurring, is_withdrawal: tWithdrawal,
    });
    setSaving(false);
    if (error) { setTMsg({ t: "err", m: "Error saving." }); return; }
    setTMsg({ t: "ok", m: "Transaction added! ✓" });
    setTAmount(""); setTNote(""); setTWithdrawal(false);
    loadTxns(selInv.id); load();
    setTimeout(() => { setTMsg(null); setAddingTxn(false); }, 1200);
  };

  const deleteTxn = async (id) => {
    const ok = await confirm({ icon: "🗑️", title: "Delete Transaction", message: "Remove this transaction record?", confirmLabel: "Delete" });
    if (!ok) return;
    await supabase.from("investment_txns").delete().eq("id", id);
    loadTxns(selInv.id); load();
  };

  const active        = investments.filter(i => i.status === "active");
  const withdrawn     = investments.filter(i => i.status === "withdrawn");
  const getCurrentVal = (i) => i.type === "fd" ? calcFDCurrentValue(i) : i.current_value;
  const totalInvested = active.reduce((s, i) => s + i.amount, 0);
  const totalCurrentV = active.reduce((s, i) => s + getCurrentVal(i), 0);
  const totalGain     = totalCurrentV - totalInvested;

  // ── Add Investment Form ──
  if (addingType) {
    const meta = INV_TYPES[addingType];
    return (
      <div>
        {modal}
        <div className="mf-back-btn" onClick={() => { setAddingType(null); resetForm(); }}>← Back</div>
        <div className="mf-topbar"><h2>Add {meta.label}</h2></div>
        <div style={{ ...SEC, maxWidth: 540 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="mf-form-group">
              <label className="mf-form-label">Name / Label *</label>
              <input type="text" className="mf-inp" value={fName} onChange={e => setFName(e.target.value)} placeholder={`e.g. SBI FD 2026, ${meta.label}`} />
            </div>
            {addingType === "mutualfund" && (
              <div className="mf-form-group">
                <label className="mf-form-label">Fund Name</label>
                <input type="text" className="mf-inp" value={fFundName} onChange={e => setFFundName(e.target.value)} placeholder="e.g. PARAG PARIKH FLEXI CAP FUND" />
              </div>
            )}
            <div className="mf-form-grid">
              <div className="mf-form-group">
                <label className="mf-form-label">Invested Amount (₹)</label>
                <input type="number" className="mf-inp" value={fAmount} onChange={e => setFAmount(e.target.value)} placeholder="0" />
              </div>
              {(addingType === "mutualfund" || addingType === "stocks") && (
                <div className="mf-form-group">
                  <label className="mf-form-label">Current Value (₹)</label>
                  <input type="number" className="mf-inp" value={fCurrentValue} onChange={e => setFCurrentValue(e.target.value)} placeholder="0" />
                </div>
              )}
              {(addingType === "fd" || addingType === "rd") && (
                <div className="mf-form-group">
                  <label className="mf-form-label">Interest Rate (% p.a.)</label>
                  <input type="number" step="0.01" className="mf-inp" value={fInterestRate} onChange={e => setFInterestRate(e.target.value)} placeholder="e.g. 7.25" />
                </div>
              )}
            </div>
            {(addingType === "fd" || addingType === "rd") && (
              <div className="mf-form-group">
                <label className="mf-form-label">Maturity Amount (₹) <span style={{ color: "#5a6490", fontWeight: 400 }}>(optional — for reference)</span></label>
                <input type="number" className="mf-inp" value={fMatAmount} onChange={e => setFMatAmount(e.target.value)} placeholder="0" />
              </div>
            )}
            <div className="mf-form-grid">
              <div className="mf-form-group">
                <label className="mf-form-label">Start Date *</label>
                <input type="date" className="mf-inp" value={fStartDate} onChange={e => setFStartDate(e.target.value)} />
              </div>
              {addingType !== "stocks" && addingType !== "mutualfund" && (
                <div className="mf-form-group">
                  <label className="mf-form-label">Maturity / End Date {addingType === "fd" && "*"}</label>
                  <input type="date" className="mf-inp" value={fMatDate} onChange={e => setFMatDate(e.target.value)} />
                </div>
              )}
            </div>
            {addingType === "fd" && fInterestRate && (
              <div style={{ fontSize: 11, color: "#5a6490", background: "rgba(0,229,204,.06)", padding: "8px 12px", borderRadius: 8 }}>
                💡 Current value will be calculated automatically each day based on your interest rate, until maturity.
              </div>
            )}
            <div className="mf-form-group">
              <label className="mf-form-label">Notes</label>
              <textarea className="mf-textarea" value={fNotes} onChange={e => setFNotes(e.target.value)} placeholder="Any notes…" style={{ minHeight: 60 }} />
            </div>
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <button className="mf-btn-p" onClick={saveInvestment} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            <button className="mf-btn-g" onClick={() => { setAddingType(null); resetForm(); }}>Cancel</button>
          </div>
          {msg && <div className={msg.t === "ok" ? "mf-msg-ok" : "mf-msg-err"}>{msg.m}</div>}
        </div>
      </div>
    );
  }

  // ── Individual Investment Detail ──
  if (selInv) {
    const meta         = INV_TYPES[selInv.type] || INV_TYPES.fd;
    const isFD          = selInv.type === "fd";
    const fdCurrentVal  = isFD ? calcFDCurrentValue(selInv) : null;
    const invTxns      = transactions.filter(t => t.investment_id === selInv.id);
    const totalContrib = invTxns.filter(t => !t.is_withdrawal).reduce((s, t) => s + t.amount, 0);
    const totalWithdr  = invTxns.filter(t => t.is_withdrawal).reduce((s, t) => s + t.amount, 0);

    return (
      <div>
        {modal}
        <div className="mf-back-btn" onClick={() => { setSelInv(null); setAddingTxn(false); load(); }}>← Back to Investments</div>

        {/* Header card */}
        <div style={{ ...CARD, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: meta.color + "22", border: `1px solid ${meta.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{meta.icon}</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#e8eaf6" }}>{selInv.name}</div>
              <div style={{ fontSize: 12, color: meta.color, fontWeight: 500 }}>{meta.label}{selInv.fund_name && ` · ${selInv.fund_name}`}{isFD && selInv.interest_rate && ` · ${selInv.interest_rate}% p.a.`}</div>
              {selInv.status === "withdrawn" && <span style={{ fontSize: 10, background: "rgba(255,255,255,.07)", color: "#5a6490", padding: "1px 6px", borderRadius: 99 }}>Withdrawn</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {!isFD && selInv.status === "active" && <button className="mf-btn-p" onClick={() => setAddingTxn(t => !t)}>+ Add Entry</button>}
            {selInv.status === "active" && (
              <button onClick={() => markWithdrawn(selInv)} style={{ padding: "8px 14px", borderRadius: 9, border: "1px solid rgba(0,214,143,.3)", background: "rgba(0,214,143,.08)", color: "#00d68f", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>✓ Withdrawn</button>
            )}
            <button className="mf-btn-d" onClick={() => deleteInvestment(selInv.id)}>🗑 Delete</button>
          </div>
        </div>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, marginBottom: 14 }}>
          <div style={{ ...CARD, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#5a6490", marginBottom: 5 }}>Invested</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#e8eaf6" }}>{fmt(selInv.amount)}</div>
          </div>
          {isFD && selInv.interest_rate && (
            <div style={{ ...CARD, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#5a6490", marginBottom: 5 }}>Current Value (est.)</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: fdCurrentVal >= selInv.amount ? "#00d68f" : "#ff4d8d" }}>{fmt(fdCurrentVal)}</div>
              <div style={{ fontSize: 10, color: "#5a6490", marginTop: 2 }}>accrued daily</div>
            </div>
          )}
          {(selInv.type === "mutualfund" || selInv.type === "stocks") && (
            <div style={{ ...CARD, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#5a6490", marginBottom: 5 }}>Current Value</div>
              {editingVal ? (
                <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center" }}>
                  <input type="number" className="mf-inp" value={newVal} onChange={e => setNewVal(e.target.value)} style={{ width: 100, padding: "4px 8px", fontSize: 13 }} />
                  <button className="mf-btn-sm" onClick={() => updateCurrentValue(selInv.id, newVal)}>✓</button>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: selInv.current_value >= selInv.amount ? "#00d68f" : "#ff4d8d" }}>{fmt(selInv.current_value)}</div>
                  <button onClick={() => { setEditingVal(true); setNewVal(String(selInv.current_value || 0)); }} style={{ fontSize: 10, color: "#00e5cc", background: "none", border: "none", cursor: "pointer", marginTop: 3 }}>✏️ Update</button>
                </div>
              )}
            </div>
          )}
          {selInv.maturity_amount > 0 && (
            <div style={{ ...CARD, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#5a6490", marginBottom: 5 }}>Maturity Amount</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#00e5cc" }}>{fmt(selInv.maturity_amount)}</div>
            </div>
          )}
          {(selInv.type === "mutualfund" || selInv.type === "stocks") && selInv.current_value > 0 && (
            <div style={{ ...CARD, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#5a6490", marginBottom: 5 }}>Gain / Loss</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: selInv.current_value - selInv.amount >= 0 ? "#00d68f" : "#ff4d6d" }}>
                {selInv.current_value - selInv.amount >= 0 ? "+" : ""}{fmt(selInv.current_value - selInv.amount)}
              </div>
            </div>
          )}
          {selInv.start_date && (
            <div style={{ ...CARD, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#5a6490", marginBottom: 5 }}>Start Date</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#e8eaf6" }}>{selInv.start_date}</div>
            </div>
          )}
          {selInv.maturity_date && (
            <div style={{ ...CARD, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#5a6490", marginBottom: 5 }}>Maturity Date</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#ffb830" }}>{selInv.maturity_date}</div>
            </div>
          )}
        </div>

        {/* Add transaction inline */}
        {addingTxn && (
          <div style={SEC}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#5a6490", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 12 }}>Add Transaction</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="mf-form-grid">
                <div className="mf-form-group"><label className="mf-form-label">Date</label><input type="date" className="mf-inp" value={tDate} onChange={e => setTDate(e.target.value)} /></div>
                <div className="mf-form-group"><label className="mf-form-label">Amount (₹)</label><input type="number" className="mf-inp" value={tAmount} onChange={e => setTAmount(e.target.value)} placeholder="0" /></div>
              </div>
              <div className="mf-form-group"><label className="mf-form-label">Note</label><input type="text" className="mf-inp" value={tNote} onChange={e => setTNote(e.target.value)} placeholder="Monthly SIP, bonus investment…" /></div>
              <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#9ba5c9", cursor: "pointer" }}>
                  <input type="checkbox" checked={tRecurring}  onChange={e => setTRecurring(e.target.checked)} /> Recurring
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#ff4d8d", cursor: "pointer" }}>
                  <input type="checkbox" checked={tWithdrawal} onChange={e => setTWithdrawal(e.target.checked)} /> Withdrawal
                </label>
              </div>
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button className="mf-btn-p" onClick={saveTxn} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
              <button className="mf-btn-g" onClick={() => setAddingTxn(false)}>Cancel</button>
            </div>
            {tMsg && <div className={tMsg.t === "ok" ? "mf-msg-ok" : "mf-msg-err"}>{tMsg.m}</div>}
          </div>
        )}

        {/* Transaction history */}
        <div style={SEC}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#5a6490", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 14 }}>
            Transaction History ({invTxns.length}) · Contrib: {fmt(totalContrib)} · Withdrawn: {fmt(totalWithdr)}
          </div>
          {invTxns.length === 0
            ? <div style={{ color: "#5a6490", fontSize: 13, padding: "16px 0", textAlign: "center" }}>No transactions yet</div>
            : invTxns.map(t => (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: t.is_withdrawal ? "#ff4d8d" : "#00d68f" }}>{t.is_withdrawal ? "↩ Withdrawal" : "↓ Contribution"}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#e8eaf6" }}>{fmt(t.amount)}</span>
                      {t.recurring && <span style={{ fontSize: 10, background: "rgba(96,165,250,.12)", color: "#60a5fa", padding: "1px 6px", borderRadius: 99 }}>🔄 Recurring</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "#5a6490", marginTop: 2 }}>📅 {t.date}{t.note && ` · ${t.note}`}</div>
                  </div>
                  <button className="mf-btn-d" style={{ fontSize: 11, padding: "3px 8px" }} onClick={() => deleteTxn(t.id)}>🗑</button>
                </div>
              ))
          }
        </div>

        {selInv.notes && (
          <div style={SEC}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#5a6490", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 8 }}>Notes</div>
            <div style={{ fontSize: 13, color: "#9ba5c9", lineHeight: 1.6 }}>{selInv.notes}</div>
          </div>
        )}
      </div>
    );
  }

  // ── Overview / List ──
  return (
    <div>
      {modal}
      <div className="mf-topbar">
        <h2>Investments</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.entries(INV_TYPES).map(([k, v]) => (
            <button key={k} onClick={() => setAddingType(k)} style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${v.color}44`, background: `${v.color}11`, color: v.color, cursor: "pointer", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Portfolio summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 18 }}>
        <div style={{ ...CARD, background: "rgba(0,229,204,.06)", border: "1px solid rgba(0,229,204,.2)" }}>
          <div style={{ fontSize: 10, color: "#5a6490", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 6 }}>Total Invested</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#00e5cc" }}>{fmt(totalInvested)}</div>
          <div style={{ fontSize: 10, color: "#5a6490", marginTop: 4 }}>{active.length} active</div>
        </div>
        <div style={{ ...CARD, background: "rgba(0,214,143,.06)", border: "1px solid rgba(0,214,143,.2)" }}>
          <div style={{ fontSize: 10, color: "#5a6490", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 6 }}>Current Value</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#00d68f" }}>{fmt(totalCurrentV)}</div>
          <div style={{ fontSize: 10, color: "#5a6490", marginTop: 4 }}>portfolio value</div>
        </div>
        <div style={{ ...CARD, background: totalGain >= 0 ? "rgba(0,214,143,.06)" : "rgba(255,77,109,.06)", border: `1px solid ${totalGain >= 0 ? "rgba(0,214,143,.2)" : "rgba(255,77,109,.2)"}` }}>
          <div style={{ fontSize: 10, color: "#5a6490", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 6 }}>Total Gain / Loss</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: totalGain >= 0 ? "#00d68f" : "#ff4d6d" }}>{totalGain >= 0 ? "+" : ""}{fmt(totalGain)}</div>
          <div style={{ fontSize: 10, color: totalGain >= 0 ? "#00d68f" : "#ff4d6d", marginTop: 4 }}>{totalInvested > 0 ? Math.round((totalGain / totalInvested) * 100) : 0}% returns</div>
        </div>
        {withdrawn.length > 0 && (
          <div style={CARD}>
            <div style={{ fontSize: 10, color: "#5a6490", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 6 }}>Withdrawn</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#5a6490" }}>{withdrawn.length}</div>
            <div style={{ fontSize: 10, color: "#5a6490", marginTop: 4 }}>completed</div>
          </div>
        )}
      </div>

      {/* By type */}
      {Object.entries(INV_TYPES).map(([type, meta]) => {
        const list = investments.filter(i => i.type === type);
        if (!list.length) return null;
        return (
          <div key={type} style={SEC}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 16 }}>{meta.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: meta.color, textTransform: "uppercase", letterSpacing: ".8px" }}>{meta.label}</span>
              <span style={{ fontSize: 11, color: "#5a6490", marginLeft: "auto" }}>{list.filter(i => i.status === "active").length} active</span>
            </div>
            {list.map(inv => {
              const isFD        = inv.type === "fd";
              const currentVal  = isFD ? calcFDCurrentValue(inv) : inv.current_value;
              const gain        = currentVal - inv.amount;
              const isWithdrawn = inv.status === "withdrawn";
              return (
                <div key={inv.id}
                  onClick={() => { if (isFD) return; setSelInv(inv); loadTxns(inv.id); setEditingVal(false); setNewVal(String(inv.current_value || 0)); }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,.05)", cursor: isFD ? "default" : "pointer", opacity: isWithdrawn ? 0.6 : 1, gap: 10 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#e8eaf6" }}>{inv.name}</span>
                      {inv.fund_name && <span style={{ fontSize: 11, color: "#5a6490", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{inv.fund_name}</span>}
                      {isWithdrawn && <span style={{ fontSize: 10, background: "rgba(255,255,255,.06)", color: "#5a6490", padding: "1px 5px", borderRadius: 99 }}>Withdrawn</span>}
                      {isFD && inv.interest_rate && <span style={{ fontSize: 10, background: "rgba(0,229,204,.1)", color: "#00e5cc", padding: "1px 6px", borderRadius: 99 }}>{inv.interest_rate}% p.a.</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "#5a6490", marginTop: 2 }}>Started {inv.start_date}{inv.maturity_date && ` · Matures ${inv.maturity_date}`}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#e8eaf6" }}>{fmt(inv.amount)}</div>
                    {isFD && inv.interest_rate ? (
                      <div style={{ fontSize: 11, color: gain >= 0 ? "#00d68f" : "#ff4d6d", marginTop: 1 }}>{gain >= 0 ? "+" : ""}{fmt(gain)} now</div>
                    ) : (type === "mutualfund" || type === "stocks") && inv.current_value > 0 && (
                      <div style={{ fontSize: 11, color: gain >= 0 ? "#00d68f" : "#ff4d6d", marginTop: 1 }}>{gain >= 0 ? "+" : ""}{fmt(gain)}</div>
                    )}
                    {inv.maturity_amount > 0 && <div style={{ fontSize: 11, color: "#00e5cc", marginTop: 1 }}>→ {fmt(inv.maturity_amount)}</div>}
                  </div>
                  {/* FD inline actions — no need to open detail page */}
                  {isFD && (
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      {!isWithdrawn && (
                        <button onClick={() => markWithdrawn(inv)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(0,214,143,.3)", background: "rgba(0,214,143,.08)", color: "#00d68f", cursor: "pointer", fontSize: 11, fontWeight: 500, whiteSpace: "nowrap" }}>✓ Withdraw</button>
                      )}
                      <button className="mf-btn-d" style={{ fontSize: 11, padding: "6px 10px" }} onClick={() => deleteInvestment(inv.id)}>🗑</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {investments.length === 0 && (
        <div style={{ ...CARD, textAlign: "center", padding: "48px 20px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#e8eaf6", marginBottom: 6 }}>No investments yet</div>
          <div style={{ fontSize: 13, color: "#5a6490" }}>Track your FDs, mutual funds, stocks, PPF and more</div>
        </div>
      )}
    </div>
  );
}