export type PathwayId = "reduce" | "maintain" | "increase";

export type LatLon = { lat: number; lon: number };

export type Station = {
  id: string;
  name: string;
  short: string;
  area: string;
  lat: number;
  lon: number;
  note: string;
  /** How hard extra heat hits this ground. 1 is typical. */
  exposure: number;
  /** How much the ground depends on sea ice. */
  iceDependence: number;
  mpa: string;
};

export type Metrics = {
  sst: number;
  ice: number;
  krill: number;
  chl: number;
  biodiversity: number;
  stress: number;
  salpRatio: number;
  fisheryRisk: number;
  mpaBuffer: number;
};

export type Brief = {
  headline: string;
  narrative: string;
  consequences: string[];
  uncertainty: string;
  decisions: string[];
};

export const PATHWAYS: {
  id: PathwayId;
  label: string;
  ssp: string;
  blurb: string;
}[] = [
  {
    id: "reduce",
    label: "Reduce",
    ssp: "SSP1-2.6 shape",
    blurb: "Fossil use falls hard. The ocean still warms, then the pace eases.",
  },
  {
    id: "maintain",
    label: "Maintain",
    ssp: "SSP2-4.5 shape",
    blurb: "Close to today's policy path. Heat and ice loss keep adding up.",
  },
  {
    id: "increase",
    label: "Increase",
    ssp: "SSP5-8.5 shape",
    blurb: "Fossil use keeps climbing. The harshest sketch in this tool.",
  },
];

export const STATIONS: Station[] = [
  {
    id: "bransfield",
    name: "Bransfield Strait",
    short: "Bransfield",
    area: "CCAMLR 48.1 · Antarctic Peninsula",
    lat: -63.2,
    lon: -59.5,
    note: "The busy corner of the krill fishery. Most recent catch has come from the Peninsula and the Scotia Sea.",
    exposure: 1.18,
    iceDependence: 0.85,
    mpa: "No CCAMLR MPA here. Catch is managed with limits and the Area 48 trigger.",
  },
  {
    id: "orkney",
    name: "South Orkney Islands",
    short: "S. Orkney",
    area: "CCAMLR 48.2 · southern shelf MPA",
    lat: -60.6,
    lon: -45.5,
    note: "The South Orkney Islands southern shelf was CCAMLR's first marine protected area, adopted in 2009.",
    exposure: 1.06,
    iceDependence: 0.92,
    mpa: "South Orkney Islands southern shelf MPA (adopted 2009).",
  },
  {
    id: "georgia",
    name: "South Georgia",
    short: "S. Georgia",
    area: "CCAMLR 48.3 · Scotia Sea",
    lat: -54.6,
    lon: -36.7,
    note: "Northern edge of where krill usually swarm. Warm years already favor salps over krill here.",
    exposure: 1.3,
    iceDependence: 0.5,
    mpa: "No CCAMLR MPA. South Georgia has its own national marine protections.",
  },
  {
    id: "weddell",
    name: "Weddell Sea",
    short: "Weddell",
    area: "CCAMLR 48.5 · proposed refuge",
    lat: -68.4,
    lon: -44.0,
    note: "A cold shelf often discussed as a refuge if the Peninsula keeps heating. The MPA is still a proposal.",
    exposure: 0.8,
    iceDependence: 1.18,
    mpa: "Weddell Sea MPA proposed to CCAMLR. Not adopted.",
  },
  {
    id: "ross",
    name: "Ross Sea",
    short: "Ross Sea",
    area: "CCAMLR 88.1 · Region MPA",
    lat: -70.2,
    lon: 176.5,
    note: "The Ross Sea region MPA is the largest in the world, about 1.55 million km², in force since December 2017.",
    exposure: 0.9,
    iceDependence: 1.38,
    mpa: "Ross Sea region MPA (adopted 2016, in force 2017).",
  },
  {
    id: "east",
    name: "East Antarctic shelf",
    short: "East Antarctica",
    area: "CCAMLR 58 · proposed system",
    lat: -65.8,
    lon: 82.0,
    note: "Krill are patchier here than in the southwest Atlantic. A multi-block MPA system has been proposed.",
    exposure: 0.86,
    iceDependence: 1.08,
    mpa: "East Antarctic MPA proposed to CCAMLR. Not adopted.",
  },
];

type Knot = { y: number; sst: number; ice: number; krill: number; chl: number };

/** Illustrated Southern Ocean sketches. Not FishCast model output. */
const KNOTS: Record<PathwayId, Knot[]> = {
  reduce: [
    { y: 2025, sst: 0.4, ice: 5, krill: 100, chl: 100 },
    { y: 2035, sst: 0.55, ice: 9, krill: 95, chl: 98 },
    { y: 2050, sst: 0.74, ice: 14, krill: 89, chl: 94 },
    { y: 2075, sst: 0.68, ice: 12, krill: 91, chl: 96 },
    { y: 2100, sst: 0.6, ice: 10, krill: 93, chl: 98 },
  ],
  maintain: [
    { y: 2025, sst: 0.4, ice: 6, krill: 100, chl: 100 },
    { y: 2035, sst: 0.72, ice: 15, krill: 91, chl: 95 },
    { y: 2050, sst: 1.08, ice: 30, krill: 79, chl: 87 },
    { y: 2075, sst: 1.42, ice: 42, krill: 69, chl: 79 },
    { y: 2100, sst: 1.72, ice: 54, krill: 60, chl: 73 },
  ],
  increase: [
    { y: 2025, sst: 0.45, ice: 7, krill: 99, chl: 99 },
    { y: 2035, sst: 0.95, ice: 22, krill: 85, chl: 89 },
    { y: 2050, sst: 1.6, ice: 50, krill: 66, chl: 74 },
    { y: 2075, sst: 2.35, ice: 78, krill: 48, chl: 60 },
    { y: 2100, sst: 3.05, ice: 102, krill: 34, chl: 48 },
  ],
};

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function sample(knots: Knot[], year: number): Knot {
  const y = clamp(year, knots[0].y, knots[knots.length - 1].y);
  let i = 0;
  while (i < knots.length - 2 && knots[i + 1].y < y) i++;
  const a = knots[i];
  const b = knots[i + 1];
  const t = (y - a.y) / (b.y - a.y || 1);
  return {
    y,
    sst: a.sst + (b.sst - a.sst) * t,
    ice: a.ice + (b.ice - a.ice) * t,
    krill: a.krill + (b.krill - a.krill) * t,
    chl: a.chl + (b.chl - a.chl) * t,
  };
}

