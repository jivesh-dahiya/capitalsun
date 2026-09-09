// Australian GST is a flat 10%. When a price is already GST-inclusive (the
// convention used everywhere in this app's pricing), the GST component is
// exactly total ÷ 11 — the standard, government-mandated formula, not an
// approximation.
export const GST_RATE = 0.1;

export function gstFromInclusive(totalIncl) {
  if (!totalIncl) return 0;
  return Math.round((totalIncl / 11) * 100) / 100;
}

export function exGstFromInclusive(totalIncl) {
  if (!totalIncl) return 0;
  return Math.round((totalIncl - totalIncl / 11) * 100) / 100;
}
