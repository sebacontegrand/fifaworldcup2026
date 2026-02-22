"use client"

import { cn } from "@/lib/utils"
import type { KnockoutRound, Team } from "@/lib/simulation"

interface BracketViewProps {
  rounds: KnockoutRound[]
  teams: Record<string, Team>
  teamProbabilities?: Record<string, { champion: number }>
  className?: string
}

export function BracketView({
  rounds,
  teams,
  teamProbabilities,
  className,
}: BracketViewProps) {
  // Show all rounds
  const displayRounds = rounds

  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className="flex items-start gap-6 min-w-[900px] py-4">
        {displayRounds.map((round, roundIdx) => (
          <div key={round.round} className="flex flex-col gap-4">
            {/* Round header */}
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                {round.round}
              </span>
            </div>

            {/* Matches */}
            <div
              className="flex flex-col justify-around gap-4"
              style={{
                minHeight: `${Math.max(
                  displayRounds[0].matches.length * 80,
                  300
                )}px`,
              }}
            >
              {round.matches.map((match) => {
                const tA = match.teamA ? teams[match.teamA] : null
                const tB = match.teamB ? teams[match.teamB] : null

                return (
                  <div
                    key={`${round.round}-${match.matchId}`}
                    className={cn(
                      "flex flex-col overflow-hidden rounded-lg border border-border/50 bg-card",
                      match.winner && "border-primary/20"
                    )}
                  >
                    {/* Team A */}
                    <div
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 border-b border-border/30",
                        match.winner === match.teamA && "bg-primary/10"
                      )}
                    >
                      <span className="text-sm">{tA?.flag || "?"}</span>
                      <span
                        className={cn(
                          "text-xs font-semibold flex-1",
                          match.winner === match.teamA
                            ? "text-primary"
                            : "text-card-foreground"
                        )}
                      >
                        {tA?.code || "TBD"}
                      </span>
                      {teamProbabilities && match.teamA && (
                        <span className="text-[9px] font-mono text-muted-foreground">
                          {teamProbabilities[match.teamA]?.champion || 0}%
                        </span>
                      )}
                    </div>

                    {/* Team B */}
                    <div
                      className={cn(
                        "flex items-center gap-2 px-3 py-2",
                        match.winner === match.teamB && "bg-primary/10"
                      )}
                    >
                      <span className="text-sm">{tB?.flag || "?"}</span>
                      <span
                        className={cn(
                          "text-xs font-semibold flex-1",
                          match.winner === match.teamB
                            ? "text-primary"
                            : "text-card-foreground"
                        )}
                      >
                        {tB?.code || "TBD"}
                      </span>
                      {teamProbabilities && match.teamB && (
                        <span className="text-[9px] font-mono text-muted-foreground">
                          {teamProbabilities[match.teamB]?.champion || 0}%
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Champion */}
        {displayRounds.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gold">
                Champion
              </span>
            </div>
            <div
              className="flex flex-col justify-center"
              style={{
                minHeight: `${Math.max(
                  displayRounds[0].matches.length * 80,
                  300
                )}px`,
              }}
            >
              {(() => {
                const finalRound = displayRounds[displayRounds.length - 1]
                const finalMatch = finalRound?.matches[0]
                const champion = finalMatch?.winner
                  ? teams[finalMatch.winner]
                  : null

                return (
                  <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-gold/50 bg-gold/5 p-4 glow-gold">
                    <span className="text-4xl">{champion?.flag || "?"}</span>
                    <span className="text-sm font-black uppercase tracking-wider text-gold text-glow-gold">
                      {champion?.name || "TBD"}
                    </span>
                    {champion &&
                      teamProbabilities &&
                      teamProbabilities[champion.id] && (
                        <span className="text-xs font-mono text-gold/70">
                          {teamProbabilities[champion.id].champion}% chance
                        </span>
                      )}
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
