# Verification report

Implementation and checks: 23–24 October 2026, Windows PowerShell, Node 24.14.1. Latest reproducible command: `npm.cmd run check`.

## Automated coverage

**40 tests passed** in Node's native test runner, including:

- Clock angles at 3:30 and 3:45, continuous movement minute by minute, wraparound, past/to wording and no inferred AM/PM.
- Exact rational equivalence/comparison, correct unit subdivision, equal SVG whole widths and unchanged highlights during equivalence lessons.
- All 90 items: IDs, unique displayed choices, keys, distractor metadata, skill/phase coverage, guess/slip assumptions and valid visual subdivisions.
- Stable answer checking after shuffling, normalised priors/posteriors, a hand-calculated Bayesian update, uncertain/skip neutrality, zero/nonnegative information gain, differing paths, repeated-family exclusion and stop limits.
- Separate post-teaching prior, unchanged diagnostic snapshot, no guided mastery updates, unused independent items, bounded retry and revisit progression.
- Deterministic Play/Pause/Replay/Next/Previous state and completion behaviour.
- AI mocked valid output and minimal payload, schema/action/parameter rejection, missing credentials, malformed/provider failures, refusal, timeout, out-of-topic text, obvious prompt injection, contact-text redaction and frontend credential scan.
- Full Time and Fractions interaction flows in an isolated DOM harness, neutral diagnostic feedback, player controls, hint tracking, independent checking, early stop, fallback UI, bridge/revisit, export actions and deletion confined to the app key.
- A real local HTTP server: app/module serving, content types/security headers, protected source/env paths, built-in API response, input validation, cross-origin/malformed-origin rejection and payload-size limit.

The actual local server also returned HTTP 200 for `/`, `/main.js`, `/style.css`, `/api/status` and a built-in `/api/explain` response. `/.env` returned 404. No credentials were printed or embedded into browser modules.

## Video and deployment checks

Fourteen H.264 MP4s, PNG posters and WebVTT tracks are present. Each targeted lesson maps to a movie. Tests validate scene mathematics, caption coverage, chapter boundaries, MP4 codec/container markers, duration (within three frames of the storyboard after encoder trimming), video byte-range responses, and player controls in the DOM harness. The movies have no embedded audio; optional local browser speech is not yet verified on real devices.

The standalone Cloudflare Worker was built and exercised locally. Mocked live success, constrained context, origin rejection, missing binding, provider/quota failure and invalid quantities passed. No live Cloudflare response is claimed.

## Synthetic audit

The reproducible [audit report](synthetic-audit.md) and [raw output](synthetic-audit.json) cover two modules, five known synthetic mastery profiles, adaptive/fixed policies, matched/mismatched response assumptions, 160 repetitions per cell and six questions each. These are simulated model diagnostics. No real learning/retention result was produced.

## What was not verified

- **Real browser rendering and interaction:** the UI tool reported no available browsers. Both Edge and in-app-browser creation returned “Browser is not available.” Mobile/desktop screenshots, actual keyboard interaction, screen-reader output and OS-level reduced-motion behaviour could not be checked. DOM/state tests are not a browser or layout engine. Follow `docs/browser-checklist.md` before a learner trial.
- **Live AI:** the free Cloudflare binding has not yet been connected, and no local server credential was configured. Valid provider responses were mocked, not live. Enabling steps are in the README; account/model availability and provider prose quality remain unverified.
- **Static TypeScript type checking:** the native build strips types and verifies parseable syntax; no TypeScript compiler was installed. Package download attempts were denied by the environment, so the application was implemented without package dependencies. Runtime tests do not substitute for a static type check.
- **Educational validation:** no real learners, calibrated likelihoods, validated cut-offs, classroom observations, impact evidence or retention study. Adult subject review and voluntary supervised trials remain necessary.

No synthetic test sessions are preloaded into the real dashboard. Test fixtures use an isolated in-memory store; audit output remains under `reports/`.
