import { useState } from 'react';
import { AiPreset, ComposerInput, DemoEvent, Option } from '../domain/types';

export interface PostComposerProps {
  event: DemoEvent;
  options: { hooks: Option[]; learnings: Option[]; conclusions: Option[]; hashtags: Option[] };
  onCompose: (input: ComposerInput) => Promise<string>;
  onComposed: (text: string, input: ComposerInput) => void;
  onAiPreset: (eventId: string) => Promise<AiPreset>;
}

type Phase = 'choose' | 'composing';
type ActiveSlot = 'hook' | 'learning' | 'conclusion' | 'hashtags';

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function pickRandomItems<T>(items: T[], count: number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy.slice(0, count);
}

export function PostComposer({ event, options, onCompose, onComposed, onAiPreset }: PostComposerProps) {
  const [hookId, setHookId] = useState<string | null>(null);
  const [learningIds, setLearningIds] = useState<string[]>([]);
  const [conclusionId, setConclusionId] = useState<string | null>(null);
  const [hashtagIds, setHashtagIds] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>('choose');
  const [error, setError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeSlot, setActiveSlot] = useState<ActiveSlot>('hook');

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

  const applyRandomPreset = () => {
    if (options.hooks.length === 0 || options.learnings.length < 3) return;
    const hashtagCount = Math.min(options.hashtags.length, Math.floor(Math.random() * 3) + 1);
    setHookId(pickRandom(options.hooks).id);
    setLearningIds(pickRandomItems(options.learnings, 3).map((item) => item.id));
    setConclusionId(options.conclusions.length > 0 ? pickRandom(options.conclusions).id : null);
    setHashtagIds(pickRandomItems(options.hashtags, hashtagCount).map((item) => item.id));
  };

  const applyPreset = (preset: AiPreset) => {
    const hook = options.hooks.find((item) => item.id === preset.hookId);
    const conclusion = options.conclusions.find((item) => item.id === preset.conclusionId);
    const learnings = preset.learningIds.filter((id) => options.learnings.some((item) => item.id === id));
    const hashtags = preset.hashtagIds.filter((id) => options.hashtags.some((item) => item.id === id));
    if (
      !hook ||
      !conclusion ||
      learnings.length !== 3 ||
      new Set(learnings).size !== 3 ||
      hashtags.length < 1 ||
      hashtags.length > 3 ||
      new Set(hashtags).size !== hashtags.length
    ) {
      applyRandomPreset();
      return;
    }
    setHookId(hook.id);
    setLearningIds(learnings);
    setConclusionId(conclusion.id);
    setHashtagIds(hashtags);
  };

  const aiTakeTheWheel = async () => {
    if (options.hooks.length === 0 || options.learnings.length < 3) return;
    setAiLoading(true);
    setError(null);
    try {
      applyPreset(await onAiPreset(event.id));
    } catch {
      applyRandomPreset();
    } finally {
      setAiLoading(false);
    }
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
      onComposed(text, input);
    } catch (err) {
      setPhase('choose');
      setError(err instanceof Error ? err.message : 'Compose failed.');
    }
  };

  const learningText = learningIds.map(
    (id) => options.learnings.find((option) => option.id === id)?.text ?? '',
  );
  const hashtagText = hashtagIds
    .map((id) => options.hashtags.find((option) => option.id === id)?.text)
    .filter(Boolean)
    .join(', ');
  // The worksheet template supplies its own punctuation, so drop any
  // trailing period/!/? carried by the option copy to avoid "47.."
  const renderSentence = (text: string) => text.replace(/[.!?]+$/, '');

  const hookText = renderSentence(options.hooks.find((option) => option.id === hookId)?.text ?? '');
  const conclusionText = renderSentence(
    options.conclusions.find((option) => option.id === conclusionId)?.text ?? '',
  );

  const renderBlank = (slot: ActiveSlot, label: string, value: string, ariaLabel: string) => (
    <button
      type="button"
      className={`blank${activeSlot === slot ? ' active' : ''}`}
      onClick={() => setActiveSlot(slot)}
      aria-label={ariaLabel}
    >
      <span className="blank-value">{value}</span>
      <span className="blank-label">{label}</span>
    </button>
  );

  const choiceTitle =
    activeSlot === 'hook'
      ? '① Choose your hook'
      : activeSlot === 'learning'
        ? '②–④ Pick three learnings'
        : activeSlot === 'conclusion'
          ? '⑤ Choose a conclusion'
          : '⑥ Pick hashtags';

  return (
    <div className="composer">
      <div className={`event-pick worksheet-event${event.featured ? ' featured' : ''}`}>
        {event.featured && <span className="pill pill-featured">Featured</span>}
        <strong>{event.title}</strong>
        <span className="event-meta">{event.dateLabel} · {event.venueLabel}</span>
      </div>

      <section className="worksheet-card">
        <div className="worksheet-caption">LarpedIn · Career Story Worksheet</div>
        <p className="worksheet">
          At <span className="given">{event.title}</span>,{' '}
          {renderBlank('hook', '① HOOK', hookText, 'Choose your hook')}. By the end of the night, I&apos;d learned that{' '}
          {renderBlank('learning', '② LEARNING', learningText[0] ?? '', 'Choose learning one')},{' '}
          {renderBlank('learning', '③ LEARNING', learningText[1] ?? '', 'Choose learning two')}, and{' '}
          {renderBlank('learning', '④ LEARNING', learningText[2] ?? '', 'Choose learning three')}.{' '}
          {renderBlank('conclusion', '⑤ CONCLUSION', conclusionText, 'Choose your conclusion')}{' '}
          {renderBlank('hashtags', '⑥ HASHTAGS', hashtagText, 'Choose your hashtags')}
        </p>
      </section>

      <section className="card worksheet-choice-panel">
        <h3>
          {choiceTitle}{' '}
          {activeSlot === 'learning' && <span className="muted">({learningIds.length}/3)</span>}
          {activeSlot === 'hashtags' && <span className="muted">(1–3)</span>}
        </h3>
        {activeSlot === 'hook' && (
          <div className="choice-list">
            {options.hooks.map((h) => (
              <button type="button" key={h.id} className={`choice${hookId === h.id ? ' on' : ''}`} onClick={() => setHookId(h.id)}>
                “{h.text}”
              </button>
            ))}
          </div>
        )}
        {activeSlot === 'learning' && (
          <div className="choice-list">
            {options.learnings.map((l) => (
              <button
                type="button"
                key={l.id}
                className={`choice${learningIds.includes(l.id) ? ' on' : ''}`}
                onClick={() => toggleLearning(l.id)}
                disabled={!learningIds.includes(l.id) && learningIds.length >= 3}
              >
                {l.text}
              </button>
            ))}
          </div>
        )}
        {activeSlot === 'conclusion' && (
          <div className="choice-list">
            {options.conclusions.map((c) => (
              <button type="button" key={c.id} className={`choice${conclusionId === c.id ? ' on' : ''}`} onClick={() => setConclusionId(c.id)}>
                {c.text}
              </button>
            ))}
          </div>
        )}
        {activeSlot === 'hashtags' && (
          <div className="chip-row">
            {options.hashtags.map((t) => (
              <button
                type="button"
                key={t.id}
                className={`chip${hashtagIds.includes(t.id) ? ' on' : ''}`}
                onClick={() => toggleHashtag(t.id)}
                disabled={!hashtagIds.includes(t.id) && hashtagIds.length >= 3}
              >
                {t.text}
              </button>
            ))}
          </div>
        )}
        <p className="worksheet-helper">Tap a blank on the worksheet to switch what you&apos;re filling.</p>
      </section>

      <div className="composer-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => void aiTakeTheWheel()}
          disabled={phase === 'composing' || aiLoading}
        >
          {aiLoading ? 'Asking Gemini…' : '✨ AI take the wheel'}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void handleCompose()}
          disabled={!readyToCompose || phase === 'composing' || aiLoading}
        >
          {phase === 'composing' ? 'Composing…' : 'Compose post'}
        </button>
      </div>
      {error && <p className="form-error">⚠️ {error}</p>}
    </div>
  );
}
