"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CapabilityHeatmapCell } from "@/lib/agent-kyle/types";

interface ProjectEvidenceRow {
  projectSlug: string;
  projectName: string;
  score: number;
  average: number;
  links: number;
  skills: number;
  topSkills: string[];
  color: string;
}

function toLabel(input: string): string {
  return input
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function compactLabel(input: string, max = 20): string {
  if (input.length <= max) return input;
  return `${input.slice(0, max - 1)}…`;
}

function normalizePercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 100)));
}

const barPalette = [
  "var(--c-link-hover)",
  "color-mix(in srgb, var(--c-link) 86%, var(--c-accent-700))",
  "color-mix(in srgb, var(--c-link) 68%, var(--c-accent-700))",
  "var(--c-accent-700)",
  "color-mix(in srgb, var(--c-accent-700) 72%, var(--c-accent-800))",
  "color-mix(in srgb, var(--c-accent-700) 58%, var(--c-accent-900))"
];

function buildRows(data: CapabilityHeatmapCell[]): ProjectEvidenceRow[] {
  const grouped = new Map<
    string,
    {
      total: number;
      count: number;
      skills: Map<string, number>;
    }
  >();

  for (const item of data) {
    const project = grouped.get(item.projectSlug) ?? {
      total: 0,
      count: 0,
      skills: new Map<string, number>()
    };

    project.total += item.strength;
    project.count += 1;
    project.skills.set(item.skill, Math.max(item.strength, project.skills.get(item.skill) ?? 0));
    grouped.set(item.projectSlug, project);
  }

  const maxTotal = Math.max(...Array.from(grouped.values(), (entry) => entry.total), 0.0001);

  return Array.from(grouped.entries())
    .map(([projectSlug, entry], index) => {
      const topSkills = Array.from(entry.skills.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([skill]) => skill);

      return {
        projectSlug,
        projectName: toLabel(projectSlug),
        score: normalizePercent(entry.total / maxTotal),
        average: normalizePercent(entry.total / entry.count),
        links: entry.count,
        skills: entry.skills.size,
        topSkills,
        color: barPalette[index % barPalette.length]
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

interface TooltipPayload {
  payload?: ProjectEvidenceRow;
  value?: number;
}

export function EvidenceHeatmap({ data }: { data: CapabilityHeatmapCell[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted">No project-skill intersections were found for this scorecard.</p>;
  }

  const rows = buildRows(data);
  const skills = new Set(data.map((item) => item.skill)).size;
  const projects = new Set(data.map((item) => item.projectSlug)).size;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-surface-1 px-3 py-2">
          <p className="text-[0.65rem] uppercase tracking-[0.12em] text-faint">Projects</p>
          <p className="mt-1 text-lg font-display font-semibold text-fg">{projects}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-1 px-3 py-2">
          <p className="text-[0.65rem] uppercase tracking-[0.12em] text-faint">Skills</p>
          <p className="mt-1 text-lg font-display font-semibold text-fg">{skills}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-1 px-3 py-2">
          <p className="text-[0.65rem] uppercase tracking-[0.12em] text-faint">Evidence Links</p>
          <p className="mt-1 text-lg font-display font-semibold text-fg">{data.length}</p>
        </div>
      </div>

      <div className="h-[21rem] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 26, left: 6, bottom: 6 }} barCategoryGap={12}>
            <CartesianGrid stroke="var(--c-border)" strokeDasharray="4 4" horizontal vertical={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(value: number) => `${value}%`}
              tick={{ fill: "var(--c-text-faint)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--c-border)" }}
            />
            <YAxis
              type="category"
              dataKey="projectName"
              width={132}
              tickFormatter={(value: string) => compactLabel(value)}
              tick={{ fill: "var(--c-text-muted)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "color-mix(in srgb, var(--c-accent-700) 10%, transparent)" }}
              labelFormatter={(_label: string, payload: TooltipPayload[]) => payload?.[0]?.payload?.projectName ?? ""}
              formatter={(value: number, _name: string, info: TooltipPayload) => {
                const row = info.payload;
                if (!row) return [value, "Relative strength"];
                return [`${value}% (avg ${row.average}% · ${row.links} links · ${row.skills} skills)`, "Relative strength"];
              }}
              contentStyle={{
                border: "1px solid var(--c-border)",
                borderRadius: "0.75rem",
                background: "var(--c-surface-2)",
                color: "var(--c-text)"
              }}
              labelStyle={{ color: "var(--c-text)" }}
              itemStyle={{ color: "var(--c-text)" }}
            />
            <Bar dataKey="score" radius={[0, 9, 9, 0]} maxBarSize={20}>
              {rows.map((row) => (
                <Cell key={row.projectSlug} fill={row.color} />
              ))}
              <LabelList dataKey="score" position="right" formatter={(value: number) => `${value}%`} fill="var(--c-text)" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {rows.slice(0, 4).map((row) => (
          <div key={row.projectSlug} className="rounded-lg border border-border bg-surface-1 p-2.5">
            <p className="text-xs font-semibold text-fg">{row.projectName}</p>
            <p className="mt-1 text-[0.68rem] uppercase tracking-[0.08em] text-faint">
              Top skills: {row.topSkills.join(" · ")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
