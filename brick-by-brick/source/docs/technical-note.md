# Adaptive diagnostic tutor: technical note

## State and prior

Each module has five binary skill variables, z=(z1,…,z5), and all 32 combinations remain possible. The initial joint prior is the product of five Bernoulli probabilities, each 0.55 by default:

`P(z) = product_k p_k^z_k (1-p_k)^(1-z_k)`.

`prior()` accepts five configurable probabilities strictly between zero and one. No personal characteristic enters the model. There is no prerequisite restriction in the prior; unusual skill combinations are allowed. Prerequisites inform teaching and practical probe selection. The 0.55 prior, response parameters and thresholds are provisional design assumptions, not fitted estimates.

## Response likelihood and updating

For item j with required skill set Q_j, define `eta_j(z)=1` only when all required skills are mastered. The noisy conjunctive model is:

`P(correct | z,j) = 1-slip_j` if eta=1, otherwise `guess_j`.

Each bank item uses slip=0.10 and guess=1/(number of distinct answer choices). Uniform random guessing is only an approximation; partial knowledge, item wording and option plausibility can change real response behaviour. Every authored item has `1-slip > guess`. Likelihoods are clamped away from zero and one to avoid impossible observations.

For a scored answer y, `P(z | y,j) = P(y | z,j) P(z) / sum_z' P(y | z',j) P(z')`. An incorrect likelihood is one minus the correct likelihood. Updates normalise after each answer. At most eight diagnostic updates occur in one session. A hand-calculated unit-test case gives a skill marginal `.55*.9 / (.55*.9 + .45*.25)` after a correct four-choice focused question.

Uncertain and skipped responses are recorded separately and leave the posterior unchanged. They count towards the burden limit, not towards scored evidence. Wrong-option patterns are separate **heuristic counts**, never Bayesian misconception probabilities. Only binary correctness updates the posterior: the same answer is not multiplied by another likelihood for its distractor.

## Expected information gain

Joint entropy is `H(P)=-sum_z P(z) log2 P(z)`. For every eligible unused item, predict `q=sum_z P(z)P(correct|z,j)`. Compute both hypothetical posteriors and:

`EIG(j) = H(P) - q H(P_after_correct) - (1-q) H(P_after_incorrect)`.

Choose the highest gain among eligible candidates, breaking ties by stable item ID. Numerical negative roundoff is clamped to zero. This calculation models correct/incorrect outcomes only; it is not a complete theory of skips, motivation, reading comprehension, or learner behaviour.

The first three questions are broad anchors, common within a module. Thereafter selection excludes seen IDs and families, limits repeated single-skill probes to two where alternatives exist, and can constrain candidates to distinguishing probes. Fraction symbol reversal requests separate total/selected count probes; a denominator comparison error requests an equal-whole visual probe. Hand reversals and numeral-as-minute responses request hand/minute probes. Within the currently eligible pool, EIG decides the order. A constrained pool may have just one item. These constraints are transparent heuristics, not additional Bayesian evidence.

The selector receives only module, posterior and observed history. Synthetic true mastery appears only in the audit response generator and metric calculation; it is never passed to the tutor.

## Stopping and language

The minimum is four questions; the usual target is six; the absolute maximum is eight. Stop at five or more if repeated evidence supports a provisional difficulty, at six if there is usable evidence, or after four if available gain falls below 0.025 bits. Required fraction distinguishing probes are completed before evidence-based stopping where the hard budget permits. Learners can stop at any time; this marks diagnosis incomplete and offers a broad lesson. Ambiguous/uncertain-only paths may reach eight.

A skill needs at least two scored independent diagnostic observations involving it before a status other than insufficient evidence is used. Marginal <0.30 is a likely difficulty; >0.80 is evidence of understanding; otherwise uncertain. These are **unvalidated design cut-offs**. Multi-skill responses do not uniquely identify which component caused an error. All numerical quantities and these statuses stay in Grown-ups; child-facing text is supportive.

## Teaching policy and scaffolding

Teaching is not selected to maximise EIG. It starts with a supported difficulty, prefers prerequisites in curriculum order, and considers repeated wrong-option clues and previous lessons when choosing a representation. Insufficient or mixed evidence leads to a broad prerequisite. Strong evidence on several skills leads to consolidation without claiming all skills are mastered. Guided practice offers a hint; incomplete diagnosis or lower evidence can show it immediately and records that fact. Higher versus lower diagnostic evidence selects different unused independent instances. Question scores never use an LLM.

## After teaching

The pre-teaching joint posterior is preserved as `diagnosticSnapshot`. Playing a tutorial never updates it. A separate post-teaching check distribution starts with independent 0.5 skill priors, reflecting uncertainty about what may have changed. Independent answers update only that distribution, using the required skills of their items. This intentionally discards prior confidence for the new check rather than assuming either no learning or successful learning. Its unused skill marginals should not be interpreted as post-test results.

Guided practice—including correct answers without a requested hint—does not update either mastery distribution. Hint exposure is still recorded. Item IDs cannot be counted twice. An incorrect or uncertain independent check offers alternate wording and/or an earlier step; after two attempts, supportive adult help replaces further retry buttons. If a guided item was already used, the new explanation proceeds to an unused independent check instead of recounting practice evidence. A further teaching attempt resets the separate uncertain check prior and preserves earlier observations.

A revisit appears after a subsequently completed connecting activity/other module, or after 24 hours. It uses a reserved item and a fresh uncertain prior; a revisit response is recorded separately from immediate checks. One revisit does not establish stable retention.

## Limitations

The model assumes conditional independence of responses given the mastery state and uses a coarse all-required-skills rule. Real children have partial knowledge, variable slips, comprehension differences and dependencies between answers. The bank is modest and expert review/calibration remain outstanding. Its purpose is to choose a helpful next step while making uncertainty inspectable—not to diagnose a disability or assign a fixed label. This is Bayesian adaptive diagnosis, **not a preference-elicitation BACE experiment**.
