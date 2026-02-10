"use client";

import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

export function ConfidenceGauge({ confidence }: { confidence: number }) {
  const value = Math.max(0, Math.min(100, Math.round(confidence * 100)));
  const data = [{ name: "Confidence", value }];
  const label = value >= 80 ? "High certainty" : value >= 60 ? "Moderate certainty" : "Low certainty";

  return (
    <div className="w-full -mt-12">
      <div className="h-24 w-full sm:h-24">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={data}
            startAngle={180}
            endAngle={0}
            innerRadius="68%"
            outerRadius="100%"
            cx="50%"
            cy="94%"
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              dataKey="value"
              cornerRadius={14}
              fill="var(--c-link-hover)"
              background={{ fill: "color-mix(in srgb, var(--c-surface-3) 85%, var(--c-accent-900))" }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 text-center">
        <p className="text-4xl font-display font-semibold leading-none text-fg">{value}%</p>
        <p className="mt-1 text-[0.64rem] uppercase tracking-[0.16em] text-faint">Confidence</p>
        <p className="mt-2 pb-2 text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}
