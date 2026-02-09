"use client";

import { Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis, ResponsiveContainer } from "recharts";
import type { CapabilityHeatmapCell } from "@/lib/agent-kyle/types";

interface HeatPoint {
  x: number;
  y: number;
  z: number;
  skill: string;
  projectSlug: string;
}

function tone(strength: number): string {
  const opacity = Math.max(0.2, Math.min(0.95, strength));
  return `rgba(141, 167, 198, ${opacity.toFixed(2)})`;
}

export function EvidenceHeatmap({ data }: { data: CapabilityHeatmapCell[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted">No project-skill intersections were found for this scorecard.</p>;
  }

  const skillLabels = Array.from(new Set(data.map((item) => item.skill)));
  const projectLabels = Array.from(new Set(data.map((item) => item.projectSlug)));

  const points: HeatPoint[] = data.map((item) => ({
    x: projectLabels.indexOf(item.projectSlug),
    y: skillLabels.indexOf(item.skill),
    z: Math.round(item.strength * 100),
    skill: item.skill,
    projectSlug: item.projectSlug
  }));

  return (
    <div className="h-[22rem] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 20, left: 12, bottom: 70 }}>
          <XAxis
            type="number"
            dataKey="x"
            domain={[-0.5, projectLabels.length - 0.5]}
            ticks={projectLabels.map((_, index) => index)}
            tickFormatter={(value: number) => projectLabels[value] || ""}
            tick={{ fill: "var(--c-text-faint)", fontSize: 11 }}
            angle={-25}
            textAnchor="end"
            height={70}
            stroke="var(--c-border)"
            interval={0}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[-0.5, skillLabels.length - 0.5]}
            ticks={skillLabels.map((_, index) => index)}
            tickFormatter={(value: number) => skillLabels[value] || ""}
            tick={{ fill: "var(--c-text-muted)", fontSize: 12 }}
            width={120}
            stroke="var(--c-border)"
            interval={0}
          />
          <ZAxis type="number" dataKey="z" range={[180, 460]} />
          <Tooltip
            cursor={{ stroke: "var(--c-border-accent)", strokeWidth: 1 }}
            formatter={(value: number) => [`${value}%`, "Strength"]}
            labelFormatter={(_: unknown, payload: Array<{ payload?: HeatPoint }>) => {
              const point = payload?.[0]?.payload as HeatPoint | undefined;
              if (!point) return "";
              return `${point.skill} × ${point.projectSlug}`;
            }}
            contentStyle={{
              border: "1px solid var(--c-border)",
              borderRadius: "0.75rem",
              background: "var(--c-surface-2)",
              color: "var(--c-text)"
            }}
          />
          <Scatter
            data={points}
            shape={(shapeProps: unknown) => {
              const props = shapeProps as { cx: number; cy: number; payload: HeatPoint };
              const color = tone(props.payload.z / 100);
              return (
                <rect
                  x={props.cx - 14}
                  y={props.cy - 11}
                  width={28}
                  height={22}
                  rx={4}
                  ry={4}
                  fill={color}
                  stroke="rgba(76, 101, 135, 0.7)"
                  strokeWidth={1}
                />
              );
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
