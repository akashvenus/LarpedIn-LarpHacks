import { ASSETS } from '../assets/manifest';

export function Inbox({ recruiter, message, sent, sending, reply, userAvatar = ASSETS.avatar }: {
  recruiter: { name: string; headline: string };
  message: string;
  sent: boolean;
  sending: boolean;
  reply: 'offer' | 'rejection' | null;
  userAvatar?: string;
}) {
  const initials = recruiter.name.split(/\s+/).map((word) => word[0]).slice(0, 2).join('');
  return (
    <div className="social">
      <section className="card inbox-card">
        <h3>Messages</h3>
        {(sent || sending) && <header className="inbox-recipient">
          <div className="inbox-avatar" aria-hidden="true">{initials}</div>
          <div><strong>To: {recruiter.name}</strong><div className="muted feed-time">{recruiter.headline}</div></div>
        </header>}
        {sending ? <p className="inbox-waiting inbox-sending" role="status"><span className="inbox-spinner" aria-hidden="true" />Sending your message…</p> : sent ? (
          <article className="inbox-msg" aria-label="Conversation">
            <div className="inbox-message inbox-outgoing">
              <div className="inbox-message-content">
                <div className="inbox-bubble"><p>{message}</p></div>
                <div className="inbox-status">Sent · just now</div>
              </div>
              <img className="inbox-user-avatar" src={userAvatar} alt="" />
            </div>
            <div aria-live="polite">
              {reply ? <div className="inbox-message inbox-incoming">
                <div className="inbox-avatar" aria-hidden="true">{initials}</div>
                <div className="inbox-message-content">
                  <div className="inbox-reply-label"><strong>{recruiter.name}</strong><span className="muted feed-time">Automated LarpedIn reply</span></div>
                  <div className="inbox-bubble"><p>{reply === 'offer'
                    ? "Thank you for sharing your profile. Your commitment to high-impact thought leadership has truly resonated with our talent ecosystem. We're delighted to offer you the role and look forward to unlocking unprecedented synergies together. Welcome aboard!"
                    : "Thank you for sharing your profile and your passion for thought leadership. After careful alignment with our evolving talent priorities, we've decided not to move forward with your application. We encourage you to stay connected as your professional journey continues to scale."}</p></div>
                </div>
              </div> : <p className="muted inbox-waiting">Awaiting a reply…</p>}
            </div>
          </article>
        ) : <p className="muted inbox-waiting">No messages yet. Claim your gift to send a message.</p>}
      </section>
    </div>
  );
}
