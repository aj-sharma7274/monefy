import { useState, useEffect } from "react";
import { MONTHS, MONTHS_SHORT, YEARS, fmt, pct } from "../constants";

// ── Chart manager ──
let chartInstances = {};
function destroyChart(id) { if (chartInstances[id]) { chartInstances[id].destroy(); delete chartInstances[id]; } }
function createChart(id, config) {
  destroyChart(id);
  const el = document.getElementById(id);
  if (!el) return;
  chartInstances[id] = new window.Chart(el, config);
}

// ── Smart rule-based insights ──
function generateInsights(budget, spend, transactions, selMonth, selYear, totalBudget, totalSpent) {
  const insights = [];
  const daysInMonth   = new Date(selYear, selMonth + 1, 0).getDate();
  const today         = new Date();
  const isCurrentMonth = today.getMonth() === selMonth && today.getFullYear() === selYear;
  const dayOfMonth    = isCurrentMonth ? today.getDate() : daysInMonth;
  const daysLeft      = isCurrentMonth ? daysInMonth - dayOfMonth : 0;
  const dailyAvg      = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0;
  const projectedTotal = dailyAvg * daysInMonth;
  const pctMonth      = Math.round((dayOfMonth / daysInMonth) * 100);
  const pctBudget     = pct(totalSpent, totalBudget);

  if (totalSpent > totalBudget)
    insights.push({ icon: "🚨", text: `You are <strong>${fmt(totalSpent - totalBudget)} over</strong> your total budget this month.` });

  if (isCurrentMonth && projectedTotal > totalBudget && totalSpent <= totalBudget)
    insights.push({ icon: "⚠️", text: `At this rate you'll spend <strong>${fmt(Math.round(projectedTotal))}</strong> by month end — <strong>${fmt(Math.round(projectedTotal - totalBudget))} over</strong> budget.` });

  if (isCurrentMonth && pctBudget < pctMonth - 10)
    insights.push({ icon: "✅", text: `You've used <strong>${pctBudget}%</strong> of budget with <strong>${pctMonth}%</strong> of month gone. Spending well below pace.` });

  if (isCurrentMonth && daysLeft > 0 && totalSpent < totalBudget) {
    const remaining = totalBudget - totalSpent;
    const perDay    = Math.round(remaining / daysLeft);
    insights.push({ icon: "📅", text: `<strong>${daysLeft} days left</strong> with ${fmt(remaining)} remaining — about <strong>${fmt(perDay)}/day</strong> to stay on budget.` });
  }

  const overCats = Object.keys(budget).filter(c => budget[c] > 0 && (spend[c] || 0) > budget[c]);
  if (overCats.length) {
    const worst = overCats.sort((a, b) => ((spend[b] || 0) - budget[b]) - ((spend[a] || 0) - budget[a]))[0];
    insights.push({ icon: "🔴", text: `<strong>${worst}</strong> is over budget by <strong>${fmt((spend[worst] || 0) - budget[worst])}</strong>.` });
  }

  const underCats = Object.keys(budget).filter(c => budget[c] > 0 && (spend[c] || 0) < budget[c] * 0.5);
  if (underCats.length) {
    const best = underCats.sort((a, b) => (budget[b] - (spend[b] || 0)) - (budget[a] - (spend[a] || 0)))[0];
    insights.push({ icon: "💚", text: `<strong>${best}</strong> still has <strong>${fmt(budget[best] - (spend[best] || 0))}</strong> left — well under budget.` });
  }

  const monthTxns = transactions.filter(t => { const d = new Date(t.date); return d.getMonth() === selMonth && d.getFullYear() === selYear; });
  if (monthTxns.length) {
    const biggest = monthTxns.reduce((a, b) => a.amount > b.amount ? a : b);
    insights.push({ icon: "💸", text: `Biggest expense: <strong>${biggest.description}</strong> — <strong>${fmt(biggest.amount)}</strong> on ${biggest.date}.` });
  }

  const dowMap = [0,0,0,0,0,0,0], dowCount = [0,0,0,0,0,0,0];
  monthTxns.forEach(t => { const d = new Date(t.date).getDay(); dowMap[d] += t.amount; dowCount[d]++; });
  const dowAvg  = dowMap.map((v, i) => dowCount[i] > 0 ? v / dowCount[i] : 0);
  const maxDow  = dowAvg.indexOf(Math.max(...dowAvg));
  const dowNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  if (dowCount[maxDow] > 0)
    insights.push({ icon: "📆", text: `You spend most on <strong>${dowNames[maxDow]}s</strong> — avg <strong>${fmt(Math.round(dowAvg[maxDow]))}</strong> per transaction.` });

  const prevMonth = selMonth === 0 ? 11 : selMonth - 1;
  const prevYear  = selMonth === 0 ? selYear - 1 : selYear;
  const prevTxns  = transactions.filter(t => { const d = new Date(t.date); return d.getMonth() === prevMonth && d.getFullYear() === prevYear; });
  const prevSpent = prevTxns.reduce((s, t) => s + t.amount, 0);
  if (prevSpent > 0 && totalSpent > 0) {
    const diff    = totalSpent - prevSpent;
    const pctDiff = Math.abs(Math.round((diff / prevSpent) * 100));
    if (diff < 0) insights.push({ icon: "📉", text: `Spending is <strong>${pctDiff}% lower</strong> than last month (${fmt(prevSpent)}). Keep it up!` });
    else if (diff > 0) insights.push({ icon: "📈", text: `Spending is <strong>${pctDiff}% higher</strong> than last month (${fmt(prevSpent)}).` });
  }

  return insights.slice(0, 5);
}

