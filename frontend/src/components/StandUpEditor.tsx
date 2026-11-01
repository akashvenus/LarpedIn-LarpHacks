import { FormEvent, useEffect, useRef, useState } from 'react';
import { StandUpPost } from '../domain/types';

export function StandUpEditor({ post, busy, error, onSave, onClose }: {
  post: StandUpPost;
  busy: boolean;
  error: string | null;
  onSave: (post: StandUpPost, win: string, nextStep: string) => Promise<boolean>;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [win, setWin] = useState(post.win);
  const [nextStep, setNextStep] = useState(post.nextStep);
  useEffect(() => { dialog.current?.showModal(); }, []);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (await onSave(post, win.trim(), nextStep.trim())) onClose();
  };
  return <dialog ref={dialog} className="standup-editor" aria-labelledby="standup-edit-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <form onSubmit={(event) => void submit(event)}>
      <h2 id="standup-edit-title">Edit Stand-Up</h2>
      <label className="personal-field">What did you ship, learn, or survive?<textarea value={win} maxLength={500} onChange={(event) => setWin(event.target.value)} /></label>
      <label className="personal-field">What's on the roadmap?<textarea value={nextStep} maxLength={500} onChange={(event) => setNextStep(event.target.value)} /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="standup-editor-actions">
        <button type="button" className="btn" onClick={onClose} disabled={busy}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={busy || !(win.trim() || nextStep.trim())}>{busy ? 'Saving…' : 'Save changes'}</button>
      </div>
    </form>
  </dialog>;
}
