import { ASSETS } from '../assets/manifest';

export interface TrophiesProps {
  badgeUnlocked: boolean;
  micUnlocked: boolean;
  lightsUnlocked: boolean;
  standUpSubmitted: boolean;
}

/**
 * Trophies screen (F1): the one badge plus the dorm shelf — mic (from a
 * real capture), RGB lights (from publishing), and the daily stand-up.
 * Locked rows stay visible so the judge sees what is still to come.
 */
export function Trophies({ badgeUnlocked, micUnlocked, lightsUnlocked, standUpSubmitted }: TrophiesProps) {
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

      <section className="card">
        <h3>Dorm shelf</h3>
        <div className="trophy-shelf">
          <div className={`shelf-row${micUnlocked ? ' unlocked' : ''}`}>
            <img className="shelf-icon" src={ASSETS.mic} alt="" />
            <div className="shelf-copy">
              <strong>Holdable mic</strong>
              <span className="muted">Capture one real photo in an event guide</span>
            </div>
            <span className={`shelf-status${micUnlocked ? ' on' : ''}`}>
              {micUnlocked ? 'Unlocked' : 'Locked'}
            </span>
          </div>

          <div className={`shelf-row${lightsUnlocked ? ' unlocked' : ''}`}>
            <img className="shelf-icon" src={ASSETS.rgbLights} alt="" />
            <div className="shelf-copy">
              <strong>RGB desk lights</strong>
              <span className="muted">Publish your event post</span>
            </div>
            <span className={`shelf-status${lightsUnlocked ? ' on' : ''}`}>
              {lightsUnlocked ? 'Unlocked' : 'Locked'}
            </span>
          </div>

          <div className={`shelf-row${standUpSubmitted ? ' unlocked' : ''}`}>
            <span className="shelf-emoji" aria-hidden>📋</span>
            <div className="shelf-copy">
              <strong>Daily stand-up</strong>
              <span className="muted">Log a two-bullet stand-up in your dorm</span>
            </div>
            <span className={`shelf-status${standUpSubmitted ? ' on' : ''}`}>
              {standUpSubmitted ? 'Logged' : 'Not logged'}
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
