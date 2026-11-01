/// <reference types="vite/client" />
import { AiPreset, CommunityPost, ComposerInput, DemoData, DemoState } from './domain/types';
import { MOCK_DEMO } from './demo/mockDemo';

/**
 * API client.
 *
 * Both endpoints live under /api on the same origin (FastAPI in
 * production). During local dev, if the backend is not running, GET
 * /api/demo falls back to the in-repo fixture (identical shape) so the
 * frontend can be developed standalone. Replace MOCK_DEMO with the real
 * content/demo.json values when Andrew's I1 commit lands.
 */

export class ApiError extends Error {}

const CLIENT_ID_KEY = 'larpedin-client-id';

const apiBase = import.meta.env.DEV ? 'http://127.0.0.1:8000' : '';

async function parseJson(res: Response): Promise<unknown> {
  if (!res.ok) {
    throw new ApiError(`API ${res.status} ${res.statusText}`.trim());
  }
  return res.json();
}

export async function fetchDemo(): Promise<{ data: DemoData; source: 'api' | 'mock' }> {
  try {
    const res = await fetch(`${apiBase}/api/demo`, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      return { data: (await parseJson(res)) as DemoData, source: 'api' };
    }
    // Backend not running (standalone dev) or a real failure other than
    // dev convenience: fall back to the mock for anything below 500 or
    // when the backend is simply absent (network error handled by caller).
    return { data: MOCK_DEMO, source: 'mock' };
  } catch {
    // Network error: backend absent in standalone dev.
    return { data: MOCK_DEMO, source: 'mock' };
  }
}

export async function compose(input: ComposerInput): Promise<string> {
  const res = await fetch(`${apiBase}/api/compose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = (await res.json().catch(() => null)) as { text?: string; detail?: unknown } | null;
  if (!res.ok || !body?.text) {
    throw new ApiError(body?.detail ? String(body.detail) : `Compose failed: ${res.status}`);
  }
  return body.text;
}

export async function fetchAiPreset(eventId: string): Promise<AiPreset> {
  const res = await fetch(`${apiBase}/api/ai/preset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId }),
  });
  const body = (await res.json().catch(() => null)) as (Partial<AiPreset> & { detail?: unknown }) | null;
  if (!res.ok || !body?.hookId) {
    throw new ApiError(body?.detail ? String(body.detail) : `AI preset failed: ${res.status}`);
  }
  return body as AiPreset;
}

export async function savePost(input: ComposerInput): Promise<CommunityPost> {
  const res = await fetch(`${apiBase}/api/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { detail?: unknown } | null;
    throw new ApiError(body?.detail ? String(body.detail) : `Save failed: ${res.status}`);
  }
  return (await res.json()) as CommunityPost;
}

export function getBrowserClientId(): string {
  const existing = window.localStorage.getItem(CLIENT_ID_KEY);
  if (existing && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existing)) return existing;
  const clientId = crypto.randomUUID();
  window.localStorage.setItem(CLIENT_ID_KEY, clientId);
  return clientId;
}

export async function saveBrowserPost(clientId: string, input: ComposerInput): Promise<string> {
  const res = await fetch(`${apiBase}/api/user-post/${encodeURIComponent(clientId)}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  });
  const body = (await res.json().catch(() => null)) as { text?: string; detail?: string } | null;
  if (!res.ok || !body?.text) throw new ApiError(body?.detail || `Save post failed: ${res.status}`);
  return body.text;
}

export async function fetchCommunityPosts(clientId?: string): Promise<CommunityPost[]> {
  const query = clientId ? `?exclude_client_id=${encodeURIComponent(clientId)}` : '';
  const res = await fetch(`${apiBase}/api/posts${query}`, { headers: { Accept: 'application/json' } });
  const body = (await res.json().catch(() => null)) as { posts?: CommunityPost[]; detail?: unknown } | null;
  if (!res.ok) {
    throw new ApiError(body?.detail ? String(body.detail) : `Load feed failed: ${res.status}`);
  }
  return body?.posts ?? [];
}

