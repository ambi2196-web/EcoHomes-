import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, RefreshCw, Loader2, BarChart2, Layout, FileText } from "lucide-react";
import { useProjectStore } from "../store/projectStore";
import ENSScorecard from "../components/ENSScorecard";
import {
  generateFloorPlan,
  renderFloorPlanSVG,
  calculateENSScore,
  defaultScoringInput,
} from "@ecohomes/ens-engine";

type Tab = "floorplan" | "score" | "summary";

export default function Step5Prototype() {
  const navigate = useNavigate();
  const store = useProjectStore();
  const { requirements, climateData, location, style, budget } = store;

  const [loading, setLoading] = useState(true);
  const [svg, setSvg] = useState("");
  const [scoreResult, setScoreResult] = useState<any>(null);
  const [floorPlan, setFloorPlan] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>("floorplan");

  useEffect(() => { generate(); }, []);

  function generate() {
    setLoading(true);
    setTimeout(() => {
      // Generate floor plan
      const plan = generateFloorPlan({
        bedrooms:         requirements.bedrooms,
        bathrooms:        requirements.bathrooms,
        livingRooms:      requirements.livingRooms,
        kitchen:          requirements.kitchen,
        parkingBays:      requirements.parkingBays,
        hasHomeOffice:    requirements.hasHomeOffice,
        hasElderly:       requirements.hasElderly,
        vastuPreference:  requirements.vastuPreference,
        plotAreaSqm:      requirements.plotAreaSqm,
        plotFacing:       requirements.plotFacing,
        floors:           requirements.floors,
        climateZone:      climateData?.zone ?? "composite",
        openSpacePercent: requirements.openSpacePercent,
      });

      const planSvg = renderFloorPlanSVG(plan, 70);
      setSvg(planSvg);
      setFloorPlan(plan);
      store.setFloorPlan(planSvg);

      // Calculate ENS score
      const scoringInput = defaultScoringInput(
        requirements.buildingType ?? "low_rise",
        requirements.floors,
        requirements.plotAreaSqm,
        climateData?.zone ?? "composite"
      );
      const result = calculateENSScore(scoringInput);
      setScoreResult(result);

      store.setAnalysisResults({
        ensScore: result.total,
        layoutSuggestions: store.layoutSuggestions,
        materialRecommendations: store.materialRecommendations,
        predictedIndoorTemp: store.predictedIndoorTemp ?? 28,
      });

      setLoading(false);
    }, 600);
  }

  function downloadSVG() {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "ecohomes-floorplan.svg";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadReport() {
    if (!scoreResult || !floorPlan) return;
    const report = buildTextReport(floorPlan, scoreResult, store);
    const blob = new Blob([report], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "ecohomes-ens-report.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 size={44} className="animate-spin text-forest-500" />
        <p className="text-gray-700 font-medium">Generating ENS-compliant floor plan…</p>
        <p className="text-sm text-gray-400">Applying climate zone rules and scoring engine</p>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: "floorplan", label: "Floor Plan",  icon: Layout    },
    { id: "score",     label: "ENS Score",   icon: BarChart2 },
    { id: "summary",   label: "Summary",     icon: FileText  },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your EcoHome Prototype</h2>
          <p className="text-gray-500 mt-0.5">
            ENS-compliant floor plan · {climateData?.zone?.replace("_", " ")} zone ·{" "}
            {style} style · {budget?.replace(/_/g, " ")}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={generate}       className="btn-secondary flex items-center gap-1.5 text-sm"><RefreshCw size={13} /> Regenerate</button>
          <button onClick={downloadSVG}    className="btn-secondary flex items-center gap-1.5 text-sm"><Download  size={13} /> Floor Plan SVG</button>
          <button onClick={downloadReport} className="btn-primary   flex items-center gap-1.5 text-sm"><Download  size={13} /> ENS Report</button>
        </div>
      </div>

      {/* Score hero strip */}
      {scoreResult && (
        <div className={`rounded-xl px-5 py-3 flex items-center justify-between flex-wrap gap-3
          ${scoreResult.compliant ? "bg-forest-50 border border-forest-200" : "bg-red-50 border border-red-200"}`}>
          <div className="flex items-center gap-3">
            <span className={`text-2xl font-black ${scoreResult.compliant ? "text-forest-700" : "text-red-600"}`}>
              {scoreResult.total} pts
            </span>
            <div>
              <div className={`text-sm font-semibold ${scoreResult.compliant ? "text-forest-800" : "text-red-700"}`}>
                {scoreResult.grade} · {scoreResult.compliant ? "✓ ENS Compliant" : "✗ Below target"}
              </div>
              <div className="text-xs text-gray-500">Target: {scoreResult.target} pts minimum</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-forest-600">{scoreResult.energySavingPercent}%</div>
            <div className="text-xs text-gray-500">energy saving vs conventional</div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 bg-earth-100 p-1 rounded-xl">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors
              ${activeTab === id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Floor Plan ─────────────────────────────────────── */}
      {activeTab === "floorplan" && (
        <div className="space-y-4">
          <div className="card p-0 overflow-hidden">
            <div className="overflow-auto" dangerouslySetInnerHTML={{ __html: svg }} />
          </div>

          {/* Room list */}
          {floorPlan && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-3">Room Schedule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {floorPlan.rooms.map((room: any) => (
                  <div key={room.id} className="flex items-start gap-2 p-2 rounded-lg border border-earth-100">
                    <div className="w-3 h-3 rounded mt-0.5 shrink-0"
                      style={{ background: { living: "#d1fae5", bedroom: "#fce7f3", kitchen: "#fef9c3", bathroom: "#dbeafe", parking: "#f3e8ff", office: "#ffedd5", utility: "#f1f5f9" }[room.type as string] || "#f1f5f9" }} />
                    <div>
                      <div className="text-sm font-medium text-gray-800">{room.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{room.notes}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-earth-100 grid grid-cols-3 gap-2 text-center text-sm">
                <div><span className="font-semibold text-gray-800">{floorPlan.plotWidthM}m × {floorPlan.plotDepthM}m</span><div className="text-xs text-gray-500">Plot dimensions</div></div>
                <div><span className="font-semibold text-gray-800">{floorPlan.openSpaceM2} m²</span><div className="text-xs text-gray-500">Open space</div></div>
                <div><span className="font-semibold text-gray-800">{floorPlan.floors}</span><div className="text-xs text-gray-500">Floor{floorPlan.floors > 1 ? "s" : ""}</div></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: ENS Score ──────────────────────────────────────── */}
      {activeTab === "score" && scoreResult && (
        <ENSScorecard result={scoreResult} />
      )}

      {/* ── Tab: Summary ───────────────────────────────────────── */}
      {activeTab === "summary" && (
        <div className="space-y-4">
          <SummaryRow label="Location"       value={`${location?.city || "–"}, ${location?.state || "–"}`} />
          <SummaryRow label="Climate Zone"   value={climateData?.zone?.replace(/_/g, " ") || "–"} />
          <SummaryRow label="Building Type"  value={requirements.buildingType?.replace(/_/g, " ") || "–"} />
          <SummaryRow label="Plot Area"      value={`${requirements.plotAreaSqm} m²`} />
          <SummaryRow label="Floors"         value={String(requirements.floors)} />
          <SummaryRow label="Bedrooms"       value={String(requirements.bedrooms)} />
          <SummaryRow label="Parking Bays"   value={String(requirements.parkingBays)} />
          <SummaryRow label="Arch Style"     value={style?.replace(/_/g, " ") || "–"} />
          <SummaryRow label="Budget"         value={budget?.replace(/_/g, " ") || "–"} />
          <SummaryRow label="ENS Score"      value={scoreResult ? `${scoreResult.total} / 220 pts (${scoreResult.grade})` : "–"} />
          <SummaryRow label="Energy Saving"  value={scoreResult ? `~${scoreResult.energySavingPercent}% vs conventional` : "–"} />
          <SummaryRow label="Indoor Temp"    value={store.predictedIndoorTemp ? `${store.predictedIndoorTemp}°C (with ENS design)` : "–"} />
          <SummaryRow label="Peak Sun Hours" value={climateData?.peakSunHours ? `${climateData.peakSunHours} hrs/day` : "–"} />
          <SummaryRow label="Prevailing Wind" value={climateData?.prevailingWind || "–"} />

          <div className="bg-forest-50 border border-forest-200 rounded-xl p-5 text-center space-y-2 mt-4">
            <h3 className="font-semibold text-forest-900">Next Steps</h3>
            <p className="text-sm text-forest-700">
              Share this prototype and ENS report with your architect as a starting brief.
              Phase 3 adds AI consultation for personalised material upgrades and Phase 4 adds 3D preview.
            </p>
            <button onClick={() => store.reset()} className="btn-secondary text-sm mt-2">Start a new project</button>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button onClick={() => navigate("/wizard/step4")} className="btn-secondary flex items-center gap-2">
          <ArrowLeft size={16} /> Back
        </button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-earth-100 capitalize">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-800">{value}</span>
    </div>
  );
}

function buildTextReport(floorPlan: any, scoreResult: any, store: any): string {
  const { location, requirements, climateData, style, budget } = store;
  const lines = [
    "═══════════════════════════════════════════════════",
    "  ECOHOMES — ENS COMPLIANCE REPORT",
    "  Based on Eco Niwas Samhita 2018 (Part I) &",
    "  ENS 2021 (Part II) — Bureau of Energy Efficiency",
    "═══════════════════════════════════════════════════",
    "",
    `Location    : ${location?.city || "–"}, ${location?.state || "–"}`,
    `Lat / Lng   : ${location?.lat?.toFixed(4)}, ${location?.lng?.toFixed(4)}`,
    `Climate Zone: ${climateData?.zone?.replace(/_/g, " ") || "–"}`,
    "",
    "── BUILDING DETAILS ─────────────────────────────",
    `Plot Area   : ${requirements.plotAreaSqm} m²`,
    `Floors      : ${requirements.floors}`,
    `Type        : ${requirements.buildingType?.replace(/_/g, " ")}`,
    `Bedrooms    : ${requirements.bedrooms}`,
    `Bathrooms   : ${requirements.bathrooms}`,
    `Parking     : ${requirements.parkingBays} bay(s)`,
    `Open Space  : ${requirements.openSpacePercent}%`,
    `Style       : ${style?.replace(/_/g, " ")}`,
    `Budget      : ${budget?.replace(/_/g, " ")}`,
    "",
    "── ENS SCORE ────────────────────────────────────",
    `Total Score : ${scoreResult.total} / 220 pts`,
    `Grade       : ${scoreResult.grade}`,
    `Compliant   : ${scoreResult.compliant ? "YES ✓" : "NO ✗"}`,
    `Target      : ${scoreResult.target} pts minimum`,
    `Energy Save : ~${scoreResult.energySavingPercent}% vs conventional build`,
    "",
    "── SCORE BY CATEGORY ────────────────────────────",
    ...scoreResult.categories.map((c: any) =>
      `  ${c.name.padEnd(25)} ${(c.mandatory + c.additional).toString().padStart(3)} / ${c.maxTotal} pts`),
    "",
    "── MANDATORY REQUIREMENTS ───────────────────────",
    ...scoreResult.mandatoryChecklist.map((c: any) =>
      `  [${c.met ? "✓" : "✗"}] ${c.requirement}`),
    "",
    "── FLOOR PLAN ───────────────────────────────────",
    `Plot        : ${floorPlan.plotWidthM}m × ${floorPlan.plotDepthM}m`,
    `Orientation : ${floorPlan.orientation}`,
    `Open Space  : ${floorPlan.openSpaceM2} m²`,
    "",
    "Rooms:",
    ...floorPlan.rooms.map((r: any) => `  • ${r.label} (${r.facing} facing) — ${r.notes}`),
    "",
    "═══════════════════════════════════════════════════",
    "Generated by EcoHomes · github.com/ambi2196-web/EcoHomes-",
    "═══════════════════════════════════════════════════",
  ];
  return lines.join("\n");
}
