# Case 03 · Professional deliverable review

**Field:** Project management · Procurement · Research delivery  
**Classification:** Entirely synthetic original professional work sample; not commissioned or fielded.

## Client task
A fictional agency seeks 2,500 completed household interviews, a defensible sampling plan and auditable QA, with a project funding ceiling of PKR 5.8 million.

## Hypothetical AI response
An illustrative AI project plan recommends immediate approval despite a mismatched budget, a pilot before procurement and frame delivery, unrealistic enumerator capacity, an undefined 80% response-rate KPI and a related-party vendor recommendation.

## Expert audit
1. **Budget does not add up.** Staffing 1.5m + fieldwork 2.2m + data 1.8m + QA/travel 0.9m = 6.4m, not 5.8m. **Correction:** Reconcile the 0.6m shortfall or obtain authorized funding before signing.

2. **Dependencies reverse chronological order.** Pilot on December 10 comes before contracting December 15 and frame delivery December 20. **Correction:** Validate frame, contract, program instrument and pilot before main fieldwork.

3. **Insufficient interview capacity.** 20 enumerators × 4 completions/day × 20 days = 1,600, short by 900 interviews. **Correction:** Pilot production rates, revisit assumptions and rescope or add resources.

4. **Undefined performance indicator.** 80% response has no eligible-contact denominator or treatment of partial/unknown cases. **Correction:** Specify disposition taxonomy, eligibility and field-quality gates.

5. **Conflict of interest.** Selection of a director's family firm without disclosure creates an integrity risk. **Correction:** Pause award, declare conflicts and use governed, independently reviewed criteria.

## Independently reproducible comparisons
- **Budget sum:** 1.5 + 2.2 + 1.8 + 0.9 = PKR 6.4m
- **Budget gap:** 6.4 - 5.8 = PKR 0.6m above ceiling
- **Initial capacity:** 20 × 4 × 20 = 1,600, short of 2,500 by 900
- **Illustrative alternative:** 27 × 5 × 25 × 0.85 = 2,868.75 expected completions (not guaranteed)

## Corrected work-product response
The plan must be held for revision. Budget and staffing must be costed together, the frame and procurement must precede the pilot, a realistic contingency is necessary, response denominators must be specified, and procurement rules and conflicts require independent review.

## Decision
Do not approve the illustrative AI-generated project plan. Numerical failures and a serious procurement integrity concern are decision-blocking defects that cannot be overridden by a polished narrative.

## Grading rubric
- Budget reconciliation: 25 points
- Logical delivery dependencies: 20 points
- Resource and capacity feasibility: 20 points
- Response-rate and quality metrics: 15 points
- Procurement integrity: 20 points

## Verification
Run `python portfolio/cases/verify.py` and `node --test portfolio/tests/cases.test.js`. See the synthetic assets in this folder. This is not a real procurement review. Lawfulness cannot be inferred without the applicable governing rules and tender documents.
