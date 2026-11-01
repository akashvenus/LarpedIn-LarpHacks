import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Inbox } from './Inbox';

const base = { recruiter: { name: 'Selena Ma', headline: 'Recruiter' }, message: 'Hello', sent: true, sending: false };

describe('recruiter reply', () => {
  it('waits before showing a reply', () => {
    const html = renderToStaticMarkup(<Inbox {...base} reply={null} />);
    expect(html).toContain('Awaiting a reply');
    expect(html).not.toContain('Automated LarpedIn reply');
  });
  it('shows the selected outcome as an automated reply', () => {
    const offer = renderToStaticMarkup(<Inbox {...base} reply="offer" />);
    const rejection = renderToStaticMarkup(<Inbox {...base} reply="rejection" />);
    expect(offer).toContain('offer you the role');
    expect(rejection).toContain('not to move forward');
    expect(offer).toContain('Automated LarpedIn reply');
  });
  it('shows the recipient separately and uses the user avatar for the outgoing message', () => {
    const html = renderToStaticMarkup(<Inbox {...base} reply="offer" userAvatar="/profile.png" />);
    expect(html).toContain('class="inbox-recipient"');
    expect(html).toContain('class="inbox-message inbox-outgoing"');
    expect(html).toContain('src="/profile.png"');
  });
});
