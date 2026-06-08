/**
 * Floor Plan Generator
 * Produces a room layout grid following ENS orientation rules.
 */

import { ClimateZone } from "./climateZones";

export interface Room {
  id: string;
  label: string;
  type: "bedroom" | "living" | "kitchen" | "bathroom" | "parking" | "office" | "utility";
  x: number;      // grid column (0-based)
  y: number;      // grid row (0-based)
  w: number;      // width in grid units
  h: number;      // height in grid units
  facing: "N" | "S" | "E" | "W" | "inner";
  windowWall: "N" | "S" | "E" | "W" | null;
  notes: string;
}

export interface FloorPlan {
  rooms: Room[];
  gridCols: number;
  gridRows: number;
  plotWidthM: number;
  plotDepthM: number;
  openSpaceM2: number;
  orientation: string;   // Long axis orientation
  floors: number;
}

const ROOM_COLORS: Record<Room["type"], string> = {
  living:   "#d1fae5",
  bedroom:  "#fce7f3",
  kitchen:  "#fef9c3",
  bathroom: "#dbeafe",
  parking:  "#f3e8ff",
  office:   "#ffedd5",
  utility:  "#f1f5f9",
};

export { ROOM_COLORS };

/**
 * Generate an ENS-compliant floor plan layout.
 * Returns room placements on a virtual grid.
 */
