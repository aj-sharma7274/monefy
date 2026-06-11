import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { fmt } from "../constants";
import { useConfirm } from "./shared/ConfirmModal";

const ENTRY_META = {
  given:         { label: "Given",         icon: "💸", bg: "rgba(255,77,109,.12)",  color: "#ff4d8d" },
  received_back: { label: "Received Back", icon: "✅", bg: "rgba(0,214,143,.12)",   color: "#00d68f" },
  borrowed:      { label: "Borrowed",      icon: "🤝", bg: "rgba(0,229,204,.12)",   color: "#00e5cc" },
  returned:      { label: "Returned",      icon: "↩️", bg: "rgba(167,139,250,.12)", color: "#a78bfa" },
};

function calcNet(entries) {
  return entries.filter(e => !e.settled).reduce((sum, e) => {
    if (e.type === "given")         return sum + e.amount;
    if (e.type === "received_back") return sum - e.amount;
    if (e.type === "borrowed")      return sum - e.amount;
    if (e.type === "returned")      return sum + e.amount;
    return sum;
  }, 0);
}

// ── Self-contained Entry Row ──
function EntryRow({ entry, onDelete, today }) {
  const meta      = ENTRY_META[entry.type] || ENTRY_META.given;
  const isOverdue = entry.reminder_date && entry.reminder_date <= today && !entry.settled;
  const [lightbox, setLightbox] = useState(false);

  return (
    <>
      {lightbox && (
        <div
          onClick={() => setLightbox(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.9)", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, gap: 14 }}
        >
          <img src={entry.attachment_url} alt="attachment" style={{ maxWidth: "100%", maxHeight: "75vh", borderRadius: 10, boxShadow: "0 8px 40px rgba(0,0,0,.6)" }} onClick={e => e.stopPropagation()} />
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => setLightbox(false)} style={{ padding: "8px 24px", borderRadius: 8, border: "1px solid rgba(255,255,255,.15)", background: "rgba(255,255,255,.08)", color: "#e8eaf6", cursor: "pointer", fontSize: 13 }}>✕ Close</button>
            <a href={entry.attachment_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ padding: "8px 24px", borderRadius: 8, border: "1px solid rgba(0,229,204,.3)", background: "rgba(0,229,204,.08)", color: "#00e5cc", textDecoration: "none", fontSize: 13 }}>🔗 Open Original</a>
          </div>
        </div>
      )}

      <div className="mf-entry-row">
        <div className="mf-entry-icon" style={{ background: meta.bg, marginTop: 2 }}>
          <span>{meta.icon}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: meta.color }}>{meta.label}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#e8eaf6" }}>{fmt(entry.amount)}</span>
            {entry.settled && <span style={{ fontSize: 10, background: "rgba(0,214,143,.12)", color: "#00d68f", padding: "2px 7px", borderRadius: 99, fontWeight: 600 }}>✓ Settled</span>}
          </div>
          {entry.note && <div style={{ fontSize: 12, color: "#9ba5c9", marginBottom: 3 }}>{entry.note}</div>}
          <div style={{ fontSize: 11, color: "#5a6490" }}>📅 {entry.date}</div>
          {entry.reminder_date && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, padding: "2px 7px", borderRadius: 99, background: isOverdue ? "rgba(255,77,109,.12)" : "rgba(255,184,48,.12)", color: isOverdue ? "#ff4d6d" : "#ffb830", marginTop: 4 }}>
              ⏰ Reminder: {entry.reminder_date}{isOverdue && <strong> — OVERDUE</strong>}
            </div>
          )}
          {entry.attachment_url && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <img src={entry.attachment_url} alt="thumb" style={{ width: 48, height: 48, borderRadius: 7, objectFit: "cover", border: "1px solid rgba(255,255,255,.12)", cursor: "pointer", flexShrink: 0 }} onClick={() => setLightbox(true)} />
              <button onClick={() => setLightbox(true)} style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid rgba(0,229,204,.3)", background: "rgba(0,229,204,.08)", color: "#00e5cc", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>🔍 View Attachment</button>
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0, paddingLeft: 8 }}>
          <button className="mf-btn-d" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => onDelete(entry.id)}>🗑 Delete</button>
        </div>
      </div>
    </>
  );
}

