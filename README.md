# LarpedIn

**A game** built for [LarpHacks](https://larphacks.devpost.com/) t**hat turns the first-year CS hustle into XP.** Walk around your dorm, go to an event, take the mandatory networking photos, generate a cliché LinkedIn post, and earn your way to a "Free recruiter message".



![The walkable 3D dorm with the character in a UofT hoodie](docs/images/dorm.png)![Suggested events, with LarpHacks featured](docs/images/events.png)![A generated post in the simulated LinkedIn](docs/images/draft.png)

## The problem

First-year CS students are told to network, post, and "build in public" before they've built much at all. Going to an event can start to feel like collecting proof that you went. LarpedIn takes that loop and makes it literal: a game with a progress bar labelled **Internship progress**.

## How it works


| Step                       | What you do                                                           | Internship progress |
| -------------------------- | --------------------------------------------------------------------- | ------------------- |
| 1. **Dorm**                | Walk around a 3D room and dress your character                        | Starts at 0 XP      |
| 2. **Stand-up** (optional) | Log today's win and next step                                         | +5 XP               |
| 3. **Events**              | Pick a real event; LarpHacks is featured                              | +20 XP              |
| 4. **Camera**              | Complete the four prompts: room shot, selfie, event banner, handshake | +10 XP each         |
| 5. **Post composer**       | Fill in the Mad Libs post, or press **AI take the wheel**             |                     |
| 6. **Simulated LinkedIn**  | Publish to the in-app feed                                            | +40 XP              |
| 7. **Gift box**            | Open your prize: an automatic message to a fictional recruiter        |                     |


Progress along the way also unlocks decor, such as a founder poster and a Google mug, which you can put on your dorm walls and desk.

## Try it in 2 minutes

Open the app on a phone-sized screen if you can, since it's designed for mobile. Then:

1. **Move around the dorm.** Use the joystick or `W A S D`, and drag to turn the camera.
2. **Open the box.** Walk to the cardboard box with the yellow arrow, then hold `E` or hold the on-screen button. Pick an item and tap a glowing spot to place it.
3. **Change your look.** The briefcase button holds the hoodies.
4. **Go to an event.** Tap **Find an event**, then **Select event** on LarpHacks. Use the camera, or check off the prompts without taking photos.
5. **Write the post.** Press **✨ AI take the wheel**, then **Preview post** and **Post to feed**.
6. **Collect your prize.** Watch the gift box open, then check the feed and the recruiter message.

Refreshing the page starts the game over.

## Tech stack


| Layer              | Technology                        | What it does                                                     |
| ------------------ | --------------------------------- | ---------------------------------------------------------------- |
| **Frontend**       | React 18, TypeScript, Vite        | The mobile-first app and game logic                              |
| **3D**             | Three.js, React Three Fiber, Drei | The walkable dorm and animated character                         |
| **Backend**        | Python, FastAPI, Uvicorn          | Serves event content, writes posts, and hosts the built frontend |
| **AI**             | Google Gemini (`google-genai`)    | Powers **AI take the wheel**                                     |
| **Database**       | PostgreSQL (`psycopg`)            | Saves published post text                                        |
| **Browser camera** | `getUserMedia`                    | Takes the event photos                                           |
| **Deployment**     | Render                            | Hosts the web service and database (`render.yaml`)               |
| **Tests**          | Vitest, pytest                    | Cover game logic and the API                                     |




## How it's built

```mermaid
flowchart LR
    Phone["React + Three.js<br/>game in the browser"] -->|"/api"| API["FastAPI"]
    API --> Content["content/demo.json<br/>events and post options"]
    API -->|"AI take the wheel"| Gemini["Google Gemini"]
    API -->|"published post text"| DB[("PostgreSQL")]
```



A few decisions we made on purpose:

- **Your photos stay on your device.** They're held in browser memory and never uploaded. The database stores only the post text and the options chosen.
- **The AI can't derail the post.** Gemini picks from our curated options and its answer is validated. If there's no API key, or it fails or takes too long, the app picks at random instead.
- **The demo keeps working when things fail.** It runs without a database or API key, and the frontend even runs without the backend, using built-in sample data. The camera can always be skipped, and phones that can't run 3D get a flat version of the room.
- **Nothing reaches the real world.** There's no real LinkedIn connection, no accounts, and no real messages. The simulation is labelled as one on screen.



## Run it locally

You'll need [Node.js 22](https://nodejs.org/) and [uv](https://docs.astral.sh/uv/). uv installs the correct Python version for you.

**Terminal 1: backend, on port 8000**

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

**Terminal 2: frontend**

```bash
cd frontend
npm install
npm run dev
```

Then open **[http://localhost:5173](http://localhost:5173)**.

### Optional features

Set these environment variables in Terminal 1 before starting the backend. Everything else works without them.


| Variable         | What it turns on                      |
| ---------------- | ------------------------------------- |
| `GEMINI_API_KEY` | Live Gemini for **AI take the wheel** |
| `DATABASE_URL`   | Saving published posts to PostgreSQL  |




### Run the tests

```bash
cd frontend && npm test
cd backend && uv run --with-requirements tests/requirements.txt pytest
```



## Project layout

```text
frontend/src/components/       Screens: dorm, events, camera, composer, simulated LinkedIn
frontend/src/components/room/  3D room, character, movement, and collisions
frontend/src/domain/           Game rules: XP, unlocks, and item placement
backend/app/                   API, post writing, Gemini, and database
content/demo.json              Events and post options
docs/                          Build spec and design decisions
```

