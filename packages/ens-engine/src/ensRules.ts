/**
 * ENS Rules Engine
 * Encodes all ENS Part I & II prescriptive and mandatory requirements.
 */

import { ClimateZone } from "./climateZones";

// ── Material Recommendations ───────────────────────────────────────────────

export interface MaterialSpec {
  element: string;
  recommendation: string;
  uValue: string;
  notes: string;
}

export function getMaterialRecommendations(zone: ClimateZone): MaterialSpec[] {
  const specs: Record<ClimateZone, MaterialSpec[]> = {
    composite: [
      { element: "Walls", recommendation: "230mm fly-ash brick with lime plaster", uValue: "~1.5 W/m²K", notes: "Thermal mass helps buffer temperature swings. Whitewash exterior." },
      { element: "Roof", recommendation: "RCC slab + 50mm XPS insulation + weathering course", uValue: "~0.5 W/m²K", notes: "Must be ≤1.2 W/m²K as per ENS. Reflective white paint on top." },
      { element: "Windows", recommendation: "Double-glazed UPVC, VLT ≥0.27, SHGC 0.3–0.4", uValue: "~2.0 W/m²K", notes: "Low-e coating. Openable area ≥5% of floor area per room." },
      { element: "Floor", recommendation: "Kota stone or vitrified tiles on 75mm concrete bed", uValue: "N/A", notes: "Thermal mass at floor level. Avoid full carpet in hot months." },
      { element: "Shading", recommendation: "Horizontal overhangs 0.6–0.9m on south; 0.3–0.5m on east/west", uValue: "N/A", notes: "Critical for composite zone. Reduces cooling load 15–20%." },
    ],
    hot_dry: [
      { element: "Walls", recommendation: "Thick 350mm brick or stabilised rammed earth", uValue: "~1.0 W/m²K", notes: "High thermal mass delays peak heat by 8–12 hours. Ensures cool interiors." },
      { element: "Roof", recommendation: "Inverted mud phuska (10cm) + lime plaster OR clay tile with air gap", uValue: "~0.7 W/m²K", notes: "Traditional cool-roof technique. Highly effective in dry climate." },
      { element: "Windows", recommendation: "Small windows (5–8% WFR) with deep recesses; jali screens", uValue: "~1.8 W/m²K", notes: "West-facing windows must be minimised. Use fixed overhangs." },
      { element: "Floor", recommendation: "Kota stone or polished concrete — cool underfoot", uValue: "N/A", notes: "Avoid heat-absorbing dark tiles." },
      { element: "Shading", recommendation: "Deep verandahs all round (1.0–1.5m overhang). Internal courtyard preferred.", uValue: "N/A", notes: "Courtyard creates evaporative cooling; 3–5°C temp reduction inside." },
    ],
    warm_humid: [
      { element: "Walls", recommendation: "Aerated autoclaved concrete (AAC) blocks, 200mm", uValue: "~0.9 W/m²K", notes: "Lightweight, moisture-resistant. Encourages airflow around structure." },
      { element: "Roof", recommendation: "Mangalore/clay tiles on sloped roof with 100mm air gap", uValue: "~0.8 W/m²K", notes: "Sloped roof sheds heavy rainfall. Air gap significantly reduces heat transfer." },
      { element: "Windows", recommendation: "Large openable louvred windows (10–15% WFR), fixed fly mesh", uValue: "~3.5 W/m²K", notes: "Maximise cross-ventilation. Single-glazed acceptable in humid coastal zones." },
      { element: "Floor", recommendation: "Raised floor (150–300mm) on plinth to avoid moisture", uValue: "N/A", notes: "Prevents ground dampness ingress. Traditional Kerala-style plinth works well." },
      { element: "Shading", recommendation: "Wide eaves (1.0–1.2m) all around; avoid direct east/west sun", uValue: "N/A", notes: "Heavy monsoon rain protection. Also provides passive cooling." },
    ],
    temperate: [
      { element: "Walls", recommendation: "200mm hollow block or brick cavity wall", uValue: "~1.2 W/m²K", notes: "Mild climate — heavy insulation not critical. Cavity reduces heat/cold transfer." },
      { element: "Roof", recommendation: "RCC slab + 25mm EPS insulation (minimum)", uValue: "~0.9 W/m²K", notes: "ENS roof U-value ≤1.2 W/m²K. Temperate climate allows lighter treatment." },
      { element: "Windows", recommendation: "Single/double glazed, VLT ≥0.27; generous south-facing glazing", uValue: "~3.0 W/m²K", notes: "Take advantage of mild winters with south-facing glass for passive solar." },
      { element: "Floor", recommendation: "Ceramic tiles or natural stone — easy to keep comfortable", uValue: "N/A", notes: "Floor heating not needed. Focus on aesthetics and durability." },
      { element: "Shading", recommendation: "Adjustable/seasonal shading — deciduous plants or movable screens", uValue: "N/A", notes: "Temperate zone doesn't need permanent heavy shading." },
    ],
    cold: [
      { element: "Walls", recommendation: "Cavity wall: 230mm brick + 75mm mineral wool + 100mm inner leaf", uValue: "~0.4 W/m²K", notes: "Must achieve ≤1.3 W/m²K as per ENS cold zone mandate. Aim for 0.5 or better." },
      { element: "Roof", recommendation: "RCC slab + 100mm EPS/XPS insulation, vapour barrier below insulation", uValue: "~0.3 W/m²K", notes: "Cold zone: roof insulation is critical. Target ≤0.5 W/m²K ideally." },
      { element: "Windows", recommendation: "Double/triple glazed with low-e coating, UPVC or timber frames", uValue: "~1.5 W/m²K", notes: "Thermal break frames essential. South-facing glazing large for solar gain." },
      { element: "Floor", recommendation: "Insulated ground floor: 75mm EPS under slab + underfloor heating rough-in", uValue: "~0.5 W/m²K", notes: "Floor insulation critical in cold zone. Prepare rough-in for future heating." },
      { element: "Shading", recommendation: "South-facing overhang sized to allow winter sun but block summer sun", uValue: "N/A", notes: "Unlike other zones, maximise winter solar gain. North wall should have no windows." },
    ],
  };

  return specs[zone];
}

