"""Regenerate fictional degree-coordinate fixtures using only Python's stdlib.
Oracle: rectangular integral of WGS84 ellipsoid surface element. No imagery.
Run from any directory: python3 portfolio/fixtures/generate-geojson.py
"""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent
A = 6378137.0
F = 1 / 298.257223563
E2 = F * (2 - F)
E = math.sqrt(E2)


def rectangle(west, south, east, north):
    return [[west, south], [east, south], [east, north], [west, north], [west, south]]


def rectangle_area(west, south, east, north):
    # Integral in u=sin(latitude): (1-e²)/(1-e² u²)² du d(longitude).
    def antiderivative(deg):
        u = math.sin(math.radians(deg))
        return (1 - E2) * (u / (2 * (1 - E2 * u * u)) + math.atanh(E * u) / (2 * E))
    return A * A * math.radians(east - west) * (antiderivative(north) - antiderivative(south))


def feature(role, bounds):
    return {"type": "Feature", "properties": {"role": role},
            "geometry": {"type": "Polygon", "coordinates": [rectangle(*bounds)]}}


bounds = {
    "parcel": (74.30, 31.50, 74.3003, 31.5003),
    "roof": (74.30005, 31.50005, 74.30020, 31.50020),
    "reference_parcel": (74.30, 31.50, 74.30032, 31.5003),
    "reference_roof": (74.30005, 31.50005, 74.30022, 31.50020),
}
scene = {"type": "FeatureCollection", "synthetic": True,
         "description": "Fictional polygons at illustrative coordinates; not cadastral records, imagery or independent ground truth.",
         "features": [feature(role, b) for role, b in bounds.items()]}
(ROOT / "synthetic-property.geojson").write_text(json.dumps(scene, indent=2) + "\n")
oracles = [{"bounds": [12, lat, 12.001, lat + .001],
            "areaSqm": rectangle_area(12, lat, 12.001, lat + .001)}
           for lat in (-85, -70, 0, 31.5, 70, 84.999)]
# Independent oblique-edge oracle: integrate the ellipsoid surface density
# across a right triangle, rather than integrating q around its boundary.
# Composite midpoint integration with Richardson extrapolation (O(h^4)).
triangle = [[12, 31.5], [12.099, 31.5], [12, 31.599], [12, 31.5]]
def triangle_area(n):
    south = math.radians(31.5)
    span = math.radians(.099)
    def density(t):
        phi = south + span * t
        return (1-t) * math.cos(phi) / (1-E2*math.sin(phi)**2)**2
    return A*A*(1-E2)*span*span*sum(density((i+.5)/n) for i in range(n))/n
triangle_oracle = (4*triangle_area(8192)-triangle_area(4096))/3
(ROOT / "geojson-area-oracles.json").write_text(json.dumps({
    "method": "Analytic WGS84 ellipsoidal integral for longitude/latitude rectangles (not geodesic edges)",
    "triangles": [{"ring": triangle, "areaSqm": triangle_oracle, "method": "Surface-density midpoint integral with Richardson extrapolation"}],
    "rectangles": oracles, "sceneAreasSqm": {role: rectangle_area(*b) for role, b in bounds.items()}
}, indent=2) + "\n")
