"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import type { CapabilityRadarPoint } from "@/lib/agent-kyle/types";

export function CapabilityRadarChart({ data }: { data: CapabilityRadarPoint[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted">No capability data available yet.</p>;
  }

  return (
    <div className="h-[24rem] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 34, right: 48, bottom: 26, left: 48 }} outerRadius="67%">
          <PolarGrid stroke="var(--c-border)" />
          <PolarAngleAxis
            dataKey="skill"
            tickSize={14}
            tick={{ fill: "var(--c-text-muted)", fontSize: 14, fontWeight: 600 }}
            axisLine={false}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: "var(--c-text-faint)", fontSize: 12 }}
            stroke="var(--c-border)"
          />
          <Radar
            name="Signal"
            dataKey="score"
            stroke="var(--c-link-hover)"
            fill="var(--c-accent-700)"
            fillOpacity={0.32}
          />
          <Tooltip
            contentStyle={{
              border: "1px solid var(--c-border)",
              borderRadius: "0.75rem",
              background: "var(--c-surface-2)",
              color: "var(--c-text)"
            }}
            labelStyle={{ color: "var(--c-text)" }}
            itemStyle={{ color: "var(--c-text)" }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