// ── Net Worth Summary (list page) ──
function NetWorthSummary({ session, people }) {
  const [totals, setTotals] = useState({ owedToMe: 0, iOwe: 0 });

  useEffect(() => {
    if (!people.length) return;
    supabase.from("ledger_entries").select("type,amount,settled").eq("user_id", session.user.id).eq("settled", false)
      .then(({ data }) => {
        if (!data) return;
        let owedToMe = 0, iOwe = 0;
        data.forEach(e => {
          if (e.type === "given")         owedToMe += e.amount;
          if (e.type === "received_back") owedToMe -= e.amount;
          if (e.type === "borrowed")      iOwe     += e.amount;
          if (e.type === "returned")      iOwe     -= e.amount;
        });
        setTotals({ owedToMe: Math.max(0, owedToMe), iOwe: Math.max(0, iOwe) });
      });
  }, [people, session]);

  if (!people.length) return null;
  const net = totals.owedToMe - totals.iOwe;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
      <div style={{ background: "rgba(255,77,141,.08)", border: "1px solid rgba(255,77,141,.2)", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 10, color: "#5a6490", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 6 }}>Total Owed to You</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#ff4d8d" }}>{fmt(totals.owedToMe)}</div>
        <div style={{ fontSize: 10, color: "#5a6490", marginTop: 4 }}>across all people</div>
      </div>
      <div style={{ background: "rgba(0,229,204,.08)", border: "1px solid rgba(0,229,204,.2)", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 10, color: "#5a6490", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 6 }}>You Owe Others</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#00e5cc" }}>{fmt(totals.iOwe)}</div>
        <div style={{ fontSize: 10, color: "#5a6490", marginTop: 4 }}>across all people</div>
      </div>
      <div style={{ background: net > 0 ? "rgba(0,214,143,.08)" : net < 0 ? "rgba(255,77,109,.08)" : "rgba(255,255,255,.04)", border: `1px solid ${net > 0 ? "rgba(0,214,143,.2)" : net < 0 ? "rgba(255,77,109,.2)" : "rgba(255,255,255,.08)"}`, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 10, color: "#5a6490", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 6 }}>Net Position</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: net > 0 ? "#00d68f" : net < 0 ? "#ff4d6d" : "#5a6490" }}>
          {net === 0 ? "Balanced ✓" : net > 0 ? `+${fmt(net)}` : `-${fmt(Math.abs(net))}`}
        </div>
        <div style={{ fontSize: 10, color: net > 0 ? "#00d68f" : net < 0 ? "#ff4d6d" : "#5a6490", marginTop: 4 }}>
          {net > 0 ? "in your favour" : net < 0 ? "you owe more" : "all clear"}
        </div>
      </div>
    </div>
  );
}