export async function deleteUserPost(clientId: string): Promise<void> {
  const res = await fetch(`${apiBase}/api/user-post/${encodeURIComponent(clientId)}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { detail?: string } | null;
    throw new ApiError(body?.detail || `Delete post failed: ${res.status}`);
  }
}

export async function fetchDemoState(clientId: string): Promise<DemoState | null> {
  const res = await fetch(`${apiBase}/api/state/${encodeURIComponent(clientId)}`, {
    headers: { Accept: 'application/json' },
  });
  const body = (await res.json().catch(() => null)) as { state?: DemoState | null; detail?: unknown } | null;
  if (!res.ok) {
    throw new ApiError(body?.detail ? String(body.detail) : `Load progress failed: ${res.status}`);
  }
  return body?.state ?? null;
}

export async function saveDemoState(clientId: string, state: DemoState): Promise<void> {
  const res = await fetch(`${apiBase}/api/state/${encodeURIComponent(clientId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { detail?: unknown } | null;
    throw new ApiError(body?.detail ? String(body.detail) : `Save progress failed: ${res.status}`);
  }
}

/**
 * Clone of POST /api/compose for standalone dev — used only when the
 * backend is unreachable (network error). Mirrors the locked contract:
 * validates known ids, exactly three DISTINCT learnings, and one to
 * three DISTINCT hashtags; invalid input throws a 422-style error.
 * Deterministic format per build spec §4: hook, event sentence,
 * three-item learning list, conclusion, hashtags. Preserve order.
 */
export function localCompose(input: ComposerInput, demo: DemoData): string {
  const find = (arr: { id: string; text: string }[], id: string) =>
    arr.find((o) => o.id === id);

  const event = demo.events.find((e) => e.id === input.eventId);
  if (!event) throw new ApiError(`422: unknown eventId "${input.eventId}"`);
  if (!find(demo.composer.hooks, input.hookId))
    throw new ApiError(`422: unknown hookId "${input.hookId}"`);
  if (!find(demo.composer.conclusions, input.conclusionId))
    throw new ApiError(`422: unknown conclusionId "${input.conclusionId}"`);

  const learningIds = input.learningIds;
  if (learningIds.length !== 3 || new Set(learningIds).size !== 3) {
    throw new ApiError('422: learningIds must contain exactly three distinct ids');
  }
  for (const id of learningIds) {
    if (!find(demo.composer.learnings, id)) throw new ApiError(`422: unknown learningId "${id}"`);
  }

  const hashtagIds = input.hashtagIds;
  if (hashtagIds.length < 1 || hashtagIds.length > 3 || new Set(hashtagIds).size !== hashtagIds.length) {
    throw new ApiError('422: hashtagIds must contain one to three distinct ids');
  }
  for (const id of hashtagIds) {
    if (!find(demo.composer.hashtags, id)) throw new ApiError(`422: unknown hashtagId "${id}"`);
  }

  if (input.format === 'personal') {
    for (const [value, limit] of [[input.customHook, 280], [input.customConclusion, 280], [input.moment, 280], [input.person, 120], [input.nextStep, 280]] as const) {
      if (value && Array.from(value).length > limit) throw new ApiError('422: personal detail is too long');
    }
    const sentence = (value: string) => /[.!?]$/.test(value.trim()) ? value.trim() : `${value.trim()}.`;
    const paragraphs = [input.customHook?.trim() ? sentence(input.customHook) : find(demo.composer.hooks, input.hookId)!.text, `I recently attended ${event.title}.`];
    const details = [];
    if (input.moment?.trim()) details.push(`One moment that stuck with me: ${sentence(input.moment)}`);
    if (input.person?.trim()) details.push(`A big thank you to ${sentence(input.person)}`);
    if (details.length) paragraphs.push(details.join(' '));
    const closing = [];
    if (input.nextStep?.trim()) closing.push(`Next up: ${sentence(input.nextStep)}`);
    closing.push(input.customConclusion?.trim() ? sentence(input.customConclusion) : find(demo.composer.conclusions, input.conclusionId)!.text);
    paragraphs.push(closing.join(' '), hashtagIds.map((id) => find(demo.composer.hashtags, id)!.text).join(' '));
    return paragraphs.join('\n\n');
  }

  const text = [
    find(demo.composer.hooks, input.hookId)!.text,
    '',
    `I recently attended ${event.title}. Here are three things I learned:`,
    '',
    ...learningIds.map((id, index) => `${index + 1}. ${find(demo.composer.learnings, id)!.text}`),
    '',
    find(demo.composer.conclusions, input.conclusionId)!.text,
    '',
    hashtagIds.map((id) => find(demo.composer.hashtags, id)!.text).join(' '),
  ].join('\n');

  return text;
}
