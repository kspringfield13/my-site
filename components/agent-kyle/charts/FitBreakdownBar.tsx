"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface FitBreakdownBarProps {
  fitScore: number;
  confidence: number;
  evidenceCount: number;
}

export function FitBreakdownBar({ fitScore, confidence, evidenceCount }: FitBreakdownBarProps) {
  const data = [
    {
      metric: "Fit",
      value: Math.round(fitScore)
    },
    {
      metric: "Confidence",
      value: Math.round(confidence * 100)
    },
    {
      metric: "Evidence",
      value: Math.min(100, evidenceCount * 14)
    }
  ];

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--c-border)" strokeDasharray="4 4" />
          <XAxis dataKey="metric" tick={{ fill: "var(--c-text-muted)", fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fill: "var(--c-text-faint)", fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              border: "1px solid var(--c-border)",
              borderRadius: "0.75rem",
              background: "var(--c-surface-2)",
              color: "var(--c-text)"
            }}
          />
          <Bar dataKey="value" fill="var(--c-accent-700)" radius={[6, 6, 0, 0]} maxBarSize={56} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