export default function Dashboard({ budget, transactions, selMonth, setSelMonth, selYear, setSelYear }) {
  const [chartsReady, setChartsReady] = useState(false);

  const txns   = transactions.filter(t => { const d = new Date(t.date); return d.getMonth() === selMonth && d.getFullYear() === selYear; });
  const spend  = {};
  txns.forEach(t => { spend[t.category] = (spend[t.category] || 0) + t.amount; });

  const totalBudget  = Object.values(budget).reduce((a, b) => a + b, 0);
  const totalSpent   = Object.values(spend).reduce((a, b) => a + b, 0);
  const remaining    = totalBudget - totalSpent;
  const activeCats   = Object.keys(budget).filter(c => budget[c] > 0);
  const spentCats    = activeCats.filter(c => (spend[c] || 0) > 0);

  const today          = new Date();
  const isCurrentMonth = today.getMonth() === selMonth && today.getFullYear() === selYear;
  const dayOfMonth     = isCurrentMonth ? today.getDate() : new Date(selYear, selMonth + 1, 0).getDate();
  const dailyAvg       = dayOfMonth > 0 ? Math.round(totalSpent / dayOfMonth) : 0;

  const prevM      = selMonth === 0 ? 11 : selMonth - 1;
  const prevY      = selMonth === 0 ? selYear - 1 : selYear;
  const prevSpent  = transactions.filter(t => { const d = new Date(t.date); return d.getMonth() === prevM && d.getFullYear() === prevY; }).reduce((s, t) => s + t.amount, 0);
  const spentDiff  = prevSpent > 0 ? Math.round(((totalSpent - prevSpent) / prevSpent) * 100) : null;

  const recent   = [...txns].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const insights = generateInsights(budget, spend, transactions, selMonth, selYear, totalBudget, totalSpent);

  // Load Chart.js once
  useEffect(() => {
    if (window.Chart) { setChartsReady(true); return; }
    const s  = document.createElement("script");
    s.src    = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    s.onload = () => setChartsReady(true);
    document.head.appendChild(s);
  }, []);

  // Draw charts
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!chartsReady || !window.Chart) return;
    const GRID     = "rgba(255,255,255,0.06)";
    const TICK     = "#5a6490";
    const fmtTick  = v => v >= 1000 ? "₹" + Math.round(v / 1000) + "k" : "₹" + v;
    const PIE      = ["#00e5cc","#ff4d8d","#ffb830","#00d68f","#a78bfa","#60a5fa","#f97316","#34d399","#fb7185","#818cf8"];

    // Chart 1 — Budget vs Actual
    createChart("mf-c1", {
      type: "bar",
      data: {
        labels: activeCats.map(c => c.length > 12 ? c.slice(0, 11) + "…" : c),
        datasets: [
          { label: "Budget", data: activeCats.map(c => budget[c] || 0), backgroundColor: "rgba(0,229,204,0.25)", borderColor: "#00e5cc", borderWidth: 1.5, borderRadius: 3 },
          { label: "Actual", data: activeCats.map(c => spend[c] || 0),  backgroundColor: activeCats.map(c => (spend[c] || 0) > (budget[c] || 0) ? "rgba(255,77,109,0.7)" : "rgba(0,214,143,0.7)"), borderRadius: 3 },
        ]
      },
      options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: TICK, font: { size: 10 }, callback: fmtTick }, grid: { color: GRID } }, y: { ticks: { color: TICK, font: { size: 10 } }, grid: { display: false } } } }
    });

    // Chart 2 — Donut
    createChart("mf-c2", {
      type: "doughnut",
      data: { labels: spentCats, datasets: [{ data: spentCats.map(c => spend[c]), backgroundColor: spentCats.map((_, i) => PIE[i % PIE.length]), borderWidth: 0, hoverOffset: 6 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: "62%", plugins: { legend: { display: false } } }
    });

    // Chart 3 — Daily spending
    const daysInMonth  = new Date(selYear, selMonth + 1, 0).getDate();
    const dayLabels    = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const dayData      = dayLabels.map(d => { const map = {}; txns.forEach(t => { const dd = new Date(t.date).getDate(); map[dd] = (map[dd] || 0) + t.amount; }); return map[d] || 0; });
    const dailyLimit   = totalBudget / daysInMonth;
    createChart("mf-c3", {
      type: "line",
      data: { labels: dayLabels, datasets: [
        { label: "Spent",       data: dayData,                              borderColor: "#00e5cc", backgroundColor: "rgba(0,229,204,0.08)", fill: true,  borderWidth: 2, pointRadius: 3, pointBackgroundColor: "#00e5cc", tension: 0.3 },
        { label: "Daily limit", data: dayLabels.map(() => Math.round(dailyLimit)), borderColor: "#ff4d8d", borderDash: [5, 4],                   fill: false, borderWidth: 1.5, pointRadius: 0 },
      ]},
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: TICK, font: { size: 10 }, maxTicksLimit: 10, autoSkip: true }, grid: { color: GRID } }, y: { ticks: { color: TICK, font: { size: 10 }, callback: fmtTick }, grid: { color: GRID } } } }
    });

    // Chart 4 — Day of week
    const dowTotals = [0,0,0,0,0,0,0], dowCounts = [0,0,0,0,0,0,0];
    txns.forEach(t => { const dow = new Date(t.date).getDay(); dowTotals[dow] += t.amount; dowCounts[dow]++; });
    const dowAvg = dowTotals.map((v, i) => dowCounts[i] > 0 ? Math.round(v / dowCounts[i]) : 0);
    const maxDow = Math.max(...dowAvg);
    createChart("mf-c4", {
      type: "bar",
      data: { labels: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"], datasets: [{ label: "Avg spend", data: dowAvg, backgroundColor: dowAvg.map(v => v === maxDow && v > 0 ? "#ff4d8d" : "rgba(0,229,204,0.35)"), borderRadius: 4, borderSkipped: false }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: TICK, font: { size: 11 } }, grid: { display: false } }, y: { ticks: { color: TICK, font: { size: 10 }, callback: fmtTick }, grid: { color: GRID } } } }
    });

    // Chart 5 — 6-month trend
    const months6  = Array.from({ length: 6 }, (_, i) => { const d = new Date(selYear, selMonth - 5 + i, 1); return { m: d.getMonth(), y: d.getFullYear(), label: MONTHS_SHORT[d.getMonth()] }; });
    const m6data   = months6.map(({ m, y }) => transactions.filter(t => { const d = new Date(t.date); return d.getMonth() === m && d.getFullYear() === y; }).reduce((s, t) => s + t.amount, 0));
    createChart("mf-c5", {
      type: "line",
      data: { labels: months6.map(x => x.label), datasets: [
        { label: "Spent",  data: m6data,                          borderColor: "#ff4d8d", backgroundColor: "rgba(255,77,141,0.08)", fill: true,  borderWidth: 2, pointRadius: 4, pointBackgroundColor: "#ff4d8d", tension: 0.3 },
        { label: "Budget", data: months6.map(() => totalBudget),  borderColor: "rgba(0,229,204,0.4)", borderDash: [5, 4],            fill: false, borderWidth: 1.5, pointRadius: 0 },
      ]},
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: TICK, font: { size: 11 } }, grid: { display: false } }, y: { ticks: { color: TICK, font: { size: 10 }, callback: fmtTick }, grid: { color: GRID } } } }
    });
  }, [chartsReady, selMonth, selYear, budget, transactions]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { ["mf-c1","mf-c2","mf-c3","mf-c4","mf-c5"].forEach(destroyChart); }, []);

  const PIE_DASH = ["#00e5cc","#ff4d8d","#ffb830","#00d68f","#a78bfa","#60a5fa","#f97316","#34d399","#fb7185","#818cf8"];
  const CC = {
    card:    { background: "#0d1130", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "16px 20px" },
    title:   { fontSize: 13, fontWeight: 600, color: "#e8eaf6", marginBottom: 4 },
    sub:     { fontSize: 11, color: "#5a6490", marginBottom: 14 },
    legend:  { display: "flex", flexWrap: "wrap", gap: 12, marginTop: 10 },
    legItem: { display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#9ba5c9" },
    legDot:  { width: 10, height: 10, borderRadius: 2, flexShrink: 0 },
  };

  return (
    <div>
      {/* Topbar */}
      <div className="mf-topbar">
        <h2>Dashboard</h2>
        <div className="mf-filters">
          <select className="mf-sel" value={selMonth} onChange={e => setSelMonth(+e.target.value)}>{MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}</select>
          <select className="mf-sel" value={selYear}  onChange={e => setSelYear(+e.target.value)}>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mf-cards" style={{ marginBottom: 18 }}>
        {[
          { label: "Budget",    val: fmt(totalBudget),        sub: MONTHS[selMonth] + " " + selYear,                                              color: "#e8eaf6",                          subColor: "#5a6490" },
          { label: "Spent",     val: fmt(totalSpent),         sub: pct(totalSpent, totalBudget) + "% of budget",                                   color: "#e8eaf6",                          subColor: "#5a6490" },
          { label: remaining >= 0 ? "Remaining" : "Over Budget", val: fmt(Math.abs(remaining)), sub: remaining >= 0 ? txns.length + " transactions" : "Over budget", color: remaining >= 0 ? "#e8eaf6" : "#ff4d6d", subColor: remaining >= 0 ? "#5a6490" : "#ff4d6d" },
          { label: "Daily Avg", val: fmt(dailyAvg),           sub: spentDiff !== null ? (spentDiff < 0 ? "↓ " + Math.abs(spentDiff) + "% vs last month" : "↑ " + spentDiff + "% vs last month") : "no prior data", color: "#e8eaf6", subColor: spentDiff !== null && spentDiff < 0 ? "#00d68f" : "#ffb830" },
        ].map((c, i) => (
          <div key={i} style={{ background: "#0d1130", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#5a6490", marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: c.color }}>{c.val}</div>
            <div style={{ fontSize: 11, color: c.subColor, marginTop: 4 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts grid — exact proposal layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* Chart 1: Budget vs Actual */}
        <div style={CC.card}>
          <div style={CC.title}>Budget vs actual</div>
          <div style={CC.sub}>Overspend shown in red · this month</div>
          <div style={{ position: "relative", height: Math.max(180, activeCats.length * 36) }}>
            <canvas id="mf-c1" role="img" aria-label="Budget vs actual by category">Budget vs actual.</canvas>
          </div>
          <div style={CC.legend}>
            {[{ c: "rgba(0,229,204,0.5)", l: "Budget" }, { c: "rgba(0,214,143,0.75)", l: "Under budget" }, { c: "rgba(255,77,109,0.75)", l: "Over budget" }].map((x, i) => (
              <span key={i} style={CC.legItem}><span style={{ ...CC.legDot, background: x.c }} />{x.l}</span>
            ))}
          </div>
        </div>

        {/* Chart 2: Donut */}
        <div style={CC.card}>
          <div style={CC.title}>Spending breakdown</div>
          <div style={CC.sub}>Where your money goes · this month</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
              <canvas id="mf-c2" role="img" aria-label="Spending breakdown donut">Spending by category.</canvas>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 100 }}>
              {spentCats.slice(0, 6).map((c, i) => (
                <div key={c} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "#9ba5c9", gap: 6 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ ...CC.legDot, width: 8, height: 8, background: PIE_DASH[i % PIE_DASH.length] }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 90 }}>{c}</span>
                  </span>
                  <span style={{ fontWeight: 600, color: "#e8eaf6", flexShrink: 0 }}>{fmt(spend[c])}</span>
                </div>
              ))}
              {spentCats.length === 0 && <div style={{ color: "#5a6490", fontSize: 12 }}>No spending yet</div>}
            </div>
          </div>
        </div>

        {/* Chart 3: Daily — full width */}
        <div style={{ ...CC.card, gridColumn: "1 / -1" }}>
          <div style={CC.title}>Daily spending pattern</div>
          <div style={CC.sub}>How much you spend each day · dotted = daily budget limit</div>
          <div style={{ position: "relative", height: 180 }}>
            <canvas id="mf-c3" role="img" aria-label="Daily spending line chart">Daily spending.</canvas>
          </div>
          <div style={CC.legend}>
            <span style={CC.legItem}><span style={{ width: 14, height: 2, background: "#00e5cc", borderRadius: 2, flexShrink: 0 }} /> Daily spend</span>
            <span style={CC.legItem}><span style={{ width: 14, height: 0, borderTop: "2px dashed #ff4d8d", flexShrink: 0 }} /> Daily limit</span>
          </div>
        </div>

        {/* Chart 4: Day of week */}
        <div style={CC.card}>
          <div style={CC.title}>Spending by day of week</div>
          <div style={CC.sub}>Which days you spend most · pink = highest</div>
          <div style={{ position: "relative", height: 180 }}>
            <canvas id="mf-c4" role="img" aria-label="Day of week spending">Day of week.</canvas>
          </div>
        </div>

        {/* Chart 5: Monthly trend */}
        <div style={CC.card}>
          <div style={CC.title}>Monthly trend</div>
          <div style={CC.sub}>Spent vs budget · last 6 months</div>
          <div style={{ position: "relative", height: 180 }}>
            <canvas id="mf-c5" role="img" aria-label="Monthly trend">Monthly trend.</canvas>
          </div>
          <div style={CC.legend}>
            <span style={CC.legItem}><span style={{ width: 14, height: 2, background: "#ff4d8d", borderRadius: 2, flexShrink: 0 }} /> Spent</span>
            <span style={CC.legItem}><span style={{ width: 14, height: 0, borderTop: "2px dashed rgba(0,229,204,0.6)", flexShrink: 0 }} /> Budget</span>
          </div>
        </div>

        {/* Chart 6: Category usage */}
        <div style={CC.card}>
          <div style={CC.title}>Category budget usage</div>
          <div style={CC.sub}>% of budget used · this month</div>
          {activeCats.length === 0
            ? <div style={{ color: "#5a6490", fontSize: 13 }}>No budget set. Go to Budget page.</div>
            : activeCats.map(cat => {
              const s = spend[cat] || 0, b = budget[cat], p = pct(s, b), over = s > b;
              return (
                <div key={cat} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: "#9ba5c9", width: 120, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat}</span>
                  <div style={{ flex: 1, height: 7, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(p, 100)}%`, background: over ? "#D85A30" : p > 80 ? "#BA7517" : "#1D9E75", borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 11, color: over ? "#ff4d6d" : p > 80 ? "#ffb830" : "#9ba5c9", width: 36, textAlign: "right", flexShrink: 0, fontWeight: over || p > 80 ? 600 : 400 }}>{p}%</span>
                </div>
              );
            })
          }
        </div>

        {/* Chart 7: Smart insights */}
        <div style={CC.card}>
          <div style={CC.title}>Smart insights</div>
          <div style={CC.sub}>Personalised observations</div>
          {insights.length === 0
            ? <div style={{ color: "#5a6490", fontSize: 13 }}>Add transactions to see insights.</div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {insights.map((ins, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: 17, flexShrink: 0, lineHeight: 1.4 }}>{ins.icon}</span>
                  <span style={{ fontSize: 12, color: "#9ba5c9", lineHeight: 1.55 }} dangerouslySetInnerHTML={{ __html: ins.text.replace(/<strong>/g, `<strong style="color:#e8eaf6;font-weight:600">`) }} />
                </div>
              ))}
            </div>
          }
        </div>

      </div>

      {/* Recent transactions */}
      <div style={{ ...CC.card, marginTop: 14 }}>
        <div style={CC.title}>Recent transactions</div>
        <div style={{ ...CC.sub, marginBottom: 0 }}>Latest expenses this month</div>
        {recent.length === 0
          ? <div style={{ color: "#5a6490", fontSize: 13, padding: "20px 0", textAlign: "center" }}>No transactions this month</div>
          : recent.map(t => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, color: "#e8eaf6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</div>
                <div style={{ fontSize: 11, color: "#5a6490", marginTop: 2 }}>{t.date} · <span style={{ color: "#9ba5c9" }}>{t.category}</span></div>
              </div>
              <div style={{ color: "#ff4d8d", fontWeight: 700, fontSize: 13, marginLeft: 16, flexShrink: 0 }}>{fmt(t.amount)}</div>
            </div>
          ))
        }
      </div>
    </div>
  );
}