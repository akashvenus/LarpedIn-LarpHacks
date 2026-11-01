import { useEffect, useState } from 'react';
import { localCompose } from '../api';
import { AiPreset, ComposerAnswer, ComposerDraft, ComposerInput, ComposerTextSlot, DemoData, DemoEvent, PhotoRef, PROMPTS } from '../domain/types';

export interface PostComposerProps {
  event: DemoEvent;
  demo: DemoData;
  photos: PhotoRef[];
  draft: ComposerDraft;
  onDraftChange: (draft: ComposerDraft) => void;
  onCompose: (input: ComposerInput) => Promise<string>;
  onComposed: (text: string, input: ComposerInput) => void;
  onAiPreset: (eventId: string) => Promise<AiPreset>;
}

type TextSlot = ComposerTextSlot;
type Slot = ComposerDraft['active'];
type Answer = ComposerAnswer;
type Answers = ComposerDraft['answers'];
const slots: Slot[] = ['hook', 'moment', 'person', 'nextStep', 'conclusion', 'hashtags'];
const labels: Record<Slot, string> = {
  hook: 'Opening line', moment: 'A moment or takeaway', person: 'Someone to thank',
  nextStep: 'What comes next', conclusion: 'Closing line', hashtags: 'Hashtags',
};
const suggestions: Record<'moment' | 'person' | 'nextStep', string[]> = {
  moment: ['the conversations', 'hearing different perspectives', 'the chance to exchange ideas'],
  person: ['everyone who helped make the event possible', 'the people who shared their ideas', 'everyone who showed up'],
  nextStep: ['keep learning and building', 'put these ideas into practice', 'stay curious and keep connecting'],
};
const sentence = (value: string) => /[.!?]$/.test(value.trim()) ? value.trim() : `${value.trim()}.`;

