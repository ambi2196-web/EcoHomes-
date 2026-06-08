import { useNavigate } from "react-router-dom";
import { Leaf, Sun, Wind, Thermometer, ArrowRight } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-earth-50 to-sky-50 flex flex-col">
      {/* Nav */}
      <nav className="px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Leaf size={24} className="text-forest-600" />
          <span className="text-xl font-bold text-gray-900">EcoHomes</span>
        </div>
        <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border border-earth-200">
          Based on ENS Guidelines · BEE, Govt. of India
        </span>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
        <div className="max-w-2xl">
          <span className="inline-block bg-forest-100 text-forest-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            Eco Niwas Samhita · Climate-Adaptive Homes
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Build a home that works{" "}
            <span className="text-forest-600">with nature,</span>{" "}
            not against it
          </h1>
          <p className="text-lg text-gray-600 mb-10 leading-relaxed">
            Enter your plot location and requirements. Get layout suggestions,
            material recommendations, and a predicted indoor temperature — all
            based on government ENS guidelines — before you spend a rupee on
            an architect.
          </p>
          <button
            onClick={() => navigate("/wizard")}
            className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3"
          >
            Start Planning <ArrowRight size={18} />
          </button>
        </div>

        {/* Feature pills */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl w-full">
          {[
            { icon: Sun,         label: "Sunlight Analysis",     desc: "Optimal room orientation" },
            { icon: Wind,        label: "Natural Ventilation",    desc: "Air flow per ENS norms" },
            { icon: Thermometer, label: "Thermal Comfort",        desc: "Predicted indoor temp" },
            { icon: Leaf,        label: "ENS Compliance",         desc: "Score 47–220 points" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="card flex flex-col items-center text-center gap-2 p-4">
              <Icon size={24} className="text-forest-500" />
              <span className="font-semibold text-sm text-gray-800">{label}</span>
              <span className="text-xs text-gray-500">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
