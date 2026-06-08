/**
 * WindRose — SVG wind direction indicator
 */
interface Props {
  direction: number;   // degrees, 0 = North
  speed: number;       // km/h
  label: string;       // cardinal label e.g. "SW"
}

const CARDINALS = ["N","NE","E","SE","S","SW","W","NW"];

export default function WindRose({ direction, speed, label }: Props) {
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const r = 50;

  // Arrow points from centre outward in the wind direction
  const rad = ((direction - 90) * Math.PI) / 180; // rotate so 0° = top
  const arrowX = cx + r * Math.cos(rad);
  const arrowY = cy + r * Math.sin(rad);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle cx={cx} cy={cy} r={r + 10} fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={r}      fill="none"    stroke="#86efac" strokeWidth="1" strokeDasharray="4 3" />

        {/* Cardinal labels */}
        {CARDINALS.map((c, i) => {
          const a = ((i * 45 - 90) * Math.PI) / 180;
          const lx = cx + (r + 14) * Math.cos(a);
          const ly = cy + (r + 14) * Math.sin(a);
          return (
            <text key={c} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
              fontSize="8" fill={c === "N" ? "#15803d" : "#6b7280"} fontWeight={c === "N" ? "700" : "400"}>
              {c}
            </text>
          );
        })}

        {/* Wind arrow */}
        <line
          x1={cx} y1={cy}
          x2={arrowX} y2={arrowY}
          stroke="#16a34a" strokeWidth="3" strokeLinecap="round"
        />
        {/* Arrowhead */}
        <circle cx={arrowX} cy={arrowY} r="4" fill="#16a34a" />
        {/* Centre dot */}
        <circle cx={cx} cy={cy} r="3" fill="#374151" />
      </svg>
      <div className="text-center">
        <div className="text-sm font-bold text-gray-800">{label}</div>
        <div className="text-xs text-gray-500">{speed} km/h</div>
      </div>
    </div>
  );
}
