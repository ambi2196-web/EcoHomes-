/**
 * SolarChart — Monthly solar irradiance bar chart (pure SVG, no dependencies)
 */
interface Props {
  monthly: Record<string, number>; // { Jan: 5.2, Feb: 5.8, ... }
  peakSunHours: number;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const BAR_COLORS = ["#fbbf24","#f59e0b","#fcd34d","#fbbf24","#f97316","#ef4444",
                    "#3b82f6","#6366f1","#22c55e","#f59e0b","#fbbf24","#f59e0b"];

export default function SolarChart({ monthly, peakSunHours }: Props) {
  const W = 340, H = 140;
  const padL = 28, padB = 24, padT = 12, padR = 8;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const values = MONTHS.map((m) => monthly[m] ?? peakSunHours);
  const maxVal = Math.max(...values, 1);
  const barW = chartW / MONTHS.length;

  return (
    <div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
        {/* Y gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = padT + chartH * (1 - pct);
          const val = (maxVal * pct).toFixed(1);
          return (
            <g key={pct}>
              <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
              <text x={padL - 3} y={y + 1} textAnchor="end" fontSize="7" fill="#9ca3af" dominantBaseline="middle">
                {val}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {values.map((val, i) => {
          const barH = (val / maxVal) * chartH;
          const x = padL + i * barW + barW * 0.15;
          const y = padT + chartH - barH;
          return (
            <g key={MONTHS[i]}>
              <rect x={x} y={y} width={barW * 0.7} height={barH}
                fill={BAR_COLORS[i]} rx="2" opacity="0.85" />
              <text x={x + barW * 0.35} y={H - padB + 10} textAnchor="middle" fontSize="7" fill="#6b7280">
                {MONTHS[i].slice(0, 1)}
              </text>
            </g>
          );
        })}

        {/* Axis line */}
        <line x1={padL} x2={W - padR} y1={padT + chartH} y2={padT + chartH} stroke="#d1d5db" strokeWidth="1" />
        <line x1={padL} x2={padL} y1={padT} y2={padT + chartH} stroke="#d1d5db" strokeWidth="1" />

        {/* Y-axis label */}
        <text
          transform={`translate(8, ${padT + chartH / 2}) rotate(-90)`}
          textAnchor="middle" fontSize="7" fill="#9ca3af">
          kWh/m²/day
        </text>
      </svg>
    </div>
  );
}