// ── Person Card ──
function PersonCard({ person, onClick, overdue }) {
  const [net, setNet] = useState(null);

  useEffect(() => {
    supabase.from("ledger_entries").select("type,amount,settled").eq("person_id", person.id)
      .then(({ data }) => { if (data) setNet(calcNet(data)); });
  }, [person.id]);

  const color = net === null ? "#5a6490" : net > 0 ? "#ff4d8d" : net < 0 ? "#00e5cc" : "#00d68f";
  const label = net === null ? "Loading…" : net > 0 ? `${fmt(net)} to receive` : net < 0 ? `${fmt(Math.abs(net))} you owe` : "Settled ✓";

  return (
    <div className="mf-person-card" onClick={onClick}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(0,229,204,.1)", border: "1px solid rgba(0,229,204,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#00e5cc", flexShrink: 0 }}>
            {person.name[0].toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#e8eaf6" }}>{person.name}</span>
              {overdue && <span style={{ fontSize: 10, background: "rgba(255,184,48,.15)", color: "#ffb830", padding: "1px 6px", borderRadius: 99 }}>⏰ Due</span>}
            </div>
            {person.phone && <div style={{ fontSize: 11, color: "#5a6490" }}>📞 {person.phone}</div>}
            {person.notes && <div style={{ fontSize: 11, color: "#9ba5c9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{person.notes}</div>}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color }}>{label}</div>
          <div style={{ fontSize: 10, color: "#5a6490", marginTop: 2 }}>tap to view →</div>
        </div>
      </div>
    </div>
  );
}

// ── Main Ledger Page ──
export default function Ledger({ session }) {
  const [view,          setView]         = useState("list");
  const [people,        setPeople]       = useState([]);
  const [selPerson,     setSelPerson]    = useState(null);
  const [entries,       setEntries]      = useState([]);
  const [overduePeople, setOverduePeople]= useState([]);
  const { confirm, modal } = useConfirm();

  // Person form
  const [pName,   setPName]   = useState("");
  const [pPhone,  setPPhone]  = useState("");
  const [pNotes,  setPNotes]  = useState("");
  const [pSaving, setPSaving] = useState(false);
  const [pMsg,    setPMsg]    = useState(null);

  // Entry form
  const [eType,     setEType]     = useState("given");
  const [eAmount,   setEAmount]   = useState("");
  const [eNote,     setENote]     = useState("");
  const [eDate,     setEDate]     = useState(new Date().toISOString().slice(0, 10));
  const [eReminder, setEReminder] = useState("");
  const [eFile,     setEFile]     = useState(null);
  const [eUploading,setEUploading]= useState(false);
  const [eMsg,      setEMsg]      = useState(null);

  const loadPeople = useCallback(async () => {
    const { data } = await supabase.from("ledger_people").select("*").eq("user_id", session.user.id).order("name");
    if (data) setPeople(data);
  }, [session]);

  const loadEntries = useCallback(async (personId) => {
    const { data } = await supabase.from("ledger_entries").select("*").eq("person_id", personId).order("date", { ascending: false });
    if (data) setEntries(data);
  }, []);

  useEffect(() => { loadPeople(); }, [loadPeople]);

  // Check overdue reminders
  useEffect(() => {
    if (!people.length) return;
    const today = new Date().toISOString().slice(0, 10);
    supabase.from("ledger_entries").select("*,ledger_people(name)")
      .eq("user_id", session.user.id).eq("settled", false)
      .lte("reminder_date", today).not("reminder_date", "is", null)
      .then(({ data }) => {
        if (data && data.length) {
          setOverduePeople(data);
          if (Notification.permission === "granted") {
            data.forEach(e => new Notification("Monefy Reminder 💰", {
              body: `${e.ledger_people?.name || "Someone"} — ${fmt(e.amount)} is due!`,
              icon: "/favicon.ico"
            }));
          }
        }
      });
  }, [people, session]);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
  }, []);

  const savePerson = async () => {
    if (!pName.trim()) { setPMsg({ t: "err", m: "Name is required" }); return; }
    setPSaving(true);
    const { error } = await supabase.from("ledger_people").insert({ user_id: session.user.id, name: pName.trim(), phone: pPhone.trim() || null, notes: pNotes.trim() || null });
    setPSaving(false);
    if (error) { setPMsg({ t: "err", m: "Error saving." }); return; }
    setPMsg({ t: "ok", m: "Person added! ✓" });
    setPName(""); setPPhone(""); setPNotes("");
    loadPeople();
    setTimeout(() => { setPMsg(null); setView("list"); }, 1200);
  };

  const deletePerson = async (id) => {
    const ok = await confirm({ icon: "👤", title: "Remove Person", message: "This will delete all entries for this person too.", confirmLabel: "Remove" });
    if (!ok) return;
    await supabase.from("ledger_entries").delete().eq("person_id", id);
    await supabase.from("ledger_people").delete().eq("id", id);
    loadPeople(); setView("list");
  };

  const openPerson = async (p) => {
    setSelPerson(p); setView("person"); await loadEntries(p.id);
  };

  const saveEntry = async () => {
    if (!eAmount || !eDate) { setEMsg({ t: "err", m: "Amount and date are required" }); return; }
    setEUploading(true);
    let attachment_url = null;
    if (eFile) {
      const ext  = eFile.name.split(".").pop();
      const path = `${session.user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("ledger-attachments").upload(path, eFile, { upsert: true });
      if (!upErr) { const { data } = supabase.storage.from("ledger-attachments").getPublicUrl(path); attachment_url = data.publicUrl; }
    }
    const { error } = await supabase.from("ledger_entries").insert({
      user_id: session.user.id, person_id: selPerson.id,
      type: eType, amount: parseFloat(eAmount), note: eNote.trim() || null,
      date: eDate, reminder_date: eReminder || null, attachment_url, settled: false,
    });
    setEUploading(false);
    if (error) { setEMsg({ t: "err", m: "Error saving." }); return; }
    setEMsg({ t: "ok", m: "Entry saved! ✓" });
    setEAmount(""); setENote(""); setEReminder(""); setEFile(null);
    loadEntries(selPerson.id);
    setTimeout(() => { setEMsg(null); setView("person"); }, 1000);
  };

  const deleteEntry = async (id) => {
    const ok = await confirm({ icon: "🗑️", title: "Delete Entry", message: "This entry will be permanently removed.", confirmLabel: "Delete" });
    if (!ok) return;
    await supabase.from("ledger_entries").delete().eq("id", id);
    loadEntries(selPerson.id);
  };

  const CC = {
    card: { background: "#0d1130", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, padding: "16px 18px" },
    sec:  { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 14, padding: "18px 22px", marginBottom: 16 },
  };
  const today = new Date().toISOString().slice(0, 10);

  // ── List view ──
  if (view === "list") return (
    <div>
      {modal}
      <div className="mf-topbar">
        <h2>Ledger</h2>
        <button className="mf-btn-p" onClick={() => setView("add_person")}>+ Add Person</button>
      </div>

      {overduePeople.length > 0 && (
        <div style={{ background: "rgba(255,184,48,.1)", border: "1px solid rgba(255,184,48,.3)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>⏰</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#ffb830" }}>Payment Reminders Due</div>
            <div style={{ fontSize: 12, color: "#9ba5c9", marginTop: 2 }}>{overduePeople.length} {overduePeople.length === 1 ? "entry" : "entries"} past reminder date</div>
          </div>
        </div>
      )}

      <NetWorthSummary session={session} people={people} />

      {people.length === 0
        ? <div style={{ ...CC.card, textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🤝</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#e8eaf6", marginBottom: 6 }}>No people yet</div>
            <div style={{ fontSize: 13, color: "#5a6490", marginBottom: 20 }}>Track money given or received with friends and family</div>
            <button className="mf-btn-p" onClick={() => setView("add_person")}>Add First Person</button>
          </div>
        : people.map(p => <PersonCard key={p.id} person={p} onClick={() => openPerson(p)} overdue={overduePeople.some(e => e.person_id === p.id)} />)
      }
    </div>
  );

  // ── Add Person view ──
  if (view === "add_person") return (
    <div>
      {modal}
      <div className="mf-back-btn" onClick={() => setView("list")}>← Back to Ledger</div>
      <div className="mf-topbar"><h2>Add Person</h2></div>
      <div style={{ ...CC.sec, maxWidth: 500 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="mf-form-group"><label className="mf-form-label">Name *</label><input type="text" className="mf-inp" value={pName} onChange={e => setPName(e.target.value)} placeholder="e.g. Rahul, Papa" /></div>
          <div className="mf-form-group"><label className="mf-form-label">Phone</label><input type="tel" className="mf-inp" value={pPhone} onChange={e => setPPhone(e.target.value)} placeholder="+91 98765 43210" /></div>
          <div className="mf-form-group"><label className="mf-form-label">Notes</label><textarea className="mf-textarea" value={pNotes} onChange={e => setPNotes(e.target.value)} placeholder="Any notes about this person…" style={{ minHeight: 70 }} /></div>
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <button className="mf-btn-p" onClick={savePerson} disabled={pSaving}>{pSaving ? "Saving…" : "Save Person"}</button>
          <button className="mf-btn-g" onClick={() => setView("list")}>Cancel</button>
        </div>
        {pMsg && <div className={pMsg.t === "ok" ? "mf-msg-ok" : "mf-msg-err"}>{pMsg.m}</div>}
      </div>
    </div>
  );

  // ── Add Entry view ──
  if (view === "add_entry") return (
    <div>
      {modal}
      <div className="mf-back-btn" onClick={() => setView("person")}>← Back to {selPerson?.name}</div>
      <div className="mf-topbar"><h2>Add Entry</h2></div>
      <div style={{ ...CC.sec, maxWidth: 520 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="mf-form-group">
            <label className="mf-form-label">Type</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {Object.entries(ENTRY_META).map(([k, v]) => (
                <button key={k} onClick={() => setEType(k)} style={{ padding: "10px 12px", borderRadius: 9, border: `1px solid ${eType === k ? v.color : "rgba(255,255,255,.1)"}`, background: eType === k ? v.bg : "transparent", color: eType === k ? v.color : "#9ba5c9", cursor: "pointer", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, transition: "all .15s" }}>
                  <span>{v.icon}</span>{v.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mf-form-grid">
            <div className="mf-form-group"><label className="mf-form-label">Amount (₹) *</label><input type="number" className="mf-inp" value={eAmount} onChange={e => setEAmount(e.target.value)} placeholder="0.00" min="0" step="0.01" /></div>
            <div className="mf-form-group"><label className="mf-form-label">Date *</label><input type="date" className="mf-inp" value={eDate} onChange={e => setEDate(e.target.value)} /></div>
          </div>
          <div className="mf-form-group"><label className="mf-form-label">Note</label><input type="text" className="mf-inp" value={eNote} onChange={e => setENote(e.target.value)} placeholder="What is this for?" /></div>
          <div className="mf-form-group">
            <label className="mf-form-label">Reminder Date <span style={{ color: "#5a6490", fontWeight: 400 }}>(optional)</span></label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="date" className="mf-inp" value={eReminder} onChange={e => setEReminder(e.target.value)} style={{ flex: 1 }} />
              {eReminder && <button onClick={() => setEReminder("")} style={{ padding: "9px 14px", borderRadius: 9, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.06)", color: "#9ba5c9", cursor: "pointer", fontSize: 12, flexShrink: 0 }}>✕ Clear</button>}
            </div>
            {eReminder && <div style={{ fontSize: 11, color: "#ffb830", marginTop: 4 }}>⏰ You'll be reminded on {eReminder}</div>}
          </div>
          <div className="mf-form-group">
            <label className="mf-form-label">Attachment <span style={{ color: "#5a6490", fontWeight: 400 }}>(screenshot, optional)</span></label>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(0,229,204,.3)", background: "rgba(0,229,204,.08)", color: "#00e5cc", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
                📎 Choose File
                <input type="file" accept="image/*,application/pdf" onChange={e => setEFile(e.target.files[0])} style={{ display: "none" }} />
              </label>
              {eFile
                ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "#00d68f" }}>📎 {eFile.name}</span>
                    <button onClick={() => setEFile(null)} style={{ padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(255,77,109,.3)", background: "rgba(255,77,109,.1)", color: "#ff4d6d", cursor: "pointer", fontSize: 11 }}>✕</button>
                  </div>
                : <span style={{ fontSize: 11, color: "#5a6490" }}>No file chosen</span>
              }
            </div>
          </div>
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="mf-btn-p" onClick={saveEntry} disabled={eUploading}>{eUploading ? "Uploading…" : "Save Entry"}</button>
          <button className="mf-btn-g" onClick={() => setView("person")}>Cancel</button>
        </div>
        {eMsg && <div className={eMsg.t === "ok" ? "mf-msg-ok" : "mf-msg-err"}>{eMsg.m}</div>}
      </div>
    </div>
  );

  // ── Person Detail view ──
  if (view === "person" && selPerson) {
    const theyOweTotal = entries.filter(e => !e.settled && (e.type === "given" || e.type === "received_back")).reduce((s, e) => e.type === "given" ? s + e.amount : s - e.amount, 0);
    const youOweTotal  = entries.filter(e => !e.settled && (e.type === "borrowed" || e.type === "returned")).reduce((s, e) => e.type === "borrowed" ? s + e.amount : s - e.amount, 0);
    const activeEntries  = entries.filter(e => !e.settled);
    const settledEntries = entries.filter(e => e.settled);

    return (
      <div>
        {modal}
        <div className="mf-back-btn" onClick={() => { setView("list"); loadPeople(); }}>← Back to Ledger</div>

        {/* Person header */}
        <div style={{ ...CC.card, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(0,229,204,.12)", border: "1px solid rgba(0,229,204,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#00e5cc", flexShrink: 0 }}>
              {selPerson.name[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#e8eaf6" }}>{selPerson.name}</div>
              {selPerson.phone && <div style={{ fontSize: 12, color: "#5a6490", marginTop: 2 }}>📞 {selPerson.phone}</div>}
              {selPerson.notes && <div style={{ fontSize: 12, color: "#9ba5c9", marginTop: 2 }}>{selPerson.notes}</div>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="mf-btn-p" onClick={() => setView("add_entry")}>+ Add Entry</button>
            <button className="mf-btn-d" onClick={() => deletePerson(selPerson.id)}>Remove</button>
          </div>
        </div>

        {/* Balance summary */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div style={{ ...CC.card, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#5a6490", marginBottom: 6 }}>They Owe You</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: theyOweTotal > 0 ? "#ff4d8d" : "#5a6490" }}>{fmt(Math.max(0, theyOweTotal))}</div>
            <div style={{ fontSize: 11, color: "#5a6490", marginTop: 4 }}>pending receivable</div>
          </div>
          <div style={{ ...CC.card, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#5a6490", marginBottom: 6 }}>You Owe Them</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: youOweTotal > 0 ? "#00e5cc" : "#5a6490" }}>{fmt(Math.max(0, youOweTotal))}</div>
            <div style={{ fontSize: 11, color: "#5a6490", marginTop: 4 }}>pending payable</div>
          </div>
        </div>

        {/* Active entries */}
        <div style={CC.sec}>
          <div className="mf-sec-title">Active Entries ({activeEntries.length})</div>
          {activeEntries.length === 0
            ? <div style={{ color: "#5a6490", fontSize: 13, padding: "16px 0", textAlign: "center" }}>No active entries. Add one above!</div>
            : activeEntries.map(e => <EntryRow key={e.id} entry={e} onDelete={deleteEntry} today={today} />)
          }
        </div>

        {/* Settled entries */}
        {settledEntries.length > 0 && (
          <div style={CC.sec}>
            <div className="mf-sec-title">Settled History ({settledEntries.length})</div>
            {settledEntries.map(e => <EntryRow key={e.id} entry={e} onDelete={deleteEntry} today={today} />)}
          </div>
        )}
      </div>
    );
  }

  return null;
}