"use client"

import { useMemo } from "react"
import { useMyTeam } from "@/lib/hooks/use-my-team"
import { useSimulation } from "@/lib/hooks/use-simulation"
import { getFlagImageUrl } from "@/lib/team-flags"
import { cn } from "@/lib/utils"
import type { Team, TeamProbability, SimulationResult } from "@/lib/simulation"
import {
  ALL_BRACKET_MATCHES,
  R32_MATCHES,
  type TeamSource,
} from "@/lib/bracket-seeding"
import { AlertCircle, Flag, Trophy, ChevronRight } from "lucide-react"

interface BracketRoadToFinalProps {
  teams: Record<string, Team>
  className?: string
}

const ROUND_PROB_KEYS: { round: string; probKey: keyof TeamProbability; label: string }[] = [
  { round: "Round of 32", probKey: "roundOf32", label: "Round of 32" },
  { round: "Round of 16", probKey: "roundOf16", label: "Round of 16" },
  { round: "Quarter-Finals", probKey: "quarterFinal", label: "Quarter-Finals" },
  { round: "Semi-Finals", probKey: "semiFinal", label: "Semi-Finals" },
  { round: "Final", probKey: "final", label: "Final" },
]

export function BracketRoadToFinal({ teams, className }: BracketRoadToFinalProps) {
  const { selectedTeam } = useMyTeam()
  const { result } = useSimulation()

  if (!selectedTeam) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Flag className="h-12 w-12 text-white/20 mb-4" />
        <h3 className="text-lg font-bold text-white/60">No Team Selected</h3>
        <p className="text-sm text-white/30 mt-2 max-w-md">
          Visit the{" "}
          <a href="/my-team" className="text-cyan-400 hover:underline">
            My Team
          </a>{" "}
          page to select your favorite team and see their path to the final.
        </p>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-12 w-12 text-white/20 mb-4" />
        <h3 className="text-lg font-bold text-white/60">No Simulation Data</h3>
        <p className="text-sm text-white/30 mt-2 max-w-md">
          Run a simulation first to see your team's road to the final.
        </p>
      </div>
    )
  }

  return <RoadToFinalContent teamId={selectedTeam} result={result} teams={teams} />
}

function RoadToFinalContent({
  teamId,
  result,
  teams,
}: {
  teamId: string
  result: SimulationResult
  teams: Record<string, Team>
}) {
  const team = teams[teamId]
  const probs = result.teamProbabilities[teamId]

  const teamGroup = team?.group

  const opponentPools = useMemo(() => {
    if (!teamGroup) return null
    return buildOpponentPools(teamGroup, teams)
  }, [teamGroup, teams])

  if (!team || !probs) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-12 w-12 text-white/20 mb-4" />
        <h3 className="text-lg font-bold text-white/60">Team Not Found</h3>
        <p className="text-sm text-white/30 mt-2">
          Selected team data is not available in the current simulation.
        </p>
      </div>
    )
  }

  const champGivenFinal = probs.final > 0
    ? Math.round((probs.champion / probs.final) * 1000) / 10
    : 0

  return (
    <div className="space-y-6 py-4">
      <TeamHeader
        team={team}
        probs={probs}
        champGivenFinal={champGivenFinal}
      />

      <div className="relative">
        <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500/40 via-cyan-500/20 to-transparent" />

        <div className="space-y-4">
          {ROUND_PROB_KEYS.map((roundDef, idx) => {
            const reachProb = probs[roundDef.probKey]
            const allOpponents = opponentPools?.[roundDef.round] ?? []
            const opponents = allOpponents.filter((oppId) => {
              const oppProb = result.teamProbabilities[oppId]?.[roundDef.probKey]
              return oppProb !== undefined && oppProb > 0
            })

            return (
              <RoundStep
                key={roundDef.round}
                roundDef={roundDef}
                idx={idx}
                isLast={idx === ROUND_PROB_KEYS.length - 1}
                team={team}
                reachProb={reachProb}
                opponents={opponents}
                teams={teams}
                teamProbabilities={result.teamProbabilities}
                probKey={roundDef.probKey}
              />
            )
          })}
        </div>
      </div>

      <ChampionCard
        team={team}
        champProb={probs.champion}
        champGivenFinal={champGivenFinal}
      />
    </div>
  )
}

