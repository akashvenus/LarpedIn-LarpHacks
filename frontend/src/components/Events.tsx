import { DemoEvent } from '../domain/types';

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
  return (
    <>
      <header>
        <h1>Suggested events</h1>
        <p className="muted" style={{ margin: 0 }}>
          Curated for the demo. Pick one to open its photo guide.
        </p>
      </header>

      <div className="events-list">
        {events.map((event) => (
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
                disabled={selectedEventId === event.id}
                onClick={() => onSelect(event.id)}
              >
                {selectedEventId === event.id ? 'Selected' : 'Select event'}
              </button>
              <a
                className="btn"
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open on Luma ↗
              </a>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
