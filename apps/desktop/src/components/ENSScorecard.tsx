/**
 * ENS Scorecard — visual breakdown of ENS score by category
 */
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import type { ENSScoreResult } from "@ecohomes/ens-engine";
import clsx from "clsx";

interface Props {
  result: ENSScoreResult;
}

const GRADE_STYLES = {
  "Non-Compliant": "bg-red-50 border-red-300 text-red-800",
  "Compliant":     "bg-yellow-50 border-yellow-300 text-yellow-800",
  "Good":          "bg-blue-50 border-blue-300 text-blue-800",
  "Excellent":     "bg-forest-50 border-forest-300 text-forest-800",
};

const GRADE_BAR = {
  "Non-Compliant": "bg-red-400",
  "Compliant":     "bg-yellow-400",
  "Good":          "bg-blue-500",
  "Excellent":     "bg-forest-500",
};

export default function ENSScorecard({ result }: Props) {
  const pct = Math.round((result.total / 220) * 100);

  return (
    <div className="space-y-5">
      {/* Total score hero */}
      <div className={clsx("rounded-xl border-2 px-6 py-5", GRADE_STYLES[result.grade])}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-3xl font-bold">{result.total} <span className="text-base font-normal opacity-70">/ 220 pts</span></div>
            <div className="text-sm font-medium mt-0.5">
              Grade: <strong>{result.grade}</strong> · Target: {result.target} pts minimum
            </div>
          </div>
          <div className={clsx("text-4xl font-black opacity-80")}>
            {result.compliant ? "✓" : "✗"}
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-2.5 bg-white/50 rounded-full overflow-hidden">
          <div
            className={clsx("h-full rounded-full transition-all duration-700", GRADE_BAR[result.grade])}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1 opacity-70">
          <span>0</span>
          <span>Target: {result.target}</span>
          <span>220 max</span>
        </div>
      </div>

      {/* Energy savings */}
      <div className="card bg-gradient-to-r from-forest-50 to-earth-50 flex items-center gap-4 p-4">
        <div className="text-4xl font-black text-forest-600">{result.energySavingPercent}%</div>
        <div>
          <div className="font-semibold text-gray-800">Estimated Energy Saving</div>
          <div className="text-sm text-gray-500">vs. a conventional non-ENS building of same size</div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800">Score Breakdown</h3>
        {result.categories.map((cat) => {
          const catTotal = cat.mandatory + cat.additional;
          const catPct = Math.round((catTotal / cat.maxTotal) * 100);
          return (
            <div key={cat.name} className="card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                <span className="text-sm font-bold text-gray-900">{catTotal} / {cat.maxTotal} pts</span>
              </div>
              <div className="h-2 bg-earth-100 rounded-full overflow-hidden">
                <div className="h-full bg-forest-400 rounded-full" style={{ width: `${catPct}%` }} />
              </div>
              <div className="flex gap-2 text-xs text-gray-500">
                <span>Mandatory: {cat.mandatory}/{cat.maxMandatory}</span>
                {cat.maxAdditional > 0 && <span>· Additional: {cat.additional}/{cat.maxAdditional}</span>}
              </div>
              {/* Items */}
              <div className="space-y-1 pt-1 border-t border-earth-50">
                {cat.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    {item.achieved
                      ? <CheckCircle size={12} className="text-forest-500 mt-0.5 shrink-0" />
                      : <XCircle    size={12} className="text-gray-300 mt-0.5 shrink-0" />}
                    <div className={item.achieved ? "text-gray-700" : "text-gray-400"}>
                      {item.label}
                      <span className="ml-1 font-semibold">{item.achieved ? `+${item.points}` : `(${item.points} pts)`}</span>
                      <span className="ml-1 text-gray-300">· {item.clause}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mandatory checklist */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-3">Mandatory Requirements Checklist</h3>
        <div className="space-y-2">
          {result.mandatoryChecklist.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              {item.met
                ? <CheckCircle  size={15} className="text-forest-500 mt-0.5 shrink-0" />
                : <AlertCircle  size={15} className="text-red-400 mt-0.5 shrink-0" />}
              <div>
                <span className={item.met ? "text-gray-700" : "text-red-600 font-medium"}>{item.requirement}</span>
                <span className="text-xs text-gray-400 ml-2">{item.clause}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
