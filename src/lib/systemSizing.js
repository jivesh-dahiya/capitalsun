import { STATE_YIELD_KWH_PER_KW } from './solarProduction';

// A quick ballpark size from a stated electricity bill, for early qualification
// before a real site assessment. Both constants are explicit, editable
// assumptions, not measured data — an average retail electricity price and a
// target percentage of usage to offset.
const ASSUMED_PRICE_PER_KWH = 0.3;
const TARGET_OFFSET = 0.8;
const MIN_SYSTEM_KW = 1.5;
const MAX_SYSTEM_KW = 15;

export function estimateSystemSizeKw({ avgMonthlyBill, state }) {
  if (!avgMonthlyBill || avgMonthlyBill <= 0) return null;
  const annualKwh = (avgMonthlyBill / ASSUMED_PRICE_PER_KWH) * 12;
  const yieldPerKw = STATE_YIELD_KWH_PER_KW[state] ?? 1500;
  const rawKw = (annualKwh * TARGET_OFFSET) / yieldPerKw;
  const rounded = Math.round(rawKw * 2) / 2;
  return Math.min(MAX_SYSTEM_KW, Math.max(MIN_SYSTEM_KW, rounded));
}
