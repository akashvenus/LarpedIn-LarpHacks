# LarpedIn — one-day build specification

**Status:** Proposed implementation contract for team confirmation. **Target:** a complete mobile-web judge demo before the LarpHacks 6 p.m. project deadline on November 1, 2026. The [event page](https://luma.com/irn5abpa) and [Devpost](https://larphacks.devpost.com/) are the deadline sources. Begin from this contract rather than broad feature prompts.

## 1. Product promise and demo path

LarpedIn is an affectionate satire of first-year CS career optimization. A judge can finish one guided route on a phone:

1. See a bare first-year dorm, avatar, and internship progress bar. Optionally fill a two-bullet daily stand-up.
2. Open **Suggested events**, select featured **LarpHacks**, and optionally open its real [Luma page](https://luma.com/irn5abpa) in a new tab.
3. Enter the event guide. See four prompts: full-room shot, selfie, event banner, handshake. Allow one prompt to be fulfilled by an actual live-camera capture; the other three can be checked off. Show the captured image as a thumbnail.
4. Use a MadLibs post composer: pick a cliché hook, event, three distinct learnings, conclusion, and one to three hashtags. **AI take the wheel** fills the choices from a curated preset. Let the user edit the assembled text and publish it inside the app.
5. Show the progress bar reach 100, a badge, a holdable mic, and RGB lights in the dorm. Automatically animate a gift box and reveal a profile-photo and message-icon prize labeled **Free recruiter message**.
6. Automatically transition to a visibly labeled, simulated LinkedIn-like app. Its feed shows the post and captured photo; its inbox animates a prewritten message sending to one fictional recruiter. No send click and no external message.

The demo is session-only: **refresh starts over**, including camera image, post, XP, cosmetics, and simulated message. Navigation inside the single-page app preserves state. No accounts, database, actual LinkedIn integration, live AI, news retrieval, Luma API, location detection, or push notifications are in the first build.

## 2. Screens and user-visible behavior

| Screen | Required behavior | Owner |
| --- | --- | --- |
| Dorm | Bare room backdrop, avatar, 0–100 internship bar, equipped mic and placed RGB lights when earned, event CTA, optional two-bullet stand-up, four-item dock | Spencer |
| Events | Three cards under “Suggested events”; LarpHacks featured; each card has **Select event** and **Open on Luma** actions | Spencer; content from Andrew |
| Camera guide | Four prompts, live preview from `getUserMedia`, one real capture, thumbnail, three remaining checkboxes, continue action when all four complete | Spencer |
| Post composer | Choice controls, deterministic **AI take the wheel**, assembled editable preview, publish action | Spencer; compose API from Akash |
| Trophies | One badge, locked until all four photo prompts are complete | Spencer |
| Gift | Automatically opens after all guided tasks; shows the two prize icons and description; automatically advances to simulation | Spencer |
| Simulated social app | Seeded profile, feed containing published post and photo, inbox containing automatic fictional recruiter message; visible “Demo simulation” label | Spencer |

Dock: **Dorm · Events · Camera · Trophies**. The composer is reached from the camera guide; the simulated social screen is reached from the prize. The camera dock opens the selected event guide, or asks the user to choose an event if none is selected.

The photo is a device-local `Blob`/object URL held in memory. It is never uploaded to FastAPI. Stop camera tracks on leaving the guide, revoke old object URLs, and give a clear permission/retry state. `getUserMedia` requires HTTPS or localhost and user permission; Render provides HTTPS. ([MDN camera API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia), [Render web services](https://render.com/docs/web-services))

## 3. Shared demo data contract

Andrew owns `content/demo.json`; both frontend and backend consume its identifiers. It contains exactly three events, at least four hooks, six learnings, three conclusions, six hashtags, one seeded profile, one fictional recruiter, and one prewritten outreach message. LarpHacks is first and uses `https://luma.com/irn5abpa`. Andrew verifies the other links; if real event links are unavailable, mark those cards **Demo example** and use a general Luma discovery link instead of inventing a specific event page.

`GET /api/demo` returns this JSON shape (example values shortened):

```json
{
  "schemaVersion": 1,
  "events": [
    {"id": "larphacks", "title": "LarpHacks", "dateLabel": "Today", "venueLabel": "Toronto", "url": "https://luma.com/irn5abpa", "featured": true, "demoExample": false}
  ],
  "composer": {
    "hooks": [{"id": "hook-1", "text": "I didn't expect one conversation to change my perspective on building."}],
    "learnings": [{"id": "learn-1", "text": "community is a force multiplier"}],
    "conclusions": [{"id": "end-1", "text": "Excited to keep building and learning."}],
    "hashtags": [{"id": "ai", "text": "#AI"}]
  },
  "profile": {"id": "demo-user", "name": "You", "headline": "First-year CS student | Building in public"},
  "recruiter": {"id": "recruiter-1", "name": "Alex Morgan", "headline": "Early Careers Recruiter | Fictional"},
  "outreachMessage": "Hi Alex, I recently attended a tech event and would love to connect about opportunities at the intersection of AI, community, and impact."
}
```

All ids are stable lowercase strings. Frontend renders text from this response; it does not duplicate content arrays. The fixture is reviewed by Andrew before the first parallel build checkpoint.

## 4. API contract

| Method/path | Request | Response | Notes |
| --- | --- | --- | --- |
| `GET /api/health` | None | `{"ok":true}` | Render health check and smoke test. |
| `GET /api/demo` | None | The data shape above | Static content, no session data. |
| `POST /api/compose` | `{"eventId":"larphacks","hookId":"hook-1","learningIds":["learn-1","learn-2","learn-3"],"conclusionId":"end-1","hashtagIds":["ai"]}` | `{"text":"..."}` | Deterministic. Validate known ids, exactly three distinct learnings, one to three distinct hashtags; invalid choices return 422. |

Composition format: hook paragraph, event sentence, a three-item learning list, conclusion sentence, then hashtags. Preserve selected order. No model call, external API call, profile mutation, or photo upload.

FastAPI serves the Vite build from `/`, with API routes under `/api`. Use the documented FastAPI frontend helper with an HTML fallback for SPA navigation, or an equivalent minimal static setup. Render's native Python runtime includes Node and npm, so its build command can install and build Vite before starting Uvicorn. The service binds to `0.0.0.0:$PORT`. ([FastAPI frontend guide](https://fastapi.tiangolo.com/tutorial/frontend/), [Render native runtimes](https://render.com/docs/native-runtimes), [Render FastAPI guide](https://render.com/docs/deploy-fastapi))

## 5. Session state and awards

Andrew owns a pure frontend state module; Spencer's components dispatch its actions. Suggested state:

```ts
type DemoState = {
  eventId: string | null;
  completedPrompts: string[]; // room, selfie, banner, handshake
  capturedPromptId: string | null;
  photoUrl: string | null; // object URL; kept only in memory
  selections: {
    hookId: string | null;
    learningIds: string[];
    conclusionId: string | null;
    hashtagIds: string[];
  };
  postText: string;
  postPublished: boolean;
  standUpSubmitted: boolean;
  giftOpened: boolean;
  outreachSent: boolean;
};
```

XP is derived, not independently mutated: 20 for selecting an event, 10 for each of four completed photo prompts, 40 for publishing the post, and 5 once for the optional stand-up; display `min(100, total)`. The captured photo completes its selected prompt. The gift opens only when an event is selected, a real photo exists, all four prompts are complete, and the post is published. Thus optional stand-up XP alone can never trigger it. The mic unlocks on actual capture; RGB lights unlock on publishing; the badge unlocks when all four prompts are complete. An animation completion callback transitions from gift to simulated inbox and sets `outreachSent` automatically. Do not use browser storage.

## 6. Visual and interaction contract

Spencer may create graphics in ChatGPT and import them. SVG or PNG are accepted, including PNG for the dorm backdrop. Provide logical asset names through a single manifest: `dormBackground`, `avatar`, `mic`, `rgbLights`, `giftClosed`, `giftOpen`. Components read the manifest rather than hardcoding file extensions. Use CSS positioning for a fixed avatar anchor and two room slots. Keep placeholder shapes until final assets arrive; absent art must not block the working flow. The gift animation can swap closed/open assets with CSS scale, bounce, and glow. One phone viewport is the primary target (around 390 × 844 CSS pixels); verify at narrower 360px width.

## 7. Release gates

1. API contract: `GET /api/demo` matches the fixture; valid compose returns stable text; invalid ids return 422.
2. App flow: judge can select event, permit camera, capture one real image, check remaining prompts, use AI take the wheel, edit/publish, watch gift open, and see automatic simulated message.
3. State: app navigation keeps progress; refresh resets everything; duplicate clicks do not add XP or send duplicate messages.
4. Mobile: camera works on one real phone over deployed HTTPS; text and buttons fit 360px width; Luma link opens separately and return to app preserves state.
5. Deployment: one Render URL serves `/`, `/api/health`, and `/api/demo`; no secrets are required. Submit the URL before the deadline.

## 8. Cut order if time slips

Cut in this order: stand-up polish → extra event cards beyond three → extra trophy art → room decoration animation → editable post refinement. Keep the real camera, deterministic composer, gift reveal, automatic simulated send, and deployed phone path. If the camera fails on the demo phone, fix or change phones before adding features; it is a required promise.
