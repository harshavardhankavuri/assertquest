interface BarChartProps {
  title: string;
  bars: { label: string; value: number }[];
  formatValue: (value: number) => string;
  color: string;
}

const BAR_HEIGHT = 20;
const BAR_GAP = 8;
const CHART_WIDTH = 480;
const LABEL_WIDTH = 90;

// Single-measure, single-axis bar chart (FR-1301) — one hue, thin marks, rounded
// data-ends, selective direct labels. Deliberately never combines shipment count
// and revenue in one chart (two different scales) — render two of these instead.
export function BarChart({ title, bars, formatValue, color }: BarChartProps) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  const plotWidth = CHART_WIDTH - LABEL_WIDTH;
  const height = bars.length * (BAR_HEIGHT + BAR_GAP);

  return (
    <figure className="rounded-xl border border-hairline bg-white p-4 shadow-card">
      <figcaption className="mb-3 text-sm font-semibold text-ink-900">{title}</figcaption>
      {bars.length === 0 ? (
        <p className="text-sm text-muted">No data for this range.</p>
      ) : (
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${height}`}
          role="img"
          aria-label={`${title}: ${bars.map((b) => `${b.label} ${formatValue(b.value)}`).join(", ")}`}
          style={{ width: "100%", maxWidth: CHART_WIDTH }}
        >
          {bars.map((bar, i) => {
            const barWidth = (bar.value / max) * (plotWidth - 8);
            const y = i * (BAR_HEIGHT + BAR_GAP);
            return (
              <g key={bar.label}>
                <text x={0} y={y + BAR_HEIGHT / 2} dominantBaseline="middle" fontSize={11} fill="#6b757e">
                  {bar.label}
                </text>
                <rect
                  x={LABEL_WIDTH}
                  y={y}
                  width={Math.max(barWidth, 2)}
                  height={BAR_HEIGHT}
                  rx={4}
                  fill={color}
                >
                  <title>
                    {bar.label}: {formatValue(bar.value)}
                  </title>
                </rect>
                <text
                  x={LABEL_WIDTH + barWidth + 6}
                  y={y + BAR_HEIGHT / 2}
                  dominantBaseline="middle"
                  fontSize={11}
                  fill="#6b757e"
                >
                  {formatValue(bar.value)}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </figure>
  );
}
