"use client"

import { cn } from "@/lib/utils"
import type { KnockoutRound, Team } from "@/lib/simulation"

interface BracketViewProps {
  rounds: KnockoutRound[]
  teams: Record<string, Team>
  teamProbabilities?: Record<string, { champion: number }>
  className?: string
}

function TeamRow({
  team,
  isWinner,
  prob,
  position,
}: {
  team: Team | null
  isWinner: boolean
  prob?: number
  position: "top" | "bottom"
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 min-w-0 transition-colors",
        position === "top" ? "border-b border-white/5" : "",
        isWinner
          ? "bg-primary/10"
          : "hover:bg-white/5"
      )}
    >
      <span className="text-sm flex-shrink-0">{team?.flag || "🏳️"}</span>
      <span
        className={cn(
          "text-[11px] font-bold flex-1 truncate",
          isWinner ? "text-primary" : "text-white/70"
        )}
      >
        {team?.name || "TBD"}
      </span>
      {prob !== undefined && (
        <span
          className={cn(
            "text-[9px] font-mono flex-shrink-0 tabular-nums",
            isWinner ? "text-primary/80" : "text-white/30"
          )}
        >
          {prob}%
        </span>
      )}
    </div>
  )
}

function MatchCard({
  match,
  teams,
  teamProbabilities,
  roundName,
}: {
  match: { matchId: number; teamA: string | null; teamB: string | null; winner: string | null }
  teams: Record<string, Team>
  teamProbabilities?: Record<string, { champion: number;[k: string]: number }>
  roundName: string
}) {
  const tA = match.teamA ? teams[match.teamA] : null
  const tB = match.teamB ? teams[match.teamB] : null

  // Use round-specific probability for advancement context
  const probKeyMap: Record<string, string> = {
    "Round of 32": "champion",
    "Round of 16": "champion",
    "Quarter-Finals": "champion",
    "Semi-Finals": "champion",
    "Final": "champion",
  }
  const probKey = probKeyMap[roundName] || "champion"

  const probA =
    teamProbabilities && match.teamA
      ? teamProbabilities[match.teamA]?.[probKey]
      : undefined
  const probB =
    teamProbabilities && match.teamB
      ? teamProbabilities[match.teamB]?.[probKey]
      : undefined

  return (
    <div
      className={cn(
        "rounded-lg border overflow-hidden bg-card/80 backdrop-blur-sm shadow-md transition-all hover:shadow-lg",
        match.winner
          ? "border-primary/20 shadow-primary/5"
          : "border-white/10"
      )}
      style={{ width: "100%" }}
    >
      <TeamRow
        team={tA}
        isWinner={match.winner === match.teamA}
        prob={probA}
        position="top"
      />
      <TeamRow
        team={tB}
        isWinner={match.winner === match.teamB}
        prob={probB}
        position="bottom"
      />
    </div>
  )
}

export function BracketView({
  rounds,
  teams,
  teamProbabilities,
  className,
}: BracketViewProps) {
  if (!rounds.length) return null

  // Round column widths based on available space
  const roundWidths: Record<string, string> = {
    "Round of 32": "160px",
    "Round of 16": "170px",
    "Quarter-Finals": "180px",
    "Semi-Finals": "190px",
    "Final": "200px",
  }

  return (
    <div className={cn("overflow-x-auto overflow-y-hidden pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar", className)} style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
      <div className="flex items-start gap-3 min-w-[1100px] py-4 px-2">
        {rounds.map((round, roundIdx) => {
          // Vertical gap grows by 2^roundIdx so match cards align with parents
          const baseGap = roundIdx === 0 ? 8 : 8 * Math.pow(2, roundIdx)
          const width = roundWidths[round.round] || "170px"

          return (
            <div
              key={round.round}
              className="flex flex-col flex-shrink-0"
              style={{ width }}
            >
              {/* Round header */}
              <div className="text-center mb-3">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/80">
                  {round.round}
                </span>
                <div className="text-[9px] text-white/20 font-mono">
                  {round.matches.length} {round.matches.length === 1 ? "match" : "matches"}
                </div>
              </div>

              {/* Matches column */}
              <div
                className="flex flex-col justify-around"
                style={{
                  gap: `${baseGap}px`,
                  minHeight: `${rounds[0].matches.length * 52 + (rounds[0].matches.length - 1) * 8}px`,
                }}
              >
                {round.matches.map((match) => (
                  <MatchCard
                    key={`${round.round}-${match.matchId}`}
                    match={match}
                    teams={teams}
                    teamProbabilities={teamProbabilities}
                    roundName={round.round}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {/* Champion Column */}
        <div className="flex flex-col flex-shrink-0" style={{ width: "140px" }}>
          <div className="text-center mb-3">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gold">
              🏆 Champion
            </span>
          </div>
          <div
            className="flex flex-col justify-center"
            style={{
              minHeight: `${rounds[0].matches.length * 52 + (rounds[0].matches.length - 1) * 8}px`,
            }}
          >
            {(() => {
              const finalRound = rounds[rounds.length - 1]
              const finalMatch = finalRound?.matches[0]
              const champion = finalMatch?.winner
                ? teams[finalMatch.winner]
                : null
              const champProb =
                champion && teamProbabilities
                  ? teamProbabilities[champion.id]?.champion
                  : undefined

              return (
                <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-gold/40 bg-gradient-to-b from-gold/10 to-gold/5 p-5 shadow-lg shadow-gold/10">
                  <span className="text-5xl drop-shadow-lg">
                    {champion?.flag || "🏳️"}
                  </span>
                  <span className="text-sm font-black uppercase tracking-wider text-gold text-glow-gold text-center">
                    {champion?.name || "TBD"}
                  </span>
                  {champProb !== undefined && (
                    <span className="text-[10px] font-mono text-gold/60">
                      {champProb}% probability
                    </span>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
