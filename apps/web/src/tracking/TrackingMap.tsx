import type { Shipment } from "@assertquest/shared";

const WIDTH = 360;
const HEIGHT = 180;

// Equirectangular projection — no map tiles or external API, consistent with this
// being a mocked GPS feed (FR-802) and the project's no-cloud-dependency goal.
function project(lat: number, lng: number): { x: number; y: number } {
  return { x: ((lng + 180) / 360) * WIDTH, y: ((90 - lat) / 180) * HEIGHT };
}

function pathFor(points: [number, number][]): string {
  return (
    points
      .map(([lat, lng], i) => {
        const { x, y } = project(lat, lng);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ") + " Z"
  );
}

// Hand-simplified continent silhouettes — still not a cartographic asset (no map
// tiles/external data, per the project's no-cloud-dependency goal), just enough
// coastline detail (bays, peninsulas, a few island nations) to read as a real map
// rather than blocky polygons.
const CONTINENTS: [number, number][][] = [
  // North America — Hudson Bay notch, Florida, Baja, Central America isthmus
  [
    [71, -156], [70, -141], [69, -125], [68, -110], [66, -95], [63, -90], [58, -93],
    [55, -85], [51, -80], [55, -90], [60, -77], [58, -68], [54, -57], [50, -56],
    [46, -60], [45, -66], [44, -63], [41, -71], [38, -75], [35, -76], [30, -81],
    [25, -80], [25, -82], [29, -90], [29, -95], [25, -97], [21, -97], [18, -95],
    [16, -93], [14, -92], [9, -83], [8, -78], [12, -83], [16, -88], [20, -97],
    [23, -110], [27, -114], [32, -117], [34, -120], [40, -124], [48, -125],
    [55, -133], [60, -140], [71, -156],
  ],
  // South America — Amazon bulge, Río de la Plata, Patagonian taper
  [
    [12, -72], [11, -68], [10, -62], [5, -52], [0, -50], [-5, -35], [-13, -39],
    [-23, -43], [-25, -48], [-30, -51], [-34, -58], [-38, -58], [-40, -62],
    [-45, -67], [-49, -68], [-52, -70], [-55, -68], [-53, -72], [-45, -74],
    [-38, -73], [-30, -71], [-24, -70], [-18, -70], [-10, -78], [-4, -81],
    [1, -80], [4, -77], [8, -77], [12, -72],
  ],
  // Europe — Iberia, Italian boot, Scandinavia, Baltic
  [
    [71, 25], [68, 20], [63, 21], [61, 17], [58, 11], [55, 9], [53, 8], [51, 4],
    [50, -2], [48, -4], [46, -1], [43, -1], [43, -9], [37, -9], [36, -6], [37, -1],
    [36, 3], [38, 8], [41, 8], [44, 8], [41, 15], [38, 16], [40, 18], [40, 20],
    [39, 23], [35, 24], [37, 27], [40, 26], [41, 29], [45, 29], [45, 38], [50, 38],
    [55, 40], [60, 30], [65, 25], [71, 25],
  ],
  // Africa — Horn of Africa, Red Sea taper, Cape
  [
    [37, 10], [35, 6], [33, -3], [31, -9], [28, -11], [24, -16], [15, -17],
    [12, -17], [7, -13], [4, -8], [5, 3], [2, 9], [-5, 8], [-13, 12], [-18, 12],
    [-23, 15], [-29, 17], [-34, 19], [-34, 22], [-30, 30], [-26, 33], [-20, 35],
    [-11, 40], [0, 42], [5, 46], [10, 51], [12, 43], [15, 42], [18, 38], [22, 38],
    [27, 34], [29, 33], [31, 32], [33, 26], [32, 20], [30, 20], [30, 25],
    [32, 25], [37, 10],
  ],
  // Asia — one continuous coastline walk: Bering Strait → Pacific coast → Indochina
  // /Malay peninsula → India → Arabia → Turkey → Ural → Siberian Arctic coast
  [
    [66, 173], [60, 166], [56, 160], [51, 157], [46, 142], [42, 131], [39, 124],
    [35, 127], [38, 125], [34, 119], [31, 121], [26, 120], [23, 113], [21, 110],
    [16, 108], [10, 106], [8, 105], [1, 104], [3, 101], [6, 99], [10, 99],
    [13, 100], [16, 94], [19, 94], [22, 91], [21, 88], [16, 81], [8, 77],
    [10, 76], [15, 74], [19, 72], [22, 69], [24, 67], [25, 62], [26, 56],
    [24, 52], [20, 50], [17, 47], [15, 43], [12, 44], [15, 42], [16, 42],
    [20, 40], [24, 37], [28, 34], [29, 34], [31, 34], [33, 35], [36, 33],
    [37, 36], [41, 29], [43, 40], [47, 48], [50, 55], [55, 60], [60, 60],
    [67, 70], [70, 75], [73, 80], [75, 95], [77, 105], [76, 120], [73, 140],
    [70, 150], [66, 173],
  ],
  // Australia
  [
    [-11, 131], [-12, 137], [-12, 143], [-16, 146], [-20, 149], [-25, 153],
    [-28, 153], [-33, 151], [-38, 147], [-39, 144], [-38, 140], [-35, 136],
    [-33, 134], [-32, 127], [-31, 119], [-25, 113], [-21, 114], [-17, 122],
    [-14, 126], [-11, 131],
  ],
  // Greenland
  [
    [83, -35], [82, -20], [76, -20], [70, -25], [66, -40], [61, -45], [63, -51],
    [68, -53], [72, -58], [77, -65], [82, -55], [83, -35],
  ],
];

// Small island nations — plotted as tiny closed blobs rather than full outlines.
const ISLANDS: { at: [number, number]; rx: number; ry: number; rotate?: number }[] = [
  { at: [54, -6], rx: 3, ry: 4.5 }, // Ireland / Great Britain
  { at: [64, -19], rx: 2.2, ry: 1.4 }, // Iceland
  { at: [36, 138], rx: 1.6, ry: 5, rotate: 25 }, // Japan
  { at: [-19, 47], rx: 1.4, ry: 4, rotate: -10 }, // Madagascar
  { at: [-2, 118], rx: 5, ry: 2 }, // Indonesia (Borneo/Sulawesi area)
  { at: [-6, 107], rx: 3, ry: 1 }, // Java/Sumatra
  { at: [-41, 173], rx: 1.6, ry: 4.5, rotate: 20 }, // New Zealand
  { at: [22, -80], rx: 3.5, ry: 0.9 }, // Cuba
];

const MERIDIANS = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];
const PARALLELS = [-60, -30, 0, 30, 60];

export function TrackingMap({ shipments }: { shipments: Shipment[] }) {
  return (
    <figure className="mb-6 rounded-xl border border-hairline bg-white p-4 shadow-card">
      <figcaption className="mb-3 text-sm font-semibold text-ink-900">Live positions (mocked GPS feed)</figcaption>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Map showing the live position of ${shipments.length} shipment(s)`}
        style={{ width: "100%", maxWidth: 480 }}
        className="rounded-lg border border-hairline bg-brand-100"
      >
        {MERIDIANS.map((lng) => {
          const { x } = project(0, lng);
          return <line key={lng} x1={x} y1={0} x2={x} y2={HEIGHT} stroke="#ffffff" strokeWidth={0.4} opacity={0.5} />;
        })}
        {PARALLELS.map((lat) => {
          const { y } = project(lat, 0);
          return <line key={lat} x1={0} y1={y} x2={WIDTH} y2={y} stroke="#ffffff" strokeWidth={0.4} opacity={0.5} />;
        })}
        {CONTINENTS.map((points, i) => (
          <g key={i}>
            {/* subtle coastal fringe for a touch of depth without a real gradient */}
            <path d={pathFor(points)} fill="none" stroke="#93a5de" strokeWidth={2.5} opacity={0.35} />
            <path d={pathFor(points)} fill="#fbfcfe" stroke="#c3ccdf" strokeWidth={0.6} />
          </g>
        ))}
        {ISLANDS.map(({ at: [lat, lng], rx, ry, rotate }, i) => {
          const { x, y } = project(lat, lng);
          return (
            <ellipse
              key={i}
              cx={x}
              cy={y}
              rx={rx}
              ry={ry}
              transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
              fill="#fbfcfe"
              stroke="#c3ccdf"
              strokeWidth={0.6}
            />
          );
        })}

        {shipments.map((s) => {
          const origin = project(s.origin.lat, s.origin.lng);
          const destination = project(s.destination.lat, s.destination.lng);
          const current = project(s.currentPosition.lat, s.currentPosition.lng);
          return (
            <g key={s.id}>
              <line
                x1={origin.x}
                y1={origin.y}
                x2={destination.x}
                y2={destination.y}
                stroke="#3550a8"
                strokeDasharray="2,2"
                opacity={0.4}
              />
              <circle cx={origin.x} cy={origin.y} r={2} fill="#101418" opacity={0.55} />
              <circle cx={destination.x} cy={destination.y} r={2} fill="#101418" opacity={0.55} />
              <circle
                cx={current.x}
                cy={current.y}
                r={3}
                fill={s.status === "delivered" ? "#2c6b4f" : "#3550a8"}
                className="motion-safe:animate-pulse"
              >
                <title>
                  {s.id} — {s.status}
                </title>
              </circle>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
