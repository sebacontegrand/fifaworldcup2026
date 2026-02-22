"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { cn } from "@/lib/utils"
import type { TeamProbability } from "@/lib/simulation"

interface StageProbabilityChartProps {
  probability: TeamProbability
  teamName: string
  className?: string
}

const stages = [
  { key: "groupAdvance", label: "Groups" },
  { key: "roundOf32", label: "R32" },
  { key: "roundOf16", label: "R16" },
  { key: "quarterFinal", label: "QF" },
  { key: "semiFinal", label: "SF" },
  { key: "final", label: "Final" },
  { key: "champion", label: "Win" },
] as const

// Neon green gradient stops
const barColors = [
  "oklch(0.85 0.22 155)",
  "oklch(0.82 0.20 155)",
  "oklch(0.78 0.18 155)",
  "oklch(0.74 0.16 155)",
  "oklch(0.70 0.14 155)",
  "oklch(0.66 0.12 160)",
  "oklch(0.87 0.17 85)", // Gold for champion
]

export function StageProbabilityChart({
  probability,
  teamName,
  className,
}: StageProbabilityChartProps) {
  const data = stages.map((stage, i) => ({
    name: stage.label,
    value: probability[stage.key],
    fill: barColors[i],
  }))

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {teamName} - Stage Probability
      </h3>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "oklch(0.6 0 0)",
                fontSize: 10,
                fontWeight: 600,
              }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "oklch(0.6 0 0)",
                fontSize: 10,
              }}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(0.17 0.02 260)",
                border: "1px solid oklch(0.28 0.02 260)",
                borderRadius: "8px",
                color: "oklch(0.95 0 0)",
                fontSize: 12,
              }}
              formatter={(value: number) => [`${value}%`, "Probability"]}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
