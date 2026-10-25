# Learner and adult reports

Reports use the existing saved study records. They do not create sessions, change scores, call AI, or upload learner data. They are snapshots: generate a new report after importing data or receiving more final scores.

## Learner report

At the end of either topic, select **View learner report**. For an earlier or incomplete session, open **Grown-ups → Session records and deviations → View learner report**.

The report includes anonymous code and session ID, topic, mode, initial/final form order, original assignment or chosen tutorial, actual delivery modes, scores and percentages, change in answers and percentage points, concept breakdown, suggested concepts to revisit, recorded tutorial time, hint/replay counts, uncertainty responses, feedback, and failures/deviations. A fixed 0–8 score chart accompanies the totals.

Incomplete quizzes have missing scores. Partial concept performance is withheld until the relevant quiz is complete. Reports never contain scored question prompts, answer keys or explanations that could reveal a later assessment. Practice and synthetic sessions are prominently labelled. No individual result is described as an AI treatment effect.

## Adult reports

In **Grown-ups → Randomised comparison**, select **View comparison report**. Time and fractions are reported separately, with original assigned groups, completion counts, missing final scores, failures, means, differences in average gains and all −8…+8 change frequencies. Missing outcomes remain missing. Failures and deviations remain under original assignment. The difference in gains is a completer-only descriptive result, not a complete intention-to-treat estimate; no winner or significance claim is generated.

The **Practice results** tab has **View practice summary report**. It is separate from the randomised report. Labelled synthetic sessions are excluded from both adult summaries. A learner report for a synthetic session remains clearly marked as synthetic.

## Save or print

- **Print / Save as PDF** opens the browser print dialog. Select a printer or **Save as PDF** (some browsers use **Microsoft Print to PDF**). The browser handles the file and destination. No external PDF service receives data.
- **Download HTML report** saves a self-contained, script-free HTML report. Open that file in a browser to read it offline or print it with Ctrl+P / Command+P. CSS is embedded; no internet connection or external assets are needed.
- Use **Back** to return to results or the dashboard. Reports contain anonymous codes and outcomes; share them only with the intended parent/teacher or authorised study audience.

JSON/CSV exports remain the complete underlying data source and the import/aggregation format. Report HTML/PDF files cannot be imported as study records. Browser-local records are not automatically synchronised between devices. Legacy prototype records use a separate schema and do not appear in these reports.

## Validation

`tests/study-reports.test.ts` checks positive/zero/negative changes for both topics, incomplete-score handling, assessment-answer exclusion, group means and denominators, fallback assignment retention, separate practice/synthetic handling, HTML escaping, print invocation, downloading, navigation and unchanged storage. These use labelled synthetic fixtures in isolated memory. DOM tests do not validate an actual browser print engine. Before sharing, inspect print preview at A4/Letter and test a phone's share/print flow; long tables should wrap and repeat headings.
