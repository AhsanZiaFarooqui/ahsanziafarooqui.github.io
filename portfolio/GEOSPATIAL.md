# Synthetic georeferenced measurement — first component of remote sensing v2

Related development: [issue #11](https://github.com/AhsanZiaFarooqui/ahsanziafarooqui.github.io/issues/11). This component addresses polygon import and measurement checks only. The issue remains open for imagery, segmentation and research validation.

## Run it

Serve the repository (`python3 -m http.server 8000`) and open `portfolio/valuation.html#geospatial`. Choose **Measure synthetic fixture**, or download the fixture, confirm the coordinate convention and fictional provenance, and upload it. Processing stays in the browser. The separate manual image upload, scale calibration, tracing and explicitly assumed floor-area workflow remains available above it.

The GeoJSON panel deliberately reports **horizontal parcel area** and **horizontal roof footprint**, without supplying a storey count, total covered floor area or automated valuation input. A roof is not a measurement of all floors. The schematic displays the polygons without a basemap or imagery registration.

## Supported input contract

- RFC 7946 `FeatureCollection` with the foreign member `"synthetic": true`. This declaration is a user assertion, not evidence of provenance. No real cadastral records are needed or included.
- Exactly one `Polygon` feature each with `properties.role` equal to `parcel` and `roof`. Optionally one `reference_parcel` and/or `reference_roof`. Unique roles identify the single fictional property; arbitrary feature IDs are not used for matching.
- WGS84 coordinates in **[longitude, latitude] decimal degrees**, the RFC 7946 / OGC:CRS84 convention. The standard supplies the CRS implicitly. No CRS is guessed from coordinate magnitudes. All legacy `crs` members are rejected, including an EPSG:4326 declaration, to avoid silently accepting legacy axis conventions or mixed CRSs. Reproject outside the demo and explicitly export RFC 7946 GeoJSON. Merely removing a `crs` member does not reproject coordinates.
- Finite two-number positions; longitude ±180°, latitude ±85°. No altitude, MultiPolygon or geometry collections. Maximum four features, ten rings and 500 positions (including closures) per feature; upload/text limit 256 KiB. The entire scene, including references, must span at most 0.1° on either axis. Antimeridian-crossing and polar scenes are unsupported.
- Each ring must close exactly, contain at least three distinct vertices, and enclose at least 0.01 m². Polygon net area must also be at least 0.01 m². Holes must lie strictly inside the exterior and cannot touch, intersect, overlap or nest. Either ring winding is accepted; input is not silently repaired.
- Reject self-crossing, repeated boundary vertices and overlapping/backtracking edges. Collinear vertices that continue along a boundary are allowed. Topology predicates operate in a local affine transform of degree coordinates, with approximate numerical tolerances of 1e-7 m for point coincidence/bounding checks and 1e-8 m² for cross products. This is a bounded educational validator, not a replacement for robust GIS processing of pathological near-degenerate geometry.
- Roof must be **strictly** within its parcel, with no boundary contact or coverage of a parcel hole. If both references are supplied the reference roof must also be strictly inside its reference parcel. This conservative policy rejects real situations such as overhangs and boundary-aligned roofs; inspect and resolve them outside the demonstration.

Coordinate ranges and the user's confirmation cannot prove the datum, axis order, correct location, date or source accuracy. Plausible swapped longitude/latitude values can pass range checks. Properties other than `role` and the collection's `synthetic` assertion do not establish measurement provenance. Uploaded HTML is never inserted into the page.

## Area method and units

`geojson-measure.js` calculates **WGS84 ellipsoidal horizontal surface area**, in m², with longitude/latitude-linear boundaries as specified by RFC 7946. It does not treat degree coordinates as planar metres, use Web Mercator areas, or estimate sloped surface area. No CRS transformation library or network request is required to calculate uploaded polygons.

For WGS84 semi-major axis `a = 6378137 m`, flattening `f = 1/298.257223563`, eccentricity squared `e² = f(2−f)`, and latitude `φ`, define

```
q(φ) = (1−e²) [sin(φ)/(1−e²sin²(φ)) + atanh(e sin(φ))/e]
```

The signed surface integral is `−a²/2 ∮ q(φ) dλ`, with angles in radians. Composite Simpson integration (eight subintervals per edge) integrates `q` along each longitude/latitude-linear edge. Subtracting a ring-origin `q` reduces cancellation for small footprints. Use the absolute exterior-ring area minus absolute hole areas. Square feet use the international foot: `sq ft = m² / 0.3048²`.

This is numerical integration, not an exact-arithmetic result or a surveying accuracy guarantee. Rectangle oracle checks across latitudes use a 0.0001 m² tolerance for arithmetic only; the tolerance is **not** an uncertainty bound on coordinates or imagery. Surface boundaries following geodesics instead of RFC degree-linear segments can give different areas. Terrain, roof pitch, elevation, positional error and source resolution are not modeled. Two-decimal display precision is formatting, not measured accuracy.

Standards and method background: [RFC 7946 §§3.1, 4](https://www.rfc-editor.org/rfc/rfc7946), [PROJ's ellipsoidal cylindrical equal-area projection](https://proj.org/en/stable/operations/projections/cea.html). The ellipsoidal authalic integral above is the same surface element underlying an ellipsoidal equal-area projection; topology still follows RFC degree-linear segments.

## Reference comparisons and their limits

For each supplied matched reference, report:

- Signed area error: measured area minus reference area, in m².
- Absolute area error: magnitude of the signed error, in m².
- Signed and absolute percentage errors: corresponding error divided by the positive reference area, times 100.

Without references, report no errors. The included references are deliberately different **synthetic** rectangles, not independently labelled ground truth. References undergo the same geometry checks as measurements. No matching by nearest location, independence verification, positional overlap metric, IoU or segmentation uncertainty is implemented. Equal-area polygons can be disjoint; an explicit test demonstrates this limitation. The schematic can expose gross positional differences but does not replace quantitative positional validation.

The fixture's expected parcel/roof areas are approximately 948.0294/237.0074 m². Compared with its fictional references, signed area errors are −6.25%/−11.7647%. These are deliberately constructed discrepancies, not empirical accuracy estimates.

## Reproduce checks

```
python3 portfolio/fixtures/generate-geojson.py
node --test portfolio/tests/*.test.js
```

The stdlib-only generator writes deterministic fictional polygons and exact rectangular-integral area oracles; no external imagery or coordinates from actual cadastral properties are used. Node tests check geometry, holes, containment, CRS/axis limitations, limits, latitudes, orientation, units, reference errors and missing references. Existing manual-tracing/model tests run alongside them. The area oracles use an analytic rectangular surface integral, not the JavaScript edge quadrature. They establish arithmetic consistency, not independent GIS certification.

Browser checks use the same development-only Playwright version as existing delivery checks:

```
npm install --prefix /tmp/geo-browser --no-audit --no-fund playwright@1.62.1
/tmp/geo-browser/node_modules/.bin/playwright install --with-deps chromium firefox
PLAYWRIGHT_MODULE=/tmp/geo-browser/node_modules/playwright node portfolio/tests/geojson-browser.cjs
```

The browser checks exercise the synthetic example, upload confirmation, valid/invalid uploads, missing references, stale-result clearing, mobile layout, downloadable fixture and unchanged manual measurement. CI runs these in Chromium and Firefox at mobile and desktop widths.

## Still required for issue #11

| Capability | Status / evidence needed |
|---|---|
| Bounded synthetic georeferenced GeoJSON import, geometry checks, units and reference area errors | Implemented here; synthetic arithmetic/interaction tests |
| Image georeferencing, CRS transformation, orthorectification and image/polygon registration | Not implemented; needs licensed dated imagery, source CRS/transforms and independent registration control |
| Automatic roof segmentation and IoU/positional/area validation by neighborhood/building type | Not implemented; needs licensed sufficiently detailed imagery and independently verified, held-out labels |
| Total covered floor area | Not inferred; needs verified floors/height and floor-specific area evidence with error bounds |
| Authorized linkage to transactions; spatial and temporal train/calibration/test separation; model comparisons, subgroup error and interval coverage | Remain research work; existing demo still uses randomized within-neighborhood splits on synthetic sales |

No improvement in appraisal accuracy, tax equity or real-world segmentation has been established. Passing these tests does not complete issue #11.
