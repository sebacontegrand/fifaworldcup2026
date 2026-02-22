"use client"

import Link from "next/link"
import { useSimulation } from "@/lib/hooks/use-simulation"
import teamsData from "@/data/teams.json"
import type { Team } from "@/lib/simulation"
import { cn } from "@/lib/utils"
import { ProbabilityBar } from "@/components/probability-bar"

const allTeams = teamsData as Team[]
const teamMap: Record<string, Team> = {}
for (const team of allTeams) {
  teamMap[team.id] = team
}

function getGroups(): Record<string, Team[]> {
  const groups: Record<string, Team[]> = {}
  for (const team of allTeams) {
    if (!groups[team.group]) groups[team.group] = []
    groups[team.group].push(team)
  }
  return groups
}

export default function GroupsPage() {
  const { result, isRunning } = useSimulation()
  const groups = getGroups()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">
          Group Stage
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          12 groups with 3-4 teams each. Top 2 advance directly, plus 8 best
          third-placed teams qualify for the Round of 32.
        </p>
      </div>

      {isRunning && (
        <div className="mb-8 flex items-center justify-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-6">
          <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm font-semibold text-primary">
            Computing group simulations...
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(groups)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([group, groupTeams]) => {
            // Calculate group strength
            const avgElo =
              groupTeams.reduce((s, t) => s + t.eloRating, 0) /
              groupTeams.length
            const strength =
              avgElo > 1800 ? "high" : avgElo > 1650 ? "medium" : "low"

            return (
              <Link
                key={group}
                href={`/groups/${group.toLowerCase()}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card transition-all hover:border-primary/30 hover:glow-neon"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/50 bg-secondary/50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-black text-primary-foreground">
                      {group}
                    </span>
                    <span className="text-sm font-bold uppercase tracking-wider text-foreground">
                      Group {group}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                      strength === "high" &&
                        "bg-destructive/20 text-destructive",
                      strength === "medium" && "bg-gold/20 text-gold",
                      strength === "low" && "bg-primary/20 text-primary"
                    )}
                  >
                    {strength === "high"
                      ? "Tough"
                      : strength === "medium"
                        ? "Balanced"
                        : "Open"}
                  </span>
                </div>

                {/* Teams */}
                <div className="flex flex-col gap-2 p-4">
                  {groupTeams
                    .sort((a, b) => a.fifaRanking - b.fifaRanking)
                    .map((team, idx) => (
                      <div key={team.id} className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "flex h-4 w-4 items-center justify-center rounded-sm text-[9px] font-bold",
                              idx < 2
                                ? "bg-primary/20 text-primary"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {idx + 1}
                          </span>
                          <span className="text-base">{team.flag}</span>
                          <span className="flex-1 text-sm font-semibold text-card-foreground">
                            {team.name}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            #{team.fifaRanking}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-foreground">
                            {team.eloRating}
                          </span>
                        </div>
                        {result &&
                          result.teamProbabilities[team.id] && (
                            <ProbabilityBar
                              label="Advance from group"
                              value={
                                result.teamProbabilities[team.id].groupAdvance
                              }
                              color={idx < 2 ? "neon" : "cyan"}
                              className="ml-6"
                            />
                          )}
                      </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-auto border-t border-border/30 px-4 py-2">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Avg Elo: {Math.round(avgElo)} | {groupTeams.length} teams
                  </span>
                </div>
              </Link>
            )
          })}
      </div>
    </div>
  )
}
