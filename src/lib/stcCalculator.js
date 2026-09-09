// Small-scale Technology Certificate (STC) calculation for Australia's
// Small-scale Renewable Energy Scheme, which runs until 31 December 2030.
//
// The formula itself is fixed and well-established:
//   STCs = floor(system size (kW) x zone rating x deeming years)
// where deeming years = years remaining from the install year up to and
// including 2030 (a system installed in 2026 deems 5 years: 2030-2026+1).
//
// Zone ratings (1-4) are assigned by the Clean Energy Regulator at the
// postcode level and don't follow state borders exactly — ZONE_DEFAULTS
// below is a reasonable starting point per state capital, not a substitute
// for checking the exact postcode against the CER's official zone list.
export const ZONE_RATINGS = { 1: 1.622, 2: 1.536, 3: 1.382, 4: 1.185 };

export const ZONE_DEFAULTS_BY_STATE = {
  NT: 1, QLD: 2, WA: 2, NSW: 3, ACT: 3, SA: 3, VIC: 4, TAS: 4,
};

export const SCHEME_END_YEAR = 2030;

export function deemingYears(installYear) {
  return Math.max(0, SCHEME_END_YEAR - installYear + 1);
}

export function calculateStcCount({ systemKw, zone, installYear }) {
  const rating = ZONE_RATINGS[zone];
  if (!systemKw || !rating || !installYear) return 0;
  return Math.floor(systemKw * rating * deemingYears(installYear));
}

// Battery rebates run on a newer, still-evolving federal scheme whose exact
// certificate-generation mechanics aren't asserted here with the same
// confidence as the long-established solar STC formula above. This keeps it
// to a plain, fully-editable $/kWh estimate rather than a fabricated
// certificate count — verify current parameters with the Clean Energy
// Regulator before quoting a customer.
export function calculateBatteryRebateAmount({ capacityKwh, ratePerKwh }) {
  if (!capacityKwh || !ratePerKwh) return 0;
  return Math.round(capacityKwh * ratePerKwh);
}
