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

type CamStatus = 'starting' | 'live' | 'denied' | 'unsupported';

/**
 * Event photo guide (F2): live getUserMedia preview, exactly one real
 * capture (credited to the chosen prompt), three manually checked
 * prompts, thumbnail, and continue only when all four are complete.
 *
 * - Tracks are stopped on unmount.
 * - Permission denial gets a clear retry state.
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
  const [status, setStatus] = useState<CamStatus>('starting');
  const [captureTarget, setCaptureTarget] = useState<PromptId>('room');
  const [captured, setCaptured] = useState(photoUrl !== null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setStatus('starting');
    stopStream();
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('unsupported');
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
      setStatus('live');
    } catch {
      setStatus('denied');
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
        {status === 'starting' && (
          <div className="cam-overlay">
            <div className="cam-spinner" aria-hidden />
            <p>Starting camera…</p>
          </div>
        )}
        {status === 'denied' && (
          <div className="cam-overlay">
            <p>📷 Camera blocked.</p>
            <p className="muted">Allow camera access in your browser, then try again.</p>
            <button className="btn btn-primary" onClick={() => void startCamera()}>
              Retry camera
            </button>
          </div>
        )}
        {status === 'unsupported' && (
          <div className="cam-overlay">
            <p>📷 Camera not available.</p>
            <p className="muted">
              This demo needs a real camera over HTTPS (or localhost) with permission granted.
            </p>
          </div>
        )}
        {captured && photoUrl && (
          <div className="cam-captured" role="img" aria-label="Captured photo thumbnail">
            <img src={photoUrl} alt="Your captured photo" />
          </div>
        )}
      </div>

      <div className="cam-controls">
        {!captured && status === 'live' && (
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
