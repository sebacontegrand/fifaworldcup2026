"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import teamsData from "@/data/teams.json"
import type { Team } from "@/lib/simulation"

interface TeamSelectorProps {
  selectedTeamId: string | null
  onSelect: (teamId: string) => void
  className?: string
}

export function TeamSelector({
  selectedTeamId,
  onSelect,
  className,
}: TeamSelectorProps) {
  const [search, setSearch] = useState("")
  const teams = teamsData as Team[]

  const filtered = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase())
  )

  const grouped: Record<string, Team[]> = {}
  for (const team of filtered) {
    if (!grouped[team.group]) grouped[team.group] = []
    grouped[team.group].push(team)
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <input
        type="text"
        placeholder="Search teams..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />

      <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1 sm:grid-cols-3">
        {Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([, groupTeams]) =>
            groupTeams.map((team) => (
              <button
                key={team.id}
                onClick={() => onSelect(team.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all",
                  selectedTeamId === team.id
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border/50 bg-card text-card-foreground hover:border-primary/30 hover:bg-secondary"
                )}
              >
                <span className="text-base">{team.flag}</span>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">{team.name}</span>
                  <span className="text-[9px] text-muted-foreground">
                    Group {team.group}
                  </span>
                </div>
              </button>
            ))
          )}
      </div>
    </div>
  )
}
