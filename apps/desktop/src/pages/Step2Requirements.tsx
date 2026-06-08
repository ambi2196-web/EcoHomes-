import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useProjectStore } from "../store/projectStore";

const FACING_OPTIONS = ["north", "south", "east", "west"] as const;
const BUILDING_TYPES = [
  { value: "low_rise",   label: "Low-Rise (≤4 floors)",  target: "47 pts" },
  { value: "affordable", label: "Affordable Housing",     target: "70 pts" },
  { value: "high_rise",  label: "High-Rise (>4 floors)", target: "100 pts" },
] as const;

export default function Step2Requirements() {
  const navigate = useNavigate();
  const { requirements, setRequirements } = useProjectStore();

  const r = requirements;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">What do you need?</h2>
        <p className="text-gray-500 mt-1">
          Tell us about your plot and space requirements so we can generate an ENS-compliant layout.
        </p>
      </div>

      {/* Plot details */}
      <div className="card space-y-5">
        <h3 className="font-semibold text-gray-800">Plot Details</h3>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Plot Area (m²)">
            <input
              type="number"
              value={r.plotAreaSqm}
              onChange={(e) => setRequirements({ plotAreaSqm: +e.target.value })}
              min={50} max={5000}
              className="input"
            />
          </Field>
          <Field label="Number of Floors">
            <input
              type="number"
              value={r.floors}
              onChange={(e) => setRequirements({ floors: +e.target.value })}
              min={1} max={15}
              className="input"
            />
          </Field>
        </div>

        <Field label="Plot Facing">
          <div className="flex gap-2 flex-wrap">
            {FACING_OPTIONS.map((f) => (
              <button
                key={f}
                onClick={() => setRequirements({ plotFacing: f })}
                className={`px-4 py-2 rounded-lg border text-sm font-medium capitalize transition-colors ${
                  r.plotFacing === f
                    ? "bg-forest-600 text-white border-forest-600"
                    : "bg-white text-gray-600 border-earth-200 hover:border-forest-400"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Building Type (sets ENS compliance target)">
          <div className="flex gap-3 flex-wrap">
            {BUILDING_TYPES.map((bt) => (
              <button
                key={bt.value}
                onClick={() => setRequirements({ buildingType: bt.value })}
                className={`px-4 py-2.5 rounded-lg border text-sm transition-colors text-left ${
                  r.buildingType === bt.value
                    ? "bg-forest-600 text-white border-forest-600"
                    : "bg-white text-gray-600 border-earth-200 hover:border-forest-400"
                }`}
              >
                <div className="font-medium">{bt.label}</div>
                <div className={`text-xs mt-0.5 ${r.buildingType === bt.value ? "text-forest-100" : "text-gray-400"}`}>
                  ENS target: {bt.target}
                </div>
              </button>
            ))}
          </div>
        </Field>
      </div>

      {/* Rooms */}
      <div className="card space-y-5">
        <h3 className="font-semibold text-gray-800">Rooms</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Counter label="Bedrooms"     value={r.bedrooms}    min={1} max={10} onChange={(v) => setRequirements({ bedrooms: v })} />
          <Counter label="Bathrooms"    value={r.bathrooms}   min={1} max={10} onChange={(v) => setRequirements({ bathrooms: v })} />
          <Counter label="Living Rooms" value={r.livingRooms} min={1} max={3}  onChange={(v) => setRequirements({ livingRooms: v })} />
          <Counter label="Kitchens"     value={r.kitchen}     min={1} max={2}  onChange={(v) => setRequirements({ kitchen: v })} />
          <Counter label="Parking Bays" value={r.parkingBays} min={0} max={5}  onChange={(v) => setRequirements({ parkingBays: v })} />
          <Counter label="Open Space %" value={r.openSpacePercent} min={0} max={60} step={5} onChange={(v) => setRequirements({ openSpacePercent: v })} />
        </div>
      </div>

      {/* Special needs */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-800">Special Considerations</h3>
        <div className="space-y-3">
          <Toggle
            label="Elderly or mobility-impaired family members"
            desc="Wider doors, single-floor design suggestions"
            value={r.hasElderly}
            onChange={(v) => setRequirements({ hasElderly: v })}
          />
          <Toggle
            label="Home office / work-from-home space"
            desc="North-facing quiet room, good natural light"
            value={r.hasHomeOffice}
            onChange={(v) => setRequirements({ hasHomeOffice: v })}
          />
          <Toggle
            label="Vastu Shastra preference"
            desc="Suggestions aligned with Vastu principles"
            value={r.vastuPreference}
            onChange={(v) => setRequirements({ vastuPreference: v })}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={() => navigate("/wizard/step1")} className="btn-secondary flex items-center gap-2">
          <ArrowLeft size={16} /> Back
        </button>
        <button onClick={() => navigate("/wizard/step3")} className="btn-primary flex items-center gap-2">
          Next: Analysis <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function Counter({
  label, value, min, max, step = 1, onChange,
}: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="border border-earth-200 rounded-lg p-3 flex flex-col gap-2">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-7 h-7 rounded-md border border-earth-200 text-gray-600 hover:bg-earth-50 flex items-center justify-center font-bold"
        >−</button>
        <span className="flex-1 text-center font-semibold text-gray-900">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-7 h-7 rounded-md border border-earth-200 text-gray-600 hover:bg-earth-50 flex items-center justify-center font-bold"
        >+</button>
      </div>
    </div>
  );
}

function Toggle({
  label, desc, value, onChange,
}: {
  label: string; desc: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div
      className={`flex items-start justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
        value ? "bg-forest-50 border-forest-300" : "bg-white border-earth-200 hover:border-earth-300"
      }`}
      onClick={() => onChange(!value)}
    >
      <div>
        <div className="text-sm font-medium text-gray-800">{label}</div>
        <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
      </div>
      <div className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors shrink-0 ml-4 ${value ? "bg-forest-500 justify-end" : "bg-gray-200 justify-start"}`}>
        <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
      </div>
    </div>
  );
}
