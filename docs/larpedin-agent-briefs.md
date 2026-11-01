# LarpedIn — parallel agent briefs and merge plan

Give every agent the [build specification](./larpedin-build-spec.md) and this file. Akash, Spencer, and Andrew each own a workflow; the lettered jobs below can run as separate agents. **Andrew is the integration owner.** Each agent must stay inside its listed paths, return a short handoff with files changed and a local verification result, and avoid changing another agent's files. Use separate worktrees or branches if agents share a filesystem; merge into one integration branch through Andrew.

## Repository layout and ownership

```text
content/demo.json                         Andrew I1
contracts/api.md, contracts/ui-props.md   Andrew I1
frontend/src/domain/*                     Andrew I2
frontend/package.json, index.html         Spencer F1
frontend/src/main.tsx, App.tsx, api.ts    Spencer F1
frontend/src/components/Dorm.tsx          Spencer F1
frontend/src/components/Trophies.tsx      Spencer F1
frontend/src/components/Events.tsx        Spencer F2
frontend/src/components/CameraGuide.tsx   Spencer F2
frontend/src/components/PostComposer.tsx  Spencer F3
frontend/src/components/GiftReveal.tsx    Spencer F3
frontend/src/components/SocialDemo.tsx    Spencer F3
frontend/src/assets/manifest.ts           Spencer F4
frontend/public/assets/*                  Spencer F4
frontend/src/styles/base.css              Spencer F1
frontend/src/styles/camera.css            Spencer F2
frontend/src/styles/social.css            Spencer F3
backend/app/*, backend/requirements.txt   Akash B1
backend/tests/*                           Akash B3
render.yaml, scripts/build.sh             Akash B2
docs/demo-script.md, scripts/smoke.sh     Andrew I3
```

F1 alone edits `App.tsx` and owns wiring. F2/F3 implement prop-driven components. I2 alone owns progression logic. B1 alone edits FastAPI app code. I1 freezes identifiers, data shapes, and component props within the first 20 minutes; subsequent changes require Andrew to announce a contract revision to all workflows.

## Common component contract

All components are named exports. F1 passes values and callbacks; components do not import the global reducer or make API calls directly.

```ts
type PromptId = 'room' | 'selfie' | 'banner' | 'handshake';
type ComposerInput = {
  eventId: string;
  hookId: string;
  learningIds: [string, string, string];
  conclusionId: string;
  hashtagIds: string[];
};

Dorm({ xp, micUnlocked, lightsUnlocked, standUpSubmitted, onSubmitStandUp, onFindEvent });
Trophies({ badgeUnlocked });
Events({ events, selectedEventId, onSelect });
CameraGuide({ event, completedPrompts, photoUrl, onCapture, onCheck, onContinue });
PostComposer({ event, options, onCompose, onPublish });
GiftReveal({ onComplete });
SocialDemo({ profile, recruiter, postText, photoUrl, outreachMessage, outreachSent });
```

`onCapture` receives a `Blob` and the prompt id fulfilled by that image. `onCompose` returns `Promise<string>`. `onPublish` receives final edited text. I1 writes the exact TypeScript interfaces in `contracts/ui-props.md`; that file takes precedence over the shorthand above. Use reasonable loading/error states, but do not add new required screens or fields.

## Akash workflow — FastAPI and Render

### B1. API and static app service

**Scope:** Own `backend/app/*` and `backend/requirements.txt`. Implement `GET /api/health`, `GET /api/demo`, `POST /api/compose` exactly as the build spec. Read `content/demo.json`; validate id references and exactly three distinct learning ids. Serve `frontend/dist` at `/` with an SPA fallback after API routes. Do not add auth, database, AI SDK, or external services. Ensure the app starts with `uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port $PORT`.

**Done when:** Valid compose returns deterministic text; invalid ids return 422; `/api/health` returns 200; `/` serves the built app. Hand off a one-line start command to B2 and sample curl requests to B3.

### B2. Render deployment packaging

