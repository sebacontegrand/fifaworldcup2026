import { cn } from "@/lib/utils"
import type { Team, MatchResult, MatchupProbability } from "@/lib/simulation"

interface MatchCardProps {
  teamA: Team
  teamB: Team
  result?: MatchResult
  probability?: MatchupProbability
  className?: string
}

export function MatchCard({
  teamA,
  teamB,
  result,
  probability,
  className,
}: MatchCardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/50 bg-card",
        className
      )}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Team A */}
        <div className="flex flex-1 flex-col items-center gap-1">
          <span className="text-2xl">{teamA.flag}</span>
          <span className="text-xs font-bold uppercase text-card-foreground">
            {teamA.code}
          </span>
        </div>

        {/* Score / VS */}
        <div className="flex flex-col items-center gap-1">
          {result ? (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-2xl font-black font-mono",
                  result.winner === teamA.id
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {result.scoreA}
              </span>
              <span className="text-xs text-muted-foreground">-</span>
              <span
                className={cn(
                  "text-2xl font-black font-mono",
                  result.winner === teamB.id
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {result.scoreB}
              </span>
            </div>
          ) : (
            <span className="text-sm font-bold uppercase text-muted-foreground">
              vs
            </span>
          )}
        </div>

        {/* Team B */}
        <div className="flex flex-1 flex-col items-center gap-1">
          <span className="text-2xl">{teamB.flag}</span>
          <span className="text-xs font-bold uppercase text-card-foreground">
            {teamB.code}
          </span>
        </div>
      </div>

      {/* Probability bar */}
      {probability && (
        <div className="border-t border-border/30 px-4 py-2">
          <div className="flex h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary transition-all"
              style={{ width: `${probability.winA}%` }}
            />
            <div
              className="bg-muted-foreground/30 transition-all"
              style={{ width: `${probability.draw}%` }}
            />
            <div
              className="bg-cyan transition-all"
              style={{ width: `${probability.winB}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[9px] font-mono">
            <span className="text-primary">{probability.winA}%</span>
            <span className="text-muted-foreground">
              {probability.draw}%
            </span>
            <span className="text-cyan">{probability.winB}%</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[9px] text-muted-foreground">
            <span>xG: {probability.expectedGoalsA}</span>
            <span>xG: {probability.expectedGoalsB}</span>
          </div>
        </div>
      )}
    </div>
  )
}
