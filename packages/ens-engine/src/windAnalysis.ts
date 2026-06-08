/**
 * Wind Analysis — Open-Meteo API integration
 * Free, no API key required.
 * https://open-meteo.com
 */

export interface WindData {
  currentSpeed: number;       // km/h
  currentDirection: number;   // degrees (0 = N, 90 = E, 180 = S, 270 = W)
  currentDirectionLabel: string;
  maxSpeed: number;
  avgHumidity: number;        // %
  temperatureMax: number;     // °C
  temperatureMin: number;     // °C
  prevailingWind: string;     // Cardinal direction for dominant wind
  naturalVentilationAdvice: string;
}

const DIRECTION_LABELS = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];

export function degreesToCardinal(deg: number): string {
  const index = Math.round(deg / 22.5) % 16;
  return DIRECTION_LABELS[index];
}

export async function fetchWindData(lat: number, lng: number): Promise<WindData> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
    `&daily=temperature_2m_max,temperature_2m_min,wind_speed_10m_max,wind_direction_10m_dominant` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m` +
    `&timezone=auto&forecast_days=1`;

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error("Open-Meteo API error");

  const data = await res.json();

  const currentDir = data.current?.wind_direction_10m ?? 180;
  const currentDirLabel = degreesToCardinal(currentDir);
  const dominantDir = data.daily?.wind_direction_10m_dominant?.[0] ?? currentDir;
  const prevailingWind = degreesToCardinal(dominantDir);

  const windSpeed = data.current?.wind_speed_10m ?? 10;
  const maxSpeed = data.daily?.wind_speed_10m_max?.[0] ?? windSpeed;
  const tempMax = data.daily?.temperature_2m_max?.[0] ?? 35;
  const tempMin = data.daily?.temperature_2m_min?.[0] ?? 15;
  const humidity = data.current?.relative_humidity_2m ?? 60;

  // Advice based on prevailing wind
  const advice = generateVentilationAdvice(prevailingWind, windSpeed, humidity);

  return {
    currentSpeed: windSpeed,
    currentDirection: currentDir,
    currentDirectionLabel: currentDirLabel,
    maxSpeed,
    avgHumidity: humidity,
    temperatureMax: tempMax,
    temperatureMin: tempMin,
    prevailingWind,
    naturalVentilationAdvice: advice,
  };
}

function generateVentilationAdvice(windDir: string, speed: number, humidity: number): string {
  const isHumid = humidity > 70;
  const isCalm = speed < 8;

  const baseAdvice = `Prevailing wind comes from the ${windDir}. `;

  if (isCalm && isHumid) {
    return baseAdvice + "Low wind speed with high humidity — design for stack ventilation (vertical air shafts) and consider dehumidification in wet rooms.";
  }
  if (isCalm) {
    return baseAdvice + "Calm winds — rely on thermal stack ventilation. Place openings at floor and ceiling level on opposite walls.";
  }

  const oppMap: Record<string, string> = {
    N:"south", NNE:"south-southwest", NE:"southwest", ENE:"west-southwest",
    E:"west",  ESE:"west-northwest",  SE:"northwest", SSE:"north-northwest",
    S:"north", SSW:"north-northeast", SW:"northeast", WSW:"east-northeast",
    W:"east",  WNW:"east-southeast",  NW:"southeast", NNW:"south-southeast",
  };
  const inlet = windDir.toLowerCase();
  const outlet = oppMap[windDir] ?? "opposite side";

  return baseAdvice + `Place primary openings (inlet) on the ${inlet} facade and outlet openings on the ${outlet} side for optimal cross-ventilation. Window-to-floor ratio ≥5% per room as per ENS.`;
}