**Scope:** Own `render.yaml` and `scripts/build.sh`; do not edit B1's Python files. Configure one Python web service. Build sequence: `npm ci` and `npm run build` under `frontend`, then `pip install -r backend/requirements.txt`; start B1's Uvicorn command. Configure health check `/api/health`. Render includes Node/npm in its native Python runtime. ([Render native runtimes](https://render.com/docs/native-runtimes))

**Done when:** The build script succeeds from a clean checkout and Render deploys one HTTPS URL. If credits are available, choose a non-sleeping instance for judging; otherwise warm the service before the demo. Never store tokens or secrets in the repository.

### B3. Backend contract verification

**Scope:** Own `backend/tests/*`. Test the fixture route, valid composition, missing/duplicate learning ids, unknown ids, and SPA/API route separation. Do not change B1 files; report failures with exact reproduction steps.

**Done when:** Tests run from one command and the service returns the same fixture ids expected by the frontend.

## Spencer workflow — frontend and graphics

### F1. App shell, dorm, trophies, API client

**Scope:** Own `frontend/package.json`, `frontend/index.html`, `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/api.ts`, `Dorm.tsx`, `Trophies.tsx`, and `base.css`. Scaffold Vite/React/TypeScript. Implement dock navigation, API load/error state, in-memory `useReducer` from I2, progress display, optional two-bullet stand-up, dorm slots, and component wiring. Keep state when switching screens; refresh resets. Use F2/F3 placeholder components until their branches merge.

**Done when:** A mock `GET /api/demo` response renders home/events, dock navigation works, and the app builds even before final assets arrive. Only F1 edits `App.tsx` during integration.

### F2. Event cards and real-camera guide

**Scope:** Own `Events.tsx`, `CameraGuide.tsx`, and `camera.css`. Render three suggested events with LarpHacks featured; use a separate select action and external Luma link. Implement a live `getUserMedia` preview, capture a still into a Blob, return it through `onCapture`, show its thumbnail, and let the other three prompts be checked. Stop media tracks on unmount and handle permission denial with a retry. Do not persist or upload the photo.

**Done when:** The camera works on one phone over HTTPS, one real capture counts for one prompt, and the guide cannot continue until all four prompts are complete.

### F3. MadLibs, prize, and simulated social app

**Scope:** Own `PostComposer.tsx`, `GiftReveal.tsx`, `SocialDemo.tsx`, and `social.css`. Provide choice controls, select exactly three distinct learnings, prefill choices from the curated AI take the wheel preset, call `onCompose`, show an editable preview, and publish through `onPublish`. Animate the gift automatically; call `onComplete` after animation. Show a visible **Demo simulation** label, profile, feed with post/photo, and inbox. Make the recruiter message appear automatically when `outreachSent` becomes true; no send button.

**Done when:** A user can fill the composer without typing, edit the preview, publish, watch the gift, and see both the feed post and automatic fictional message.

### F4. Graphics and asset manifest

**Scope:** Own `frontend/public/assets/*` and `frontend/src/assets/manifest.ts`. Produce or import a dorm backdrop (PNG is accepted), avatar, mic, RGB lights, and closed/open gift visuals. SVG or transparent PNG is acceptable for the other assets. Export logical names `dormBackground`, `avatar`, `mic`, `rgbLights`, `giftClosed`, `giftOpen`; use temporary placeholders at the same logical names from the start. Keep the art easy to position in fixed slots at phone widths.

**Done when:** All six manifest entries resolve, no asset has an external hotlink, and F1/F3 can replace placeholders without changing component code.

## Andrew workflow — contracts, state, integration, demo

### I1. Freeze contract and content (first 20 minutes)

**Scope:** Own `content/demo.json`, `contracts/api.md`, and `contracts/ui-props.md`. Populate exactly three events, option arrays, seeded profile/recruiter, and prewritten outreach. Use the real [LarpHacks Luma URL](https://luma.com/irn5abpa). Verify any other event URL; label unverified concepts as **Demo example** and link to general Luma discovery. Define exact JSON names and component props from the build spec. Distribute this commit to all agents before their independent work proceeds.

**Done when:** B1, F1, F2, F3, and I2 can work from the fixture without asking each other for field names.

### I2. Pure session reducer and awards

**Scope:** Own `frontend/src/domain/*`. Implement initial state, typed actions, derived XP, badge, mic/RGB unlocks, and gift eligibility. Keep all data in memory; no localStorage/sessionStorage. Make actions idempotent: repeated selects/checks/publish/animation callbacks cannot add XP or send twice. Add a small focused test for gift gating and refresh-equivalent initial state.

**Done when:** Unit tests prove one real photo + four prompts + post are required; stand-up XP alone does not open the gift.

### I3. Integration, phone QA, and submission

**Scope:** Own `docs/demo-script.md`, `scripts/smoke.sh`, the integration branch, and the final release. Review each agent handoff against the contract, merge without changing owner files silently, run build/tests, deploy, and test on a real phone. Verify the automatic simulated message and refresh reset. Prepare a 90-second judge script and one backup demo phone/browser. Submit the Render URL before the deadline.

**Done when:** A clean phone run completes the exact six-step path in the build spec, `/api/health` responds, and the URL is submitted.

## Merge order and timebox

The event's published project deadline is **6 p.m. Toronto time on November 1, 2026**. This schedule assumes kickoff around 11:35 a.m.; shift the first checkpoints if work begins later, while preserving the final 90-minute release window.

| By | Gate | Required output |
| --- | --- | --- |
| 11:55 a.m. | Contract freeze | I1 fixture + API/UI contracts; F1/B1 scaffolds can use it. |
| 2:00 p.m. | First stitch | B1 API returns fixture; F1 shell runs with F2/F3 placeholders; I2 reducer imports; F4 placeholder manifest exists. |
| 3:15 p.m. | Full local route | F2 camera and F3 composer/gift/social merged; run the full flow locally. |
| 4:15 p.m. | Deployed feature freeze | One Render URL works; no new features. |
| 4:15–5:35 p.m. | Phone QA and rehearsal | Fix only blockers, rehearse, verify links and refresh reset. |
| 5:45 p.m. | Submission buffer | Submit URL at least 15 minutes before the published 6 p.m. deadline. |

If a job slips, keep its file boundary and use the cut order in the build spec. Andrew merges interface-compatible work first; art can land last because the manifest has placeholders. No agent should wait for final graphics to make the flow work.
