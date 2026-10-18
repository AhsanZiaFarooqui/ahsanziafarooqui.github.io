# Case 02 · Quantitative analysis review

**Field:** Econometrics · Data auditing  
**Classification:** Entirely synthetic original professional work sample; not commissioned or fielded.

## Client task
A fictional tax department compares ten circles adopting digital assessment in 2024 with ten comparison circles. The reviewer receives two years of synthetic circle-level tax collections and a deliberately corrupted export.

## Hypothetical AI response
An authored illustrative AI-style readout calls a 20-million-PKR 2024 treated-control difference a statistically significant causal effect, does not inspect duplicate keys, and treats repeated circle-years as independent observations.

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


## Data provenance and estimand

The source readout is an authored fictional statement, not an actual model output. Its 20-million claim uses the clean reference means while ignoring the corrupted export. The dirty export has 42 rows, two duplicated keys and one blank outcome. It contains all 40 reference rows plus exactly two appended corrupt records. Verification compares these row multisets; it does not silently deduplicate or impute. In real data the conflicting T03 values cannot be resolved from row order. Consult the authoritative record before analysis.

The four reported numbers are unweighted group means of annual collections **per circle**, in millions of nominal PKR. There are 20 circles, each observed in 2023 and 2024, with fixed treatment status. The descriptive DiD is 15 million per circle; the implied difference in aggregate changes across ten treated and ten comparison circles is 150 million. Neither is an identified effect. One preperiod cannot test pretrends; even multiple similar pretrends would not prove the counterfactual assumption. With only 20 assignment units, inference also requires attention to small-cluster behavior. No inferential result is reported here.

## Applying the rubric

Score each dimension at 0, half, or full weight: full requires the evidence below, half identifies an issue but incompletely corrects it, zero is absent or incorrect. These authored anchors are not calibrated model-performance ratings.

- Data integrity (25): identify both duplicated keys and the blank, reconcile against explicit reference provenance and check 20 balanced two-year circles with fixed treatment.
- Arithmetic (25): reproduce all four means, post contrast 20 and DiD 15; state per-circle units.
- Identification (25): explain assignment, counterfactual trends and coincident shocks; retain descriptive language.
- Inference (15): reject invented significance and address circle dependence and the small number of assignment units.
- Policy interpretation (10): reject universal rollout from a synthetic example and identify external-validity and cost gaps.

No aggregate score is assigned to the abbreviated hypothetical readout. A causal or significance claim without supporting design or inference is a decision-blocking error regardless of points.

## Source files

- [Original flawed readout and reference provenance](assets/quantitative_readout.md)
- [Deliberately corrupted panel](assets/circle_panel_dirty.csv)
- [Synthetic reference panel](assets/circle_panel.csv)
- [Python verification](verify.py)
- [Node verification source](../tests/cases.test.js)


## Reproduce from a fresh checkout

All inputs are synthetic authored fixtures. The flawed responses are AI-style examples written for these exercises, not captured outputs from a named model.

Requires Git and either Python 3.10+ or Node.js 22+. No Python or Node packages are needed for the numerical checks. Run from the repository root:

```sh
git clone https://github.com/AhsanZiaFarooqui/ahsanziafarooqui.github.io.git
cd ahsanziafarooqui.github.io
python3 portfolio/cases/verify.py
node --test portfolio/tests/cases.test.js
```

Use `py -3` on Windows if `python3` is unavailable. Python prints the derived counts, means, budget and capacity, followed by a pass message; Node exits successfully with zero failures. A failed assertion or nonzero exit means verification failed. Running both gives cross-language checks of the fixtures; neither validates causal claims, field readiness or professional accreditation. For the full portfolio use `node --test portfolio/tests/*.test.js`.