export function PostComposer({ event, demo, photos, draft, onDraftChange, onCompose, onComposed, onAiPreset }: PostComposerProps) {
  const options = demo.composer;
  const [answers, setAnswers] = useState<Answers>(draft.answers);
  const [hashtagIds, setHashtagIds] = useState<string[]>(draft.hashtagIds);
  const [active, setActive] = useState<Slot>(draft.active);
  const [customOpen, setCustomOpen] = useState(draft.customOpen);
  const [customDraft, setCustomDraft] = useState(draft.customDraft);
  const [loading, setLoading] = useState<'ai' | 'compose' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ready = slots.slice(0, 5).every((slot) => !!answers[slot as TextSlot]?.value.trim()) && hashtagIds.length > 0;

  useEffect(() => {
    onDraftChange({ answers, hashtagIds, active, customOpen, customDraft });
  }, [answers, hashtagIds, active, customOpen, customDraft, onDraftChange]);

  const selectSlot = (slot: Slot) => {
    setActive(slot);
    setCustomOpen(false);
    setCustomDraft(slot !== 'hashtags' && answers[slot]?.custom ? answers[slot]?.value ?? '' : '');
  };
  const choose = (slot: TextSlot, value: string, custom: boolean, id?: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setAnswers((previous) => ({ ...previous, [slot]: { value: trimmed, custom, id } }));
    selectSlot(slots[slots.indexOf(slot) + 1]);
  };
  const hookId = answers.hook?.id ?? options.hooks[0].id;
  const conclusionId = answers.conclusion?.id ?? options.conclusions[0].id;
  const input: ComposerInput = {
    eventId: event.id, hookId,
    learningIds: options.learnings.slice(0, 3).map((item) => item.id) as [string, string, string],
    conclusionId, hashtagIds, format: 'personal',
    customHook: answers.hook?.custom ? answers.hook.value : '',
    customConclusion: answers.conclusion?.custom ? answers.conclusion.value : '',
    moment: answers.moment?.value ?? '', person: answers.person?.value ?? '', nextStep: answers.nextStep?.value ?? '',
  };
  const preview = ready ? localCompose(input, demo) : '';
  const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

  const refreshChoices = async () => {
    setLoading('ai');
    setError(null);
    try {
      let hook = pick(options.hooks);
      let conclusion = pick(options.conclusions);
      let tags = [pick(options.hashtags).id];
      try {
        const preset = await onAiPreset(event.id);
        const selectedHook = options.hooks.find((item) => item.id === preset.hookId);
        const selectedConclusion = options.conclusions.find((item) => item.id === preset.conclusionId);
        if (!selectedHook || !selectedConclusion || preset.hashtagIds.length < 1 || preset.hashtagIds.length > 3 ||
            new Set(preset.hashtagIds).size !== preset.hashtagIds.length ||
            !preset.hashtagIds.every((id) => options.hashtags.some((item) => item.id === id))) throw new Error('Invalid preset');
        hook = selectedHook;
        conclusion = selectedConclusion;
        tags = preset.hashtagIds;
      } catch { /* Use local choices when the preset service is unavailable. */ }
      setAnswers((previous) => {
        const next = { ...previous };
        const fresh: Record<TextSlot, Answer> = {
          hook: { value: hook.text, id: hook.id, custom: false },
          moment: { value: pick(suggestions.moment), custom: false },
          person: { value: pick(suggestions.person), custom: false },
          nextStep: { value: pick(suggestions.nextStep), custom: false },
          conclusion: { value: conclusion.text, id: conclusion.id, custom: false },
        };
        for (const slot of Object.keys(fresh) as TextSlot[]) if (!previous[slot]?.custom) next[slot] = fresh[slot];
        return next;
      });
      setHashtagIds(tags);
      setCustomOpen(false);
    } finally {
      setLoading(null);
    }
  };

  const handleCompose = async () => {
    if (!ready) return;
    setLoading('compose');
    setError(null);
    try {
      const text = await onCompose(input);
      if (text !== preview) throw new Error('The post service needs an update before this draft can be published.');
      onComposed(text, input);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not prepare your post.');
    } finally {
      setLoading(null);
    }
  };

  const blank = (slot: Slot, value: string) => (
    <button type="button" className={`blank${active === slot ? ' active' : ''}`} onClick={() => selectSlot(slot)} aria-label={`${labels[slot]}${value ? `: ${value}` : ', empty'}`} aria-pressed={active === slot}>
      <span className="blank-value">{value || '\u00a0'}</span><span className="blank-label">{labels[slot]}</span>
    </button>
  );
  const choices = active === 'hook' ? options.hooks.map((item) => ({ value: item.text, id: item.id }))
    : active === 'conclusion' ? options.conclusions.map((item) => ({ value: item.text, id: item.id }))
    : active === 'hashtags' ? [] : suggestions[active].map((value) => ({ value, id: undefined }));
  const tagsText = hashtagIds.map((id) => options.hashtags.find((item) => item.id === id)?.text).join(' ');

  return (
    <div className="composer personal-composer">
      <div className="event-pick worksheet-event">
        {event.featured && <span className="pill pill-featured">Featured</span>}
        <strong>{event.title}</strong><span className="event-meta">{event.dateLabel} · {event.venueLabel}</span>
      </div>
      <section className="worksheet-card personal-preview" aria-label="Mad Libs post worksheet">
        <div className="worksheet-caption">LarpedIn · Career Story Worksheet</div>
        <div className="worksheet personal-worksheet">
          <p>{blank('hook', answers.hook ? (answers.hook.custom ? sentence(answers.hook.value) : answers.hook.value) : '')}</p>
          <p>I recently attended <span className="given">{event.title}</span>.</p>
          <p>One moment that stuck with me: {blank('moment', answers.moment ? sentence(answers.moment.value) : '')} A big thank you to {blank('person', answers.person ? sentence(answers.person.value) : '')}</p>
          <p>Next up: {blank('nextStep', answers.nextStep ? sentence(answers.nextStep.value) : '')} {blank('conclusion', answers.conclusion ? (answers.conclusion.custom ? sentence(answers.conclusion.value) : answers.conclusion.value) : '')}</p>
          <p>{blank('hashtags', tagsText)}</p>
        </div>
        {photos.length > 0 && <div className="photo-grid">{photos.map((photo) => <img key={photo.promptId} src={photo.url} alt={PROMPTS.find((prompt) => prompt.id === photo.promptId)?.label ?? 'Event photo'} />)}</div>}
      </section>
      <section className="card worksheet-choice-panel" aria-label={`${labels[active]} choices`}>
        <h3>{labels[active]} {active === 'hashtags' && <span className="muted">(choose 1 to 3)</span>}</h3>
        {active === 'hashtags' ? <>
          <div className="chip-row">{options.hashtags.map((item) => {
            const selected = hashtagIds.includes(item.id);
            return <button type="button" key={item.id} className={`chip${selected ? ' on' : ''}`} aria-pressed={selected} disabled={!selected && hashtagIds.length === 3} onClick={() => setHashtagIds(selected ? hashtagIds.filter((id) => id !== item.id) : [...hashtagIds, item.id])}>{item.text}</button>;
          })}</div>
          <button type="button" className="btn" disabled={hashtagIds.length === 0} onClick={() => selectSlot(slots.find((slot) => slot !== 'hashtags' && !answers[slot as TextSlot]) ?? 'hashtags')}>Continue</button>
        </> : <>
          <div className="choice-list">{choices.map((item) => <button type="button" className="choice" key={item.id ?? item.value} onClick={() => choose(active, item.value, false, item.id)}>{item.value}</button>)}
            <div className="custom-answer-row">
              <input id="custom-answer" type="text" placeholder="Fill in your own" aria-label={`Fill in your own ${labels[active].toLowerCase()}`}
                value={customDraft} maxLength={active === 'person' ? 120 : 280}
                onChange={(e) => { setCustomOpen(true); setCustomDraft(e.target.value); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); choose(active, customDraft, true); } }} />
              <button type="button" className="custom-answer-confirm" aria-label={`Confirm ${labels[active].toLowerCase()}`}
                disabled={!customDraft.trim()} onClick={() => choose(active, customDraft, true)}>✓</button>
            </div>
          </div>
        </>}
        <p className="worksheet-helper">Tap any blank to change its answer.</p>
      </section>
      <div className="composer-actions">
        <button type="button" className="btn btn-ghost" onClick={() => void refreshChoices()} disabled={loading !== null}>{loading === 'ai' ? 'Finding choices…' : '✨ AI take the wheel'}</button>
        <button type="button" className="btn btn-primary" onClick={() => void handleCompose()} disabled={!ready || loading !== null}>{loading === 'compose' ? 'Preparing…' : 'Preview post'}</button>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}
