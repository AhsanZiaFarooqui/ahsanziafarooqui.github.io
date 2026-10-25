# AI tailoring contract and verification

Implementation: `src/tailoring.ts`, `server/study-ai.ts`, `/api/study-explain` in `server/index.ts`. The existing legacy endpoint is separate. The Node provider tests use synthetic adapters or missing-key fallback. The published Cloudflare implementation is `server/study-cloudflare.ts`; the adult reported eight successful live verification samples and enabled comparison on 25 October 2026.

## Permitted evidence and adaptation

The client sends exactly: segmentId; the two initial item IDs and choices for that concept; an Explain differently flag; previous checked explanation or null; and an optional fixed-choice clarification. It sends no participant code, final response, name, school, birth date, recording or free text. Initial evidence must be two distinct items from the same topic, concept and form. Final responses are never read by the request builder. The local client is trusted to identify which form was initial; this is not a tamper-proof exam service.

All four concepts are covered. The AI sequence puts initial errors/uncertainty first. The live model selects a checked explanation, supported example and one guided practice task from the relevant segment. The same three core captions remain visible. Wrong answers prompt tentative language and optional clarification, not misconception diagnoses. Explain differently excludes the previously delivered wording; failures use a different checked alternative. Clarification is logged separately and cannot change quiz scores or final items.

**The live AI selects from checked content; it does not generate unrestricted mathematical prose.** There are three checked explanation variants per segment (the main explanation, the alternative and the worked sequence), supported visual IDs, two candidate guided tasks and checked follow-up wording. This limits expressiveness but prevents invented diagrams, unsupported arithmetic and accidental scored-item examples. Instructional values are separate from the fixed assessment pools. The standard renderer never receives initial responses and uses its fixed first example/task and fixed sequence.

The actual tailoring instruction string is exported as `tailoringInstructions` from `server/study-ai.ts`. It directs selection using initial evidence, forbids mastery or misconception assertions, treats context as data, requires exact supported IDs and checked captions, and forbids generated quantities, assessment questions, HTML, links and code.

## Structured result

| Field | Validation |
| --- | --- |
| targetConcept | Exact requested segment |
| explanation | Exact member of the checked wording pool; maximum 550 characters; different wording when requested |
| visualExampleId | Exact supported worked ID for this segment |
| stepCaptions | Exactly the three checked captions in their original order |
| guidedPracticeItemId | Exact guided ID for this segment |
| followUpResponse | Exact checked follow-up text, maximum 250 characters |

Extra fields are rejected. Arbitrary HTML, URLs, JavaScript and visual parameters are not permitted. DOM text is inserted as text nodes. Deterministic SVG and rational arithmetic remain responsible for all diagrams and answer checking. Server and client both validate live output. Imported evidence is also checked for supported content.

The adapter uses the existing OpenAI Responses API pattern with strict JSON schema, `store:false`, a bounded token count and a 15-second request timeout. Refusals, invalid JSON, unsupported fields, incorrect captions, provider errors and timeouts return checked fallback packages. The [official Structured Outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses) describes the schema format and the need to handle refusals and incomplete output. This API option is not a claim that a provider retains no service/abuse logs; review the provider's arrangements before a supervised trial.

## Credentials and gate

Only the Node server reads `OPENAI_API_KEY`, `OPENAI_MODEL` and `ENABLE_COMPARISON`. The browser uses same-origin `/api/study-*` endpoints, never credentials. Requests have size limits, rate limits and origin checks. The local server binds to loopback by default. Do not expose it as a public service without a separate authentication/deployment review.

`/api/study-verify` requires configured credentials and ENABLE_COMPARISON=true. It requests one synthetic sample per segment, reports all eight, and returns a one-time review token only if all are live and valid. `/api/study-enable` additionally requires that token and explicit adult review. The gate stays in server memory and resets on restart. It is an adult-supervised operational control, not authenticated identity proof. Verification creates no learner sessions and no apparent participants.

Without credentials, practice tailoring is clearly **simulated**. Comparison cannot start until verification and review pass. A failure after assignment is **fallback**, never reclassified to standard; original assignment and every delivery/failure remain exported. No failed session is automatically excluded. Continued sessions after a server restart retain their assignments; unavailable AI falls back and is recorded.

The published Worker now provides the separate `/api/study-*` contract alongside the historical endpoints. It uses the existing AI binding and a compact structured selection (explanation index, visual ID, practice ID, follow-up index), mapped back to checked content and validated again. The hosted frontend reads the Worker URL from config; local loopback development uses Node. Cloudflare verification uses an origin-bound, version-bound cache receipt plus a browser-local token. Receipts expire within seven days; cache eviction or a different data centre can relock new comparison starts and require another adult review. No learner data is cached in that receipt. Existing assignments are retained. Reports never contain the receipt token or call the AI endpoint.
