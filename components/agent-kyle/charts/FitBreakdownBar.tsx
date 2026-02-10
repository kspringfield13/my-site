"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface FitBreakdownBarProps {
  fitScore: number;
  confidence: number;
  evidenceCount: number;
}

export function FitBreakdownBar({ fitScore, confidence, evidenceCount }: FitBreakdownBarProps) {
  const confidenceScore = Math.round(confidence * 100);
  const evidenceCoverage = Math.min(100, evidenceCount * 14);

  const data = [
    {
      metric: "Overall fit",
      value: Math.round(fitScore),
      fill: "var(--c-link-hover)"
    },
    {
      metric: "Confidence",
      value: confidenceScore,
      fill: "color-mix(in srgb, var(--c-link) 70%, var(--c-accent-700))"
    },
    {
      metric: "Evidence depth",
      value: evidenceCoverage,
      fill: "var(--c-accent-700)"
    }
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 6, right: 32, left: 10, bottom: 8 }} barCategoryGap={16}>
          <CartesianGrid stroke="var(--c-border)" strokeDasharray="4 4" horizontal vertical={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: "var(--c-text-faint)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "var(--c-border)" }}
          />
          <YAxis
            type="category"
            dataKey="metric"
            width={110}
            tick={{ fill: "var(--c-text-muted)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "color-mix(in srgb, var(--c-accent-700) 12%, transparent)" }}
            formatter={(value: number) => [`${value}%`, "Score"]}
            contentStyle={{
              border: "1px solid var(--c-border)",
              borderRadius: "0.75rem",
              background: "var(--c-surface-2)",
              color: "var(--c-text)"
            }}
            labelStyle={{ color: "var(--c-text)" }}
            itemStyle={{ color: "var(--c-text)" }}
          />
          <Bar dataKey="value" radius={[0, 9, 9, 0]} maxBarSize={24}>
            {data.map((item) => (
              <Cell key={item.metric} fill={item.fill} />
            ))}
            <LabelList dataKey="value" position="right" formatter={(value: number) => `${value}%`} fill="var(--c-text)" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
