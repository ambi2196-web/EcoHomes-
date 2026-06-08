/**
 * ENS Scoring Engine — Full point calculator
 * Based on ENS Part II (2021) — Bureau of Energy Efficiency, GoI
 *
 * Score structure (Table 2 & 3 from ENS Part II):
 *   Building Envelope          47 mandatory + 40 additional = 87 max
 *   Common Area Lighting        3 mandatory +  6 additional =  9 max
 *   Elevators                  13 mandatory +  9 additional = 22 max
 *   Pumps                       6 mandatory +  8 additional = 14 max
 *   Electrical Systems          1 mandatory +  5 additional =  6 max
 *   Indoor Lighting            12 mandatory                 = 12 max
 *   Comfort Systems            50 mandatory                 = 50 max
 *   Renewable Energy (bonus)   20 (10 solar hot water + 10 PV)
 *   ─────────────────────────────────────────────────────────────
 *   Total possible: 220 pts
 */

import { ClimateZone } from "./climateZones";

export interface ENSScoringInput {
  // Building basics
  buildingType: "low_rise" | "affordable" | "high_rise";
  plotAreaSqm: number;
  floors: number;
  climateZone: ClimateZone;

  // Envelope
  wallUValue: number;         // W/m²K — calculated from chosen material
  roofUValue: number;         // W/m²K
  retv: number;               // W/m² Residential Envelope Transmittance Value
  windowVLT: number;          // 0–1 — Visible Light Transmittance
  openableWFR: number;        // % — Openable Window-to-Floor Ratio
  hasOverhangs: boolean;

  // Services
  hasHighEfficacyLighting: boolean;   // ≥105 lm/W
  hasAutoLightControls: boolean;      // occupancy/photo sensors
  hasElevator: boolean;
  hasRegenerativeLift: boolean;
  hasBEE5StarPumps: boolean;
  hasVFDPumps: boolean;
  powerFactor: number;         // 0–1 (target ≥0.97)
  distributionLossPercent: number; // % (target ≤3%)

  // Indoor
  hasLEDLighting: boolean;
  hasCeilingFanStarRating: number;  // 1–5 BEE stars
  acStarRating: number;             // 1–5 BEE stars (0 = no AC)
  hasSolarHotWater: boolean;
  hasSolarPV: boolean;
}

export interface ENSScoreCategory {
  name: string;
  mandatory: number;
  additional: number;
  maxMandatory: number;
  maxAdditional: number;
  maxTotal: number;
  items: { label: string; points: number; achieved: boolean; clause: string }[];
}

export interface ENSScoreResult {
  total: number;
  target: number;
  compliant: boolean;
  categories: ENSScoreCategory[];
  mandatoryChecklist: { requirement: string; met: boolean; clause: string }[];
  grade: "Non-Compliant" | "Compliant" | "Good" | "Excellent";
  energySavingPercent: number;
}

const TARGETS = { low_rise: 47, affordable: 70, high_rise: 100 };

