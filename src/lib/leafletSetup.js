import L from 'leaflet';

// leaflet-draw is a pre-ESM plugin that reads a global `L` rather than taking
// it as a module import — this module's only job is to exist as a distinct,
// dependency-free import so its side effect runs before `leaflet-draw` loads.
if (typeof window !== 'undefined') window.L = L;

export default L;
