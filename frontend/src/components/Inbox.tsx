export function Inbox({ recruiter, message, postText, sent, sending }: {
  recruiter: { name: string; headline: string };
  message: string;
  postText: string;
  sent: boolean;
  sending: boolean;
}) {
  return (
    <div className="social">
      <section className="card">
        <h3>Messages</h3>
        {sending ? <p className="inbox-waiting inbox-sending" role="status"><span className="inbox-spinner" aria-hidden="true" />Sending your post…</p> : sent ? (
          <article className="inbox-msg">
            <div className="inbox-head">
              <div className="inbox-avatar" aria-hidden>{recruiter.name.split(/\s+/).map((word) => word[0]).slice(0, 2).join('')}</div>
              <div><strong>To: {recruiter.name}</strong><div className="muted feed-time">{recruiter.headline}</div></div>
            </div>
            <div className="inbox-bubble"><p>{message}</p>{postText && <p className="feed-text">{postText}</p>}</div>
            <div className="inbox-status">Sent in demo · just now</div>
          </article>
        ) : <p className="muted inbox-waiting">No messages yet. Claim your gift to send your post.</p>}
      </section>
    </div>
  );
}
