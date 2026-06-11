import { useState } from "react";

export function ConfirmModal({ icon, title, message, confirmLabel = "Delete", danger = true, onConfirm, onCancel }) {
  return (
    <div className="mf-modal-backdrop" onClick={onCancel}>
      <div className="mf-modal" onClick={e => e.stopPropagation()}>
        <div className="mf-modal-icon">{icon}</div>
        <div className="mf-modal-title">{title}</div>
        <div className="mf-modal-msg">{message}</div>
        <div className="mf-modal-btns">
          <button className="mf-modal-cancel" onClick={onCancel}>Cancel</button>
          <button className={`mf-modal-ok ${danger ? "" : "cyan"}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function useConfirm() {
  const [opts, setOpts] = useState(null);

  const confirm = (options) => new Promise(resolve => {
    setOpts({ ...options, resolve });
  });

  const modal = opts ? (
    <ConfirmModal
      icon={opts.icon || "🗑️"}
      title={opts.title || "Are you sure?"}
      message={opts.message || "This action cannot be undone."}
      confirmLabel={opts.confirmLabel || "Delete"}
      danger={opts.danger !== false}
      onConfirm={() => { opts.resolve(true);  setOpts(null); }}
      onCancel={()  => { opts.resolve(false); setOpts(null); }}
    />
  ) : null;

  return { confirm, modal };
}