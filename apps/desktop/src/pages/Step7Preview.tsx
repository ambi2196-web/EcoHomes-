import { Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Sun, Wind, Thermometer, Zap } from "lucide-react";
import { useProjectStore } from "../store/projectStore";

// Lazy-load the heavy 3D component so the page renders instantly
const Home3DModel = lazy(() => import("../components/Home3DModel"));

// ── Stat card ─────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = "text-forest-700" }: {
  icon: any; label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="card p-4 flex items-start gap-3">
      <div className="p-2 bg-forest-50 rounded-lg shrink-0">
        <Icon size={18} className={color} />
      </div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className={`font-bold text-base ${color}`}>{value}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ── Zone badge ────────────────────────────────────────────────────────────

const ZONE_META: Record<string, { label: string; strategy: string; color: string }> = {
  composite:  { label: "Composite",  strategy: "Mixed heating & cooling", color: "bg-amber-100 text-amber-800" },
  hot_dry:    { label: "Hot & Dry",  strategy: "Shade, thermal mass, evaporation", color: "bg-orange-100 text-orange-800" },
  warm_humid: { label: "Warm & Humid", strategy: "Max cross-ventilation", color: "bg-green-100 text-green-800" },
  temperate:  { label: "Temperate", strategy: "Solar gain + insulation",  color: "bg-blue-100 text-blue-800" },
  cold:       { label: "Cold",      strategy: "Super-insulate & seal",    color: "bg-indigo-100 text-indigo-800" },
};

// ── Page ──────────────────────────────────────────────────────────────────

export default function Step7Preview() {
  const navigate = useNavigate();
  const {
    requirements, climateData, location, ensScore,
    predictedIndoorTemp, style, budget,
  } = useProjectStore();

  const zone = climateData?.zone ?? "composite";
  const zoneMeta = ZONE_META[zone] ?? ZONE_META.composite;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">3D Home Preview</h2>
          <p className="text-gray-500 mt-0.5 text-sm">
            Interactive model ·{" "}
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${zoneMeta.color}`}>
              {zoneMeta.label} Zone
            </span>
            {" "}· {style?.replace(/_/g, " ")} style
          </p>
        </div>
        <div className={`text-right px-4 py-2 rounded-xl ${ensScore && ensScore >= 47 ? "bg-forest-50 border border-forest-200" : "bg-red-50 border border-red-200"}`}>
          <div className={`text-2xl font-black ${ensScore && ensScore >= 47 ? "text-forest-700" : "text-red-600"}`}>
            {ensScore ?? "–"} pts
          </div>
          <div className="text-xs text-gray-500">ENS Score / 220</div>
        </div>
      </div>

      {/* 3D Viewer */}
      <div className="card p-0 overflow-hidden rounded-2xl border border-earth-200">
        <Suspense fallback={
          <div className="flex items-center justify-center" style={{ height: 480 }}>
            <div className="text-center space-y-3">
              <Loader2 size={36} className="animate-spin text-forest-400 mx-auto" />
              <p className="text-sm text-gray-500">Loading 3D model…</p>
            </div>
          </div>
        }>
          <Home3DModel
            plotAreaSqm={requirements.plotAreaSqm}
            floors={requirements.floors}
            bedrooms={requirements.bedrooms}
            bathrooms={requirements.bathrooms}
            parkingBays={requirements.parkingBays}
            zone={zone}
          />
        </Suspense>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Thermometer}
          label="Indoor Temp (with ENS)"
          value={predictedIndoorTemp ? `${predictedIndoorTemp}°C` : "–"}
          sub="vs outdoor peak"
          color="text-orange-600"
        />
        <StatCard
          icon={Sun}
          label="Peak Sun Hours"
          value={climateData?.peakSunHours ? `${climateData.peakSunHours} hrs/day` : "–"}
          sub="annual average"
          color="text-yellow-600"
        />
        <StatCard
          icon={Wind}
          label="Prevailing Wind"
          value={climateData?.prevailingWind ?? "–"}
          sub="natural ventilation axis"
          color="text-blue-600"
        />
        <StatCard
          icon={Zap}
          label="Energy Saving"
          value={ensScore ? `~${Math.min(60, Math.round((ensScore / 220) * 65))}%` : "–"}
          sub="vs conventional build"
          color="text-forest-600"
        />
      </div>

      {/* Design strategy */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-3">
          {zoneMeta.label} Zone — Design Strategy
        </h3>
        <p className="text-sm text-gray-600 mb-3">{zoneMeta.strategy}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <DesignTip zone={zone} index={0} />
          <DesignTip zone={zone} index={1} />
          <DesignTip zone={zone} index={2} />
        </div>
      </div>

      {/* Summary bar */}
      <div className="bg-earth-50 border border-earth-200 rounded-xl px-5 py-3
                      flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex flex-wrap gap-4">
          <span className="text-gray-600">📍 {location?.city || "–"}, {location?.state || "–"}</span>
          <span className="text-gray-600">🏠 {requirements.plotAreaSqm} m² · {requirements.floors} floor{requirements.floors > 1 ? "s" : ""}</span>
          <span className="text-gray-600">🛏 {requirements.bedrooms} bed · {requirements.bathrooms} bath</span>
          <span className="text-gray-600">💰 {budget?.replace(/_/g, " ")}</span>
        </div>
      </div>

      {/* Nav */}
      <div className="flex justify-between pt-1">
        <button onClick={() => navigate("/wizard/step6")} className="btn-secondary flex items-center gap-2">
          <ArrowLeft size={16} /> AI Consult
        </button>
        <button onClick={() => navigate("/wizard/step5")} className="btn-secondary flex items-center gap-2">
          Floor Plan <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Design tips per zone ──────────────────────────────────────────────────

const DESIGN_TIPS: Record<string, string[]> = {
  composite: [
    "🌿 Plant deciduous trees on the west to block afternoon sun in summer, allow winter sun",
    "🧱 Use 230mm brick walls — thermal mass absorbs daytime heat, releases at night",
    "🪟 Openable WFR ≥ 8% on north and south walls for cross-ventilation",
  ],
  hot_dry: [
    "🌡️ White or cool-roof tiles cut roof surface temp by 20–30°C",
    "🏛️ Include a central courtyard — creates convective cool air stack",
    "🪟 Small, deep-set windows on east/west; larger openings on north/south",
  ],
  warm_humid: [
    "💨 Maximise cross-ventilation — align openings perpendicular to prevailing wind",
    "🌿 Avoid thermal mass; use lightweight materials that don't retain heat",
    "🏠 Raised plinth (300–600mm) keeps floor cool and protects from moisture",
  ],
  temperate: [
    "☀️ South-facing glazing captures winter solar gain — use 40–50% glass on south",
    "🧱 Insulated cavity walls (75mm EPS) for year-round comfort",
    "🌲 Evergreen windbreaks on the north side reduce cold wind infiltration",
  ],
  cold: [
    "🧣 Wall U-value ≤ 1.3 W/m²K mandatory — use 100mm EPS or mineral wool insulation",
    "🪟 Triple glazing or low-E double glass; avoid north-facing windows",
    "♻️ Heat recovery ventilation (HRV) — recovers 70–80% of heat from exhaust air",
  ],
};

function DesignTip({ zone, index }: { zone: string; index: number }) {
  const tips = DESIGN_TIPS[zone] ?? DESIGN_TIPS.composite;
  const tip = tips[index] ?? tips[0];
  return (
    <div className="bg-white border border-earth-100 rounded-xl p-3 text-sm text-gray-700">
      {tip}
    </div>
  );
}
