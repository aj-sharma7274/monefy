import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function AddExpense({ budget, onSaved }) {
  const cats = Object.keys(budget);
  const [date,   setDate]   = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [desc,   setDesc]   = useState("");
  const [cat,    setCat]    = useState(cats[0] || "");
  const [msg,    setMsg]    = useState(null);
  const [loading, setLoading] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!cat && cats.length) setCat(cats[0]); }, [cats]);

  const save = async () => {
    if (!date || !amount || !desc || !cat) { setMsg({ t: "err", m: "Please fill all fields" }); return; }
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("transactions").insert({
      date, description: desc, category: cat, amount: parseFloat(amount), user_id: session.user.id
    });
    setLoading(false);
    if (error) { setMsg({ t: "err", m: "Error saving." }); return; }
    setMsg({ t: "ok", m: "Expense saved! ✓" });
    setAmount(""); setDesc("");
    onSaved();
    setTimeout(() => setMsg(null), 2500);
  };

  return (
    <div>
      <div className="mf-topbar"><h2>Add Expense</h2></div>
      <div className="mf-sec" style={{ maxWidth: 520 }}>
        <div className="mf-form-grid">
          <div className="mf-form-group">
            <label className="mf-form-label">Date</label>
            <input type="date" className="mf-inp" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="mf-form-group">
            <label className="mf-form-label">Amount (₹)</label>
            <input type="number" className="mf-inp" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" min="0" step="0.01" />
          </div>
          <div className="mf-form-group full">
            <label className="mf-form-label">Description</label>
            <input type="text" className="mf-inp" value={desc} onChange={e => setDesc(e.target.value)} placeholder="What did you spend on?" />
          </div>
          <div className="mf-form-group full">
            <label className="mf-form-label">Category</label>
            <select className="mf-inp" style={{ cursor: "pointer" }} value={cat} onChange={e => setCat(e.target.value)}>
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="mf-btn-p" onClick={save} disabled={loading}>{loading ? "Saving…" : "Save Expense"}</button>
          <button className="mf-btn-g" onClick={() => { setAmount(""); setDesc(""); }}>Clear</button>
        </div>
        {msg && <div className={msg.t === "ok" ? "mf-msg-ok" : "mf-msg-err"}>{msg.m}</div>}
      </div>
    </div>
  );
}