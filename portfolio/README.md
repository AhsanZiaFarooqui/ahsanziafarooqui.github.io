# Evidence Portfolio: research-evaluation demonstrations

Static, dependency-free, synthetic demonstrations by Ahsan Zia Farooqui. The portfolio is an original set of educational prototypes, **not** the author's confidential research pipelines or independently validated commercial software.

## Demonstrations

| Page | Function | Caveat |
|---|---|---|
| `adaptive.html` | Bayesian binary preference learning, expected-information-gain choice selection, and seeded simulation comparison | One-dimensional synthetic model; **not** an implementation or validation of the dissertation BACE instrument |
| `econeval.html` | Ten authored scenarios testing errors in AI-style quantitative analysis; answer checks and rubrics | Illustrative candidate answers; no external AI-model outputs or benchmarking claims |
| `data-audit.html` | Reproducible synthetic data-quality audit with CSV and JSON export | Toy records, no confidential administrative or survey data |
| `professional-review.html` | Procurement/workplan and deliverable audit with diagnostic scoring | Fictional project with deliberately planted faults |
| `roi-survey.html` | Transparent ROI sensitivity calculator and questionnaire quality exercise | No measured policy returns, no clinical validation |
| `property.html` | Measurement-error and tax-bill simulations on synthetic properties | Simulated independent benchmark; no real property valuations |
| `incidence.html` | Statutory burden by synthetic income quintile and optional assumed allocation | Simplified allocation, not structural economic incidence or empirical estimates |

All example names, household/property records, assignment mechanisms, prices and responses are synthetic or deliberately stylized. No user responses are stored or transmitted; browser state is ephemeral.

## Local development

Start a static HTTP server in the repository root (e.g. `python -m http.server 8000`), open `portfolio/`, and navigate to the demonstrations. Run automated mathematical checks with `node --test portfolio/tests/*.test.js`. Source modules have no external dependencies.

## Research and methodological integrity

- Do not treat simulated Bayesian preferences or finite simulation results as empirical estimates, causal proof, or superiority claims.
- AdaptiveChoice has an explicit one-parameter binary logit likelihood, a discrete uniform prior, and entropy-based acquisition; it is not the multi-parameter field BACE.
- The revenue experiment includes artificial independence assumptions and arbitrary parameter scales.
- The incidence demo labels its shift as an **assumed burden allocation**, not estimated equilibrium pass-through.
- Numeric inputs have boundaries and tests, but this work is a demonstrator, not a production tax administration system.
- For scientific use, run a separate model-validation protocol, robustness checks and expert review.

## License / reuse

No external research data or proprietary packages are included. Source code is provided for inspection. Contact the author for reuse permissions; no open-source license is asserted here.
