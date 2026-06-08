/**
 * ENS Climate Zone Detection
 * Based on Eco Niwas Samhita Part I — Bureau of Energy Efficiency, GoI
 *
 * India has 5 ENS climate zones:
 *   composite   — Delhi, UP, MP, Haryana, Punjab, Bihar, Jharkhand
 *   hot_dry     — Rajasthan, Gujarat (inland), parts of AP & Telangana
 *   warm_humid  — Coastal Kerala, Tamil Nadu, Karnataka, Maharashtra, AP, Odisha, WB, NE India
 *   temperate   — Bengaluru plateau, Pune, parts of Maharashtra & Karnataka
 *   cold        — Himachal, Uttarakhand hills, J&K, Ladakh, Sikkim, Arunachal
 */

export type ClimateZone = "composite" | "hot_dry" | "warm_humid" | "temperate" | "cold";

export interface ClimateZoneInfo {
  zone: ClimateZone;
  label: string;
  description: string;
  maxRETVWm2: number;        // W/m² — RETV limit for non-roof envelope
  maxRoofUValue: number;     // W/m²·K — U-value limit for roof
  maxWallUValue: number | null; // null = use RETV instead
  exampleCities: string[];
  thermalStrategy: string;
  color: string;
}

export const ZONE_INFO: Record<ClimateZone, ClimateZoneInfo> = {
  composite: {
    zone: "composite",
    label: "Composite",
    description: "Hot summers, cold winters, moderate humidity. Wide temperature swing.",
    maxRETVWm2: 12,
    maxRoofUValue: 1.2,
    maxWallUValue: null,
    exampleCities: ["Delhi", "Lucknow", "Nagpur", "Bhopal", "Patna", "Kanpur"],
    thermalStrategy: "Insulate roof heavily. East-West long axis to minimize east/west exposure. Cross-ventilation for summer; thermal mass for winter.",
    color: "#f59e0b",
  },
  hot_dry: {
    zone: "hot_dry",
    label: "Hot & Dry",
    description: "Very hot summers, minimal rainfall, low humidity. High solar radiation.",
    maxRETVWm2: 12,
    maxRoofUValue: 1.2,
    maxWallUValue: null,
    exampleCities: ["Jaipur", "Ahmedabad", "Hyderabad", "Jodhpur", "Bikaner"],
    thermalStrategy: "Thick high-mass walls (brick/earth). Small deep-set windows. Courtyard design. Cool roof with reflective coating. Avoid west-facing glazing.",
    color: "#ef4444",
  },
  warm_humid: {
    zone: "warm_humid",
    label: "Warm & Humid",
    description: "High humidity year-round, warm temperatures, heavy rainfall.",
    maxRETVWm2: 12,
    maxRoofUValue: 1.2,
    maxWallUValue: null,
    exampleCities: ["Mumbai", "Chennai", "Kochi", "Thiruvananthapuram", "Kolkata", "Guwahati"],
    thermalStrategy: "Maximize cross-ventilation. Lightweight walls for quick heat release. Sloped roof for drainage. Deep overhangs. Raise floor to avoid dampness.",
    color: "#3b82f6",
  },
  temperate: {
    zone: "temperate",
    label: "Temperate",
    description: "Mild temperatures year-round, moderate rainfall. Most comfortable zone.",
    maxRETVWm2: 12,
    maxRoofUValue: 1.2,
    maxWallUValue: null,
    exampleCities: ["Bengaluru", "Pune", "Mysuru", "Ooty", "Coorg", "Shillong"],
    thermalStrategy: "Natural ventilation works well year-round. Moderate insulation. South-facing rooms for winter warmth. Lighter construction acceptable.",
    color: "#22c55e",
  },
  cold: {
    zone: "cold",
    label: "Cold",
    description: "Cold winters, short summers, high altitude. Heating is primary concern.",
    maxRETVWm2: 999,           // not applicable — use U-value instead
    maxRoofUValue: 1.2,
    maxWallUValue: 1.3,        // W/m²·K — mandatory for cold zone
    exampleCities: ["Srinagar", "Shimla", "Dehradun", "Leh", "Gangtok", "Darjeeling"],
    thermalStrategy: "Maximum insulation on all surfaces. South-facing glazing for passive solar gain. Minimal north openings. Double/triple glazing. Thermal breaks in structure.",
    color: "#6366f1",
  },
};

