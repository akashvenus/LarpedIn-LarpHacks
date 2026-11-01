import type { ReactNode } from 'react';

export function XpHeader({ xp, showProgress = true, action }: { xp: number; showProgress?: boolean; action?: ReactNode }) {
  return (
    <header className="topbar app-header">
      <span className="brand-logo app-wordmark" aria-label="LarpedIn">Larped<span>in</span></span>
      {showProgress && <div className="xp-wrap">
        <div className="xp-row">
          <span>Tech-bro internship (with equity)</span>
          <strong>{xp}/100 XP</strong>
        </div>
        <div className="xp-bar" role="progressbar" aria-valuenow={xp} aria-valuemin={0} aria-valuemax={100}
          aria-label="Progress toward a tech-bro VC startup internship with equity">
          <div className="xp-fill" style={{ width: `${xp}%` }} />
        </div>
      </div>}
      {action}
    </header>
  );
}
