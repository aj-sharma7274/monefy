import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { timeAgo, avatarColor, avatarInitial } from "../constants";
import { useConfirm } from "./shared/ConfirmModal";
import Avatar from "./shared/Avatar";

const TAG_LABELS = {
  feature:   "✨ Feature",
  bug:       "🐛 Bug",
  complaint: "😤 Complaint",
  other:     "💬 Other",
};

const isAdmin = (profile) => profile?.is_admin === true;

// ── Thread Detail ──
function ThreadDetail({ thread, session, profile, onBack }) {
  const [comments,      setComments]      = useState([]);
  const [text,          setText]          = useState("");
  const [posting,       setPosting]       = useState(false);
  const [msg,           setMsg]           = useState(null);
  const [profiles,      setProfiles]      = useState({});
  const [threadProfile, setThreadProfile] = useState(null);
  const { confirm, modal } = useConfirm();
  const admin = isAdmin(profile);

  const loadComments = useCallback(async () => {
    const { data } = await supabase
      .from("feedback_comments").select("*")
      .eq("thread_id", thread.id).order("created_at", { ascending: true });
    if (data) {
      setComments(data);
      const ids = [...new Set(data.map(c => c.author_id))];
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("*").in("id", ids);
        if (profs) { const map = {}; profs.forEach(p => { map[p.id] = p; }); setProfiles(map); }
      }
    }
  }, [thread.id]);

  useEffect(() => { loadComments(); }, [loadComments]);
  useEffect(() => {
    supabase.from("profiles").select("*").eq("id", thread.author_id).single()
      .then(({ data }) => setThreadProfile(data));
  }, [thread.author_id]);

  const postComment = async () => {
    if (!text.trim()) { setMsg({ t: "err", m: "Write something first" }); return; }
    setPosting(true);
    const { error } = await supabase.from("feedback_comments").insert({
      thread_id: thread.id, body: text.trim(),
      author_id: session.user.id,
      author_name: profile?.display_name || session.user.email,
    });
    if (!error) {
      await supabase.from("feedback_threads")
        .update({ comment_count: (thread.comment_count || 0) + comments.length + 1 })
        .eq("id", thread.id);
    }
    setPosting(false);
    if (error) { setMsg({ t: "err", m: "Error posting." }); return; }
    setText(""); loadComments();
  };

  const deleteComment = async (id) => {
    const ok = await confirm({ icon: "💬", title: "Delete Comment", message: "This comment will be permanently removed.", confirmLabel: "Delete Comment" });
    if (!ok) return;
    await supabase.from("feedback_comments").delete().eq("id", id);
    loadComments();
  };

  const deleteThread = async () => {
    const ok = await confirm({ icon: "🗑️", title: "Delete Post", message: "This post and all its comments will be permanently deleted.", confirmLabel: "Delete Post" });
    if (!ok) return;
    await supabase.from("feedback_comments").delete().eq("thread_id", thread.id);
    await supabase.from("feedback_threads").delete().eq("id", thread.id);
    onBack();
  };

  return (
    <div>
      {modal}
      <div className="mf-back-btn" onClick={onBack}>← Back to Board</div>

      {/* Thread body */}
      <div className="mf-sec" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span className={`mf-tag mf-tag-${thread.tag}`}>{TAG_LABELS[thread.tag] || thread.tag}</span>
          {(admin || thread.author_id === session.user.id) && (
            <button className="mf-btn-d" style={{ padding: "3px 10px", fontSize: 11 }} onClick={deleteThread}>🗑 Delete Post</button>
          )}
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: "#e8eaf6" }}>{thread.title}</h3>
        <p style={{ fontSize: 14, color: "#9ba5c9", lineHeight: 1.6, marginBottom: 14 }}>{thread.body}</p>
        <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 11, color: "#5a6490" }}>
          <Avatar profile={threadProfile} size={24} fontSize={11} />
          <span>{thread.author_name}</span>
          <span>·</span>
          <span>{timeAgo(thread.created_at)}</span>
          {admin && thread.author_id !== session.user.id && <span style={{ color: "#ffb830", fontSize: 10, marginLeft: 4 }}>👑</span>}
        </div>
      </div>

      {/* Comments */}
      <div className="mf-sec">
        <div className="mf-sec-title">{comments.length} Comment{comments.length !== 1 ? "s" : ""}</div>
        {comments.length === 0
          ? <div style={{ color: "#5a6490", fontSize: 13, padding: "12px 0" }}>No comments yet. Add the first one!</div>
          : comments.map(c => (
              <div key={c.id} className="mf-comment">
                <Avatar profile={profiles[c.author_id]} size={34} fontSize={14} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 5, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#e8eaf6" }}>{c.author_name}</span>
                    <span style={{ fontSize: 11, color: "#5a6490" }}>{timeAgo(c.created_at)}</span>
                    {c.author_id === session.user.id && (
                      <span style={{ fontSize: 10, color: "#5a6490", background: "rgba(255,255,255,.06)", padding: "1px 6px", borderRadius: 4 }}>You</span>
                    )}
                    {admin && c.author_id !== session.user.id && <span style={{ fontSize: 10, color: "#ffb830" }}>👑</span>}
                    {(admin || c.author_id === session.user.id) && (
                      <button className="mf-btn-d" style={{ padding: "2px 8px", fontSize: 10, marginLeft: "auto" }} onClick={() => deleteComment(c.id)}>🗑</button>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: "#9ba5c9", lineHeight: 1.6 }}>{c.body}</p>
                </div>
              </div>
            ))
        }

        {/* Add comment */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,.06)" }}>
          <div className="mf-sec-title">Add a Comment</div>
          <textarea className="mf-textarea" value={text} onChange={e => setText(e.target.value)} placeholder="Share your thoughts…" style={{ marginBottom: 10 }} />
          <button className="mf-btn-p" onClick={postComment} disabled={posting}>{posting ? "Posting…" : "Post Comment"}</button>
          {msg && <div className={msg.t === "ok" ? "mf-msg-ok" : "mf-msg-err"}>{msg.m}</div>}
        </div>
      </div>
    </div>
  );
}

