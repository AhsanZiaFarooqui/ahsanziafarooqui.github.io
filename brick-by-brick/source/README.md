# Brick by Brick — learn and compare

Two topics, **Read the Time** and **Explore Fractions**, with a complete initial quiz → results → tutorial → final quiz → before/after journey. The research question is: **Do tutorials tailored to a learner’s initial answers improve quiz scores more than standard explanations of the same concepts?** This is a hypothesis, not a finding.

## Run locally

Requires Node.js **24.12 or later**. No dependency installation is required.

```powershell
Set-Location 'D:\Daniya AI project'
npm.cmd run dev
```

Open **http://127.0.0.1:5173**. Keep the server running. Source changes require rebuilding/restarting; this is not a hot-reload server. Alternatively, `npm.cmd run build` then `npm.cmd start`. On other platforms use `npm`.

## Practice

Choose a topic, keep **Practice** selected and keep the generated anonymous code. Complete eight questions. Initial results appear before the equally prominent tutorial choices. Choose basic concepts or AI tailoring, complete four segments with four guided tasks, then answer eight new fixed questions. Scores, percentage-point changes and concept breakdowns honestly show improvement, no change or decline. “I’m not sure” is a distinct response scored incorrect; unfinished quizzes have no total score. Stop and resume using the saved session card.

Without live credentials, AI practice is explicitly labelled **simulated** and uses checked built-in selection. Practice never enters randomised summaries. A real AI request that fails is labelled **fallback**. There are no ads or analytics.

## Randomised comparison — adult setup

For the published site, open **Grown-ups**, run **Verify live AI with eight sample requests**, review every sample, then use **Enable comparison after review**. The Cloudflare Worker uses its existing AI binding; no API key is entered in the browser. Verification is browser-scoped, expires after seven days at most, and can be lost if its server cache is evicted or requests reach another data centre. Reverify if it relocks. Existing assignments remain recorded. The adult reported successful live samples and enabled comparison on 25 October 2026.

For a local Node setup:

1. Copy `.env.example` to `.env`. Set a server-side `OPENAI_API_KEY`, a supported structured-output `OPENAI_MODEL`, and `ENABLE_COMPARISON=true`. Credentials must never go in browser files. Provider usage may incur charges.
2. Restart the server. Open **Grown-ups → Verify live AI with eight sample requests**. This sends synthetic sample evidence, not a learner record. All eight segments must return validated live responses.
3. Review the eight explanations, captions and visuals. Tick the adult review confirmation and select **Enable comparison after review**. The gate is server-side and resets on server restart. Checking a box without successful live samples cannot unlock it.
4. Follow [the trial guide](docs/trial-guide.md). Choose a topic and **Randomised comparison**, enter the participant’s anonymous code, and start. Form order is chosen independently at creation; tutorial assignment happens after the initial quiz. Both draws have 1:1 probabilities. Save the code; one primary comparison across both topics is permitted per code in this browser or imported collection.
5. Do not help with scored answers. Learners can stop. The assigned tutorial cannot be switched before the final quiz. Afterwards **Explore the other tutorial** opens optional review without changing the primary outcome or delivery record.

The website and comparison Worker were published on 25 October 2026. The adult subsequently reported that all eight live samples succeeded and enabled comparison after review. Local automated provider tests use synthetic adapters; those tests alone are not live-provider evidence. The hosted frontend routes study requests through `public/config.json`; loopback development keeps using the local Node server.

## What the AI changes

All learners cover the same four concept areas, three core captioned steps per segment, four guided opportunities and identical controls. Plan approximately 6–10 minutes of instruction for either arm and check actual times in a pilot. Both use the existing deterministic building-brick SVG renderers and animation; neither comparison arm uses audio. Existing movie/audio assets remain in the legacy code but are excluded from the trial to avoid unequal practice and assessment overlap.

Standard instruction has a fixed sequence and wording. Its delivery function receives no initial responses. The AI package puts initially missed concepts first and uses a live model to choose **checked wording, a supported worked example and a guided task**, using only initial evidence and optional unscored clarification. Explain differently selects another checked wording. It does not generate unrestricted teaching prose. This deliberate constraint protects mathematical accuracy and keeps scored examples out of tutorials. Checked fallback instruction is available on failure; original AI assignment remains AI assignment and the failure is recorded.

The comparison estimates the **whole AI-tailored package versus standard instruction**, not separate effects of personalisation and generative AI. These parallel forms are designed to match but are **not psychometrically validated**. No effectiveness claim is justified without real trial evidence.

## Dashboard and data

**Grown-ups** has separate randomised and practice tabs. Randomised summaries separate topics and retain original assignments, failures and deviations. Counts show assignment, baseline completion, tutorial starts and final completion. Means and the full −8…+8 change distribution are shown. Mean gains and their difference are **completer-only**, not a complete intention-to-treat estimate. Missing final scores are never imputed. Synthetic records are excluded from real summaries.

Export full JSON or CSV. Import JSON on one collecting device with strict validation and duplicate session-ID / primary-code checks. Nothing automatically syncs across devices. See [the data dictionary and aggregation procedure](docs/study-data-dictionary.md). Browser storage is not an authenticated research database; use an adult-supervised local device, export backups, coordinate codes across devices and do not use this prototype as a secure examination platform. The adult interface is a separate screen, not a password-based access boundary. Legacy `brick-by-brick:v1` data are left untouched and are never imported into this comparison.

## Readable reports

At final results, select **View learner report**. In **Grown-ups**, use **View comparison report**, or switch to **Practice results ? View practice summary report**. Individual reports for incomplete sessions are available under **Session records and deviations**. Each report supports **Print / Save as PDF** and a self-contained **Download HTML report**. Reports reuse the dashboard scoring, keep missing scores missing, and never upload records or reveal quiz answers. See [report instructions and limitations](docs/reports.md).

## Deliverables and validation

- [Assessment blueprint, four forms and answer keys](docs/assessment-blueprint-and-keys.md), plus [machine-readable bank](docs/study-assessment.json).
- [Standard instruction, worked examples and guided pool](docs/standard-tutorial-content.md).
- [AI contract, prompt, gate and limitations](docs/study-ai.md).
- [Trial guide](docs/trial-guide.md), [blank student journal](docs/student-journal.md), [3–5-minute showcase](docs/showcase.md).
- [Test report and remaining checks](reports/comparison-verification.md).

```powershell
npm.cmd run check
npm.cmd run test:study
npm.cmd run study:docs
```

`check` builds the app and legacy Worker, runs all tests and the legacy model audit, and regenerates both old and new content documentation. Synthetic tests run in isolated memory / subprocesses and never seed the real dashboard. The build strips TypeScript and checks syntax; it does **not** perform static type checking. DOM-harness tests are **not** real browser, keyboard or mobile visual testing. The adult has checked the published setup screens; full real-browser, print/PDF, keyboard and mobile validation remains outstanding.

New entry point: `src/comparison-main.ts`; scoring/storage: `src/study.ts`; fixed forms: `src/assessment.ts`; teaching: `src/curriculum.ts`; validated AI contract: `src/tailoring.ts`; server adapter: `server/study-ai.ts`. The previous adaptive prototype and its tests remain for reference, with [its old README](docs/legacy-readme.md). Its diagnostic claims and results do not apply to the new comparison.

Student decisions, genuine participant feedback, learning results and revisions still need to be collected and documented. The journal is blank. Features implemented by Codex/adults must be credited as such.
