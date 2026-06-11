import { avatarColor, avatarInitial } from "../../constants";

export default function Avatar({ profile, size = 36, fontSize = 15 }) {
  const color = avatarColor(profile?.display_name || "?");

  if (profile?.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt="avatar"
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${color}44` }}
      />
    );
  }

  if (profile?.avatar_emoji) {
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", background: color + "22", border: `2px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.5, flexShrink: 0 }}>
        {profile.avatar_emoji}
      </div>
    );
  }

  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color + "22", border: `2px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize, fontWeight: 700, color, flexShrink: 0 }}>
      {avatarInitial(profile?.display_name || "?")}
    </div>
  );
}