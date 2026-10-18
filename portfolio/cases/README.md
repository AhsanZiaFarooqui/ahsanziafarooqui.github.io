# Expert-review cases: evidence and reproduction

These three cases are entirely synthetic, original authored exercises. The flawed responses are AI-style examples, not captured outputs from a named model or actual client engagements. No confidential research data are included. Passing the checks demonstrates internal consistency, not external validation, measured model performance or professional accreditation.

## Inspect the evidence

| Case | Readable review | Supplied work product and inputs |
|---|---|---|
| Survey | [Case 01](survey-instrument-review.html), [Markdown](survey-instrument-review.md) | [Flawed draft](assets/survey_draft.csv), [revised draft](assets/survey_revised.csv), [contact dispositions](assets/survey_dispositions.csv) |
| Quantitative | [Case 02](quantitative-analysis-review.html), [Markdown](quantitative-analysis-review.md) | [Flawed readout and provenance](assets/quantitative_readout.md), [dirty export](assets/circle_panel_dirty.csv), [reference panel](assets/circle_panel.csv) |
| Professional delivery | [Case 03](professional-deliverable-review.html), [Markdown](professional-deliverable-review.md) | [Flawed plan](assets/project_plan.md), [budget](assets/project_budget.csv), [capacity](assets/project_capacity.csv), [schedule](assets/project_schedule.csv) |

The panels have fields `circle` (synthetic identifier), `treated` (0/1 circle group, constant across years), `year` (2023/2024), and `tax_collection_m_pkrs` (annual nominal PKR millions per circle). The dirty export appends two corrupt rows. The reference panel is supplied ground truth, not the output of an automatic repair rule. Never resolve conflicting real observations by retaining the first row without checking provenance.

The questionnaire CSVs contain `question_id`, `asked_if`, `prompt`, `response_options`. Conditions refer only to answered earlier questions; `AND` means both conditions must hold. A skipped or unanswered gate cannot activate a later item. Q5 inherits the prior routing through Q4. See Case 01 for termination rules and descriptive denominators. The disposition CSV aggregates mutually exclusive contact statuses; it does not separate enough dispositions to compute a standardized response rate.

Project budget amounts are PKR millions. Capacity multiplies enumerators, completions per productive enumerator-day, planned days and productive availability. Availability is not response rate. Schedule dates are ISO calendar dates. The brief fixes a ceiling of PKR 5.8m and target of 2,500 completions. The alternative staffing scenario is a sensitivity calculation, not an approved or costed solution.

## Run the checks

Requires Git plus Python 3.10+ and/or Node.js 22+. No additional packages are needed for these numerical checks. Start in a terminal, not the browser console:

```sh
git clone https://github.com/AhsanZiaFarooqui/ahsanziafarooqui.github.io.git
cd ahsanziafarooqui.github.io
python3 portfolio/cases/verify.py
node --test portfolio/tests/cases.test.js
```

On Windows, `py -3 portfolio/cases/verify.py` can replace the Python command. Use either language if only one runtime is available; running both provides cross-language calculations. All paths are relative to the repository root. Downloading only `verify.py` is insufficient: it reads the sibling `assets/` directory. Obtain the whole repository through Git or GitHub's **Code → Download ZIP**, extract it and enter the extracted directory.

Python prints the observed inputs and derived results, ending with `Case-study checks passed`. Node must report zero failed tests. Any nonzero exit or exception indicates failure. Expected results:

- Panel: 40 reference rows, 20 circles; dirty export 42 rows, two duplicated keys, one blank; means 80/110 versus 75/90; post-only contrast 20 and descriptive DiD 15 million PKR per circle.
- Survey: 200 contacts, 150 known eligible, 30 unknown, 20 ineligible; 96/150 = 64.0%, and 96/180 = 53.3%. These are completion proportions.
- Project: 6.4m budget, 0.6m over ceiling; 1,600 planned completions, 900 shortfall; alternative expectation 2,868.75; pilot dated before contracting and supplied frame delivery.

Run all portfolio checks with `node --test portfolio/tests/*.test.js`. To preview locally, run `python3 -m http.server 8000` from the repository root and open `http://localhost:8000/portfolio/cases/`.

## Browser delivery checks

[Browser smoke-check source](../tests/cases-browser.cjs) tests desktop and narrow viewport layouts, navigation, local links and downloads, keyboard bypass and table access. It uses Playwright as a development-only dependency; it is not required to read cases or run numerical checks. CI installs the pinned browser test version and runs Chrome/Chromium and Firefox. Mobile-width emulation is not a physical iOS/Android or screen-reader certification.

[Audit record](AUDIT-2026-10-18.md) distinguishes original deployment observations from corrected-branch checks and remaining limitations. [HTTP delivery checker](check_delivery.py) verifies same-origin links and byte identity against a checkout; run `python3 portfolio/cases/check_delivery.py` after deployment from the matching revision.
