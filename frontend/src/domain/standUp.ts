import { StandUpPost } from './types';

export function localDay(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseStandUpDraft(draft: string): { win: string; nextStep: string } {
  try {
    const parsed: unknown = JSON.parse(draft);
    if (parsed && typeof parsed === 'object' && 'win' in parsed && 'nextStep' in parsed &&
        typeof parsed.win === 'string' && typeof parsed.nextStep === 'string') return { win: parsed.win, nextStep: parsed.nextStep };
  } catch { /* Older drafts were plain text. */ }
  const [win = '', ...rest] = draft.split('\n');
  return { win: win.replace(/^\s*[•*-]\s*/, ''), nextStep: rest.join('\n').replace(/^\s*[•*-]\s*/, '') };
}

export function hasStandUpToday(posts: StandUpPost[], date = new Date()): boolean {
  return posts.some((post) => post.isOwn && post.localDate === localDay(date));
}
