"use client"

import { useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts"
import type { TeamProbability } from "@/lib/simulation"
import teamsData from "@/data/teams.json"

const stages = [
  { key: "groupAdvance", label: "Group" },
  { key: "roundOf32", label: "R32" },
  { key: "roundOf16", label: "R16" },
  { key: "quarterFinal", label: "QF" },
  { key: "semiFinal", label: "SF" },
  { key: "final", label: "Final" },
  { key: "champion", label: "Win" },
] as const

const palette = [
  "#60a5fa", "#f472b6", "#34d399", "#fbbf24", "#a78bfa",
  "#fb923c", "#2dd4bf", "#f87171", "#e879f9", "#38bdf8",
  "#a3e635", "#f97316",
]

function teamColor(id: string, index: number): string {
  return palette[index % palette.length]
}

type TeamsById = Record<string, { id: string; name: string; code: string; flag?: string }>

const allTeams: TeamsById = {}
for (const t of teamsData as { id: string; name: string; code: string; flag?: string }[]) {
  allTeams[t.id] = t
}

export function ProgressionLineChart({
  teamProbabilities,
}: {
  teamProbabilities: Record<string, TeamProbability>
}) {
  const chartData = useMemo(() => {
    const alive = Object.entries(teamProbabilities)
      .filter(([, p]) => p.groupAdvance > 0)
      .sort(([, a], [, b]) => b.champion - a.champion)
      .slice(0, 12)

    return stages.map((stage) => {
      const point: Record<string, any> = { name: stage.label }
      for (const [id, prob] of alive) {
        point[id] = prob[stage.key]
      }
      return point
    })
  }, [teamProbabilities])

  const topTeams = useMemo(() => {
    return Object.entries(teamProbabilities)
      .filter(([, p]) => p.groupAdvance > 0)
      .sort(([, a], [, b]) => b.champion - a.champion)
      .slice(0, 12)
      .map(([id]) => id)
  }, [teamProbabilities])

  if (topTeams.length === 0) return null

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Round Progression
        </h3>
        <span className="text-[8px] text-white/30 font-mono">
          {topTeams.length} teams alive
        </span>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0 0)" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "oklch(0.6 0 0)", fontSize: 10, fontWeight: 600 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
              tick={{ fill: "oklch(0.6 0 0)", fontSize: 10 }}
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
              formatter={(value: number, name: string) => {
                const team = allTeams[name]
                return [`${value}%`, team?.name ?? name]
              }}
              labelFormatter={(label) => `Reach ${label}`}
            />
            <Legend
              wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }}
              formatter={(value: string) => {
                const team = allTeams[value]
                return team?.code ?? value
              }}
            />
            {topTeams.map((id, i) => (
              <Line
                key={id}
                type="monotone"
                dataKey={id}
                name={id}
                stroke={teamColor(id, i)}
                strokeWidth={2}
                dot={{ r: 3, fill: teamColor(id, i) }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
