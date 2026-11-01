import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { DemoEvent } from '../domain/types';
import { eventLocked } from '../domain/eventAvailability';

export interface EventsProps {
  events: DemoEvent[];
  selectedEventId: string | null;
  onSelect: (eventId: string) => void;
}

/**
 * Events screen (F2): three "Suggested events" cards, LarpHacks featured
 * and first. "Select event" uses a separate action from "Open on Luma"
 * (external link, new tab). Cards flagged demoExample are labeled.
 */
export function Events({ events, selectedEventId, onSelect }: EventsProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      <header>
        <h1>Suggested events</h1>
        <p className="muted" style={{ margin: 0 }}>
          Pick an event to open its photo guide. Upcoming events unlock when they start.
        </p>
      </header>

      <div className="events-list">
        {events.map((event) => {
          const locked = eventLocked(event, now);
          return (
            <article
            key={event.id}
            className={`card event-card${event.featured ? ' featured' : ''}${
              selectedEventId === event.id ? ' selected' : ''
            }`}
          >
            <div className="event-title-row">
              <h3>{event.title}</h3>
              {event.featured && <span className="pill pill-featured">Featured</span>}
              {event.demoExample && <span className="pill pill-demo">Demo example</span>}
            </div>
            <p className="event-meta" style={{ margin: 0 }}>
              {event.dateLabel} · {event.venueLabel}
              {selectedEventId === event.id && ' · ✓ Selected'}
            </p>
            <div className="event-actions">
              <button
                className="btn btn-primary"
                disabled={locked || selectedEventId === event.id}
                onClick={() => onSelect(event.id)}
              >
                {locked ? `🔒 Opens ${event.dateLabel}` : selectedEventId === event.id ? 'Selected' : 'Select event'}
              </button>
              <a
                className="btn"
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open on Luma <ExternalLink size={16} className="action-icon" aria-hidden="true" />
              </a>
            </div>
            </article>
          );
        })}
        <div className="events-coming-soon">
          <strong>More events coming soon</strong>
          <p>Our networking pipeline is currently in stealth mode.</p>
        </div>
      </div>
    </>
  );
}
