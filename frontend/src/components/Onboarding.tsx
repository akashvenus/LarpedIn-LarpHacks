import { FormEvent, useState } from 'react';

export function Onboarding({ onComplete }: { onComplete: (name: string, occupation: string) => void }) {
  const [name, setName] = useState('');
  const [occupation, setOccupation] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (name.trim() && occupation.trim()) onComplete(name, occupation);
  };
  return (
    <div className="splash onboarding">
      <form className="splash-card onboarding-card" onSubmit={submit}>
        <h1 className="brand-logo" aria-label="LarpedIn">Larped<span>in</span></h1>
        <h2>Make your introduction</h2>
        <p className="muted">Tell us how you want to appear on your demo profile.</p>
        <label className="personal-field">Name<input autoComplete="name" maxLength={100} value={name} onChange={(event) => setName(event.target.value)} required /></label>
        <label className="personal-field">Occupation<input autoComplete="organization-title" maxLength={160} value={occupation} onChange={(event) => setOccupation(event.target.value)} placeholder="e.g. Computer science student" required /></label>
        <button className="btn btn-primary" type="submit" disabled={!name.trim() || !occupation.trim()}>Continue</button>
      </form>
    </div>
  );
}
