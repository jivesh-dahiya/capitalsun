// Approximate annual production using publicly-known regional average specific
// yields for Australia (kWh generated per kW of installed capacity per year),
// combined with standard orientation/tilt derate curves. This is a quick
// planning estimate for a quote, not a certified PVWatts/Solargis-grade
// simulation — it doesn't use measured irradiance data or model shading for
// the exact site.
export const STATE_YIELD_KWH_PER_KW = {
  NSW: 1500, ACT: 1500, VIC: 1350, QLD: 1600,
  SA: 1550, WA: 1600, TAS: 1250, NT: 1650,
};

// Factor relative to true north (0deg), optimal in the Southern Hemisphere.
const ORIENTATION_POINTS = [
  { deg: 0, factor: 1.0 },
  { deg: 45, factor: 0.95 },
  { deg: 90, factor: 0.88 },
  { deg: 135, factor: 0.8 },
  { deg: 180, factor: 0.72 },
];

const TILT_POINTS = [
  { deg: 0, factor: 0.92 },
  { deg: 10, factor: 0.97 },
  { deg: 20, factor: 1.0 },
  { deg: 30, factor: 1.0 },
  { deg: 40, factor: 0.97 },
  { deg: 50, factor: 0.92 },
  { deg: 60, factor: 0.85 },
];

function interpolate(points, value) {
  const v = Math.min(Math.max(value, points[0].deg), points[points.length - 1].deg);
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (v >= a.deg && v <= b.deg) {
      const t = (v - a.deg) / (b.deg - a.deg);
      return a.factor + (b.factor - a.factor) * t;
    }
  }
  return points[points.length - 1].factor;
}

export function orientationFactor(azimuthDeg) {
  const deviation = Math.min(Math.abs(azimuthDeg), 360 - Math.abs(azimuthDeg));
  return interpolate(ORIENTATION_POINTS, deviation);
}

export function tiltFactor(tiltDeg) {
  return interpolate(TILT_POINTS, tiltDeg);
}

export function estimateAnnualKwh({ systemKw, state, faces, systemEfficiency = 0.87 }) {
  if (!faces?.length || !systemKw) return 0;
  const totalPanels = faces.reduce((s, f) => s + f.panelCount, 0);
  if (totalPanels === 0) return 0;
  const baseYield = STATE_YIELD_KWH_PER_KW[state] ?? 1500;
  let weighted = 0;
  for (const face of faces) {
    const share = face.panelCount / totalPanels;
    weighted += share * orientationFactor(face.azimuthDeg) * tiltFactor(face.tiltDeg);
  }
  return Math.round(systemKw * baseYield * weighted * systemEfficiency);
}

// How much a state's solar output swings between its best and worst month —
// higher latitude / more southerly states see a bigger summer-to-winter
// swing than the tropics.
const SEASONAL_SWING_BY_STATE = {
  NT: 0.12, QLD: 0.18, WA: 0.22, NSW: 0.28, ACT: 0.3,
  SA: 0.28, VIC: 0.32, TAS: 0.35,
};

// Splits an annual production estimate into 12 monthly figures using a
// cosine curve peaked at the Southern Hemisphere summer (January) and
// troughed in July — a standard shape for seasonal solar yield, not a
// site-specific irradiance simulation. The 12 values always sum back to the
// annual estimate.
export function monthlyProductionKwh(annualKwh, state) {
  if (!annualKwh) return Array(12).fill(0);
  const swing = SEASONAL_SWING_BY_STATE[state] ?? 0.28;
  const rawFactors = Array.from({ length: 12 }, (_, month) => 1 + swing * Math.cos((2 * Math.PI * month) / 12));
  const factorSum = rawFactors.reduce((s, f) => s + f, 0);
  return rawFactors.map((f) => Math.round((annualKwh * f) / factorSum));
}
