# Case 01 · Survey instrument review

**Field:** Survey methodology · Social science  
**Classification:** Entirely synthetic original professional work sample; not commissioned or fielded.

## Client task
A fictional municipality seeks descriptive estimates of adult residents' online-service use, satisfaction among users, and reasons for nonuse. A field-ready questionnaire must screen eligibility, use coherent skip logic, offer neutral responses and state analysis denominators.

## Hypothetical AI response
An illustrative AI-authored survey asks everybody whether an excellent digital portal improved speed and trust, forces nonusers to report completion times and complaint outcomes, and claims an 80% response rate without a sample disposition table.

## Expert audit
1. **Leading and double-barreled wording.** It presupposes the service is excellent and combines speed with trust. **Correction:** Separate constructs; ask a neutral satisfaction question and a distinct time item.

2. **No eligibility or use-specific routing.** Nonusers would be asked to invent experience with the portal. **Correction:** Screen adults resident in the municipality; only ask experience questions of confirmed users.

3. **Complaint-status gate absent.** Respondents without a complaint receive an inapplicable question. **Correction:** Ask status only when the respondent confirms submitting a complaint.

4. **Forced answers and sensitive values.** No cannot-recall, prefer-not-to-say or not-applicable options. **Correction:** Add defensible missingness and privacy choices.

5. **Causal overclaim.** Observed perceptions cannot identify the effect of digitization on trust. **Correction:** Report descriptive responses; identify causal claims with a separate evaluation design.

6. **Unspecified response-rate denominator.** Neither eligible nonrespondents nor unknown-eligibility contacts are accounted for. **Correction:** Report exact disposition and denominator, not a claimed 80%.

## Independently reproducible comparisons
- **Eligible and completed:** 96 of 150 known eligible, or 64.0%
- **Conservative denominator:** 96 of (150 known eligible + 30 unknown), or 53.3%
- **Disposition:** 200 contacts: 20 ineligible, 150 known eligible, 30 eligibility unknown
- **Important restriction:** These are completion proportions, not a standardized AAPOR response rate.

## Corrected work-product response
The revised nine-question instrument separates eligibility, use, experience, complaints and non-use. Routing is explicit (Q5 only if Q4=Yes; Q7 only if S1=No), and the wording does not ask respondents to infer a causal effect.

## Decision
Reject the hypothetical AI draft for field deployment. Its flawed construct definitions, skip logic and asserted response rate would bias interpretation. The replacement is only a proposed draft, pending piloting, translation and ethics review.

## Grading rubric
- Construct validity and wording: 25 points
- Correct routing and denominators: 25 points
- Response options and privacy: 15 points
- Sampling and nonresponse transparency: 20 points
- Causal interpretation and corrections: 15 points

## Verification
Run `python portfolio/cases/verify.py` and `node --test portfolio/tests/cases.test.js`. See the synthetic assets in this folder. All instruments, respondents and statements are synthetic; the revised questions have not been cognitively tested or field validated.
