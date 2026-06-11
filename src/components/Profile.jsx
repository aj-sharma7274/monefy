import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Avatar from "./shared/Avatar";

const PRESET_AVATARS = [
  "🧑","👩","👨","🧔","👩‍💻","👨‍💻","🧑‍🎨","👩‍🎨",
  "🦊","🐯","🐻","🦁","🐸","🐧","🦋","🌟",
  "🔥","💎","🚀","🎯",
];

export default function Profile({ session, profile, onProfileUpdated }) {
  const [name,        setName]        = useState(profile?.display_name || "");
  const [newPass,     setNewPass]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [nameMsg,     setNameMsg]     = useState(null);
  const [passMsg,     setPassMsg]     = useState(null);
  const [avatarMsg,   setAvatarMsg]   = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  useEffect(() => { setName(profile?.display_name || ""); }, [profile]);

  const saveName = async () => {
    if (!name.trim()) { setNameMsg({ t: "err", m: "Name cannot be empty" }); return; }
    setSaving(true);
    await supabase.from("profiles").upsert({
      id: session.user.id,
      display_name: name.trim(),
      email: session.user.email,
      avatar_url:   profile?.avatar_url   || null,
      avatar_emoji: profile?.avatar_emoji || null,
      is_admin:     profile?.is_admin     || false,
    });
    await supabase.auth.updateUser({ data: { display_name: name.trim() } });
    setSaving(false);
    setNameMsg({ t: "ok", m: "Name updated! ✓" });
    onProfileUpdated();
    setTimeout(() => setNameMsg(null), 2500);
  };

  const savePass = async () => {
    if (!newPass || !confirmPass) { setPassMsg({ t: "err", m: "Fill both fields" }); return; }
    if (newPass !== confirmPass)  { setPassMsg({ t: "err", m: "Passwords don't match" }); return; }
    if (newPass.length < 6)       { setPassMsg({ t: "err", m: "Min 6 characters" }); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setSaving(false);
    if (error) { setPassMsg({ t: "err", m: "Error updating password." }); return; }
    setPassMsg({ t: "ok", m: "Password updated! ✓" });
    setNewPass(""); setConfirmPass("");
    setTimeout(() => setPassMsg(null), 2500);
  };

  const uploadPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setAvatarMsg({ t: "err", m: "Max file size is 2MB" }); return; }
    setUploading(true);
    const ext  = file.name.split(".").pop();
    const path = `avatars/${session.user.id}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { setAvatarMsg({ t: "err", m: "Upload failed. Check avatars bucket in Supabase Storage." }); setUploading(false); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = data.publicUrl + "?t=" + Date.now();
    await supabase.from("profiles").upsert({
      id: session.user.id, display_name: profile?.display_name || name,
      email: session.user.email, avatar_url: url, avatar_emoji: null, is_admin: profile?.is_admin || false,
    });
    setUploading(false);
    setAvatarMsg({ t: "ok", m: "Photo updated! ✓" });
    onProfileUpdated();
    setTimeout(() => setAvatarMsg(null), 2500);
  };

  const pickEmoji = async (emoji) => {
    await supabase.from("profiles").upsert({
      id: session.user.id, display_name: profile?.display_name || name,
      email: session.user.email, avatar_url: null, avatar_emoji: emoji, is_admin: profile?.is_admin || false,
    });
    setShowPresets(false);
    setAvatarMsg({ t: "ok", m: "Avatar updated! ✓" });
    onProfileUpdated();
    setTimeout(() => setAvatarMsg(null), 2500);
  };

  const removeAvatar = async () => {
    await supabase.from("profiles").upsert({
      id: session.user.id, display_name: profile?.display_name || name,
      email: session.user.email, avatar_url: null, avatar_emoji: null, is_admin: profile?.is_admin || false,
    });
    setAvatarMsg({ t: "ok", m: "Avatar removed" });
    onProfileUpdated();
    setTimeout(() => setAvatarMsg(null), 2500);
  };

  return (
    <div>
      <div className="mf-topbar">
        <h2>Profile</h2>
        {profile?.is_admin && (
          <span style={{ background: "rgba(255,184,48,.15)", color: "#ffb830", padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
            👑 Admin
          </span>
        )}
      </div>

      <div className="mf-sec" style={{ maxWidth: 480 }}>

        {/* Avatar section */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ position: "relative", display: "inline-block", marginBottom: 12 }}>
            <Avatar profile={profile} size={80} fontSize={30} />
            {(profile?.avatar_url || profile?.avatar_emoji) && (
              <button onClick={removeAvatar} style={{ position: "absolute", top: -4, right: -4, width: 22, height: 22, borderRadius: "50%", background: "#ff4d6d", border: "none", cursor: "pointer", fontSize: 11, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            )}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>{profile?.display_name || "—"}</div>
          <div style={{ fontSize: 13, color: "#5a6490", marginBottom: 16 }}>{session.user.email}</div>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <label style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(0,229,204,.3)", background: "rgba(0,229,204,.08)", color: "#00e5cc", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
              {uploading ? "Uploading…" : "📷 Upload Photo"}
              <input type="file" accept="image/*" onChange={uploadPhoto} style={{ display: "none" }} disabled={uploading} />
            </label>
            <button onClick={() => setShowPresets(s => !s)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(167,139,250,.3)", background: "rgba(167,139,250,.08)", color: "#a78bfa", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
              😀 Pick Emoji
            </button>
          </div>

          {showPresets && (
            <div style={{ marginTop: 14, padding: 14, background: "rgba(255,255,255,.04)", borderRadius: 12, border: "1px solid rgba(255,255,255,.08)" }}>
              <div style={{ fontSize: 11, color: "#5a6490", textTransform: "uppercase", letterSpacing: ".7px", marginBottom: 10 }}>Choose an avatar</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {PRESET_AVATARS.map(e => (
                  <button key={e} onClick={() => pickEmoji(e)} style={{ width: 40, height: 40, borderRadius: 8, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", cursor: "pointer", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>{e}</button>
                ))}
              </div>
            </div>
          )}
          {avatarMsg && <div className={avatarMsg.t === "ok" ? "mf-msg-ok" : "mf-msg-err"} style={{ marginTop: 10 }}>{avatarMsg.m}</div>}
        </div>

        <div className="mf-divider" />

        {/* Display name */}
        <div style={{ marginBottom: 4 }}>
          <div className="mf-sec-title">Update Display Name</div>
          <input type="text" className="mf-inp" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && saveName()} placeholder="Your name" style={{ marginBottom: 10 }} />
          <button className="mf-btn-p" onClick={saveName} disabled={saving}>Save Name</button>
          {nameMsg && <div className={nameMsg.t === "ok" ? "mf-msg-ok" : "mf-msg-err"}>{nameMsg.m}</div>}
        </div>

        <div className="mf-divider" />

        {/* Change password */}
        <div>
          <div className="mf-sec-title">Change Password</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
            <input type="password" className="mf-inp" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New password" />
            <input type="password" className="mf-inp" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} onKeyDown={e => e.key === "Enter" && savePass()} placeholder="Confirm new password" />
          </div>
          <button className="mf-btn-p" onClick={savePass} disabled={saving}>Update Password</button>
          {passMsg && <div className={passMsg.t === "ok" ? "mf-msg-ok" : "mf-msg-err"}>{passMsg.m}</div>}
        </div>

      </div>
    </div>
  );
}