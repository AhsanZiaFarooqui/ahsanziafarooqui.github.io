# Case 01 · Survey instrument review

**Field:** Survey methodology · Social science  
**Classification:** Entirely synthetic original professional work sample; not commissioned or fielded.

## Client task
A fictional municipality seeks descriptive estimates of adult residents' online-service use, satisfaction among users, and reasons for nonuse. A field-ready questionnaire must screen eligibility, use coherent skip logic, offer neutral responses and state analysis denominators.

## Hypothetical AI response
An authored illustrative AI-style-authored survey asks everybody whether an excellent digital portal improved speed and trust, forces nonusers to report completion times and complaint outcomes, and claims an 80% response rate without a sample disposition table.

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


## Routing and analysis denominators

S0=No ends as ineligible; refusal ends with eligibility unknown. S1=Do not remember or Prefer not to say ends with use status missing, not nonuse. S1=No receives Q7 only. Confirmed users receive Q1; Q1=Cannot recall ends experience follow-up. Q5 is asked only after Q4=Yes. The revised time item includes unsuccessful attempts, accepts nonnegative minutes and flags unusual values rather than rejecting all values above 600.

Use prevalence: confirmed users / eligible respondents answering Yes or No to S1; report missing S1 separately. Satisfaction: Q3 valid substantive responses among routed users able to recall a service; report exclusions and item nonresponse. Complaint resolution: Q5=Resolved / valid Q5 status responses among Q4=Yes; disclose Do not know separately. Nonuse reasons: substantive Q7 responses among S1=No; disclose refusals. These are descriptive respondent estimates. Without a defensible sampling design and weights they are not representative municipal population estimates.

The synthetic disposition source records 96 eligible completes, 54 other known-eligible contacts, 20 ineligible and 30 unknown-eligibility contacts. Partial interviews and refusals are not separated, so a standardized response rate cannot be calculated from this table.

## Applying the rubric

Score each dimension at 0, half, or full weight. Full credit requires the stated evidence; half means a correctly identified issue with incomplete correction; zero means absent or incorrect. These are authored scoring anchors, not empirically calibrated ratings.

- Wording (25): identify leading/double-barreled wording and replace it with neutral, separate items.
- Routing (25): trace eligible, nonuser, unknown-use, cannot-recall and complaint branches; define analysis denominators.
- Response options (15): allow refusal and recall uncertainty; handle abandoned requests and unusual times.
- Nonresponse (20): reconcile 200 contacts and both completion proportions; distinguish them from a standardized rate and population representativeness.
- Interpretation (15): reject causal trust claims and condition field deployment on piloting, translation and ethics review.

No aggregate score is assigned to the abbreviated hypothetical response. An instrument requiring inapplicable or invented answers remains unsuitable for deployment regardless of its point total.

## Source files

- [Original flawed questionnaire](assets/survey_draft.csv)
- [Revised draft questionnaire](assets/survey_revised.csv)
- [Synthetic contact dispositions](assets/survey_dispositions.csv)
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