// ── Layout Rules ─────────────────────────────────────────────────────────

export interface LayoutRule {
  category: string;
  rule: string;
  ensClause: string;
}

export function getLayoutRules(
  zone: ClimateZone,
  opts: {
    hasElderly: boolean;
    hasHomeOffice: boolean;
    vastuPreference: boolean;
    plotFacing: string | null;
    floors: number;
  }
): LayoutRule[] {
  const rules: LayoutRule[] = [
    {
      category: "Orientation",
      rule: "Orient the building's long axis East-West to minimise east and west wall exposure to afternoon sun",
      ensClause: "ENS Part I — Sec 4.2 Building Orientation",
    },
    {
      category: "Ventilation",
      rule: "Each habitable room must have openable windows ≥5% of that room's floor area (Window-to-Floor Ratio)",
      ensClause: "ENS Part I — Sec 4.3 Openable Window-to-Floor Area Ratio",
    },
    {
      category: "Daylighting",
      rule: "All windows must achieve Visible Light Transmittance (VLT) ≥0.27",
      ensClause: "ENS Part I — Sec 4.4 Visible Light Transmittance",
    },
    {
      category: "Room Placement",
      rule: "Place living room on South or South-East — best natural light and winter warmth",
      ensClause: "ENS Best Practice — passive solar design",
    },
    {
      category: "Room Placement",
      rule: "Bedrooms on East side — morning sunlight, cooler afternoons in summer",
      ensClause: "ENS Best Practice",
    },
    {
      category: "Room Placement",
      rule: "Kitchen on East or South-East — morning sun, good cross-ventilation, avoid hot west wall",
      ensClause: "ENS Best Practice",
    },
    {
      category: "Room Placement",
      rule: "Wet areas (bathrooms, utility) on North or West — use as buffer against heat/cold",
      ensClause: "ENS Best Practice",
    },
  ];

  // Zone-specific rules
  if (zone === "hot_dry") {
    rules.push(
      { category: "Passive Cooling", rule: "Consider internal courtyard — creates natural evaporative cooling, reducing indoor temperature 3–5°C", ensClause: "ENS Annex D — Improved Air Cooling" },
      { category: "Shading", rule: "All west-facing openings must have deep permanent overhangs or be eliminated", ensClause: "ENS Part I — Sec 4.2" }
    );
  }
  if (zone === "warm_humid") {
    rules.push(
      { category: "Ventilation", rule: "Design for unobstructed cross-ventilation paths through entire floor plan — humid climates depend on airflow", ensClause: "ENS Annex D" },
      { category: "Structure", rule: "Raise ground floor plinth 300–450mm to prevent moisture ingress from heavy monsoon rainfall", ensClause: "ENS Best Practice" }
    );
  }
  if (zone === "cold") {
    rules.push(
      { category: "Passive Solar", rule: "South wall should have 15–20% glazing ratio for passive solar heating. Use thermal mass (concrete/brick) inside to store daytime heat", ensClause: "ENS Part I — Cold Zone" },
      { category: "Air Sealing", rule: "All junctions (wall-roof, wall-floor, window frames) must be sealed against air infiltration", ensClause: "ENS Cold Zone — Sec 4.1" }
    );
  }
  if (zone === "composite") {
    rules.push(
      { category: "Shading", rule: "South-facing overhang depth = 0.6× window height. Blocks summer sun (high angle) but allows winter sun (low angle)", ensClause: "ENS Part I — Sec 4.2" }
    );
  }

  // Special requirements
  if (opts.hasElderly) {
    rules.push(
      { category: "Accessibility", rule: "Provide ground-floor bedroom with attached bathroom. Wider door openings (900mm min). No split-level at entrance", ensClause: "Universal Design — NBC 2016" }
    );
  }
  if (opts.hasHomeOffice) {
    rules.push(
      { category: "Work Space", rule: "Dedicate a North-facing room for home office — north light is even, glare-free, and ideal for screen work", ensClause: "ENS Daylighting Best Practice" }
    );
  }
  if (opts.vastuPreference) {
    rules.push(
      { category: "Vastu", rule: "Main entrance on East or North face. Master bedroom South-West. Kitchen South-East. Avoid bedroom in North-East corner", ensClause: "Vastu Shastra — traditional alignment" }
    );
  }

  return rules;
}

// ── Thermal Comfort Estimate ──────────────────────────────────────────────

export interface ThermalEstimate {
  outdoorMax: number;
  indoorWithENS: number;
  indoorWithoutENS: number;
  savingDegrees: number;
  coolingLoadReduction: string;
}

export function estimateThermalComfort(zone: ClimateZone, outdoorMax: number): ThermalEstimate {
  const reductions: Record<ClimateZone, number> = {
    hot_dry: 9, composite: 7, warm_humid: 5, temperate: 4, cold: 6,
  };
  const reduction = reductions[zone];
  const indoorWithENS = Math.round(outdoorMax - reduction);
  const indoorWithoutENS = Math.round(outdoorMax - 2); // minimal design

  return {
    outdoorMax,
    indoorWithENS,
    indoorWithoutENS,
    savingDegrees: reduction - 2,
    coolingLoadReduction: `${Math.round((reduction / outdoorMax) * 100)}% less cooling energy needed`,
  };
}
