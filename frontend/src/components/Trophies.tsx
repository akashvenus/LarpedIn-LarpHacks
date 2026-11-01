export interface TrophiesProps {
  badgeUnlocked: boolean;
}

/**
 * Trophies screen (F1): one badge, locked until all four photo prompts
 * are complete. Extra trophy art is on the cut list if time slips.
 */
export function Trophies({ badgeUnlocked }: TrophiesProps) {
  return (
    <>
      <header>
        <h1>Trophies</h1>
        <p className="muted" style={{ margin: 0 }}>
          Milestones from the internship sim.
        </p>
      </header>

      <div className="card trophy-badge">
        <div className={`badge-orb${badgeUnlocked ? ' unlocked' : ''}`} aria-hidden>
          🏅
        </div>
        <div>
          <h2 style={{ margin: 0 }}>{badgeUnlocked ? 'Event Photographer' : 'Locked badge'}</h2>
          <p className="muted" style={{ margin: '8px 0 0' }}>
            {badgeUnlocked
              ? 'All four photo checkpoints complete. Certified first-year operator.'
              : 'Complete all four photo checkpoints in an event guide to unlock.'}
          </p>
        </div>
      </div>
    </>
  );
}
