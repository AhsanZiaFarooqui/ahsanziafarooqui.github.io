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
| `valuation.html` | Random forest sale-price prediction with Bayesian residual calibration by neighborhood and stratified holdout diagnostics | Synthetic comparable sales; interval is approximate, not fully Bayesian or appraised value; `property.html` redirects |
| `incidence.html` | Statutory burden by synthetic income quintile and optional assumed allocation | Simplified allocation, not structural economic incidence or empirical estimates |

All example names, household/property records, assignment mechanisms, prices and responses are synthetic or deliberately stylized. No user responses are stored or transmitted; browser state is ephemeral.

## Remote-sensing measurement module

`valuation.html#remote-sensing` includes a human-in-the-loop aerial/satellite/drone image tracing module. The user supplies a licensed image (processed locally), draws a scale reference between two points with a **known external ground distance**, and traces parcel and roof polygons. The shoelace formula converts polygon areas from image pixels to square feet using the calibrated pixel size. A separately provided floor count and floor-area factor convert roof footprint to **assumed** covered floor area; this is not inferred from imagery.

The resultant numeric land and covered-area inputs feed the existing random forest and Bayesian neighborhood calibration valuation model; the machine learning does **not** ingest raw image pixels or automatically segment roofs. The included overhead diagram and annotations are entirely fictional. The calibration assumes an orthographic, undistorted image with approximately uniform ground scale; screenshots, perspective imagery, oblique satellite views, imagery collected at different dates, and roof overhangs can create material errors. No empirical accuracy claim has been established.

For a research-grade v2, use properly georeferenced high-resolution imagery with clear reuse rights, independent cadastral boundaries, verified imagery dates and floor counts, an annotated training sample for segmentation if automation is desired, and spatially/temporally held-out sale-price validation.

### First v2 component: synthetic GeoJSON measurement

`valuation.html#geospatial` now imports synthetic RFC 7946 WGS84 parcel/roof Polygon features, checks geometry and coordinate conventions, reports ellipsoidal horizontal areas in m²/sq ft, and optionally compares areas against supplied synthetic reference polygons. It rejects unsupported CRSs instead of guessing or interpreting degrees as metres. Roof footprint stays separate from covered floor area. The existing manual tracing workflow remains available.

See [the input contract, area method, reproducible fixtures and limitations](GEOSPATIAL.md). This component does not georeference imagery, segment roofs, establish label independence, or change the valuation model's randomized split. [Issue #11](https://github.com/AhsanZiaFarooqui/ahsanziafarooqui.github.io/issues/11) remains open for licensed imagery, ground-truth segmentation evaluation and spatial/temporal valuation validation.

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

## Property valuation implementation

- Training features: land area (sq ft), covered floor area (sq ft), and categorical neighborhood; response: log observed transaction price in PKR. Neighborhood is handled as an equality split, not an arbitrary ordinal number.
- 48 bootstrap regression trees using randomized feature subsets, squared-error splits and terminal-node means. No external ML library or API.
- Within-neighborhood randomized train/calibration/test split (approximately 65/17.5/17.5) with a fixed seed. No holdout reuse for fitting. Duplicate property identifiers and exact duplicate rows are rejected. A provided `property_id` should uniquely identify each property; repeated transactions from the same property would otherwise risk leakage.
- The Bayesian calibration stage uses disjoint holdout-from-training residuals (not the final test set) and conjugate normal shrinkage for neighborhood-specific mean residuals. Forest parameters remain fixed.
- Prediction interval: a plug-in normal approximation for log residuals, incorporating Gaussian neighborhood posterior uncertainty. It does not integrate forest parameter uncertainty and must not be advertised as a fully Bayesian credible interval. Coverage is reported empirically on the untouched test sample.
- User-uploaded CSV never leaves their browser. This does not establish suitability for property tax assessments, lending, mortgages, or valuations of properties with different market structures. For actual work, use temporally and spatially held-out transactions and review legal/ethical requirements.

## Written expert-review cases

[Three synthetic review cases](cases/index.html) provide survey, econometric and professional-delivery audits. See the [evidence map and reproduction guide](cases/README.md) for underlying fixtures and dependency-free Python/Node checks. These authored AI-style exercises are distinct from the interactive demonstrations and from actual model or client evaluations.
