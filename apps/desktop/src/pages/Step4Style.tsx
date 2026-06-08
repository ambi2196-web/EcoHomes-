import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useProjectStore, ArchStyle, BudgetRange } from "../store/projectStore";
import clsx from "clsx";

const STYLES: { value: ArchStyle; label: string; desc: string; emoji: string }[] = [
  { value: "modern",      label: "Modern",      emoji: "🏢", desc: "Clean lines, flat roofs, large windows, minimalist facade" },
  { value: "traditional", label: "Traditional", emoji: "🏠", desc: "Sloped roof, decorative elements, classic Indian craftsmanship" },
  { value: "vernacular",  label: "Vernacular",  emoji: "🏡", desc: "Local materials, adapted to regional climate and culture" },
  { value: "minimalist",  label: "Minimalist",  emoji: "◻️", desc: "Less is more — simple form, natural materials, no clutter" },
];

const BUDGETS: { value: BudgetRange; label: string; range: string }[] = [
  { value: "under_30L", label: "Budget",    range: "Under ₹30 Lakh" },
  { value: "30L_60L",   label: "Standard",  range: "₹30L – ₹60L" },
  { value: "60L_1Cr",   label: "Premium",   range: "₹60L – ₹1 Cr" },
  { value: "above_1Cr", label: "Luxury",    range: "Above ₹1 Cr" },
];

export default function Step4Style() {
  const navigate = useNavigate();
  const { style, budget, setStyle, setBudget } = useProjectStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Your Style & Budget</h2>
        <p className="text-gray-500 mt-1">
          This helps us tailor material choices, finishes, and design suggestions to what you actually want.
        </p>
      </div>

      {/* Style */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-800">Architectural Style</h3>
        <div className="grid grid-cols-2 gap-3">
          {STYLES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStyle(s.value)}
              className={clsx(
                "p-4 rounded-xl border text-left transition-all",
                style === s.value
                  ? "border-forest-500 bg-forest-50 ring-1 ring-forest-400"
                  : "border-earth-200 hover:border-earth-400 bg-white"
              )}
            >
              <span className="text-2xl">{s.emoji}</span>
              <div className="font-semibold text-gray-800 mt-2">{s.label}</div>
              <div className="text-xs text-gray-500 mt-1">{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-800">Budget Range</h3>
        <div className="grid grid-cols-2 gap-3">
          {BUDGETS.map((b) => (
            <button
              key={b.value}
              onClick={() => setBudget(b.value)}
              className={clsx(
                "p-4 rounded-xl border text-left transition-all",
                budget === b.value
                  ? "border-forest-500 bg-forest-50 ring-1 ring-forest-400"
                  : "border-earth-200 hover:border-earth-400 bg-white"
              )}
            >
              <div className="font-semibold text-gray-800">{b.label}</div>
              <div className="text-sm text-gray-500 mt-0.5">{b.range}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={() => navigate("/wizard/step3")} className="btn-secondary flex items-center gap-2">
          <ArrowLeft size={16} /> Back
        </button>
        <button
          onClick={() => navigate("/wizard/step5")}
          disabled={!style || !budget}
          className="btn-primary flex items-center gap-2"
        >
          Generate Prototype <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
