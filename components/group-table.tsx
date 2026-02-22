import Link from "next/link"
import { cn } from "@/lib/utils"
import type { GroupStanding, Team } from "@/lib/simulation"

interface GroupTableProps {
  group: string
  standings: GroupStanding[]
  teams: Record<string, Team>
  advanceCount?: number
  compact?: boolean
  className?: string
}

export function GroupTable({
  group,
  standings,
  teams,
  advanceCount = 2,
  compact = false,
  className,
}: GroupTableProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/50 bg-card",
        className
      )}
    >
      {/* Group Header */}
      <div className="flex items-center justify-between border-b border-border/50 bg-secondary/50 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-xs font-black text-primary-foreground">
            {group}
          </span>
          <span className="text-sm font-bold uppercase tracking-wider text-foreground">
            Group {group}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/30 text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-2 text-left font-medium">#</th>
              <th className="px-4 py-2 text-left font-medium">Team</th>
              {!compact && (
                <>
                  <th className="px-2 py-2 text-center font-medium">P</th>
                  <th className="px-2 py-2 text-center font-medium">W</th>
                  <th className="px-2 py-2 text-center font-medium">D</th>
                  <th className="px-2 py-2 text-center font-medium">L</th>
                  <th className="px-2 py-2 text-center font-medium">GF</th>
                  <th className="px-2 py-2 text-center font-medium">GA</th>
                </>
              )}
              <th className="px-2 py-2 text-center font-medium">GD</th>
              <th className="px-2 py-2 text-center font-medium">Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((standing, idx) => {
              const team = teams[standing.teamId]
              if (!team) return null
              const advances = idx < advanceCount

              return (
                <tr
                  key={standing.teamId}
                  className={cn(
                    "border-b border-border/20 transition-colors hover:bg-secondary/30",
                    advances && "bg-primary/5"
                  )}
                >
                  <td className="px-4 py-2">
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-sm text-[10px] font-bold",
                        advances
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/teams/${team.id}`}
                      className="flex items-center gap-2 hover:text-primary transition-colors"
                    >
                      <span className="text-base">{team.flag}</span>
                      <span className="text-sm font-semibold text-card-foreground">
                        {team.name}
                      </span>
                    </Link>
                  </td>
                  {!compact && (
                    <>
                      <td className="px-2 py-2 text-center text-xs font-mono text-muted-foreground">
                        {standing.played}
                      </td>
                      <td className="px-2 py-2 text-center text-xs font-mono text-muted-foreground">
                        {standing.won}
                      </td>
                      <td className="px-2 py-2 text-center text-xs font-mono text-muted-foreground">
                        {standing.drawn}
                      </td>
                      <td className="px-2 py-2 text-center text-xs font-mono text-muted-foreground">
                        {standing.lost}
                      </td>
                      <td className="px-2 py-2 text-center text-xs font-mono text-muted-foreground">
                        {standing.goalsFor}
                      </td>
                      <td className="px-2 py-2 text-center text-xs font-mono text-muted-foreground">
                        {standing.goalsAgainst}
                      </td>
                    </>
                  )}
                  <td
                    className={cn(
                      "px-2 py-2 text-center text-xs font-mono font-bold",
                      standing.goalDifference > 0
                        ? "text-primary"
                        : standing.goalDifference < 0
                          ? "text-destructive"
                          : "text-muted-foreground"
                    )}
                  >
                    {standing.goalDifference > 0 ? "+" : ""}
                    {standing.goalDifference}
                  </td>
                  <td className="px-2 py-2 text-center text-sm font-bold font-mono text-foreground">
                    {standing.points}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
