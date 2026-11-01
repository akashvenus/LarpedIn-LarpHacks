import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Camera, Trash2 } from 'lucide-react';
import { DemoEvent, PromptId, PROMPTS } from '../domain/types';

export interface CameraGuideProps {
  event: DemoEvent;
  completedPrompts: PromptId[];
  /** One object URL per prompt (null = not captured yet). */
  photos: Record<PromptId, string | null>;
  onCapture: (blob: Blob, promptId: PromptId) => void;
  onDeletePhoto: (promptId: PromptId) => void;
  onContinue: () => void;
}

type CamStatus =
  | { kind: 'starting' }
  | { kind: 'live' }
  | { kind: 'denied' }
  | { kind: 'nocamera' }
  | { kind: 'insecure' }
  | { kind: 'error'; message: string };

/**
 * Event photo guide (F2). Each of the four prompts has its own 📷 snap
 * button against the shared live preview; a re-snap overwrites that
 * prompt's photo. Continue is always available when photos are skipped.
 *
 * - The camera stays live for the whole screen; tracks stop on unmount.
 * - Failures are classified (denied / no camera / insecure / other) with
 *   a clear explanation and retry where it makes sense.
 * - Captures are compressed before the app saves them with browser progress.
 */
export function CameraGuide({
  event,
  completedPrompts,
  photos,
  onCapture,
  onDeletePhoto,
  onContinue,
}: CameraGuideProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CamStatus>({ kind: 'starting' });

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setStatus({ kind: 'starting' });
    stopStream();
    try {
      if (window.isSecureContext === false) {
        setStatus({ kind: 'insecure' });
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus({ kind: 'nocamera' });
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => undefined);
      }
      setStatus({ kind: 'live' });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setStatus({ kind: 'denied' });
      } else if (
        name === 'NotFoundError' ||
        name === 'OverconstrainedError' ||
        name === 'NotReadableError'
      ) {
        setStatus({ kind: 'nocamera' });
      } else if (name === 'InsecureContextError') {
        setStatus({ kind: 'insecure' });
      } else {
        setStatus({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
      }
    }
  }, [stopStream]);

  useEffect(() => {
    void startCamera();
    return () => stopStream();
  }, [startCamera, stopStream]);

  /** Snap the current frame and credit it to the given prompt (overwrite on re-snap). */
  const handleSnap = useCallback(
    (promptId: PromptId) => {
      const video = videoRef.current;
      if (!video || video.videoWidth === 0) return;
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 1440 / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        onCapture(blob, promptId);
      }, 'image/jpeg', 0.82);
    },
    [onCapture],
  );

  const doneCount = completedPrompts.length;
  const allComplete = doneCount === PROMPTS.length;
  const live = status.kind === 'live';

  return (
    <>
      <header>
        <h1>{event.title} · Pics or it didn’t happen</h1>
        <p className="muted" style={{ margin: 0 }}>
          {event.dateLabel} · {event.venueLabel}<br />
          Capture the event, the vibes, and ideally yourself. Or skip the photos.
        </p>
      </header>

      <div className="cam-stage">
        <video ref={videoRef} className="cam-video" muted playsInline autoPlay />
        {status.kind === 'starting' && (
          <div className="cam-overlay">
            <div className="cam-spinner" aria-hidden />
            <p>Starting camera…</p>
          </div>
        )}
        {status.kind === 'denied' && (
          <div className="cam-overlay">
            <p>📷 Camera permission was blocked</p>
            <p className="muted">
              Your browser stopped LarpedIn from using the camera. Click the camera icon (or the
              padlock) in the address bar, set it to <strong>Allow</strong>, then retry. In Chrome:
              lock icon → Camera → Allow → reload.
            </p>
            <button className="btn btn-primary" onClick={() => void startCamera()}>
              Retry camera
            </button>
          </div>
        )}
        {status.kind === 'nocamera' && (
          <div className="cam-overlay">
            <p>📷 No camera available</p>
            <p className="muted">
              No camera was found on this device (or it is in use by another app). Close other
              camera apps and retry, or continue without photos below.
            </p>
            <button className="btn" onClick={() => void startCamera()}>
              Try again
            </button>
          </div>
        )}
        {status.kind === 'insecure' && (
          <div className="cam-overlay">
            <p>🔒 Camera needs a secure connection</p>
            <p className="muted">
              Browsers only expose the camera over HTTPS (or localhost). Open the deployed URL, or
              run the app locally, then reload. You can still continue without photos below.
            </p>
          </div>
        )}
        {status.kind === 'error' && (
          <div className="cam-overlay">
            <p>⚠️ Camera failed to start</p>
            <p className="muted">{status.message || 'Unknown error.'}</p>
            <button className="btn" onClick={() => void startCamera()}>
              Retry camera
            </button>
          </div>
        )}
      </div>

      <section className="card">
        <h3>Photo checkpoints · {doneCount}/4</h3>
        <ul className="prompt-list">
          {PROMPTS.map((p) => {
            const photoUrl = photos[p.id];
            const done = completedPrompts.includes(p.id);
            return (
              <li key={p.id} className={`prompt-row${done ? ' done' : ''}`}>
                <div className="prompt-copy">
                  <strong>{p.label}</strong>
                  <span className="muted">{p.hint}</span>
                </div>
                <div className="prompt-actions">
                  {photoUrl && (
                    <img
                      className="prompt-thumb"
                      src={photoUrl}
                      alt={`${p.label} capture`}
                    />
                  )}
                  <button
                    className="btn snap-btn"
                    disabled={!live}
                    aria-label={`${photoUrl ? 'Retake' : 'Take'} ${p.label} photo`}
                    title={photoUrl ? 'Snap again (replaces this photo)' : 'Snap a photo for this checkpoint'}
                    onClick={() => handleSnap(p.id)}
                  >
                    <Camera size={18} aria-hidden="true" />
                  </button>
                  {photoUrl && <button type="button" className="photo-delete" onClick={() => onDeletePhoto(p.id)}
                    aria-label={`Delete ${p.label} photo`} title={`Delete ${p.label} photo`}>
                    <Trash2 size={18} aria-hidden="true" />
                  </button>}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <button className="btn btn-primary btn-block" onClick={onContinue}>
        {allComplete ? <>Continue to post composer <ArrowRight size={18} className="action-icon" aria-hidden="true" /></> : 'Continue (skip photos)'}
      </button>
    </>
  );
}
