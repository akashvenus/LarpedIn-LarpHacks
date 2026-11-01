import { useCallback, useEffect, useRef, useState } from 'react';
import { DemoEvent, PromptId, PROMPTS } from '../domain/types';

export interface CameraGuideProps {
  event: DemoEvent;
  completedPrompts: PromptId[];
  photoUrl: string | null;
  onCapture: (blob: Blob, promptId: PromptId) => void;
  onCheck: (promptId: PromptId) => void;
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
 * Event photo guide (F2): live getUserMedia preview, exactly one real
 * capture (credited to the chosen prompt), three manually checked
 * prompts, thumbnail, and continue only when all four are complete.
 *
 * - Tracks are stopped on unmount.
 * - Failures are classified (denied / no camera / insecure context /
 *   other) with a clear explanation and a retry where one makes sense.
 * - The photo is a device-local Blob; never persisted or uploaded.
 */
export function CameraGuide({
  event,
  completedPrompts,
  photoUrl,
  onCapture,
  onCheck,
  onContinue,
}: CameraGuideProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CamStatus>({ kind: 'starting' });
  const [captureTarget, setCaptureTarget] = useState<PromptId>('room');
  const [captured, setCaptured] = useState(photoUrl !== null);

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

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      stopStream();
      setCaptured(true);
      onCapture(blob, captureTarget);
    }, 'image/png');
  }, [captureTarget, onCapture, stopStream]);

  const allComplete = completedPrompts.length === PROMPTS.length;
  const live = status.kind === 'live';

  return (
    <>
      <header>
        <h1>{event.title} · Photo guide</h1>
        <p className="muted" style={{ margin: 0 }}>
          {event.dateLabel} · {event.venueLabel} — one real capture counts; check off the rest.
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
              camera apps and retry, or switch to a device with a camera.
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
              run the app locally, then reload.
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
        {captured && photoUrl && (
          <div className="cam-captured" role="img" aria-label="Captured photo thumbnail">
            <img src={photoUrl} alt="Your captured photo" />
          </div>
        )}
      </div>

      <div className="cam-controls">
        {!captured && live && (
          <>
            <div className="cam-target-row" aria-label="Which prompt this capture fulfills">
              <span className="cam-target-label">Capture counts for:</span>
              {PROMPTS.map((p) => (
                <button
                  key={p.id}
                  className={`cam-chip${captureTarget === p.id ? ' on' : ''}`}
                  onClick={() => setCaptureTarget(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button className="btn btn-primary btn-block" onClick={handleCapture}>
              📸 Capture photo
            </button>
          </>
        )}
        {captured && (
          <p className="cam-captured-note">
            ✅ One real photo captured. Check off the remaining prompts, then continue.
          </p>
        )}
      </div>

      <section className="card">
        <h3>Photo checkpoints</h3>
        <ul className="prompt-list">
          {PROMPTS.map((p) => {
            const done = completedPrompts.includes(p.id);
            return (
              <li key={p.id} className={`prompt-row${done ? ' done' : ''}`}>
                <div className="prompt-copy">
                  <strong>{p.label}</strong>
                  <span className="muted">{p.hint}</span>
                </div>
                {done ? (
                  <span className="prompt-check" aria-label={`${p.label} complete`}>
                    ✓
                  </span>
                ) : (
                  <button className="btn prompt-check-btn" onClick={() => onCheck(p.id)}>
                    Check
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <button className="btn btn-primary btn-block" disabled={!allComplete} onClick={onContinue}>
        {allComplete ? 'Continue to post composer →' : `${completedPrompts.length}/4 checkpoints done`}
      </button>
    </>
  );
}