export function metricsAt(pathway: PathwayId, year: number, station: Station): Metrics {
  const b = sample(KNOTS[pathway], year);
  const sst = 0.35 + (b.sst - 0.35) * (0.72 + 0.28 * station.exposure);
  const ice = b.ice * (0.62 + 0.38 * station.iceDependence) * (0.82 + 0.18 * station.exposure);
  const krillDrop = (100 - b.krill) * (0.75 + 0.25 * station.exposure) * (0.82 + 0.18 * station.iceDependence);
  const krill = clamp(100 - krillDrop, 8, 104);
  const stress = clamp((sst - 0.32) / 2.7 * 0.52 + ice / 120 * 0.28 + (100 - krill) / 100 * 0.38, 0, 1);
  const biodiversity = clamp(96 - stress * 70 - (station.exposure - 1) * 10, 10, 98);
  const salpRatio = clamp(0.18 + stress * 1.65 * station.exposure, 0.12, 3.4);
  const fisheryHot = station.id === "bransfield" || station.id === "georgia" || station.id === "orkney";
  const fisheryRisk = clamp(stress * (fisheryHot ? 108 : 72), 4, 99);
  const baseShelter = station.mpa.includes("proposed") ? 38 : station.mpa.startsWith("No") ? 20 : 74;
  const mpaBuffer = clamp(baseShelter * (1 - stress * 0.48), 6, 92);
  const chl = clamp(b.chl - (station.exposure - 1) * 10 - stress * 6, 28, 104);
  return { sst, ice, krill, chl, biodiversity, stress, salpRatio, fisheryRisk, mpaBuffer };
}

export function stationById(id: string | null | undefined): Station {
  return STATIONS.find((s) => s.id === id) ?? STATIONS[0];
}

export function angularDeg(a: LatLon, b: LatLon) {
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const dλ = ((b.lon - a.lon) * Math.PI) / 180;
  const c = Math.sin(φ1) * Math.sin(φ2) + Math.cos(φ1) * Math.cos(φ2) * Math.cos(dλ);
  return (Math.acos(clamp(c, -1, 1)) * 180) / Math.PI;
}

export function nearestStation(lat: number, lon: number) {
  let best = STATIONS[0];
  let deg = Infinity;
  for (const s of STATIONS) {
    const d = angularDeg({ lat, lon }, s);
    if (d < deg) {
      best = s;
      deg = d;
    }
  }
  return { station: best, deg, nm: deg * 60 };
}

export function krillSeries(station: Station) {
  const rows: { year: string; Reduce: number; Maintain: number; Increase: number }[] = [];
  for (let y = 2025; y <= 2100; y += 5) {
    rows.push({
      year: String(y),
      Reduce: Math.round(metricsAt("reduce", y, station).krill),
      Maintain: Math.round(metricsAt("maintain", y, station).krill),
      Increase: Math.round(metricsAt("increase", y, station).krill),
    });
  }
  return rows;
}

export function latLonToVec(latDeg: number, lonDeg: number, r: number) {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (lonDeg * Math.PI) / 180;
  return {
    x: r * Math.cos(lat) * Math.cos(lon),
    y: r * Math.sin(lat),
    z: r * Math.cos(lat) * Math.sin(lon),
  };
}

export function vecToLatLon(x: number, y: number, z: number) {
  const r = Math.hypot(x, y, z) || 1;
  return {
    lat: (Math.asin(clamp(y / r, -1, 1)) * 180) / Math.PI,
    lon: (Math.atan2(z, x) * 180) / Math.PI,
  };
}

/** Polar chart: south pole at center, lon 0 toward the top, east to the right. */
export function projectChart(lat: number, lon: number) {
  const t = (lat - -78) / (-50 - -78);
  const radius = 22 + clamp(t, -0.05, 1.08) * 70;
  const a = (lon * Math.PI) / 180;
  return { x: 100 + radius * Math.sin(a), y: 100 - radius * Math.cos(a), radius };
}

export function unprojectChart(x: number, y: number): LatLon | null {
  const dx = x - 100;
  const dy = y - 100;
  const radius = Math.hypot(dx, dy);
  const t = (radius - 22) / 70;
  if (t < 0 || t > 1) return null;
  const lat = -78 + t * 28;
  const lon = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return { lat, lon };
}

export function fmt(n: number, digits = 1) {
  return n.toFixed(digits);
}

export const FISHCAST_NOTE =
  "FishCast, a Georgia Tech Big Data Big Impact project, asks whether Gaussian-process and sequence models can predict Antarctic krill (Euphausia superba) on years they have not seen, especially near CCAMLR marine protected areas. On 2004–2016 test years, only models that use recent catches beat a constant baseline, by about 5%. No climate-only model has shown skill yet. Runs from before 27 September 2026 were invalidated by a preprocessing fix. FutureTide does not run those models. The dial is an illustrated workshop scenario.";
