import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Sun, Wind, Thermometer, CheckCircle, Zap, Info } from "lucide-react";
import { useProjectStore } from "../store/projectStore";
import WindRose from "../components/WindRose";
import SolarChart from "../components/SolarChart";

import {
  detectClimateZone, ZONE_INFO,
  fetchSolarData, estimateSolarData,
  fetchWindData,
  getMaterialRecommendations, getLayoutRules, estimateThermalComfort,
} from "@ecohomes/ens-engine";

export default function Step3Analysis() {
  const navigate = useNavigate();
  const store = useProjectStore();
  const { location, requirements } = store;

  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState("Detecting ENS climate zone…");
  const [error, setError] = useState<string | null>(null);

  // Analysis results
  const [zoneKey, setZoneKey] = useState<string | null>(null);
  const [solar, setSolar] = useState<any>(null);
  const [wind, setWind] = useState<any>(null);
  const [thermal, setThermal] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [layoutRules, setLayoutRules] = useState<any[]>([]);

  useEffect(() => {
    if (!location) { navigate("/wizard/step1"); return; }
    runAnalysis();
  }, []);

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    try {
      // 1. Climate zone
      setLoadingMsg("Detecting ENS climate zone from coordinates…");
      const zone = detectClimateZone(location!.lat, location!.lng);
      setZoneKey(zone);

      // 2. Solar data (NASA POWER)
      setLoadingMsg("Fetching solar irradiance from NASA POWER API…");
      let solarData;
      try {
        solarData = await fetchSolarData(location!.lat, location!.lng);
      } catch {
        solarData = estimateSolarData(location!.lat); // fallback
      }
      setSolar(solarData);

      // 3. Wind + weather (Open-Meteo)
      setLoadingMsg("Fetching wind & temperature data from Open-Meteo…");
      const windData = await fetchWindData(location!.lat, location!.lng);
      setWind(windData);

      // 4. ENS rules
      setLoadingMsg("Applying ENS design rules for your zone…");
      const mats = getMaterialRecommendations(zone as any);
      const rules = getLayoutRules(zone as any, {
        hasElderly: requirements.hasElderly,
        hasHomeOffice: requirements.hasHomeOffice,
        vastuPreference: requirements.vastuPreference,
        plotFacing: requirements.plotFacing,
        floors: requirements.floors,
      });
      setMaterials(mats);
      setLayoutRules(rules);

      // 5. Thermal estimate
      const thermalEst = estimateThermalComfort(zone as any, windData.temperatureMax);
      setThermal(thermalEst);

      // 6. Store results
      store.setClimateData({
        zone: zone as any,
        avgTempSummer: windData.temperatureMax,
        avgTempWinter: windData.temperatureMin,
        humidity: `${windData.avgHumidity}%`,
        prevailingWind: windData.prevailingWind,
        peakSunHours: solarData.peakSunHours,
        bestOrientation: solarData.bestBuildingOrientation,
      });

      const ensScore = calcENSScore(requirements);
      store.setAnalysisResults({
        ensScore,
        layoutSuggestions: rules.map((r) => r.rule),
        materialRecommendations: Object.fromEntries(mats.map((m) => [m.element, m.recommendation])),
        predictedIndoorTemp: thermalEst.indoorWithENS,
      });

    } catch (err: any) {
      setError(err?.message ?? "Analysis failed. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  }

  function calcENSScore(req: typeof requirements) {
    let score = 30;
    if (req.openSpacePercent >= 20) score += 10;
    if (req.plotFacing === "south" || req.plotFacing === "north") score += 7;
    if (req.floors <= 4) score += 5;
    return score;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 size={44} className="animate-spin text-forest-500" />
        <p className="text-gray-700 font-medium">{loadingMsg}</p>
        <p className="text-sm text-gray-400">Using NASA POWER API, Open-Meteo & ENS rules engine</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button onClick={runAnalysis} className="btn-primary">Retry</button>
      </div>
    );
  }

  const zoneInfo = zoneKey ? ZONE_INFO[zoneKey as keyof typeof ZONE_INFO] : null;
  const { ensScore } = useProjectStore.getState();
  const ensTarget = { low_rise: 47, affordable: 70, high_rise: 100 }[requirements.buildingType || "low_rise"];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Climate & ENS Analysis</h2>
        <p className="text-gray-500 mt-1">
          Based on <strong>{location?.city || location?.address?.split(",")[0]}</strong> — real data from NASA POWER & Open-Meteo.
        </p>
      </div>

      {/* ── Zone Banner ── */}
      {zoneInfo && (
        <div className={`rounded-xl border-2 px-5 py-4 flex items-start gap-4`}
          style={{ borderColor: zoneInfo.color, background: zoneInfo.color + "15" }}>
          <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ background: zoneInfo.color }} />
          <div>
            <div className="font-bold text-gray-900 text-lg">{zoneInfo.label} Climate Zone</div>
            <div className="text-sm text-gray-600 mt-0.5">{zoneInfo.description}</div>
            <div className="flex flex-wrap gap-2 mt-2">
              {zoneInfo.exampleCities.slice(0, 4).map((c) => (
                <span key={c} className="text-xs bg-white border border-gray-200 rounded-full px-2.5 py-0.5 text-gray-600">{c}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Climate Metrics Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={Thermometer} label="Max Temperature" value={`${wind?.temperatureMax ?? "--"}°C`} sub="Today's forecast" color="text-orange-500" />
        <MetricCard icon={Thermometer} label="Min Temperature" value={`${wind?.temperatureMin ?? "--"}°C`} sub="Today's forecast" color="text-blue-500" />
        <MetricCard icon={Sun}         label="Peak Sun Hours"  value={`${solar?.peakSunHours ?? "--"} hrs`} sub="Annual daily avg" color="text-yellow-500" />
        <MetricCard icon={Zap}         label="Solar Roof Yield" value={`${solar?.rooftopYieldKWh ?? solar?.rooftopSolarYieldKWh ?? "--"} kWh`} sub="Per 1 kW installed/yr" color="text-green-500" />
      </div>

      {/* ── Thermal Comfort ── */}
      {thermal && (
        <div className="card bg-gradient-to-r from-forest-50 to-earth-50">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Thermometer size={16} className="text-forest-600" /> Predicted Indoor Temperature
          </h3>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-center">
              <div className="text-3xl font-bold text-forest-700">{thermal.indoorWithENS}°C</div>
              <div className="text-xs text-gray-500 mt-1">With ENS design</div>
            </div>
            <div className="text-2xl text-gray-300">vs</div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400">{thermal.indoorWithoutENS}°C</div>
              <div className="text-xs text-gray-500 mt-1">Conventional build</div>
            </div>
            <div className="flex-1 min-w-[160px]">
              <div className="text-forest-700 font-semibold">{thermal.savingDegrees}°C cooler</div>
              <div className="text-sm text-gray-600 mt-0.5">{thermal.coolingLoadReduction}</div>
              <div className="text-xs text-gray-400 mt-1">Outdoor max: {thermal.outdoorMax}°C today</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Wind + Solar Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Wind Rose */}
        {wind && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Wind size={15} className="text-blue-500" /> Wind Analysis
            </h3>
            <div className="flex items-center gap-6">
              <WindRose direction={wind.currentDirection} speed={wind.currentSpeed} label={wind.currentDirectionLabel} />
              <div className="flex-1 space-y-2 text-sm">
                <Row label="Prevailing wind" value={wind.prevailingWind} />
                <Row label="Current speed"   value={`${wind.currentSpeed} km/h`} />
                <Row label="Max today"        value={`${wind.maxSpeed} km/h`} />
                <Row label="Humidity"         value={`${wind.avgHumidity}%`} />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3 border-t border-earth-100 pt-3">
              {wind.naturalVentilationAdvice}
            </p>
          </div>
        )}

        {/* Solar Chart */}
        {solar && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Sun size={15} className="text-yellow-500" /> Monthly Solar Irradiance
            </h3>
            <SolarChart monthly={solar.monthlySolarKWh} peakSunHours={solar.peakSunHours} />
            <p className="text-xs text-gray-500 mt-2">{solar.bestBuildingOrientation}</p>
            <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              solar.uvIndex === "Very High" ? "bg-red-100 text-red-700" :
              solar.uvIndex === "High" ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"
            }`}>UV Index: {solar.uvIndex}</span>
          </div>
        )}
      </div>

      {/* ── ENS Score ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800">ENS Compliance Score (Estimated)</h3>
          <span className="text-xs bg-earth-100 text-earth-700 px-2.5 py-1 rounded-full">
            Target: {ensTarget} pts minimum
          </span>
        </div>
        <div className="h-3 bg-earth-100 rounded-full overflow-hidden">
          <div className="h-full bg-forest-500 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, ((ensScore ?? 0) / 220) * 100)}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1.5">
          <span className="font-medium text-forest-700">{ensScore} pts estimated</span>
          <span>220 pts maximum</span>
        </div>
        <p className="text-xs text-gray-400 mt-2 flex items-start gap-1">
          <Info size={12} className="mt-0.5 shrink-0" />
          Full score is calculated once material choices are finalised in Phase 2 of the build.
        </p>
      </div>

      {/* ── Zone Strategy ── */}
      {zoneInfo && (
        <div className="card border-l-4" style={{ borderLeftColor: zoneInfo.color }}>
          <h3 className="font-semibold text-gray-800 mb-2">Design Strategy for {zoneInfo.label} Zone</h3>
          <p className="text-sm text-gray-600">{zoneInfo.thermalStrategy}</p>
        </div>
      )}

      {/* ── Layout Rules ── */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">ENS Layout Recommendations</h3>
        <div className="space-y-2.5">
          {layoutRules.map((rule, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <CheckCircle size={15} className="text-forest-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-forest-700 mr-2">{rule.category}</span>
                <span className="text-sm text-gray-700">{rule.rule}</span>
                <div className="text-xs text-gray-400 mt-0.5">{rule.ensClause}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Material Recommendations ── */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Material Specifications</h3>
        <div className="space-y-4">
          {materials.map((m) => (
            <div key={m.element} className="border border-earth-100 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-forest-700 uppercase tracking-wide">{m.element}</span>
                <span className="text-xs bg-earth-100 text-earth-700 px-2 py-0.5 rounded-full">{m.uValue}</span>
              </div>
              <p className="text-sm text-gray-700">{m.recommendation}</p>
              <p className="text-xs text-gray-400 mt-1">{m.notes}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={() => navigate("/wizard/step2")} className="btn-secondary flex items-center gap-2">
          <ArrowLeft size={16} /> Back
        </button>
        <button onClick={() => navigate("/wizard/step4")} className="btn-primary flex items-center gap-2">
          Next: Style & Budget <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="card flex flex-col gap-1 p-4">
      <Icon size={17} className={color} />
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xl font-bold text-gray-900">{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}
