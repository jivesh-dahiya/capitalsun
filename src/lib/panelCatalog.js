// A curated shortlist of panel manufacturers with well-established
// residential market presence in Australia, used to surface a "Popular
// panels" shortcut in the design tool's panel search. This is a fixed
// reference list, not live sales-ranking data from any distributor.
export const POPULAR_PANEL_BRAND_KEYWORDS = [
  'JINKO', 'TRINA', 'LONGI', 'JA SOLAR', 'CANADIAN SOLAR', 'REC', 'Q CELLS', 'QCELLS',
  'HYUNDAI', 'RISEN', 'AIKO', 'TINDO',
];

function normalize(name) {
  return (name ?? '').toUpperCase();
}

export function isPopularPanel(model) {
  const manufacturer = normalize(model.manufacturers?.name);
  return POPULAR_PANEL_BRAND_KEYWORDS.some((kw) => manufacturer.includes(kw));
}