export function calculateENSScore(input: ENSScoringInput): ENSScoreResult {
  const categories: ENSScoreCategory[] = [];

  // ── 1. Building Envelope ────────────────────────────────────────────
  const envelopeItems = [
    {
      label: "RETV ≤ 12 W/m² (or cold zone U-wall ≤ 1.3)",
      points: 25,
      achieved: input.climateZone === "cold" ? input.wallUValue <= 1.3 : input.retv <= 12,
      clause: "ENS Part I — Sec 4.1 & 5.1.2",
    },
    {
      label: "Roof U-value ≤ 1.2 W/m²K",
      points: 12,
      achieved: input.roofUValue <= 1.2,
      clause: "ENS Part I — Sec 5.1.3",
    },
    {
      label: "Openable Window-to-Floor Ratio ≥ 5%",
      points: 5,
      achieved: input.openableWFR >= 5,
      clause: "ENS Part I — Sec 4.3",
    },
    {
      label: "Window VLT ≥ 0.27",
      points: 5,
      achieved: input.windowVLT >= 0.27,
      clause: "ENS Part I — Sec 4.4",
    },
    // Additional points
    {
      label: "RETV ≤ 8 W/m² (additional — better insulation)",
      points: 15,
      achieved: input.retv <= 8,
      clause: "ENS Part I — Additional Sec 6.4",
    },
    {
      label: "Roof U-value ≤ 0.8 W/m²K (additional)",
      points: 10,
      achieved: input.roofUValue <= 0.8,
      clause: "ENS Part I — Additional",
    },
    {
      label: "Overhangs/shading devices on east/west/south (additional)",
      points: 8,
      achieved: input.hasOverhangs,
      clause: "ENS Part I — Shading",
    },
    {
      label: "WFR ≥ 10% (additional — better daylighting)",
      points: 7,
      achieved: input.openableWFR >= 10,
      clause: "ENS Part I — Additional",
    },
  ];
  const mandatoryEnvelope = envelopeItems.slice(0, 4).reduce((s, i) => s + (i.achieved ? i.points : 0), 0);
  const additionalEnvelope = envelopeItems.slice(4).reduce((s, i) => s + (i.achieved ? i.points : 0), 0);
  categories.push({
    name: "Building Envelope",
    mandatory: mandatoryEnvelope, additional: additionalEnvelope,
    maxMandatory: 47, maxAdditional: 40, maxTotal: 87,
    items: envelopeItems,
  });

  // ── 2. Common Area & Exterior Lighting ─────────────────────────────
  const lightingItems = [
    { label: "Common area LPD ≤ 3.0 W/m² (corridors) & lamp efficacy ≥ 105 lm/W", points: 3, achieved: input.hasHighEfficacyLighting, clause: "ENS Part II — Sec 5.2, Table 4" },
    { label: "Exterior lighting with photo sensor / astronomical time switch (additional)", points: 3, achieved: input.hasAutoLightControls, clause: "ENS Part II — Sec 5.2.3" },
    { label: "Basement lighting LPD ≤ 1.0 W/m² (additional)", points: 3, achieved: input.hasHighEfficacyLighting && input.hasAutoLightControls, clause: "ENS Part II — Table 4" },
  ];
  const mandatoryLighting = lightingItems.slice(0, 1).reduce((s, i) => s + (i.achieved ? i.points : 0), 0);
  const additionalLighting = lightingItems.slice(1).reduce((s, i) => s + (i.achieved ? i.points : 0), 0);
  categories.push({
    name: "Common Area Lighting",
    mandatory: mandatoryLighting, additional: additionalLighting,
    maxMandatory: 3, maxAdditional: 6, maxTotal: 9,
    items: lightingItems,
  });

  // ── 3. Elevators ────────────────────────────────────────────────────
  if (input.hasElevator) {
    const liftItems = [
      { label: "High efficacy lift car lighting ≥ 85 lm/W", points: 3, achieved: input.hasHighEfficacyLighting, clause: "ENS Part II — Sec 5.3 (i)" },
      { label: "Auto switch-off for lift car lights/fan when unoccupied", points: 3, achieved: input.hasAutoLightControls, clause: "ENS Part II — Sec 5.3 (ii)" },
      { label: "IE4 high-efficiency motors", points: 4, achieved: input.floors > 2, clause: "ENS Part II — Sec 5.3 (iii)" },
      { label: "Variable voltage & frequency drives (VVVF)", points: 3, achieved: input.floors > 3, clause: "ENS Part II — Sec 5.3 (iv)" },
      { label: "Regenerative drive (additional)", points: 5, achieved: input.hasRegenerativeLift, clause: "ENS Part II — Sec 5.3 (v)" },
      { label: "Group automatic supervisory control (additional)", points: 4, achieved: input.floors > 5, clause: "ENS Part II — Sec 5.3 (vi)" },
    ];
    const mandatoryLift = liftItems.slice(0, 4).reduce((s, i) => s + (i.achieved ? i.points : 0), 0);
    const additionalLift = liftItems.slice(4).reduce((s, i) => s + (i.achieved ? i.points : 0), 0);
    categories.push({
      name: "Elevators",
      mandatory: mandatoryLift, additional: additionalLift,
      maxMandatory: 13, maxAdditional: 9, maxTotal: 22,
      items: liftItems,
    });
  }

  // ── 4. Pumps ────────────────────────────────────────────────────────
  const pumpItems = [
    { label: "BEE 5-star rated pumps OR hydro-pneumatic ≥70% efficiency", points: 6, achieved: input.hasBEE5StarPumps, clause: "ENS Part II — Sec 5.4" },
    { label: "Variable frequency drives on pumps (additional)", points: 5, achieved: input.hasVFDPumps, clause: "ENS Part II — Additional" },
    { label: "Smart pump controls with pressure sensors (additional)", points: 3, achieved: input.hasVFDPumps && input.hasBEE5StarPumps, clause: "ENS Part II — Additional" },
  ];
  const mandatoryPumps = pumpItems.slice(0, 1).reduce((s, i) => s + (i.achieved ? i.points : 0), 0);
  const additionalPumps = pumpItems.slice(1).reduce((s, i) => s + (i.achieved ? i.points : 0), 0);
  categories.push({
    name: "Pumps",
    mandatory: mandatoryPumps, additional: additionalPumps,
    maxMandatory: 6, maxAdditional: 8, maxTotal: 14,
    items: pumpItems,
  });

  // ── 5. Electrical Systems ───────────────────────────────────────────
  const elecItems = [
    { label: "Power factor ≥ 0.97 at point of connection", points: 1, achieved: input.powerFactor >= 0.97, clause: "ENS Part II — Sec 4.2" },
    { label: "Distribution losses ≤ 3% of total power", points: 2, achieved: input.distributionLossPercent <= 3, clause: "ENS Part II — Sec 4.5" },
    { label: "EV charging infrastructure provision (additional)", points: 2, achieved: input.plotAreaSqm >= 500, clause: "ENS Part II — Sec 4.4" },
    { label: "Energy monitoring system with 15-min interval (additional)", points: 1, achieved: input.floors > 2, clause: "ENS Part II — Sec 4.3" },
  ];
  const mandatoryElec = elecItems.slice(0, 1).reduce((s, i) => s + (i.achieved ? i.points : 0), 0);
  const additionalElec = elecItems.slice(1).reduce((s, i) => s + (i.achieved ? i.points : 0), 0);
  categories.push({
    name: "Electrical Systems",
    mandatory: mandatoryElec, additional: additionalElec,
    maxMandatory: 1, maxAdditional: 5, maxTotal: 6,
    items: elecItems,
  });

  // ── 6. Indoor Lighting ──────────────────────────────────────────────
  const indoorLightItems = [
    { label: "LED lighting throughout (≥100 lm/W efficacy)", points: 7, achieved: input.hasLEDLighting, clause: "ENS Part II — Sec 6.6 Indoor Lighting" },
    { label: "Occupancy sensors in common areas & corridors", points: 5, achieved: input.hasAutoLightControls, clause: "ENS Part II — Sec 6.6" },
  ];
  const indoorLightScore = indoorLightItems.reduce((s, i) => s + (i.achieved ? i.points : 0), 0);
  categories.push({
    name: "Indoor Lighting",
    mandatory: indoorLightScore, additional: 0,
    maxMandatory: 12, maxAdditional: 0, maxTotal: 12,
    items: indoorLightItems,
  });

  // ── 7. Comfort Systems ──────────────────────────────────────────────
  const comfortItems = [
    { label: "BEE 5-star ceiling fans", points: 15, achieved: input.hasCeilingFanStarRating >= 5, clause: "ENS Part II — Comfort Systems" },
    { label: "BEE 4-star ceiling fans", points: 10, achieved: input.hasCeilingFanStarRating >= 4, clause: "ENS Part II — Comfort Systems" },
    { label: "BEE 5-star inverter AC (if installed)", points: 25, achieved: input.acStarRating >= 5, clause: "ENS Part II — Sec 6.6 AC" },
    { label: "BEE 3-star AC or better", points: 10, achieved: input.acStarRating >= 3, clause: "ENS Part II — Sec 6.6 AC" },
  ];
  const comfortScore = Math.min(50,
    (input.hasCeilingFanStarRating >= 5 ? 15 : input.hasCeilingFanStarRating >= 4 ? 10 : 0) +
    (input.acStarRating >= 5 ? 25 : input.acStarRating >= 3 ? 10 : 0)
  );
  categories.push({
    name: "Comfort Systems",
    mandatory: comfortScore, additional: 0,
    maxMandatory: 50, maxAdditional: 0, maxTotal: 50,
    items: comfortItems,
  });

  // ── 8. Renewable Energy (bonus) ─────────────────────────────────────
  if (input.hasSolarHotWater || input.hasSolarPV) {
    const renewItems = [
      { label: "Solar hot water system (sized per ENS norms)", points: 10, achieved: input.hasSolarHotWater, clause: "ENS Part II — Sec 6.7" },
      { label: "Solar PV system (sized per ENS norms)", points: 10, achieved: input.hasSolarPV, clause: "ENS Part II — Sec 6.7" },
    ];
    const renewScore = renewItems.reduce((s, i) => s + (i.achieved ? i.points : 0), 0);
    categories.push({
      name: "Renewable Energy (Bonus)",
      mandatory: renewScore, additional: 0,
      maxMandatory: 20, maxAdditional: 0, maxTotal: 20,
      items: renewItems,
    });
  }

  // ── Total ────────────────────────────────────────────────────────────
  const total = categories.reduce((s, c) => s + c.mandatory + c.additional, 0);
  const target = TARGETS[input.buildingType];
  const compliant = total >= target;
  const grade =
    total >= 160 ? "Excellent" :
    total >= 100 ? "Good" :
    compliant    ? "Compliant" : "Non-Compliant";

  const energySavingPercent = Math.min(60, Math.round((total / 220) * 65));

  // ── Mandatory checklist ───────────────────────────────────────────────
  const mandatoryChecklist = [
    { requirement: "RETV ≤ 12 W/m² (non-cold zones) or Wall U ≤ 1.3 W/m²K (cold zone)", met: input.climateZone === "cold" ? input.wallUValue <= 1.3 : input.retv <= 12, clause: "ENS Part I — Mandatory" },
    { requirement: "Roof U-value ≤ 1.2 W/m²K", met: input.roofUValue <= 1.2, clause: "ENS Part I — Mandatory" },
    { requirement: "Openable WFR ≥ 5% per room", met: input.openableWFR >= 5, clause: "ENS Part I — Mandatory" },
    { requirement: "Window VLT ≥ 0.27", met: input.windowVLT >= 0.27, clause: "ENS Part I — Mandatory" },
    { requirement: "Power factor ≥ 0.97 (3-phase buildings)", met: input.powerFactor >= 0.97, clause: "ENS Part II — Sec 4.2" },
    { requirement: "Distribution losses ≤ 3%", met: input.distributionLossPercent <= 3, clause: "ENS Part II — Sec 4.5" },
    { requirement: "Common area lamp efficacy ≥ 105 lm/W", met: input.hasHighEfficacyLighting, clause: "ENS Part II — Sec 5.2" },
  ];

  return { total, target, compliant, categories, mandatoryChecklist, grade, energySavingPercent };
}

/** Default scoring input from Phase 0 requirements — sensible ENS-compliant defaults */
export function defaultScoringInput(
  buildingType: "low_rise" | "affordable" | "high_rise",
  floors: number,
  plotAreaSqm: number,
  climateZone: ClimateZone
): ENSScoringInput {
  return {
    buildingType, floors, plotAreaSqm, climateZone,
    wallUValue: 1.5, roofUValue: 0.5, retv: 11, windowVLT: 0.3, openableWFR: 6,
    hasOverhangs: true, hasHighEfficacyLighting: true, hasAutoLightControls: true,
    hasElevator: floors > 4, hasRegenerativeLift: false, hasBEE5StarPumps: true,
    hasVFDPumps: false, powerFactor: 0.97, distributionLossPercent: 2.5,
    hasLEDLighting: true, hasCeilingFanStarRating: 5, acStarRating: 3,
    hasSolarHotWater: false, hasSolarPV: false,
  };
}
