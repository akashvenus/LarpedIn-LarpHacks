# LarpedIn API contract

Contract version: 1. Changes are announced by Andrew to all workflows. Source: [build spec](../docs/larpedin-build-spec.md), sections 3 and 4.

All routes are under `/api` on the same origin as the frontend. No authentication, database, external calls, or photo uploads. JSON field names are camelCase.

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

### Validation

Return `422` when any of these hold:

- A required field is missing or has the wrong type.
- `eventId`, `hookId`, `conclusionId`, or any listed learning or hashtag id is unknown.
- `learningIds` does not contain exactly 3 distinct ids.
- `hashtagIds` does not contain 1 to 3 distinct ids.

Clients rely on the status code only; the `422` body is not part of this contract.

## Static frontend

FastAPI serves `frontend/dist` at `/` with an HTML fallback for SPA navigation. Unknown `/api/*` paths return `404`, never the HTML fallback.