function TeamHeader({
  team,
  probs,
  champGivenFinal,
}: {
  team: Team
  probs: TeamProbability
  champGivenFinal: number
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 p-4">
      <img
        src={getFlagImageUrl(team.id, 64)}
        alt={team.code}
        className="h-14 w-14 object-contain"
      />
      <div>
        <h3 className="text-lg font-black uppercase tracking-tight text-white">
          {team.name}
        </h3>
        <div className="mt-1 flex items-center gap-3 flex-wrap">
          <ProbBadge label="Final" value={probs.final} color="text-cyan-300" />
          <ProbBadge label="Champion" value={probs.champion} color="text-gold" />
          {champGivenFinal > 0 && (
            <ProbBadge
              label="Win Final if Reached"
              value={champGivenFinal}
              color="text-green-400"
            />
          )}
        </div>
      </div>
    </div>
  )
}

function ProbBadge({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <span className="text-xs text-white/40">
      {label}: <span className={`font-bold ${color}`}>{value}%</span>
    </span>
  )
}

function RoundStep({
  roundDef,
  idx,
  isLast,
  team,
  reachProb,
  opponents,
  teams,
  teamProbabilities,
  probKey,
}: {
  roundDef: { round: string; probKey: keyof TeamProbability; label: string }
  idx: number
  isLast: boolean
  team: Team
  reachProb: number
  opponents: string[]
  teams: Record<string, Team>
  teamProbabilities: Record<string, TeamProbability>
  probKey: keyof TeamProbability
}) {
  const isFinal = isLast

  return (
    <div className="relative pl-12">
      <div
        className={cn(
          "absolute left-[15px] top-4 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center",
          isFinal
            ? "border-gold bg-gold/20"
            : "border-cyan-500/50 bg-cyan-500/10"
        )}
      >
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            isFinal ? "bg-gold" : "bg-cyan-400"
          )}
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-xs font-black uppercase tracking-wider",
                isFinal ? "text-gold" : "text-cyan-300"
              )}
            >
              {roundDef.label}
            </span>
          </div>
          <span className="text-[10px] font-mono text-white/30">
            {reachProb}% to reach
          </span>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-3 py-2 min-w-0 flex-1">
            <img
              src={getFlagImageUrl(team.id, 20)}
              alt={team.code}
              className="h-5 w-5 object-contain flex-shrink-0"
            />
            <span className="text-xs font-bold text-cyan-300 truncate">
              {team.name}
            </span>
            <span className="text-[10px] font-mono text-cyan-300/50 ml-auto flex-shrink-0">
              {reachProb}%
            </span>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <ChevronRight className="h-4 w-4 text-white/20" />
          </div>

          <div className="flex-1 space-y-1.5 min-w-0">
            {opponents.length === 0 ? (
              <div className="rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2">
                <span className="text-xs text-white/30 italic">Path TBD</span>
              </div>
            ) : (
              opponents.map((oppId) => {
                const opp = teams[oppId]
                const oppProb = teamProbabilities[oppId]?.[probKey]
                return (
                  <div
                    key={oppId}
                    className="flex items-center gap-2 rounded-lg bg-white/[0.03] border border-white/5 px-3 py-1.5"
                  >
                    <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                      {opp ? (
                        <img
                          src={getFlagImageUrl(opp.id, 20)}
                          alt={opp.code}
                          className="h-4 w-4 object-contain"
                        />
                      ) : (
                        <span className="text-[10px]">❓</span>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-white/70 truncate flex-1">
                      {opp?.name || oppId}
                    </span>
                    <span className="text-[9px] font-mono text-white/30 flex-shrink-0">
                      {oppProb !== undefined ? `${oppProb}%` : "—"}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ChampionCard({
  team,
  champProb,
  champGivenFinal,
}: {
  team: Team
  champProb: number
  champGivenFinal: number
}) {
  return (
    <div className="rounded-xl border-2 border-gold/20 bg-gradient-to-b from-gold/5 to-transparent p-6 text-center">
      <Trophy className="mx-auto mb-2 h-8 w-8 text-gold" />
      <div className="text-lg font-black uppercase tracking-tight text-gold">
        {champProb}% Champion
      </div>
      <div className="mt-1 text-xs text-white/40">
        {team.name} win the World Cup
      </div>
      {champGivenFinal > 0 && (
        <div className="mt-2 text-[10px] text-white/30">
          {champGivenFinal}% chance to win the final if they reach it
        </div>
      )}
    </div>
  )
}

// ─── Opponent Pool Computation ──────────────────────────────────────────

function getTeamsFromSource(
  source: TeamSource,
  teams: Record<string, Team>,
  visited: Set<number>
): string[] {
  switch (source.type) {
    case "group_winner":
    case "group_runner_up":
    case "third_place":
      return Object.values(teams)
        .filter((t) => t.group === source.group)
        .map((t) => t.id)
    case "third_place_dependent":
      return Object.values(teams)
        .filter((t) => source.groupPool.includes(t.group))
        .map((t) => t.id)
    case "winner_of":
    case "loser_of": {
      if (visited.has(source.matchId)) return []
      visited.add(source.matchId)
      const slot = ALL_BRACKET_MATCHES.find(
        (m) => m.matchId === source.matchId
      )
      if (!slot) return []
      return [
        ...getTeamsFromSource(slot.sourceA, teams, visited),
        ...getTeamsFromSource(slot.sourceB, teams, visited),
      ]
    }
  }
}

function getR32MatchForGroupWinner(group: string) {
  return R32_MATCHES.find((m) => {
    const a =
      m.sourceA.type === "group_winner" && m.sourceA.group === group
    const b =
      m.sourceB.type === "group_winner" && m.sourceB.group === group
    return a || b
  }) ?? null
}

function getTeamSideInMatch(
  matchId: number,
  group: string
): "A" | "B" | null {
  const slot = ALL_BRACKET_MATCHES.find((m) => m.matchId === matchId)
  if (!slot) return null
  const isA =
    slot.sourceA.type === "group_winner" && slot.sourceA.group === group
  const isB =
    slot.sourceB.type === "group_winner" && slot.sourceB.group === group
  if (isA) return "A"
  if (isB) return "B"
  return null
}

function getOpponentSide(source: TeamSource, side: "A" | "B"): TeamSource {
  return side === "A" ? source : source
}

interface OpponentPoolMap {
  [round: string]: string[]
}

function buildOpponentPools(
  group: string,
  teams: Record<string, Team>
): OpponentPoolMap | null {
  const r32Match = getR32MatchForGroupWinner(group)
  if (!r32Match) return null

  const teamSide = getTeamSideInMatch(r32Match.matchId, group)
  if (!teamSide) return null

  const pools: OpponentPoolMap = {}

  // R32: opponent is the other side of the R32 match
  const r32OpponentSource =
    teamSide === "A" ? r32Match.sourceB : r32Match.sourceA
  pools["Round of 32"] = dedupe(
    getTeamsFromSource(r32OpponentSource, teams, new Set())
  )

  // Build edge chain: childMatchId → { parentMatchId, childSide }
  const childToParent = new Map<
    number,
    { parentMatchId: number; childSide: string }
  >()
  const allSlots = ALL_BRACKET_MATCHES
  for (const slot of allSlots) {
    const extract = (source: TeamSource, side: string) => {
      if (source.type === "winner_of") {
        childToParent.set(source.matchId, {
          parentMatchId: slot.matchId,
          childSide: side,
        })
      }
    }
    extract(slot.sourceA, "A")
    extract(slot.sourceB, "B")
  }

  const laterRounds = [
    { round: "Round of 16", parentMatchId: 0 },
    { round: "Quarter-Finals", parentMatchId: 0 },
    { round: "Semi-Finals", parentMatchId: 0 },
    { round: "Final", parentMatchId: 0 },
  ]

  let currentMatchId = r32Match.matchId
  for (const rd of laterRounds) {
    const parent = childToParent.get(currentMatchId)
    if (!parent) break

    const parentSlot = allSlots.find(
      (s) => s.matchId === parent.parentMatchId
    )
    if (!parentSlot) break

    const opponentChildSide = parent.childSide === "A" ? "B" : "A"
    const opponentSource =
      opponentChildSide === "A"
        ? parentSlot.sourceA
        : parentSlot.sourceB

    pools[rd.round] = dedupe(
      getTeamsFromSource(opponentSource, teams, new Set())
    )

    currentMatchId = parent.parentMatchId
  }

  return pools
}

function dedupe(arr: string[]): string[] {
  return [...new Set(arr)]
}
