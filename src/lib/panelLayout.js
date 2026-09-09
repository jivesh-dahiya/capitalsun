import * as turf from '@turf/turf';

const METERS_PER_DEG_LAT = 111320;
const PANEL_GAP_M = 0.02;
const EDGE_MARGIN_M = 0.3;

function metersPerDegLng(originLatDeg) {
  return METERS_PER_DEG_LAT * Math.cos((originLatDeg * Math.PI) / 180);
}

// Local flat-earth projection — accurate enough at roof scale (tens of metres).
function projectToLocal(latLngs, origin) {
  const mPerLng = metersPerDegLng(origin.lat);
  return latLngs.map(([lat, lng]) => [(lng - origin.lng) * mPerLng, (lat - origin.lat) * METERS_PER_DEG_LAT]);
}

function unprojectFromLocal(points, origin) {
  const mPerLng = metersPerDegLng(origin.lat);
  return points.map(([x, y]) => [origin.lat + y / METERS_PER_DEG_LAT, origin.lng + x / mPerLng]);
}

function rotatePoint([x, y], angleRad) {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return [x * cos - y * sin, x * sin + y * cos];
}

export function polygonCentroid(latLngs) {
  const lat = latLngs.reduce((s, p) => s + p[0], 0) / latLngs.length;
  const lng = latLngs.reduce((s, p) => s + p[1], 0) / latLngs.length;
  return { lat, lng };
}

// Angle of the polygon's longest edge — used to align panel rows with the
// roof's dominant line (its eave/ridge) instead of a fixed compass angle.
export function dominantEdgeAngleDeg(latLngs) {
  const origin = polygonCentroid(latLngs);
  const local = projectToLocal(latLngs, origin);
  let best = { length: 0, angle: 0 };
  for (let i = 0; i < local.length; i++) {
    const [x1, y1] = local[i];
    const [x2, y2] = local[(i + 1) % local.length];
    const length = Math.hypot(x2 - x1, y2 - y1);
    if (length > best.length) best = { length, angle: Math.atan2(y2 - y1, x2 - x1) };
  }
  return (best.angle * 180) / Math.PI;
}

export function polygonAreaM2(latLngs) {
  const origin = polygonCentroid(latLngs);
  const local = projectToLocal(latLngs, origin);
  let area = 0;
  for (let i = 0; i < local.length; i++) {
    const [x1, y1] = local[i];
    const [x2, y2] = local[(i + 1) % local.length];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2;
}

// Fills a roof polygon with a grid of rectangular panel footprints, aligned
// to `rotationDeg`. This is a geometric best-fit for planning purposes — it
// doesn't model vents, chimneys, shading, or racking rules, which a real
// layout still needs to be checked on site.
export function fillPolygonWithPanels(latLngs, { panelWidthM, panelHeightM, rotationDeg = 0 }) {
  if (latLngs.length < 3) return [];
  const origin = polygonCentroid(latLngs);
  const local = projectToLocal(latLngs, origin);
  const angleRad = (rotationDeg * Math.PI) / 180;

  const rotated = local.map((p) => rotatePoint(p, -angleRad));
  const roofPoly = turf.polygon([[...rotated, rotated[0]]]);

  const xs = rotated.map((p) => p[0]);
  const ys = rotated.map((p) => p[1]);
  const minX = Math.min(...xs) + EDGE_MARGIN_M;
  const maxX = Math.max(...xs) - EDGE_MARGIN_M;
  const minY = Math.min(...ys) + EDGE_MARGIN_M;
  const maxY = Math.max(...ys) - EDGE_MARGIN_M;

  const stepX = panelWidthM + PANEL_GAP_M;
  const stepY = panelHeightM + PANEL_GAP_M;
  const panels = [];
  let row = 0;
  for (let y = minY; y + panelHeightM <= maxY; y += stepY, row++) {
    let col = 0;
    for (let x = minX; x + panelWidthM <= maxX; x += stepX, col++) {
      const corners = [
        [x, y],
        [x + panelWidthM, y],
        [x + panelWidthM, y + panelHeightM],
        [x, y + panelHeightM],
      ];
      const panelPoly = turf.polygon([[...corners, corners[0]]]);
      if (turf.booleanWithin(panelPoly, roofPoly)) {
        const worldCorners = corners.map((c) => rotatePoint(c, angleRad));
        panels.push({ key: `${row}-${col}`, corners: unprojectFromLocal(worldCorners, origin) });
      }
    }
  }
  return panels;
}
