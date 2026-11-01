import { ASSETS } from '../assets/manifest';
import { PhotoRef, PROMPTS, PromptId } from '../domain/types';

export interface SocialDemoProps {
  profile: { id: string; name: string; headline: string };
  postText: string;
  /** Captured photos in fixed prompt order (room → selfie → banner → handshake). */
  photos: PhotoRef[];
  /** Show the draft or the published post. */
  published: boolean;
  profilePhoto: PromptId | null;
  onSelectPhoto: (promptId: PromptId) => void;
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

  return (
    <div className="social">
      {error && <p className="post-action-error" role="alert">{error}</p>}
      {!published ? (
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
              <div className="feed-fake-actions" aria-hidden>
                <span>👍 12</span>
                <span>💬 3</span>
                <span>↗ 1 repost</span>
              </div>
            </article>
          </section>


        </>
      )}
    </div>
  );
}
