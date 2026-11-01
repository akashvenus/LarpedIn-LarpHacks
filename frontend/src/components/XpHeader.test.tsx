import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { XpHeader } from './XpHeader';

describe('shared XP header', () => {
  it('shows the wordmark and current progress accessibly', () => {
    const shared = renderToStaticMarkup(<XpHeader xp={65} />);
    expect(shared).toContain('65/100 XP');
    expect(shared).toContain('aria-valuenow="65"');
    expect(shared).toContain('brand-logo');
  });
  it('keeps the wordmark and action while hiding progress on the feed', () => {
    const feed = renderToStaticMarkup(<XpHeader xp={65} showProgress={false} action={<button>Inbox</button>} />);
    expect(feed).toContain('brand-logo');
    expect(feed).toContain('Inbox');
    expect(feed).not.toContain('progressbar');
  });
});