export function generateFloorPlan(params: {
  bedrooms: number;
  bathrooms: number;
  livingRooms: number;
  kitchen: number;
  parkingBays: number;
  hasHomeOffice: boolean;
  hasElderly: boolean;
  vastuPreference: boolean;
  plotAreaSqm: number;
  plotFacing: string | null;
  floors: number;
  climateZone: ClimateZone;
  openSpacePercent: number;
}): FloorPlan {
  const {
    bedrooms, bathrooms, livingRooms, kitchen, parkingBays,
    hasHomeOffice, hasElderly, vastuPreference, plotAreaSqm,
    plotFacing, floors, climateZone, openSpacePercent,
  } = params;

  // Derive plot shape (assume roughly square-ish, depth slightly less than width)
  const plotWidth = Math.sqrt(plotAreaSqm * 1.3);
  const plotDepth = plotAreaSqm / plotWidth;
  const builtArea = plotAreaSqm * (1 - openSpacePercent / 100);

  // Grid: each cell = ~3m × 3m
  const CELL = 3;
  const gridCols = Math.max(4, Math.round(plotWidth / CELL));
  const gridRows = Math.max(4, Math.round(plotDepth / CELL));

  const rooms: Room[] = [];

  // ── Orientation rules per ENS + climate zone ──────────────────────
  // North India (composite/hot_dry): long axis E-W, living on South
  // South India (warm_humid/temperate): long axis E-W, living on South/East
  // Cold zone: South facing maximised
  const livingFace: "S" | "SE" | "E" = climateZone === "cold" ? "S" : climateZone === "warm_humid" ? "SE" : "S";

  // Vastu adjustments
  const entranceFace = vastuPreference ? "E" : (plotFacing?.toUpperCase() as any) ?? "S";

  let row = 0;

  // ── Row 0 (North side): Service rooms — buffer against heat/cold ──
  // Utility / bathroom / parking
  let col = 0;

  // Parking on North or West (buffer zone in most climates)
  if (parkingBays > 0) {
    rooms.push({
      id: "parking",
      label: `Parking (${parkingBays} bay${parkingBays > 1 ? "s" : ""})`,
      type: "parking",
      x: col, y: row, w: Math.min(parkingBays * 1.5, gridCols * 0.4), h: 1.5,
      facing: "N", windowWall: null,
      notes: "North or West placement acts as thermal buffer",
    });
    col += Math.min(parkingBays * 1.5, gridCols * 0.4);
  }

  // Utility/service
  rooms.push({
    id: "utility",
    label: "Utility / Storeroom",
    type: "utility",
    x: col, y: row, w: gridCols - col, h: 1,
    facing: "N", windowWall: "N",
    notes: "North-facing utility as thermal buffer",
  });
  row += 1.5;

  // ── Row 1 (Centre-North): Bathrooms + Office ──────────────────────
  col = 0;
  const bathPerFloor = Math.ceil(bathrooms / floors);
  for (let i = 0; i < bathPerFloor; i++) {
    rooms.push({
      id: `bath_${i + 1}`,
      label: i === 0 && hasElderly ? "Accessible Bath" : `Bathroom ${i + 1}`,
      type: "bathroom",
      x: col, y: row, w: 1, h: 1,
      facing: "inner", windowWall: "N",
      notes: "Wet areas on North wall — exhaust fan + small window",
    });
    col += 1;
  }

  if (hasHomeOffice) {
    rooms.push({
      id: "office",
      label: "Home Office",
      type: "office",
      x: col, y: row, w: 1.5, h: 1,
      facing: "N", windowWall: "N",
      notes: "North-facing — glare-free, even natural light ideal for screens",
    });
    col += 1.5;
  }
  row += 1.5;

  // ── Row 2 (Centre): Bedrooms ──────────────────────────────────────
  const bedsPerFloor = Math.ceil(bedrooms / floors);
  col = 0;
  const bedW = gridCols / Math.max(bedsPerFloor, 1);

  for (let i = 0; i < bedsPerFloor; i++) {
    const isMaster = i === 0;
    const isElderly = hasElderly && i === 0;
    rooms.push({
      id: `bed_${i + 1}`,
      label: isMaster ? "Master Bedroom" : `Bedroom ${i + 1}`,
      type: "bedroom",
      x: col, y: row,
      w: bedW,
      h: 1.5,
      facing: "E",
      windowWall: i % 2 === 0 ? "E" : "W",
      notes: isElderly
        ? "Ground floor — attached bath, wider 900mm door, accessible"
        : "East-facing for morning sun, cooler west afternoon",
    });
    col += bedW;
  }
  row += 1.5;

  // ── Row 3 (South side): Kitchen + Living ─────────────────────────
  col = 0;

  // Kitchen on South-East (morning sun, good ventilation)
  const kitchenW = gridCols * 0.35;
  rooms.push({
    id: "kitchen",
    label: "Kitchen",
    type: "kitchen",
    x: col, y: row,
    w: kitchenW,
    h: 1.5,
    facing: "SE" as any,
    windowWall: vastuPreference ? "E" : "S",
    notes: "South-East placement: morning sun + cross-ventilation. Vastu: cooking faces East.",
  });
  col += kitchenW;

  // Living room on South — maximum natural light + winter warmth
  rooms.push({
    id: "living_1",
    label: "Living Room",
    type: "living",
    x: col, y: row,
    w: gridCols - col,
    h: 1.5,
    facing: "S",
    windowWall: "S",
    notes: "South-facing: best natural light year-round. Large windows (≥10% WFR) here.",
  });
  row += 1.5;

  return {
    rooms,
    gridCols,
    gridRows: Math.max(row + 0.5, gridRows),
    plotWidthM: Math.round(plotWidth),
    plotDepthM: Math.round(plotDepth),
    openSpaceM2: Math.round(plotAreaSqm * openSpacePercent / 100),
    orientation: "Long axis East-West (ENS recommended)",
    floors,
  };
}

/**
 * Render floor plan to SVG string.
 * Each grid unit = cellPx pixels.
 */
