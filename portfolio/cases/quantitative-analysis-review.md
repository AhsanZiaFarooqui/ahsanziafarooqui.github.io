# Case 02 · Quantitative analysis review

**Field:** Econometrics · Data auditing  
**Classification:** Entirely synthetic original professional work sample; not commissioned or fielded.

## Client task
A fictional tax department compares ten circles adopting digital assessment in 2024 with ten comparison circles. The reviewer receives two years of synthetic circle-level tax collections and a deliberately corrupted export.

## Hypothetical AI response
An illustrative AI readout calls a 20-million-PKR 2024 treated-control difference a statistically significant causal effect, does not inspect duplicate keys, and treats repeated circle-years as independent observations.

## Expert audit
1. **Nonunique panel key.** The dirty CSV adds a second T03-2024 observation with value 999 and an extra blank C04-2024 observation. **Correction:** Assert unique (circle, year) and nonmissing tax collection before any summary.

2. **Observed post difference mistaken for DiD.** 110 - 90 = 20 million PKR is a post-only contrast. **Correction:** Use change in treated group minus change in comparison group: 15 million PKR.

3. **Unjustified causality.** Digitization assignment is not known to be random and only one preyear is available. **Correction:** Treat 15 as descriptive; investigate rollout assignment, earlier trends and other shocks.

4. **Unverified significance.** No valid uncertainty interval or reported test supports a p-value. **Correction:** Prespecify estimator and dependence-aware inference; do not invent significance.

5. **Incorrect effective sample unit.** Two annual records per circle can share shocks. **Correction:** Account for repeated outcomes within circles and level of treatment assignment.

6. **Unsupported rollout claim.** A single fictional comparison has no external validity. **Correction:** Assess other locations, data quality, implementation cost and contextual heterogeneity.

## Independently reproducible comparisons
- **Digitized circles 2023 → 2024:** 80 → 110 million PKR; change +30
- **Comparison circles 2023 → 2024:** 75 → 90 million PKR; change +15
- **Post-treatment difference:** 110 - 90 = 20 million PKR
- **Descriptive DiD:** (110 - 80) - (90 - 75) = 15 million PKR

## Corrected work-product response
The correct readout reports 15 million PKR as a descriptive difference-in-differences comparison. It cannot be called causal until the counterfactual trend is defended. A single preyear cannot establish parallel trends.

## Decision
Reject the hypothetical AI causal and significance statements. Correct the invalid panel, recompute group-year means, then report a design-limited comparison rather than an unconditional policy effect.

## Grading rubric
- Key uniqueness and missingness audit: 25 points
- Accurate numerical comparisons: 25 points
- Identification and counterfactuals: 25 points
- Inference and dependence: 15 points
- Disciplined policy interpretation: 10 points

## Verification
Run `python portfolio/cases/verify.py` and `node --test portfolio/tests/cases.test.js`. See the synthetic assets in this folder. Data are artificial and intended to be independently recomputed. Neither the artificial comparison nor its DiD contrast is a measured policy impact.
