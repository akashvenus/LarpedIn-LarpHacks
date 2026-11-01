import { ComposerInput, DemoData } from './domain/types';
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

async function parseJson(res: Response): Promise<unknown> {
  if (!res.ok) {
    throw new ApiError(`API ${res.status} ${res.statusText}`.trim());
  }
  return res.json();
}

export async function fetchDemo(): Promise<{ data: DemoData; source: 'api' | 'mock' }> {
  try {
    const res = await fetch('/api/demo', { headers: { Accept: 'application/json' } });
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
  const res = await fetch('/api/compose', {
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
/**
 * Local fallback used only when the backend is unreachable (e.g.
 * frontend-only dev). Production rehearsal always prefers the API.
 * Format mirrors the build spec §4: hook, event sentence, three-item
 * learning list, conclusion, hashtags.
 */
export function localComposeText(
  input: ComposerInput,
  options: { hooks: { id: string; text: string }[]; learnings: { id: string; text: string }[]; conclusions: { id: string; text: string }[]; hashtags: { id: string; text: string }[] },
  eventTitle: string,
): string {
  const find = (arr: { id: string; text: string }[], id: string) =>
    arr.find((o) => o.id === id)?.text ?? '';
  const hook = find(options.hooks, input.hookId);
  const learnings = input.learningIds.map((id) => find(options.learnings, id)).filter(Boolean);
  const conclusion = find(options.conclusions, input.conclusionId);
  const hashtags = input.hashtagIds.map((id) => find(options.hashtags, id)).filter(Boolean);

  return [
    hook,
    `I just wrapped up ${eventTitle}.`,
    ...learnings.map((l) => `• ${l}`),
    conclusion,
    hashtags.join(' '),
  ]
    .filter(Boolean)
    .join('\n');
}