// ── Zone lookup table by state / lat-lng ──────────────────────────────────

interface ZoneRegion {
  zone: ClimateZone;
  // Bounding box: [minLat, maxLat, minLng, maxLng]
  bounds: [number, number, number, number];
  // Optional: additional condition function
  condition?: (lat: number, lng: number) => boolean;
}

/**
 * Simplified India climate zone regions based on ENS Part I zone map.
 * Listed in priority order (more specific regions first).
 */
const ZONE_REGIONS: ZoneRegion[] = [
  // ── COLD: Himalayan states & high-altitude regions ──────────────────
  { zone: "cold", bounds: [34, 37, 74, 80] },   // J&K, Ladakh
  { zone: "cold", bounds: [30, 34, 76, 82] },   // Himachal Pradesh, Uttarakhand hills
  { zone: "cold", bounds: [26, 30, 88, 97] },   // Sikkim, Arunachal Pradesh

  // ── HOT & DRY: Rajasthan, inland Gujarat, parts of AP ───────────────
  { zone: "hot_dry", bounds: [24, 30, 69, 77] },   // Rajasthan
  { zone: "hot_dry", bounds: [20, 25, 68, 74] },   // Gujarat inland
  { zone: "hot_dry", bounds: [15, 20, 76, 80],     // Telangana / N. AP
    condition: (lat, lng) => lng < 79 },

  // ── WARM & HUMID: Coastal and northeastern ─────────────────────────
  { zone: "warm_humid", bounds: [8, 15, 74, 80] },    // Kerala, coastal TN, coastal Karnataka
  { zone: "warm_humid", bounds: [15, 22, 80, 88] },   // Coastal AP, Odisha, coastal WB
  { zone: "warm_humid", bounds: [20, 23, 86, 90] },   // West Bengal coast
  { zone: "warm_humid", bounds: [22, 28, 88, 97] },   // NE India (Assam, Meghalaya, etc.)
  { zone: "warm_humid", bounds: [15, 21, 72, 75],     // Coastal Maharashtra, Goa
    condition: (lat, lng) => lng < 74.5 },

  // ── TEMPERATE: Deccan plateau ────────────────────────────────────────
  { zone: "temperate", bounds: [12, 16, 74, 80] },    // Bengaluru plateau, parts of Karnataka
  { zone: "temperate", bounds: [17, 21, 73, 78] },    // Pune, parts of Maharashtra

  // ── COMPOSITE: Default — rest of India (UP, MP, Bihar, etc.) ─────────
  { zone: "composite", bounds: [18, 32, 72, 97] },
];

/**
 * Detect ENS climate zone from latitude and longitude.
 * Falls back to "composite" if no specific zone matches.
 */
export function detectClimateZone(lat: number, lng: number): ClimateZone {
  // Must be within India bounds
  if (lat < 6 || lat > 38 || lng < 68 || lng > 98) {
    return "composite"; // fallback for out-of-India coords
  }

  for (const region of ZONE_REGIONS) {
    const [minLat, maxLat, minLng, maxLng] = region.bounds;
    if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
      if (!region.condition || region.condition(lat, lng)) {
        return region.zone;
      }
    }
  }

  return "composite";
}

/**
 * Get full zone info object for a detected zone.
 */
export function getZoneInfo(zone: ClimateZone): ClimateZoneInfo {
  return ZONE_INFO[zone];
}

/**
 * Calculate minimum ENS score target based on building type.
 */
export function getENSTarget(buildingType: "low_rise" | "affordable" | "high_rise"): number {
  return { low_rise: 47, affordable: 70, high_rise: 100 }[buildingType];
}
