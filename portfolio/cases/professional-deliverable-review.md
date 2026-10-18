# Case 03 · Professional deliverable review

**Field:** Project management · Procurement · Research delivery  
**Classification:** Entirely synthetic original professional work sample; not commissioned or fielded.

## Client task
A fictional agency seeks 2,500 completed household interviews, a defensible sampling plan and auditable QA, with a project funding ceiling of PKR 5.8 million.

## Hypothetical AI response
An authored illustrative AI-style project plan recommends immediate approval despite a mismatched budget, a pilot before procurement and frame delivery, unrealistic enumerator capacity, an undefined 80% response-rate KPI and a related-party vendor recommendation.

## Expert audit
1. **Budget does not add up.** Staffing 1.5m + fieldwork 2.2m + data 1.8m + QA/travel 0.9m = 6.4m, not 5.8m. **Correction:** Reconcile the 0.6m shortfall or obtain authorized funding before signing.

2. **Dependencies reverse chronological order.** Pilot on December 10 comes before contracting December 15 and frame delivery December 20. **Correction:** Authorize contracting, prepare an appropriate pilot frame and instrument, then pilot; validate the final frame and accept the pilot before main fieldwork.

3. **Insufficient interview capacity.** 20 enumerators × 4 completions/day × 20 days = 1,600, short by 900 interviews. **Correction:** Pilot production rates, revisit assumptions and rescope or add resources.

4. **Undefined performance indicator.** 80% response has no eligible-contact denominator or treatment of partial/unknown cases. **Correction:** Specify disposition taxonomy, eligibility and field-quality gates.

5. **Conflict of interest.** Selection of a director's family firm without disclosure creates an integrity risk. **Correction:** Pause award, declare conflicts and use governed, independently reviewed criteria.

## Independently reproducible comparisons
- **Budget sum:** 1.5 + 2.2 + 1.8 + 0.9 = PKR 6.4m
- **Budget gap:** 6.4 - 5.8 = PKR 0.6m above ceiling
- **Initial capacity:** 20 × 4 × 20 = 1,600, short of 2,500 by 900
- **Illustrative alternative:** 27 × 5 × 25 × 0.85 = 2,868.75 expected completions (not guaranteed)

## Corrected work-product response
The plan must be held for revision. Budget and staffing must be costed together, an appropriate pilot frame and authorization must precede the pilot, a realistic contingency is necessary, response denominators must be specified, and procurement rules and conflicts require independent review.

## Decision
Do not approve the illustrative AI-style project plan. Numerical failures and a serious procurement integrity concern are decision-blocking defects that cannot be overridden by a polished narrative.

## Grading rubric
- Budget reconciliation: 25 points
- Logical delivery dependencies: 20 points
- Resource and capacity feasibility: 20 points
- Response-rate and quality metrics: 15 points
- Procurement integrity: 20 points


## Inspect the supplied work product

The authored fictional plan, budget, capacity and schedule are available below. They expose the original numerical inputs and statements so a reviewer can challenge this audit directly. The 0.6 million gap is 10.34% of the 5.8 million ceiling; initial capacity covers 64% of the target. The alternative's 0.85 is productive staff-day availability, not a response rate. Its higher productivity, duration and staffing have not been validated or costed.

## Additional delivery and quality gates

The plan supplies no defensible sampling design or operational QA protocol. Before approval require frame coverage and eligibility rules, probability selection and within-household selection, reserve-sample controls, weighting/nonresponse rules, consent and instrument testing, supervisor/back-check procedures and explicit acceptance thresholds. These omissions are visible in the supplied plan. The audit does not invent a sampling scheme or QA percentage that the fictional brief has not justified.

Pilot preparation requires the approved pilot instrument and an appropriate pilot frame plus contracting/authorization. Final main-survey frame validation, instrument revision and pilot acceptance precede main fieldwork. A pilot need not always await the final main-survey frame; the supplied plan fails because it identifies no pilot frame or authorization at all. A family connection warrants disclosure, recusal where required and independent procurement review; it does not by itself establish illegality under unspecified rules.

## Applying the rubric

Score each dimension at 0, half, or full weight. Full requires the evidence below, half identifies the issue but incompletely corrects it, zero is absent or incorrect. These are authored criteria, not validated professional certification.

- Budget (25): reconcile 6.4 against 5.8 million and require a costed revision or authorized funding.
- Dependencies (20): identify both date reversals and specify authorized, frame-supported piloting and main-fieldwork gates.
- Feasibility (20): reproduce 1,600, the 900 shortfall and the uncosted 2,868.75 sensitivity scenario; address sampling feasibility.
- Metrics and QA (15): define eligible dispositions and response denominators, supervision/back-checks and acceptance thresholds.
- Integrity (20): identify the related-party recommendation and require disclosure and independent selection without asserting unproven illegality.

No aggregate score is assigned to the abbreviated hypothetical plan. Unfunded delivery, unresolved procurement conflicts and missing sampling/QA gates block approval regardless of points.

## Source files

- [Original flawed project plan](assets/project_plan.md)
- [Budget lines](assets/project_budget.csv)
- [Capacity assumptions](assets/project_capacity.csv)
- [Proposed milestone dates](assets/project_schedule.csv)
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
