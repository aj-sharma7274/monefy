import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { fmt } from "../constants";
import { useConfirm } from "./shared/ConfirmModal";

export default function Budget({ budget, onSaved }) {
  const [local,     setLocal]     = useState({ ...budget });
  const [newCat,    setNewCat]    = useState("");
  const [newAmt,    setNewAmt]    = useState("");
  const [msg,       setMsg]       = useState(null);
  const [saving,    setSaving]    = useState(false);
  const { confirm, modal } = useConfirm();

  useEffect(() => { setLocal({ ...budget }); }, [budget]);

  const save = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const rows = Object.entries(local).map(([category, amount]) => ({ category, amount, user_id: session.user.id }));
    const { error } = await supabase.from("budget").upsert(rows, { onConflict: "category,user_id" });
    setSaving(false);
    if (error) { setMsg({ t: "err", m: "Error saving." }); return; }
    setMsg({ t: "ok", m: "Budget saved! ✓" });
    onSaved();
    setTimeout(() => setMsg(null), 2500);
  };

  const addCat = async () => {
    if (!newCat.trim()) { setMsg({ t: "err", m: "Enter category name" }); return; }
    if (local[newCat.trim()] !== undefined) { setMsg({ t: "err", m: "Already exists" }); return; }
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("budget").insert({ category: newCat.trim(), amount: parseFloat(newAmt) || 0, user_id: session.user.id });
    if (error) { setMsg({ t: "err", m: "Error adding." }); return; }
    setNewCat(""); setNewAmt("");
    setMsg({ t: "ok", m: "Category added!" });
    onSaved();
    setTimeout(() => setMsg(null), 2500);
  };

  const delCat = async (cat) => {
    const ok = await confirm({ icon: "🗑️", title: "Remove Category", message: `Remove "${cat}" from your budget? Past transactions won't be deleted.`, confirmLabel: "Remove" });
    if (!ok) return;
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from("budget").delete().eq("category", cat).eq("user_id", session.user.id);
    onSaved();
  };

  const totalBudget = Object.values(local).reduce((a, b) => a + b, 0);

  return (
    <div>
      {modal}
      <div className="mf-topbar">
        <h2>Budget Manager</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#5a6490" }}>Total: <strong style={{ color: "#00e5cc" }}>{fmt(totalBudget)}</strong></span>
          <button className="mf-btn-p" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Budget"}</button>
        </div>
      </div>
      {msg && <div className={msg.t === "ok" ? "mf-msg-ok" : "mf-msg-err"} style={{ marginBottom: 14 }}>{msg.m}</div>}

      <div className="mf-sec" style={{ maxWidth: 600 }}>
        <div className="mf-sec-title">Categories & Monthly Budget</div>
        {Object.entries(local).map(([cat, amt]) => (
          <div key={cat} style={{ display: "grid", gridTemplateColumns: "1fr 120px auto", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
            <span style={{ fontSize: 14, color: "#e8eaf6" }}>{cat}</span>
            <input
              type="number"
              value={amt}
              onChange={e => setLocal(p => ({ ...p, [cat]: parseFloat(e.target.value) || 0 }))}
              style={{ background: "#131840", border: "1px solid rgba(255,255,255,.1)", color: "#e8eaf6", padding: "6px 10px", borderRadius: 7, fontSize: 13, outline: "none", width: "100%" }}
            />
            <button className="mf-btn-d" onClick={() => delCat(cat)}>Remove</button>
          </div>
        ))}

        <div style={{ marginTop: 18, display: "flex", gap: 10, alignItems: "center", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,.08)", flexWrap: "wrap" }}>
          <input type="text"   className="mf-inp" value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="New category name" style={{ flex: 1, minWidth: 160 }} />
          <input type="number" className="mf-inp" value={newAmt} onChange={e => setNewAmt(e.target.value)} placeholder="₹ Budget"           style={{ width: 120 }} />
          <button className="mf-btn-p" onClick={addCat}>Add</button>
        </div>
      </div>
    </div>
  );
}