export function renderFloorPlanSVG(plan: FloorPlan, cellPx = 72): string {
  const PAD = 40;
  const W = plan.gridCols * cellPx + PAD * 2;
  const H = plan.gridRows * cellPx + PAD * 2;

  const rects = plan.rooms.map((room) => {
    const x = PAD + room.x * cellPx;
    const y = PAD + room.y * cellPx;
    const rw = room.w * cellPx;
    const rh = room.h * cellPx;
    const color = ROOM_COLORS[room.type];

    // Window indicator (small tick on window wall)
    let windowSvg = "";
    if (room.windowWall) {
      const wLen = Math.min(rw, rh) * 0.5;
      if (room.windowWall === "S") windowSvg = `<rect x="${x + rw / 2 - wLen / 2}" y="${y + rh - 4}" width="${wLen}" height="6" fill="#60a5fa" rx="2"/>`;
      if (room.windowWall === "N") windowSvg = `<rect x="${x + rw / 2 - wLen / 2}" y="${y - 2}" width="${wLen}" height="6" fill="#60a5fa" rx="2"/>`;
      if (room.windowWall === "E") windowSvg = `<rect x="${x + rw - 2}" y="${y + rh / 2 - wLen / 2}" width="6" height="${wLen}" fill="#60a5fa" rx="2"/>`;
      if (room.windowWall === "W") windowSvg = `<rect x="${x - 4}" y="${y + rh / 2 - wLen / 2}" width="6" height="${wLen}" fill="#60a5fa" rx="2"/>`;
    }

    // Label — split at space for multi-line
    const words = room.label.split(" ");
    const line1 = words.slice(0, 2).join(" ");
    const line2 = words.slice(2).join(" ");
    const labelY = y + rh / 2 + (line2 ? -6 : 0);

    return `
    <rect x="${x}" y="${y}" width="${rw}" height="${rh}" fill="${color}" stroke="#94a3b8" stroke-width="1.5" rx="3"/>
    ${windowSvg}
    <text x="${x + rw / 2}" y="${labelY}" text-anchor="middle" dominant-baseline="middle" font-size="10" font-family="Inter,sans-serif" fill="#1e293b" font-weight="500">${line1}</text>
    ${line2 ? `<text x="${x + rw / 2}" y="${labelY + 14}" text-anchor="middle" font-size="10" font-family="Inter,sans-serif" fill="#1e293b">${line2}</text>` : ""}
    <text x="${x + rw - 4}" y="${y + rh - 4}" text-anchor="end" font-size="7" fill="#64748b">${room.facing}</text>`;
  });

  // Compass rose
  const cx = W - 36, cy = 36;
  const compass = `
    <g>
      <circle cx="${cx}" cy="${cy}" r="20" fill="white" stroke="#e2e8f0" stroke-width="1.5"/>
      <text x="${cx}" y="${cy - 10}" text-anchor="middle" font-size="9" font-weight="700" fill="#15803d" font-family="Inter,sans-serif">N</text>
      <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="7" fill="#64748b" font-family="Inter,sans-serif">S</text>
      <text x="${cx - 12}" y="${cy + 3}" text-anchor="middle" font-size="7" fill="#64748b" font-family="Inter,sans-serif">W</text>
      <text x="${cx + 12}" y="${cy + 3}" text-anchor="middle" font-size="7" fill="#64748b" font-family="Inter,sans-serif">E</text>
      <polygon points="${cx},${cy - 16} ${cx + 3},${cy - 4} ${cx - 3},${cy - 4}" fill="#15803d"/>
    </g>`;

  // Legend
  const legendItems = Object.entries(ROOM_COLORS);
  const legendSvg = legendItems.map(([type, color], i) => {
    const lx = PAD + i * 80;
    const ly = H - 20;
    return `<rect x="${lx}" y="${ly - 8}" width="10" height="10" fill="${color}" stroke="#94a3b8" stroke-width="1" rx="2"/>
            <text x="${lx + 13}" y="${ly + 1}" font-size="8" fill="#64748b" font-family="Inter,sans-serif">${type}</text>`;
  }).join("\n");

  // Window legend
  const winLegend = `
    <rect x="${PAD}" y="${H - 38}" width="12" height="6" fill="#60a5fa" rx="2"/>
    <text x="${PAD + 16}" y="${H - 33}" font-size="8" fill="#64748b" font-family="Inter,sans-serif">Window position (ENS WFR ≥5%)</text>`;

  // Dimensions
  const dims = `
    <text x="${W / 2}" y="${H - 4}" text-anchor="middle" font-size="9" fill="#94a3b8" font-family="Inter,sans-serif">
      EcoHomes · ENS Schematic Floor Plan · Plot ${plan.plotWidthM}m × ${plan.plotDepthM}m · ${plan.orientation}
    </text>`;

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="#f8fafc" rx="8"/>
  ${rects.join("\n")}
  ${compass}
  ${winLegend}
  ${legendSvg}
  ${dims}
</svg>`;
}
