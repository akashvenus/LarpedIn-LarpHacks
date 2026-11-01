export function Inbox({ recruiter, message, sent, sending }: {
  recruiter: { name: string; headline: string };
  message: string;
  sent: boolean;
  sending: boolean;
}) {
  return (
    <div className="social">
      <section className="card">
        <h3>Messages</h3>
        {sending ? <p className="inbox-waiting inbox-sending" role="status"><span className="inbox-spinner" aria-hidden="true" />Sending your message…</p> : sent ? (
          <article className="inbox-msg">
            <div className="inbox-head">
              <div className="inbox-avatar" aria-hidden>{recruiter.name.split(/\s+/).map((word) => word[0]).slice(0, 2).join('')}</div>
              <div><strong>To: {recruiter.name}</strong><div className="muted feed-time">{recruiter.headline}</div></div>
            </div>
            <div className="inbox-bubble"><p>{message}</p></div>
            <div className="inbox-status">Sent · just now</div>
          </article>
        ) : <p className="muted inbox-waiting">No messages yet. Claim your gift to send a message.</p>}
      </section>
    </div>
  );
}
