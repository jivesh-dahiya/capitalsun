// A transparent, explainable weighted score — not a trained model — so a
// salesperson can see exactly why a lead scored the way it did.
export function scoreLead({ addressLine, avgMonthlyBill, jobInterest, appointmentAt, email, mobile }) {
  let score = 0;
  const reasons = [];

  if (addressLine) { score += 25; reasons.push('Provided an address'); }
  if (avgMonthlyBill > 0) { score += 25; reasons.push('Shared their electricity bill'); }
  if (jobInterest === 'solar_battery') { score += 20; reasons.push('Interested in solar + battery'); }
  else if (jobInterest) { score += 10; }
  if (appointmentAt) { score += 20; reasons.push('Booked a site visit'); }
  if (email && mobile) { score += 10; reasons.push('Left both email and mobile'); }

  return { score: Math.min(100, score), reasons };
}
