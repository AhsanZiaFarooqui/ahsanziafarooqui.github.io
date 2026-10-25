# Comparison implementation verification — 25 October 2026

This report concerns the new `comparison-main.ts` entry point and schema-2 study flow. Older adaptive-model audit results are software diagnostics, not evidence that either tutorial improves learning.

## Passed

- Browser-module build, standalone Worker build, content/answer-key generation and existing model audit completed successfully. Build performs native TypeScript syntax stripping, not static type checking.
- Full automated suite: **86 tests passed, zero failed** (including the Cloudflare study adapter and seven readable-report tests). Tests run against synthetic data in isolated DOM storage, test subprocesses and temporary files; none are real participants and none populate the learner dashboard.
- Both topics complete initial quiz → initial results → tutorial → final quiz → results. Both fixed form orders and both assigned arms are exercised. Practice supports either tutorial choice.
- Eight-item score calculations, uncertain responses, concept counts, percentage-point gains, zero gains and declines are checked. Incomplete scores remain null / blank in exports. New answer keys are checked against deterministic arithmetic and clock wording.
- Tutorial assignment occurs after all eight initial responses, using a separate random draw from form order. Persisted assignment/order survive reload. Switching before the final outcome is rejected. One primary comparison per anonymous code across topics is enforced locally and at import.
- Fixed assessments do not depend on treatment or performance. Separate teaching IDs and numeric examples are checked. AI input includes permitted initial evidence only; unsupported content, extra fields, repeated evidence, incorrect captions and invented text are rejected. A request for different wording cannot return the same wording silently.
- Both arms cover all four concepts, use the same controls and four guided opportunities. Standard delivery accepts no initial evidence. Guided responses do not affect scored totals.
- AI provider/validation/network failure records a fallback deviation and preserves AI assignment. Missing credentials produce labelled simulated practice and a locked trial. A stale client verification flag cannot start a comparison after the server loses verification.
- HTTP verification requires all eight valid live-mode samples (mock provider in tests) plus explicit adult review and the server review token. Origin, body size and input checks pass. This verifies gate logic, **not an actual live provider**.
- Dashboard calculations retain assigned denominators, count missing follow-up and failures, exclude practice/synthetic records, show negative/zero/positive gains and avoid winner claims. JSON round trips, CSV values, duplicate imports and aggregation are checked.
- Optional post-final access to the other tutorial leaves original assignment, delivery and outcome unchanged. Storage conflicts and full-storage errors retain prior data. Double submissions cannot answer the next item. Corrupt records fail closed rather than being silently erased.
- Continuous clock angles, wraparound, exact fraction comparison, identical whole widths and unchanged shaded quantity during equivalence subdivision are checked. Native buttons, labels, focus movement, responsive CSS and reduced-motion rules are present.

## Not verified here

- **Live AI:** no provider credentials were configured; no real live provider call was made. A previous app’s historical connection verification does not verify this new endpoint. Real comparison remains disabled until an adult configures, runs and reviews the new verification samples.
- **Real-browser / mobile / keyboard / screen-reader QA:** the computer-use inventory exposed no browser, and attempting to open the in-app browser returned “Browser is not available: iab”. DOM tests do not exercise a browser layout engine, real touch targets, tab order, screen-reader output, downloads or OS accessibility behaviour. Complete the manual checklist below before recruitment.
- **Static TypeScript checking:** no compiler/type-check run was available. Syntax build and runtime tests passed.
- **Measurement quality:** no child trial, comprehension study, form-equivalence validation, power analysis, causal estimate or effectiveness evidence exists from this work. Planned tutorial durations require piloting; actual active-page time is approximate.
- **Deployment:** the adult published the comparison Worker and GitHub Pages app on 25 October 2026. GitHub confirmed the initial deployment succeeded, and the adult supplied the new setup screen and successful verification result. Adult controls and browser storage are not a secure authenticated study database.

## Report feature verification

Seven report tests pass: both topics and positive/zero/negative changes; incomplete totals and withheld partial concept feedback; assigned-group means, denominators and distributions; practice/synthetic separation; safe script-free HTML escaping; preview/print invocation/download/navigation; and unchanged stored sessions. Reports reuse `metrics`, `breakdown` and `summary`, so they calculate from the same source as the dashboard. Report display contains no scored prompts or answers and makes no AI requests.

Real desktop/mobile print preview, PDF pagination, physical printer output and screen-reader review remain untested. A successful DOM print invocation is not proof that an operating-system PDF was saved.

## Manual device checklist before a trial

1. At desktop width and approximately 360px mobile width, complete both topic journeys, checking readable diagrams, answer targets, no clipped content and horizontally scrollable tables.
2. Use only Tab / Shift+Tab / Enter / Space to select a topic, choose a mode, answer quizzes, use tutorial controls, view results and export. Check visible focus, sensible focus after each question and the skip link. Check the native progress indicators with a screen reader.
3. On the actual browser, refresh mid-initial-quiz, mid-tutorial and mid-final-quiz; close/reopen; confirm exact answers, form and assignment persist. Test two tabs and full/disabled storage. Never use test data in the real participant profile.
4. Exercise Play, Pause, Replay, Previous/Next and reduced motion. Check clock minute arcs against moving hands and fraction wholes across subdivision. Both arms have captions and neither uses audio in the comparison flow.
5. With adult-configured live AI, review all eight sample packages, test a successful tailored segment, Explain differently, clarification, an unavailable provider and quota/network failure. Confirm labels, original assignment and exported deviations.
6. Download CSV/JSON in the target browser; compare with the displayed results. Import on a separate collecting profile; test duplicate rejection and scoped deletion with disposable synthetic records.
7. Run a permitted pilot, review reading burden, approximate form difficulty and tutorial time; freeze the version and protocol before the main trial.

Real evidence still needed: willing participants with appropriate permission, initial/final responses, original assignments, missing outcomes and failures, genuine anonymous feedback, student design decisions and documented revisions. Report all outcomes honestly.
