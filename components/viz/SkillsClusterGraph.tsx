interface Cluster {
  name: string;
  count: number;
  x: number;
  y: number;
}

export function SkillsClusterGraph({
  data,
  analytics,
  ai,
  product
}: {
  data: number;
  analytics: number;
  ai: number;
  product: number;
}) {
  const clusters: Cluster[] = [
    { name: "Data Eng", count: data, x: 120, y: 120 },
    { name: "Analytics", count: analytics, x: 320, y: 80 },
    { name: "AI", count: ai, x: 510, y: 120 },
    { name: "Product", count: product, x: 320, y: 220 }
  ];

  return (
    <svg viewBox="0 0 640 300" role="img" aria-label="Skills cluster graph" className="w-full">
      <defs>
        <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.08" />
        </linearGradient>
      </defs>

      <line x1="120" y1="120" x2="320" y2="80" stroke="url(#edge)" strokeWidth="1.5" />
      <line x1="320" y1="80" x2="510" y2="120" stroke="url(#edge)" strokeWidth="1.5" />
      <line x1="320" y1="80" x2="320" y2="220" stroke="url(#edge)" strokeWidth="1.5" />
      <line x1="120" y1="120" x2="320" y2="220" stroke="url(#edge)" strokeWidth="1.5" />
      <line x1="510" y1="120" x2="320" y2="220" stroke="url(#edge)" strokeWidth="1.5" />

      {clusters.map((cluster) => {
        const radius = Math.max(30, Math.min(50, 26 + cluster.count * 1.5));
        return (
          <g key={cluster.name} transform={`translate(${cluster.x}, ${cluster.y})`}>
            <circle r={radius} fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.8" />
            <circle r={radius - 8} fill="currentColor" fillOpacity="0.06" />
            <text y="-4" textAnchor="middle" className="fill-current" style={{ fontSize: 13, fontWeight: 600 }}>
              {cluster.name}
            </text>
            <text y="14" textAnchor="middle" className="fill-current" style={{ fontSize: 11, opacity: 0.78 }}>
              {cluster.count} tools
            </text>
          </g>
        );
      })}
    </svg>
  );
}
