/**
 * Solar Analysis — NASA POWER API integration
 * Free, no API key required.
 * https://power.larc.nasa.gov/api/
 */

export interface SolarData {
  peakSunHours: number;           // kWh/m²/day (monthly average of annual)
  monthlySolarKWh: Record<string, number>; // Jan–Dec
  bestBuildingOrientation: string;
  rooftopSolarYieldKWh: number;   // estimated annual yield per 1 kW installed
  uvIndex: string;                // Low / Medium / High / Very High
}

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export async function fetchSolarData(lat: number, lng: number): Promise<SolarData> {
  const url =
    `https://power.larc.nasa.gov/api/temporal/climatology/point` +
    `?parameters=ALLSKY_SFC_SW_DWN` +
    `&community=RE` +
    `&longitude=${lng.toFixed(4)}` +
    `&latitude=${lat.toFixed(4)}` +
    `&format=JSON`;

  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error("NASA POWER API error");

  const json = await res.json();
  const monthly: Record<string, number> = json?.properties?.parameter?.ALLSKY_SFC_SW_DWN ?? {};

  // ANN = annual average; Jan–Dec are individual months
  const annualAvg = monthly["ANN"] ?? 5.0;
  const monthlyMap: Record<string, number> = {};
  MONTH_LABELS.forEach((m, i) => {
    const key = String(i + 1).padStart(2, "0"); // "01"–"12"
    monthlyMap[m] = Number((monthly[key] ?? annualAvg).toFixed(2));
  });

  const peakSunHours = Number(annualAvg.toFixed(2));

  // Best orientation advice
  const bestOrientation =
    lat > 0
      ? "South-facing roof (India is in northern hemisphere — max solar gain faces south)"
      : "North-facing roof";

  // Rough yield estimate: 1 kW system × 0.8 efficiency factor
  const rooftopSolarYieldKWh = Math.round(peakSunHours * 365 * 0.8);

  const uvIndex =
    peakSunHours > 6.5 ? "Very High" :
    peakSunHours > 5.5 ? "High" :
    peakSunHours > 4.5 ? "Medium" : "Low";

  return { peakSunHours, monthlySolarKWh: monthlyMap, bestBuildingOrientation: bestOrientation, rooftopSolarYieldKWh, uvIndex };
}

/**
 * Fallback solar data when API is unavailable.
 * Uses typical India averages by latitude band.
 */
export function estimateSolarData(lat: number): SolarData {
  const peakSunHours =
    lat < 12 ? 5.8 :
    lat < 20 ? 6.2 :
    lat < 28 ? 5.5 :
    lat < 32 ? 5.0 : 4.2;

  const monthly: Record<string, number> = {};
  MONTH_LABELS.forEach((m) => { monthly[m] = peakSunHours; });

  return {
    peakSunHours,
    monthlySolarKWh: monthly,
    bestBuildingOrientation: "South-facing roof",
    rooftopSolarYieldKWh: Math.round(peakSunHours * 365 * 0.8),
    uvIndex: peakSunHours > 6 ? "Very High" : peakSunHours > 5 ? "High" : "Medium",
  };
}