// ── Main Feedback Board ──
export default function Feedback({ session, profile }) {
  const [threads,    setThreads]    = useState([]);
  const [openThread, setOpenThread] = useState(null);
  const [showNew,    setShowNew]    = useState(false);
  const [title,      setTitle]      = useState("");
  const [body,       setBody]       = useState("");
  const [tag,        setTag]        = useState("feature");
  const [posting,    setPosting]    = useState(false);
  const [msg,        setMsg]        = useState(null);
  const { confirm, modal } = useConfirm();
  const admin = isAdmin(profile);

  const loadThreads = useCallback(async () => {
    const { data } = await supabase.from("feedback_threads").select("*").order("created_at", { ascending: false });
    if (data) setThreads(data);
  }, []);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  const postThread = async () => {
    if (!title.trim() || !body.trim()) { setMsg({ t: "err", m: "Fill title and description" }); return; }
    setPosting(true);
    const { error } = await supabase.from("feedback_threads").insert({
      title: title.trim(), body: body.trim(), tag,
      author_id:   session.user.id,
      author_name: profile?.display_name || session.user.email,
    });
    setPosting(false);
    if (error) { setMsg({ t: "err", m: "Error posting." }); return; }
    setTitle(""); setBody(""); setTag("feature"); setShowNew(false);
    loadThreads();
  };

  const deleteThread = async (e, id) => {
    e.stopPropagation();
    const ok = await confirm({ icon: "🗑️", title: "Delete Post", message: "This post and all its comments will be permanently deleted.", confirmLabel: "Delete Post" });
    if (!ok) return;
    await supabase.from("feedback_comments").delete().eq("thread_id", id);
    await supabase.from("feedback_threads").delete().eq("id", id);
    loadThreads();
  };

  if (openThread) return (
    <ThreadDetail
      thread={openThread}
      session={session}
      profile={profile}
      onBack={() => { setOpenThread(null); loadThreads(); }}
    />
  );

  return (
    <div>
      {modal}
      <div className="mf-topbar">
        <h2>Feedback Board</h2>
        <button className="mf-btn-p" onClick={() => setShowNew(s => !s)}>
          {showNew ? "Cancel" : "+ New Post"}
        </button>
      </div>

      {/* New thread form */}
      {showNew && (
        <div className="mf-sec" style={{ maxWidth: 600, marginBottom: 20 }}>
          <div className="mf-sec-title">Create New Thread</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="mf-form-group">
              <label className="mf-form-label">Title</label>
              <input type="text" className="mf-inp" value={title} onChange={e => setTitle(e.target.value)} placeholder="Short summary of your post" />
            </div>
            <div className="mf-form-group">
              <label className="mf-form-label">Description</label>
              <textarea className="mf-textarea" value={body} onChange={e => setBody(e.target.value)} placeholder="Describe your feature request, bug, or feedback…" />
            </div>
            <div className="mf-form-group">
              <label className="mf-form-label">Category</label>
              <select className="mf-inp" style={{ cursor: "pointer" }} value={tag} onChange={e => setTag(e.target.value)}>
                <option value="feature">✨ Feature Request</option>
                <option value="bug">🐛 Bug Report</option>
                <option value="complaint">😤 Complaint</option>
                <option value="other">💬 Other</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <button className="mf-btn-p" onClick={postThread} disabled={posting}>{posting ? "Posting…" : "Post"}</button>
            <button className="mf-btn-g" onClick={() => setShowNew(false)}>Cancel</button>
          </div>
          {msg && <div className={msg.t === "ok" ? "mf-msg-ok" : "mf-msg-err"}>{msg.m}</div>}
        </div>
      )}

      {/* Thread list */}
      {threads.length === 0
        ? <div className="mf-sec" style={{ textAlign: "center", color: "#5a6490", padding: "40px 0" }}>
            No posts yet. Be the first to share feedback!
          </div>
        : threads.map(t => (
            <div key={t.id} className="mf-thread-card" onClick={() => setOpenThread(t)}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span className={`mf-tag mf-tag-${t.tag}`}>{TAG_LABELS[t.tag] || t.tag}</span>
                {(admin || t.author_id === session.user.id) && (
                  <button className="mf-btn-d" style={{ padding: "3px 10px", fontSize: 11 }} onClick={e => deleteThread(e, t.id)}>🗑 Delete</button>
                )}
              </div>
              <div className="mf-thread-title">{t.title}</div>
              <div className="mf-thread-body">{t.body}</div>
              <div className="mf-thread-meta">
                <span>👤 {t.author_name}</span>
                <span>🕐 {timeAgo(t.created_at)}</span>
                <span>💬 {t.comment_count || 0} comments</span>
                {admin && <span style={{ color: "#ffb830", fontSize: 10 }}>👑 admin view</span>}
              </div>
            </div>
          ))
      }
    </div>
  );
}