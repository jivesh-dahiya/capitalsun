// Free OpenStreetMap Nominatim geocoding — no API key needed. Fine for a
// low-volume internal tool; a production deployment at real scale should
// self-host Nominatim or move to a paid provider per their usage policy.
export async function geocodeAddress({ addressLine, suburb, state, postcode }) {
  const query = [addressLine, suburb, state, postcode, 'Australia'].filter(Boolean).join(', ');
  if (!query || query === 'Australia') return null;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=au&q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}
