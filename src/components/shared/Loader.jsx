export default function Loader() {
  return (
    <div style={{ minHeight: "100vh", background: "#07091a", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 26, fontWeight: 800, background: "linear-gradient(135deg,#00e5cc,#ff4d8d)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "inline-block" }}>
        Monefy
      </div>
      <div style={{ color: "#5a6490", fontSize: 13 }}>Loading…</div>
    </div>
  );
}