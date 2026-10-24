# Brick by Brick: My Maths Helper

A working local adaptive diagnostic tutor for approximately ages 7–10, covering analogue clocks and fractions. It is a prototype for a student's Beaconhouse ILAP 2027 project, with Digital Transformation and SDG 4 as its intended links. It does not claim eligibility, selection, validated diagnosis, or demonstrated learning gains.

## Open it

Requires **Node.js 24.12 or later**. No package installation, account, database, or API key is required for the built-in mode.

```powershell
Set-Location 'D:\Daniya AI project'
npm.cmd run dev
```

Open **http://127.0.0.1:5173** in a modern browser. `dev` builds the browser modules and starts the server; it does not hot reload. After editing source, stop with Ctrl+C and rerun. On macOS/Linux use `npm` instead of `npm.cmd`. `npm run build` creates `dist`; `npm start` serves it. Keep the local server running while using the app. Opening `index.html` directly is unsupported.

The application uses TypeScript, standard DOM/SVG APIs and Node's built-in HTTP server/test runner. Node strips erasable TypeScript syntax for the browser build. This keeps the prototype dependency-free; **this build does not perform static TypeScript type checking**. The original React/Vite plan was replaced after package downloads were denied by this environment. No abandoned framework dependencies are required.

## What works

- Two complete journeys: broad questions → adaptive probes → targeted lesson → guided practice → fresh independent check → bounded retry/prerequisite help → revisit.
- 90 question instances: **25 diagnostic items per module**, plus five practice families with four instances each per module. See the [question-bank guide](docs/question-bank.md), [full index](docs/item-index.md) and [machine-readable metadata](docs/item-bank.json).
- 13 targeted lessons with real captioned H.264 MP4 mini-movies, plus a fourteenth Fractions of an Hour movie. An interactive SVG step view remains available, with continuous clock hands, exact fraction comparisons and same-length whole strips. The hour hand stays synchronised across twelve. Play, Pause, Replay, Previous/Next, Explain differently and Try it myself all work.
- An optional Fractions of an Hour activity distinguishes durations from clock readings.
- A 32-state Bayesian model per module; EIG-based follow-ups; no ability score shown to children. See the [technical note](docs/technical-note.md).
- A free-plan Cloudflare Workers AI endpoint for alternate explanations and supported examples. It validates structured output and falls back on quota/provider/validation failure. **The account owner verified a live response through Grown-ups > Test AI connection (LIVE_VERIFIED, 24 October 2026). Visual parameters were checked; arbitrary prose still needs review.** Each explanation is labelled live or built-in. The diagnostic engine works fully without AI.
- Local anonymous sessions, separate guided/check evidence, parent/teacher explanations, optional evaluation labels, JSON/CSV export, scoped reset/delete and a blank local project journal.

## Share it and enable free AI

The static app is published on GitHub Pages at https://ahsanziafarooqui.github.io/brick-by-brick/. Its source lives in the same repository under `brick-by-brick/source`.

Follow [Cloudflare setup](deploy/CLOUDFLARE-SETUP.md). A standalone Worker is ready at `deploy/cloudflare-worker.js`; paste it into the dashboard and add a Workers AI binding named `AI`. Keep **Workers Free**, without paid upgrades or purchased credits. The current free allowance is 10,000 neurons daily; quota exhaustion switches the app to built-in explanations. Set only the public Worker URL in `public/config.json`, then rebuild/publish. No API key goes in the browser. See [official pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/).

The optional original local OpenAI adapter remains in the source for development, with placeholders in `.env.example`. It is **not used by the free deployment** and requires a separately billed credential if enabled. Leave its key blank for this project.

Videos contain large visible captions and downloadable WebVTT captions. They **do not contain embedded speech**. Read aloud optionally uses an installed local English device voice; availability and timing vary. Nothing autoplays. The checked interactive step view and full transcript remain usable without playback or speech. Movies use original generic interlocking bricks, with no brand affiliation.

## Verify it

```powershell
npm.cmd run check
```

This builds the browser and standalone Worker, runs the mathematical/model/AI/DOM/HTTP tests, reruns the synthetic audit, and regenerates item-bank documentation. Individual commands: `npm test`, `npm run test:ui`, `npm run audit:model`, `npm run bank:docs`.

`test:ui` uses a small DOM harness, **not a real browser**. See [verification report](reports/verification.md) and [browser checklist](docs/browser-checklist.md). Browser/mobile layout, real keyboard navigation and OS reduced-motion behaviour could not be inspected because no browser was connected to the available UI tool. Tests run in isolated in-memory storage; they do not create fake sessions in a real dashboard.

The [synthetic audit](reports/synthetic-audit.md) compares adaptive and fixed selection at the same six-question budget, including mismatched slip/guess rates. It is a software/model diagnostic, not a study of real children or evidence of learning.

## Project materials

- [Parent/teacher trial guide](docs/trial-guide.md) — blank protocol and observation sheet.
- [Blank student journal](docs/student-journal.md) — also editable inside Grown-ups.
- [3–5-minute showcase](docs/showcase.md) — simulated demonstrations explicitly labelled.
- [ILAP source/access notes and continuation plan](docs/ilap-notes.md).
- [Evidence export schema](docs/evidence-schema.md).

The student must identify and document a real difficulty, understand and choose important design decisions, test with willing participants with adult oversight, record actual feedback and revisions, and acknowledge adult/AI/coding assistance. The app supplies none of those experiences or findings on her behalf.

## Source map

`src/model.ts`: probabilities and question policy. `src/bank.ts`: authored items and practice families. `src/tutorials.ts`: checked teaching steps and selection. `src/session.ts`: progression, post-teaching evidence, storage/CSV. `src/math.ts`: arithmetic. `src/animation.ts`: deterministic player state. `src/visuals.ts`: SVG renderer. `src/main.ts`: child and grown-up flows. `server/ai.ts`: provider call and fallback. `server/index.ts`: local server. `tests/`: automated checks. `scripts/`: native build, audit and metadata generation.

## Narration preparation

See [audio setup](docs/audio-setup.md) for the free one-time speech generation and MP4 embedding pipeline. The existing MP4 files still have no embedded audio until that pipeline has been completed and checked.
