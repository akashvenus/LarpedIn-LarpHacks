import { ASSETS } from '../assets/manifest';
import { CommunityPost, PhotoRef, PROMPTS, PromptId, StandUpPost } from '../domain/types';

export interface SocialDemoProps {
  profile: { id: string; name: string; headline: string };
  postText: string;
  /** Captured photos in fixed prompt order (room → selfie → banner → handshake). */
  photos: PhotoRef[];
  /** Show the draft or the published post. */
  published: boolean;
  profilePhoto: PromptId | null;
  onSelectPhoto: (promptId: PromptId) => void;
  communityPosts: CommunityPost[];
  standUps: StandUpPost[];
  standUpBusy: boolean;
  standUpError: string | null;
  onDeleteStandUp: (post: StandUpPost) => void;
  feedError: string | null;
  onPublish: (text: string) => void;
  onEdit?: () => void;
  onReplace?: () => void;
  onDelete: () => void;
  onCancelReplace: () => void;
  busy: boolean;
  error: string | null;
  replacing: boolean;
}

function photoAlt(promptId: PromptId): string {
  return PROMPTS.find((p) => p.id === promptId)?.label ?? 'Event';
}

export function SocialDemo({
  profile,
  postText,
  photos,
  published,
  profilePhoto,
  onSelectPhoto,
  communityPosts,
  standUps,
  standUpBusy,
  standUpError,
  onDeleteStandUp,
  feedError,
  onPublish,
  onEdit,
  onReplace,
  onDelete,
  onCancelReplace,
  busy,
  error,
  replacing,
}: SocialDemoProps) {
  const avatar = photos.find((photo) => photo.promptId === profilePhoto)?.url
    ?? photos.find((photo) => photo.promptId === 'selfie')?.url
    ?? photos[0]?.url ?? ASSETS.avatar;

  const photoGrid =
    photos.length > 0 ? (
      <div className="photo-grid">
        {photos.map((ph) => (
          <img key={ph.promptId} src={ph.url} alt={`${photoAlt(ph.promptId)} — captured at the event`} />
        ))}
      </div>
    ) : null;

  const feedItems = [
    ...communityPosts.map((post) => ({ type: 'event' as const, post })),
    ...standUps.map((post) => ({ type: 'standup' as const, post })),
  ].sort((a, b) => Date.parse(b.post.createdAt) - Date.parse(a.post.createdAt));

  const communityFeed = (
    <section className="card">
      <h3>Community feed</h3>
      {feedError && <p className="form-error" role="alert">{feedError}</p>}
      {standUpError && <p className="form-error" role="alert">{standUpError}</p>}
      {!feedError && feedItems.length === 0 && <p className="muted">No community posts yet.</p>}
      {feedItems.map((item) => item.type === 'standup' ? (
        <article className="feed-post community-post" key={`standup-${item.post.id}`}>
          <div className="feed-head">
            <img className="feed-avatar" src={item.post.isOwn ? avatar : ASSETS.avatar} alt="" />
            <div><strong>{item.post.name}</strong><div className="muted feed-time">{item.post.headline} · {new Date(item.post.createdAt).toLocaleString()}</div></div>
            {item.post.isOwn && <button type="button" className="post-delete" aria-label="Delete Stand-Up" title="Delete Stand-Up" disabled={standUpBusy} onClick={() => onDeleteStandUp(item.post)}>🗑️</button>}
          </div>
          <p className="muted feed-time">Daily Stand-Up</p>
          {item.post.win && <p className="feed-text"><strong>The win: </strong>{item.post.win}</p>}
          {item.post.nextStep && <p className="feed-text"><strong>Next up: </strong>{item.post.nextStep}</p>}
        </article>
      ) : (
        <article className="feed-post community-post" key={`event-${item.post.id}`}>
          <div className="feed-head">
            <img className="feed-avatar" src={ASSETS.avatar} alt="" />
            <div><strong>Community member</strong><div className="muted feed-time">{new Date(item.post.createdAt).toLocaleString()}</div></div>
          </div>
          <p className="muted feed-time">Event · {item.post.eventId}</p>
          <p className="feed-text">{item.post.text}</p>
          {item.post.photos?.length > 0 && (
            <div className="photo-grid">
              {item.post.photos.map((photo) => (
                <img key={photo.promptId} src={photo.url} alt={`${photoAlt(photo.promptId)} — captured at the event`} />
              ))}
            </div>
          )}
        </article>
      ))}
    </section>
  );

  return (
    <div className="social">
      {error && <p className="post-action-error" role="alert">{error}</p>}
      {!published ? (
        <>
        <section className="card">
          <h3>Your post · draft</h3>
          <article className="feed-post">
            <div className="feed-head">
              <img className="feed-avatar" src={avatar} alt="" />
              <div>
                <strong>{profile.name}</strong>
                <div className="muted feed-time">{profile.headline} · draft</div>
              </div>
            </div>
            {postText ? (
              <p className="feed-text">{postText}</p>
            ) : (
              <p className="muted">Choose an event and compose a post to share it here.</p>
            )}
            {photoGrid}
          </article>
          {photos.length > 0 && (
            <fieldset className="profile-photo-picker">
              <legend>Choose a profile photo</legend>
              <div className="profile-photo-options">
                {photos.map((photo) => <button key={photo.promptId} type="button" className="profile-photo-option"
                  aria-label={`Use ${photoAlt(photo.promptId)} as profile photo`} aria-pressed={avatar === photo.url}
                  onClick={() => onSelectPhoto(photo.promptId)}><img src={photo.url} alt="" /></button>)}
              </div>
            </fieldset>
          )}
          {onEdit && (
            <button type="button" className="btn btn-block social-edit" onClick={onEdit}>
              {postText ? 'Edit post' : 'Create post'}
            </button>
          )}
          <button
            className="btn btn-primary btn-block"
            style={{ marginTop: 12 }}
            disabled={!postText.trim() || busy}
            onClick={() => onPublish(postText)}
          >
            {busy ? 'Saving…' : replacing ? 'Save replacement' : '📤 Post to feed · +40 XP'}
          </button>
          {replacing && <button type="button" className="btn btn-block social-edit" onClick={onCancelReplace} disabled={busy}>Cancel replacement</button>}
        </section>
        {communityFeed}
        </>
      ) : (
        <>
          <section className="card">
            <h3>Feed</h3>
            <article className="feed-post">
              <div className="feed-head">
                <img className="feed-avatar" src={avatar} alt="" />
                <div>
                  <strong>{profile.name}</strong>
                  <div className="muted feed-time">{profile.headline} · Just now</div>
                </div>
                <button type="button" className="post-delete" aria-label="Delete post" title="Delete post" onClick={onDelete} disabled={busy}>🗑️</button>
              </div>
              <p className="feed-text">{postText}</p>
              {photoGrid}
              {onReplace && <button type="button" className="btn social-edit" onClick={onReplace} disabled={busy}>Edit post</button>}
            </article>
          </section>
          {communityFeed}


        </>
      )}
    </div>
  );
}
