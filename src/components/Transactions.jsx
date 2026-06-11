import { useState } from "react";
import { supabase } from "../lib/supabase";
import { MONTHS, YEARS, fmt } from "../constants";
import { useConfirm } from "./shared/ConfirmModal";

export default function Transactions({ transactions, onDeleted }) {
  const now = new Date();
  const [m, setM] = useState(now.getMonth());
  const [y, setY] = useState(now.getFullYear());
  const { confirm, modal } = useConfirm();

  const txns = transactions
    .filter(t => { const d = new Date(t.date); return d.getMonth() === m && d.getFullYear() === y; })
    .sort((a, b) => b.date.localeCompare(a.date));

  const del = async (id) => {
    const ok = await confirm({ icon: "🗑️", title: "Delete Transaction", message: "This transaction will be permanently removed.", confirmLabel: "Yes, Delete" });
    if (!ok) return;
    await supabase.from("transactions").delete().eq("id", id);
    onDeleted();
  };

  return (
    <div>
      {modal}
      <div className="mf-topbar">
        <h2>Transactions</h2>
        <div className="mf-filters">
          <select className="mf-sel" value={m} onChange={e => setM(+e.target.value)}>
            {MONTHS.map((mo, i) => <option key={i} value={i}>{mo}</option>)}
          </select>
          <select className="mf-sel" value={y} onChange={e => setY(+e.target.value)}>
            {YEARS.map(yr => <option key={yr} value={yr}>{yr}</option>)}
          </select>
        </div>
      </div>
      <div className="mf-sec">
        {txns.length === 0
          ? <div style={{ color: "#5a6490", fontSize: 13, padding: "32px 0", textAlign: "center" }}>No transactions this month</div>
          : <div className="mf-table-wrap">
              <table className="mf-table">
                <thead>
                  <tr>
                    <th>Date</th><th>Description</th>
                    <th>Category</th><th>Amount</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {txns.map(t => (
                    <tr key={t.id}>
                      <td>{t.date}</td>
                      <td style={{ color: "#e8eaf6" }}>{t.description}</td>
                      <td><span className="mf-chip">{t.category}</span></td>
                      <td style={{ color: "#ff4d8d", fontWeight: 600 }}>{fmt(t.amount)}</td>
                      <td><button className="mf-btn-d" onClick={() => del(t.id)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>
    </div>
  );
}