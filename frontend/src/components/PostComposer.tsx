import { useState } from 'react';
import { ComposerInput, DemoEvent, Option } from '../domain/types';

export interface PostComposerProps {
  event: DemoEvent;
  options: {
    hooks: Option[];
    learnings: Option[];
    conclusions: Option[];
    hashtags: Option[];
  };
  /** Calls POST /api/compose; resolves with the assembled text. */
  onCompose: (input: ComposerInput) => Promise<string>;
  /** Receives the final edited text. */
  onPublish: (text: string) => void;
}

type Phase = 'choose' | 'composing' | 'preview';

/**
 * MadLibs post composer (F3): choose a hook, exactly three distinct
 * learnings, a conclusion, and 1–3 hashtags. "AI take the wheel"
 * prefills a deterministic curated preset. The assembled text is
 * editable before publishing via onPublish. No typing required.
 */
export function PostComposer({ event, options, onCompose, onPublish }: PostComposerProps) {
  const [hookId, setHookId] = useState<string | null>(null);
  const [learningIds, setLearningIds] = useState<string[]>([]);
  const [conclusionId, setConclusionId] = useState<string | null>(null);
  const [hashtagIds, setHashtagIds] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>('choose');
  const [previewText, setPreviewText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const readyToCompose =
    hookId !== null && learningIds.length === 3 && conclusionId !== null && hashtagIds.length >= 1;

  const toggleLearning = (id: string) => {
    setLearningIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 3 ? prev : [...prev, id],
    );
  };

  const toggleHashtag = (id: string) => {
    setHashtagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 3 ? prev : [...prev, id],
    );
  };

  /** Deterministic curated preset — no live model call. */
  const aiTakeTheWheel = () => {
    if (options.hooks.length === 0 || options.learnings.length < 3) return;
    setHookId(options.hooks[0].id);
    setLearningIds(options.learnings.slice(0, 3).map((l) => l.id));
    setConclusionId(options.conclusions[0]?.id ?? null);
    setHashtagIds(options.hashtags.slice(0, 2).map((h) => h.id));
  };

  const handleCompose = async () => {
    if (!readyToCompose || !hookId || !conclusionId) return;
    setPhase('composing');
    setError(null);
    try {
      const input: ComposerInput = {
        eventId: event.id,
        hookId,
        learningIds: learningIds as [string, string, string],
        conclusionId,
        hashtagIds,
      };
      const text = await onCompose(input);
      setPreviewText(text);
      setPhase('preview');
    } catch (err) {
      setPhase('choose');
      setError(err instanceof Error ? err.message : 'Compose failed.');
    }
  };

  return (
    <div className="composer">
      <section className="card">
        <h3>1 · Pick your hook</h3>
        <div className="choice-list">
          {options.hooks.map((h) => (
            <button
              key={h.id}
              className={`choice${hookId === h.id ? ' on' : ''}`}
              onClick={() => setHookId(h.id)}
            >
              “{h.text}”
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>
          2 · Three things you learned <span className="muted">({learningIds.length}/3)</span>
        </h3>
        <div className="choice-list">
          {options.learnings.map((l) => (
            <button
              key={l.id}
              className={`choice${learningIds.includes(l.id) ? ' on' : ''}`}
              onClick={() => toggleLearning(l.id)}
              disabled={!learningIds.includes(l.id) && learningIds.length >= 3}
            >
              {l.text}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>3 · Land the conclusion</h3>
        <div className="choice-list">
          {options.conclusions.map((c) => (
            <button
              key={c.id}
              className={`choice${conclusionId === c.id ? ' on' : ''}`}
              onClick={() => setConclusionId(c.id)}
            >
              {c.text}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>
          4 · Hashtags <span className="muted">(1–3)</span>
        </h3>
        <div className="chip-row">
          {options.hashtags.map((t) => (
            <button
              key={t.id}
              className={`chip${hashtagIds.includes(t.id) ? ' on' : ''}`}
              onClick={() => toggleHashtag(t.id)}
              disabled={!hashtagIds.includes(t.id) && hashtagIds.length >= 3}
            >
              {t.text}
            </button>
          ))}
        </div>
      </section>

      <div className="composer-actions">
        <button
          className="btn btn-ghost"
          onClick={aiTakeTheWheel}
          disabled={phase === 'composing'}
        >
          ✨ AI take the wheel
        </button>
        <button
          className="btn btn-primary"
          onClick={() => void handleCompose()}
          disabled={!readyToCompose || phase === 'composing'}
        >
          {phase === 'composing' ? 'Composing…' : 'Compose post'}
        </button>
      </div>
      {error && <p className="form-error">⚠️ {error}</p>}

      {phase === 'preview' && (
        <section className="card preview-card">
          <h3>Preview · edit anything, then publish</h3>
          <textarea
            className="preview-text"
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            aria-label="Editable post preview"
          />
          <button
            className="btn btn-primary btn-block"
            disabled={!previewText.trim()}
            onClick={() => onPublish(previewText)}
          >
            📤 Publish to feed · +40 XP
          </button>
        </section>
      )}
    </div>
  );
}
