# Anonymous evidence schema, version 1

The app stores one versioned object under localStorage key `brick-by-brick:v1`. Evidence exports exclude the project journal. Optional learner reasoning sent to the wording helper is never persisted in this object.

## JSON export

Top-level fields: `schemaVersion:1`, `exportedAt` (ISO time), `sessions` (array), `bridgeVisits` (completed connecting-activity count). The local object also stores `journal` and `lastBridgeAt`; the latter only schedules revisits and is not exported. An empty array means no sessions, not missing sample data.

Each session contains:

| Field | Meaning |
|---|---|
| id | Locally generated random UUID; not a name or account ID |
| module | `time` or `fractions` |
| started, completed, revisitAfter | ISO timestamps; completed/revisitAfter are optional |
| evaluation | Whether Grown-ups started an optional trial visit |
| posterior | 32 joint probabilities from diagnosis |
| diagnosticSnapshot | Preserved joint probabilities before teaching, when available |
| checkPrior | Current separate 32-state post-teaching/revisit check distribution; historical name retained in code |
| stage, currentItemId | Resume state; current item is optional |
| selectionReason | Human-readable explanation for the current/most recent selection |
| tutorialId, tutorialReason, taught | Selected tutorial, why, and previously offered tutorial IDs |
| stopReason, incomplete | Diagnostic stopping rule and explicit early-stop flag |
| attempts | Number of independent/revisit responses so far |
| observations | Ordered answer records (below) |
| feedback | Optional fixed choice: helped, puzzling, or another picture requested |

Each observation has `itemId`, `outcome` (`correct`, `incorrect`, `uncertain`, `skipped`), optional stable `choiceId`, `hints` (whether shown), `phase` (`diagnostic`, `guided`, `independent`, `revisit`), optional `tutorialId`, ISO `time`, five `prior` and `posterior` marginals for the applicable phase's distribution, `reason` for asking the item, and an optional heuristic `misconception` tag. Join the item ID to `docs/item-bank.json` for required skills, exact prompt, option labels and distractor interpretation.

For guided observations, prior equals posterior; no mastery update occurs. Independent and revisit updates do not change the diagnostic distribution. A fresh prior of 0.5 is used after a new teaching attempt and for a revisit. Snapshot changes are not learning-gain estimates. Tutorial selection means offered, not proof it was watched or understood.

## CSV export

One row per observation. Columns: `schemaVersion`, `sessionId`, `module`, `evaluation`, `itemId`, `skills` (pipe separated), `outcome`, `choiceId`, `hintsUsed`, `phase`, `tutorialId`, `independentCheck`, `time`, `feedback`. `independentCheck` repeats the outcome only for independent/revisit rows, otherwise it is blank. A session stopped before any answer still appears in JSON but has no observation row in CSV. CSV fields are quoted, embedded quotes doubled, and potentially executable spreadsheet prefixes escaped.

Use scored independent correct / (correct + incorrect) for independent accuracy. Report uncertain/skipped counts alongside that denominator. Keep guided accuracy, diagnosis, engagement counts, immediate independent accuracy and later revisit results separate. Do not interpret fewer questions, greater posterior confidence, or lesson completion as learning evidence.

Exported files may reveal timestamps and optional anonymous feedback, so handle them sensibly even though no personal identifier is requested. Browser deletion cannot delete files already downloaded. Reset deletes only the chosen session; delete-all clears this app's storage key and leaves unrelated projects and browser data intact. Project-journal text has its own separate plain-text export.
