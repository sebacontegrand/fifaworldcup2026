import Link from "next/link"
import { cn } from "@/lib/utils"
import type { Team } from "@/lib/simulation"

interface TeamCardProps {
  team: Team
  probability?: number
  rank?: number
  compact?: boolean
  showGroup?: boolean
  className?: string
}

export function TeamCard({
  team,
  probability,
  rank,
  compact = false,
  showGroup = true,
  className,
}: TeamCardProps) {
  if (compact) {
    return (
      <Link
        href={`/teams/${team.id}`}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-2 transition-all hover:border-primary/50 hover:bg-secondary",
          className
        )}
      >
        <span className="text-xl">{team.flag}</span>
        <span className="text-sm font-semibold text-card-foreground">
          {team.name}
        </span>
        {probability !== undefined && (
          <span className="ml-auto text-xs font-mono text-primary">
            {probability}%
          </span>
        )}
      </Link>
    )
  }

  return (
    <Link
      href={`/teams/${team.id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card transition-all hover:border-primary/30 hover:glow-neon",
        className
      )}
    >
      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-cyan to-gold" />

      <div className="flex flex-col gap-3 p-4">
        {/* Header: flag, name, ranking */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{team.flag}</span>
            <div className="flex flex-col">
              <span className="text-base font-bold uppercase tracking-wide text-card-foreground">
                {team.name}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                {team.confederation}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            {showGroup && (
              <span className="rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">
                Group {team.group}
              </span>
            )}
            <span className="text-[10px] font-mono text-muted-foreground">
              FIFA #{team.fifaRanking}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 border-t border-border/30 pt-3">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-muted-foreground">
              Elo
            </span>
            <span className="text-sm font-bold font-mono text-foreground">
              {team.eloRating}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-muted-foreground">
              Best
            </span>
            <span className="text-xs font-semibold text-foreground">
              {team.stats.bestFinish}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-muted-foreground">
              Form
            </span>
            <div className="flex gap-0.5">
              {team.stats.recentForm.split("").map((r, i) => (
                <span
                  key={i}
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-sm text-[9px] font-bold",
                    r === "W" && "bg-primary/20 text-primary",
                    r === "D" && "bg-gold/20 text-gold",
                    r === "L" && "bg-destructive/20 text-destructive"
                  )}
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Win probability if provided */}
        {probability !== undefined && (
          <div className="flex items-center gap-2 border-t border-border/30 pt-3">
            <span className="text-[10px] uppercase text-muted-foreground">
              Win Tournament
            </span>
            <div className="ml-auto flex items-center gap-2">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(probability * 5, 100)}%` }}
                />
              </div>
              <span className="text-sm font-bold font-mono text-primary">
                {probability}%
              </span>
            </div>
          </div>
        )}

        {rank !== undefined && (
          <div className="absolute right-3 top-5 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs font-black text-accent-foreground">
            {rank}
          </div>
        )}
      </div>
    </Link>
  )
}
