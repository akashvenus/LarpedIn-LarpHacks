# LarpedIn API contract

Contract version: 2. Changes are announced by Andrew to all workflows. Source: [build spec](../docs/larpedin-build-spec.md), sections 3 and 4, plus the post-lock Postgres and Gemini extension.

All routes are under `/api` on the same origin as the frontend. No authentication or photo uploads. `/api/compose` stays deterministic. Published posts may be stored in Postgres, and the AI preset route may call Gemini when `GEMINI_API_KEY` is configured; both features degrade gracefully. JSON field names are camelCase.

## `GET /api/health`

Response `200`:

```json
{"ok": true}
```

## `GET /api/demo`

Response `200`: the contents of [`content/demo.json`](../content/demo.json), unchanged. That file is the source of truth for the shape, ids, and copy.

```ts
type DemoEvent = {
  id: string;
  title: string;
  dateLabel: string;
  startAt?: string; // ISO 8601 start time with timezone; upcoming events unlock at this time
  venueLabel: string;
  url: string;
  featured: boolean;
  demoExample: boolean; // true: render a "Demo example" label on the card
};

type ComposerOption = { id: string; text: string };

type DemoData = {
  schemaVersion: 1;
  events: DemoEvent[]; // exactly 3; LarpHacks first
  composer: {
    hooks: ComposerOption[]; // at least 4
    learnings: ComposerOption[]; // at least 6
    conclusions: ComposerOption[]; // at least 3
    hashtags: ComposerOption[]; // at least 6
  };
  profile: { id: string; name: string; headline: string };
  recruiter: { id: string; name: string; headline: string };
  outreachMessage: string;
};
```

Ids are stable lowercase strings.

## `POST /api/compose`

Request:

```json
{
  "eventId": "larphacks",
  "hookId": "hook-1",
  "learningIds": ["learn-1", "learn-2", "learn-3"],
  "conclusionId": "end-1",
  "hashtagIds": ["ai", "buildinpublic"]
}
```

Response `200`:

```json
{"text": "I didn't expect one conversation to change my perspective on building.\n\nI recently attended LarpHacks. Here are three things I learned:\n\n1. community is a force multiplier\n2. shipping beats sleeping\n3. every handshake is a warm lead\n\nExcited to keep building and learning.\n\n#AI #BuildInPublic"}
```

### Text format

Exact template, with `\n` line endings and no trailing newline:

```text
{hook}

I recently attended {event.title}. Here are three things I learned:

1. {learning 1}
2. {learning 2}
3. {learning 3}

{conclusion}

{hashtags joined by one space}
```

Option text is inserted unchanged. Learnings and hashtags keep request order. Identical requests return identical text.

For the personal format, include `"format": "personal"` and optionally `moment`, `person`, `nextStep`, `customHook`, and `customConclusion` strings. Nonempty custom opening and closing text replaces the selected hook or conclusion text; their IDs remain required. The existing IDs remain required for compatibility, including three learning IDs, though learnings are not shown in the personal post. The output contains the hook, event sentence, any provided personal details, the optional next step and conclusion, and hashtags in short paragraphs. Whitespace-only details are omitted. `moment`, `nextStep`, `customHook`, and `customConclusion` are limited to 280 characters, and `person` to 120. Omitting `format` retains the legacy format above. Both compose and save use the same formatter; the saved text contains the personal details.

### Validation

Return `422` when any of these hold:

- A required field is missing or has the wrong type.
- `eventId`, `hookId`, `conclusionId`, or any listed learning or hashtag id is unknown.
- `learningIds` does not contain exactly 3 distinct ids.
- `hashtagIds` does not contain 1 to 3 distinct ids.

Clients rely on the status code only; the `422` body is not part of this contract.

## `POST /api/ai/preset`

Request:

```json
{"eventId": "larphacks"}
```

Response `200`:

```json
{
  "source": "gemini",
  "hookId": "hook-2",
  "learningIds": ["learn-1", "learn-4", "learn-6"],
  "conclusionId": "end-2",
  "hashtagIds": ["ai", "hackathon"]
}
```

`source` is `"gemini"` when the model returned a valid choice, or `"fallback"` when the key is absent, the call fails, or the model output is invalid. A fallback response is still `200` and always contains valid ids. Unknown `eventId` returns `422`.

## `POST /api/posts`

Request: the same body as `POST /api/compose`. The server regenerates `text` from the selected ids; clients do not send text.

Response `201`:

```json
{
  "id": 1,
  "createdAt": "2026-11-01T18:30:00+00:00",
  "eventId": "larphacks",
  "hookId": "hook-1",
  "learningIds": ["learn-1", "learn-2", "learn-3"],
  "conclusionId": "end-1",
  "hashtagIds": ["ai"],
  "text": "..."
}
```

Validation matches `POST /api/compose` and returns `422`. If `DATABASE_URL` is not configured or the database is unreachable, the route returns `503`; the demo may continue without persistence.

## `GET /api/posts`

Optional query: `limit` (default `20`, range `1` to `50`).

Response `200`:

```json
{"posts": [{"id": 1, "createdAt": "2026-11-01T18:30:00+00:00", "eventId": "larphacks", "hookId": "hook-1", "learningIds": ["learn-1", "learn-2", "learn-3"], "conclusionId": "end-1", "hashtagIds": ["ai"], "text": "..."}]}
```

Newest posts first. Returns `422` for an out-of-range limit and `503` when the database is unavailable.

## `GET /api/db/health`

Response `200`:

```json
{"ok": true}
```

Returns `503` when `DATABASE_URL` is not configured or the database is unreachable. This is separate from `/api/health`, which must stay independent of the database.

## Configuration

- `DATABASE_URL`: Render Postgres connection string, injected from `render.yaml` or set locally.
- `GEMINI_API_KEY`: server-side only; set in the Render dashboard or the local shell. It is never sent to the frontend or committed.

## Static frontend

FastAPI serves `frontend/dist` at `/` with an HTML fallback for SPA navigation. Unknown `/api/*` paths return `404`, never the HTML fallback.

## Browser-scoped demo post

`PUT /api/user-post/{client_id}` accepts the same body as `POST /api/compose`, and creates or replaces the browser's single demo post. It returns `{"text": "..."}`. `DELETE /api/user-post/{client_id}` deletes that browser's post and clears its post and draft fields from saved progress in the same database transaction; it returns `204`. Both endpoints return `503` if the database is unavailable. The browser ID is a demo identifier, not account authentication. The older `/api/posts` records have no browser identifier and cannot safely be attributed to a user.
