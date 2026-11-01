import { useEffect, useRef, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

export function PostActions({ label, onEdit, onDelete, busy }: {
  label: string;
  onEdit?: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); }
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape); };
  }, [open]);

  return <div className="post-actions" ref={container}>
    <button ref={trigger} type="button" className="post-action-trigger" aria-label={`${label} options`}
      aria-expanded={open} disabled={busy} onClick={() => setOpen((value) => !value)}>
      <Pencil size={18} aria-hidden="true" />
    </button>
    {open && <div className="post-action-menu" aria-label={`${label} actions`}>
      <button type="button" disabled={!onEdit} onClick={() => { setOpen(false); onEdit?.(); }}><Pencil size={16} aria-hidden="true" /> Edit post</button>
      <button type="button" className="post-action-remove" onClick={() => { setOpen(false); onDelete(); }}><Trash2 size={16} aria-hidden="true" /> Delete post</button>
    </div>}
  </div>;
}
