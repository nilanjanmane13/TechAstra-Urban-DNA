// demoData.js
// -----------------------------------------------------------------------------
// Generates believable, INTERNALLY CONSISTENT demo urban stats for any
// lat/lng on the planet. This is the "random database for demo" the frontend
// calls into whenever the user clicks a spot on the map that isn't one of the
// few hand-authored Pune zones. Same coordinates -> same numbers every time
// (seeded PRNG), so it behaves like real backed data even though it's synthetic.
// -----------------------------------------------------------------------------

const ROAD_PREFIXES = [
  'MG', 'Station', 'Ring', 'College', 'Market', 'Canal', 'Park', 'Hill',
  'River', 'Central', 'North', 'South', 'East', 'West', 'Old', 'New',
];
const ROAD_SUFFIXES = ['Road', 'Street', 'Avenue', 'Marg', 'Highway', 'Lane'];

// Simple deterministic hash -> 32-bit int
function hashCoord(lat, lng) {
  const s = `${lat.toFixed(4)}:${lng.toFixed(4)}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Mulberry32 seeded PRNG - deterministic, fast, good enough for demo data.
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}
function range(rng, min, max) {
  return min + rng() * (max - min);
}

const TRAFFIC_BANDS = [
  { max: 30, label: 'Free flow', tone: 'good' },
  { max: 55, label: 'Moderate', tone: 'warn' },
  { max: 80, label: 'Heavy', tone: 'danger' },
  { max: 101, label: 'Critical', tone: 'danger' },
];
function bandFor(pct) {
  return TRAFFIC_BANDS.find((b) => pct <= b.max) || TRAFFIC_BANDS[TRAFFIC_BANDS.length - 1];
}

export function generateCellData(lat, lng) {
  const rng = mulberry32(hashCoord(lat, lng));

  const congestion = Math.round(range(rng, 8, 98)); // 0-100
  const band = bandFor(congestion);
  const avgSpeed = Math.round(range(rng, 8, 58) - congestion * 0.25);
  const vehiclesPerMin = Math.round(range(rng, 120, 1400));
  const travelDelta = Math.round(range(rng, 2, 55));
  const aqi = Math.round(range(rng, 35, 210));
  const capacity = Math.round(range(rng, 40, 96));

  const roadName = `${pick(rng, ROAD_PREFIXES)} ${pick(rng, ROAD_SUFFIXES)}`;

  // A short synthetic "selected corridor" path near the click point.
  const bearing = range(rng, 0, Math.PI * 2);
  const len = range(rng, 0.0035, 0.008); // ~350m-800m
  const dx = Math.cos(bearing) * len;
  const dy = Math.sin(bearing) * len;
  const mainPath = [
    { lat: lat - dy / 2, lng: lng - dx / 2 },
    { lat, lng },
    { lat: lat + dy / 2, lng: lng + dx / 2 },
  ];

  // Alternate route: offset perpendicular to the main corridor, slightly
  // longer, with its own (independently seeded) congestion figure - this is
  // what renders as the dashed "alternate route" after a click.
  const rng2 = mulberry32(hashCoord(lat + 0.0009, lng - 0.0009));
  const perpBearing = bearing + Math.PI / 2;
  const offset = range(rng2, 0.0015, 0.0032);
  const ox = Math.cos(perpBearing) * offset;
  const oy = Math.sin(perpBearing) * offset;
  const altCongestion = Math.max(5, Math.round(congestion - range(rng2, 15, 45)));
  const altPath = [
    { lat: lat - dy / 2 + oy, lng: lng - dx / 2 + ox },
    { lat: lat + oy * 0.6, lng: lng + ox * 0.6 },
    { lat: lat + dy / 2 + oy, lng: lng + dx / 2 + ox },
  ];

  return {
    roadName,
    congestion,
    trafficLabel: band.label,
    trafficTone: band.tone,
    avgSpeed: Math.max(4, avgSpeed),
    vehiclesPerMin,
    travelDelta,
    aqi,
    capacity,
    mainPath,
    altPath,
    altCongestion,
    altLabel: bandFor(altCongestion).label,
    altTimeSavedPct: Math.max(1, Math.round(congestion - altCongestion)),
  };
}
