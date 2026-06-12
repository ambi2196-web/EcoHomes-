import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, MapPin, ClipboardList, BarChart2, Palette, FileImage, MessageSquare } from "lucide-react";
import clsx from "clsx";

const STEPS = [
  { path: "step1", label: "Location",     icon: MapPin,          phase: 1 },
  { path: "step2", label: "Requirements", icon: ClipboardList,   phase: 1 },
  { path: "step3", label: "Analysis",     icon: BarChart2,       phase: 2 },
  { path: "step4", label: "Style",        icon: Palette,         phase: 2 },
  { path: "step5", label: "Prototype",    icon: FileImage,       phase: 2 },
  { path: "step6", label: "AI Consult",   icon: MessageSquare,   phase: 3 },
];

export default function WizardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentStep = STEPS.findIndex((s) =>
    location.pathname.includes(s.path)
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-earth-100 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate("/")}
          className="p-2 rounded-lg hover:bg-earth-50 transition-colors"
        >
          <Home size={20} className="text-forest-600" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">EcoHomes</h1>
          <p className="text-xs text-gray-500">Climate-Adaptive Home Planner · ENS Guidelines</p>
        </div>
      </header>

      {/* Step progress bar */}
      <div className="bg-white border-b border-earth-100 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === currentStep;
            const isDone = i < currentStep;
            return (
              <div key={step.path} className="flex items-center gap-2 flex-1 min-w-0">
                <button
                  onClick={() => isDone && navigate(`/wizard/${step.path}`)}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors truncate",
                    isActive && "bg-forest-600 text-white",
                    isDone && "bg-forest-100 text-forest-700 hover:bg-forest-200 cursor-pointer",
                    !isActive && !isDone && "text-gray-400 cursor-default"
                  )}
                >
                  <Icon size={15} className="shrink-0" />
                  <span className="truncate">{step.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={clsx(
                      "h-px flex-1 min-w-[8px]",
                      i < currentStep ? "bg-forest-300" : "bg-earth-200"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Page content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
