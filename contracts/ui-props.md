# LarpedIn UI props contract

Contract version: 1. Takes precedence over the shorthand in the [agent briefs](../docs/larpedin-agent-briefs.md). Changes are announced by Andrew to all workflows. `DemoEvent`, `ComposerOption`, and `DemoData` are defined in [api.md](./api.md).

## Rules

- Components are named exports in `frontend/src/components/`.
- Only `App.tsx` imports the reducer, calls `dispatch`, or calls `api.ts`. Components receive values and callbacks through props.
- Refresh resets everything. No `localStorage`, `sessionStorage`, or other browser storage.
- The photo is never uploaded.

## Shared types

```ts
type PromptId = 'room' | 'selfie' | 'banner' | 'handshake';

type ComposerInput = {
  eventId: string;
  hookId: string;
  learningIds: [string, string, string]; // distinct, in selected order
  conclusionId: string;
  hashtagIds: string[]; // 1 to 3 distinct, in selected order
};
```

## Components

```ts
type DormProps = {
  xp: number; // 0 to 100
  micUnlocked: boolean;
  lightsUnlocked: boolean;
  standUpSubmitted: boolean;
  onSubmitStandUp: (bullets: [string, string]) => void;
  onFindEvent: () => void;
};

type TrophiesProps = {
  badgeUnlocked: boolean;
};

type EventsProps = {
  events: DemoEvent[];
  selectedEventId: string | null;
  onSelect: (eventId: string) => void;
};

type CameraGuideProps = {
  event: DemoEvent;
  completedPrompts: PromptId[];
  capturedPromptId: PromptId | null;
  photoUrl: string | null;
  onCapture: (photo: Blob, promptId: PromptId) => void;
  onCheck: (promptId: PromptId) => void;
  onContinue: () => void;
};

type PostComposerProps = {
  event: DemoEvent;
  options: DemoData['composer'];
  onCompose: (input: ComposerInput) => Promise<string>;
  onPublish: (text: string) => void;
};

type GiftRevealProps = {
  onComplete: () => void;
};

type SocialDemoProps = {
  profile: DemoData['profile'];
  recruiter: DemoData['recruiter'];
  postText: string;
  photoUrl: string | null;
  outreachMessage: string;
  outreachSent: boolean;
};
```

## Behavior

**Event required.** `CameraGuide` and `PostComposer` render only with a selected event. When none is selected, `App.tsx` asks the user to choose one and links to Events.

**Photo prompts.**

- Checking a prompt is one-way; there is no uncheck.
- `CameraGuide` disables the last unchecked prompt until `photoUrl` is set, and the reducer ignores a check that would complete all four without a photo. Every route to four complete prompts therefore includes a real capture.
- `onContinue` is available only when all four prompts are complete and `photoUrl` is set.
- A retake replaces the photo and `capturedPromptId`. Completed prompts stay complete.

**Photo URL.** `App.tsx` turns the `Blob` from `onCapture` into an object URL, revokes the previous URL, and dispatches the URL string. The reducer stays pure and never creates or revokes URLs. `CameraGuide` stops its media tracks on unmount.

**AI take the wheel.** The preset is derived from option order: the first hook, first three learnings, first conclusion, and first three hashtags. `demo.json` has no separate preset field.

**Composing.** `PostComposer` shows a retry state when `onCompose` rejects. The text passed to `onPublish` is the final edited text.

**Gift and outreach.** `App.tsx` shows `GiftReveal` once the reducer reports the gift as eligible. `GiftReveal` calls `onComplete` when its animation ends, and `App.tsx` then sets `outreachSent` and shows `SocialDemo`. Repeated `onComplete` calls have no further effect. `SocialDemo` has no send button and shows a visible **Demo simulation** label.

**Event cards.** Cards with `demoExample: true` show a **Demo example** label. **Open on Luma** opens `event.url` in a new tab and does not select the event.
