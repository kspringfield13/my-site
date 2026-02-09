"use client";

import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

export function ConfidenceGauge({ confidence }: { confidence: number }) {
  const value = Math.max(0, Math.min(100, Math.round(confidence * 100)));
  const data = [{ name: "Confidence", value }];

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          data={data}
          startAngle={180}
          endAngle={0}
          innerRadius="60%"
          outerRadius="95%"
          cx="50%"
          cy="92%"
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={10} fill="var(--c-link-hover)" background={{ fill: "var(--c-surface-3)" }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <p className="-mt-5 text-center text-xs text-muted">Confidence: {value}%</p>
    </div>
  );
}
