# Comparison data dictionary and aggregation

The authoritative browser key is `brick-by-brick:comparison:v2`, JSON schema 2. Legacy adaptive records in `brick-by-brick:v1` are never mixed into this study. No session is fabricated at app startup. Test fixtures live only in isolated test memory or subprocesses.

| Field | Meaning |
| --- | --- |
| schema | Export version, exactly 2 |
| sessions | All local comparison and practice records, including incomplete ones |
| activeId | Session to reopen; null when on home screen |
| id | Random UUID, unique session identity |
| code | Anonymous BBB-XXXXXX participant code; not a name |
| mode | practice or comparison |
| topic | time or fractions |
| order | A or B, the initial form; final uses the other form |
| assigned | Original random tutorial assignment, standard or ai; null until initial quiz complete; always null in practice |
| selected | Practice choice, standard or ai; always null in comparison |
| stage | initial, baseline (initial results), tutorial, final or results |
| status | active, stopped or complete; complete requires eight final answers |
| created, completed | ISO timestamps; completed is null until finished |
| initialScore, finalScore | 0–8 only for a complete eight-item quiz; otherwise null. Revalidated against item answers on every load/import |
| initial, final | Ordered item response arrays. Unanswered items are absent, never invented zeros |
| response.itemId | Fixed topic/form/item ID |
| response.choice | Zero-based option index, or null for “I’m not sure” |
| response.kind | choice or uncertain; uncertainty is distinct from a missing response |
| response.correct | Deterministic match to answer key; uncertain is false |
| response.at | ISO submission time |
| sequence | Four tutorial segment IDs; fixed in standard, initial-error order for AI |
| segmentIndex, stepIndex | Current zero-based tutorial and caption position |
| deliveries | All delivered explanation packages, including retries and fallbacks |
| delivery.segmentId | Supported target concept / segment |
| delivery.mode | standard, live, simulated or fallback |
| delivery.reason | Source or failure reason; no credentials or provider payloads |
| delivery.explanation | Exact checked explanation selected |
| delivery.exampleId, practiceId | Supported worked/guided pool IDs; never assessment IDs |
| delivery.stepCaptions, followUpResponse | Checked text actually delivered |
| guided | One response per segment: segmentId, practiceId, choice, correct. Not included in quiz scores |
| interactions | ISO time, action, optional segmentId and fixed-choice value; hint, replay, step, clarification, stop, resume etc. |
| deviations | Timestamp and reason, including AI fallback, tutorial reopen or adult-reported condition deviations |
| tutorialStarted, tutorialCompleted | ISO timestamps, nullable |
| tutorialMs | Accumulated foreground time on the tutorial screen; includes pauses/reading, excludes background, adult pages and closed-browser intervals |
| feedback | Optional Helpful / Still confusing / Prefer not to say; no free text |
| synthetic | Explicit software-test marker; true records are excluded from real summaries |

Timing checkpoints occur every five seconds and at normal transitions. An abrupt close can lose the last few seconds. Reopening a tutorial is flagged. Background and closed time are not inferred as learning. These are approximate interaction timings, not attention measurements. Interaction timestamps and start/completion wall times are also retained.

CSV has one row per session, including incomplete sessions. It includes original assignment, selected tutorial, actuallyDelivered (distinct delivery modes), assignedTutorialDelivered (all four segments delivered in the assigned mode, no simulated/fallback delivery), both scores, gain, percentagePointChange, status, stage, timings, feedback, synthetic and JSON-encoded item/interaction/delivery/deviation arrays. Hint use is the count of hint actions. Form order is written as “A then B” or “B then A”. Missing scores are blank, not zero. CSV strings beginning with spreadsheet formula characters are prefixed with an apostrophe for safe opening; negative gains may therefore appear as text in spreadsheet software. Use JSON for exact typed analysis, or explicitly parse numeric CSV columns after stripping this protection.

Quiz percent = correct / 8 × 100. Gain = finalScore − initialScore. Percentage-point change = gain × 12.5. These quantities are missing unless both necessary scores exist. Concept counts use two fixed questions per form and are descriptive, not mastery estimates.

## Dashboard denominators

- Group membership always uses original random assignment, regardless of fallback or deviations. Practices and synthetic sessions never enter real randomised summaries.
- Initial quizzes ending before assignment are counted separately by topic, without inventing group membership.
- Mean initial score uses all assigned records with completed baselines.
- Mean final and mean gain use complete paired sessions. Their denominators are the displayed final-completion counts. Their difference is not a complete intention-to-treat estimate when final scores are missing.
- Failures count affected sessions, not API calls. Deviations count sessions with any recorded deviation. No deviations are automatically excluded.
- Mean tutorial seconds uses tutorial starters. The full gain distribution includes zero and negative gains. No winner, p-value, significance star or individual causal claim is produced.

## Import / aggregation across devices

1. Before collecting data, allocate disjoint anonymous code lists across devices and enforce one primary topic per code. This browser cannot know which codes were used on another device until exports are combined.
2. Export JSON and CSV on each device after finishing the batch. Keep original files unchanged and record app/content version in the trial log. Export before clearing storage. Do not include personal identifiers in filenames.
3. On a collecting device, open Grown-ups and import JSON files. The entire file is validated before any write. Repeated session IDs or repeated primary comparison codes reject the entire import; no rows are silently dropped or preferred based on outcomes. Different schemas, unknown fields, invalid forms, unsupported content and contradictory scores are also rejected.
4. Repeated snapshots of the same device are not additional participants. Use exactly one latest snapshot per source in a fresh collection, or back up and remove the previous imported snapshot's sessions before replacing it. Investigate any code conflict with the supervising adult. Keep a documented resolution log. Never rename a duplicate participant to make it appear independent.
5. Compare assigned/completer counts and per-session values against the source devices. Export the combined JSON and CSV. Browser data are not automatically combined, synchronised or backed up.

The optional command below performs the same strict aggregation without the browser, leaving source files untouched and refusing to overwrite existing output:

```powershell
node --experimental-strip-types scripts/aggregate-studies.ts reports/combined.json device-one.json device-two.json
```

Deletion controls remove a selected session or only this comparison-app key. They do not erase other apps, legacy data or downloaded exports. Removing a primary session also removes this browser's duplicate-code protection for it. An adult code register remains necessary. Local storage, exports and role labels are not cryptographically authenticated; deliberate modification cannot be ruled out by this prototype.
