# LarpedIn — decision log

Status: locked and confirmed. The detailed implementation is in [the build specification](./larpedin-build-spec.md) and [agent briefs](./larpedin-agent-briefs.md).

## ADR 001 — Demo loop

**Decision:** The judge-facing mobile web experience runs from event discovery to a live-camera photo guide, a MadLibs-style professional post, XP, and a dorm-room unlock. Finishing all guided-demo tasks triggers an animated gift-box prize reveal.

**Why:** It connects the app's career satire, practical event guidance, and progression in one playable loop.

## ADR 002 — Demo readiness

**Decision:** Optimize for a reliable phone demo with one seeded profile. Refreshing the page resets the entire demo. Full account and social-network infrastructure are outside the first-day target.

**Why:** The build window is under nine working hours, with a complete loop more valuable than disconnected breadth.

## ADR 003 — Audience and voice

**Decision:** Design for a first-year CS student. The tone is affectionate career satire; guidance and generated posts should remain useful and grounded in user-entered facts.

## ADR 004 — Staged recruiter outreach

**Decision:** Recreate a small LinkedIn-like experience inside the app. Finishing the guided demo opens a gift box revealing a LinkedIn-style profile-photo icon and message icon, with a brief description of the free recruiter message. The reward can automatically send a prewritten jargon-heavy outreach message to a seeded recruiter within that simulated interface. There is no live LinkedIn integration.

**Open detail:** Define how the simulation is identified in the UI and what happens if the demo is reset.

**Technical context:** LinkedIn member-messaging API access is restricted, and its policy prohibits unauthorized automation. See [API access](https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access) and [messaging overview](https://learn.microsoft.com/en-us/linkedin/shared/integrations/communications/overview).

## ADR 005 — Ownership

**Decision:** Akash owns backend/API and Render hosting. Spencer owns mobile frontend and graphics. Andrew codes and owns integration, event content, QA, and the demo.

**Open detail:** Define file ownership, contracts, merge checkpoints, and deployment ownership in the final agent briefs.

## ADR 006 — Feature priority

**Decision:** The gift-box recruiter reward is the protected bonus feature. The daily stand-up is a simple form, and the first build includes one badge. Friend features, push reminders, and the roaming cat are stretch work.

## ADR 007 — Events

**Decision:** Use a curated demo event list with LarpHacks first and links out to Luma. The experience may be static for the demo.

**Decision detail:** Label the static list “Suggested events” and link out from its entries. Pin LarpHacks first. Two other entries can be curated or clearly marked as demo examples.

## ADR 008 — Camera

**Decision:** Use the device's real camera in the guided event flow.

**Decision detail:** Show a live camera preview and require one real captured photo. Show all four prompts; the remaining three can be checked off to make the demo completable at a judging table.

**Open detail:** Decide whether the photo appears in the simulated social post and how long it is retained on the device.

## ADR 009 — Post composer

**Decision:** Use deterministic MadLibs-style composition. The user selects a cliché hook, event, three things learned, conclusion, and hashtags. “AI take the wheel” chooses curated selections or fills the template. No live model or news API is required for the demo.

## ADR 010 — Stack and deployment

**Decision:** Use one repository, a React/Vite mobile frontend, a Python FastAPI backend, and a single Render web service serving the app and API. Seeded-profile progress exists only in memory and resets on refresh.

**Decision detail:** FastAPI serves the built frontend plus endpoints for suggested events, MadLibs options, and deterministic post composition. The browser keeps XP, checklist state, photo, and unlocks only in memory. Refreshing resets the demo. There is no database.

## ADR 011 — Visual production

**Decision:** Spencer will explore graphics with ChatGPT in the browser and bring suitable output back into Codex. Named SVG or PNG assets are accepted for the room backdrop, character, items, and gift box; a PNG room backdrop is explicitly acceptable. Placeables use fixed slots.

## ADR 013 — Guided demo completion

**Decision:** The guided path requires selecting an event, taking one real photo via the live camera, checking off the other three photo prompts, and completing the MadLibs post. Once all tasks are complete, the gift box opens, reveals the free recruiter message, and a prewritten message automatically sends to a fictional recruiter inside the simulated social interface. No send click is required.

## ADR 014 — Navigation

**Decision:** The dock has Dorm, Events, Camera, and Trophies. The post composer is reached through the event guide. The simulated social screen is reached through the prize.

## ADR 015 — Composer and simulated feed

**Decision:** Required post fields are choices: hook, selected event, three learnings, conclusion, and hashtags. “AI take the wheel” fills all choices at once. The generated text is editable before publishing. The real captured photo appears in the guide and in the simulated feed, staying on the device.

**Decision detail:** The simulated social experience has a seeded profile, feed showing the MadLibs post, and inbox with the automatic fictional recruiter message. It is labeled as a demo simulation.

## ADR 016 — Progress and rewards

**Decision:** The guided tasks fill a 100-point internship progress bar. Completing the required task flags, rather than XP alone, unlocks the gift. The first build has a holdable mic, placeable RGB lights, and one badge. The optional stand-up may add a small amount of XP but cannot unlock the gift by itself.

## ADR 017 — Demo reset

**Decision:** Refreshing the page resets all demo state. There is no separate reset control or durable browser storage.

## ADR 018 — Parallel agent structure

**Decision:** Use three person-owned workflows: Akash for backend/Render, Spencer for frontend/graphics, and Andrew for contracts/content/integration/QA. Each workflow may contain several narrowly scoped parallel agents. Their work must converge through frozen contracts and one integration owner.

## ADR 019 — Published deadline

**Decision:** Plan for the LarpHacks published 6 p.m. November 1, 2026 project deadline, with a deployed feature freeze at 4:15 p.m. and submission target at 5:45 p.m. Confirm with the team if its judging schedule differs. Sources: [LarpHacks Luma event](https://luma.com/irn5abpa) and [Devpost](https://larphacks.devpost.com/).

## ADR 012 — Timebox

**Decision:** Reserve approximately the final 90 minutes for deployment, phone testing, and rehearsal. Total build time is a little under nine hours; exact deadline is not yet recorded.

## Open decisions

- Exact demo deadline and integration cutoff within the roughly 7–8 hour window.
- Exact MadLibs copy, event fixtures, and recruiter copy.
- Shared data model, API contract, and path ownership.
