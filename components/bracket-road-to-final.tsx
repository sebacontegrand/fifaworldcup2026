"use client"

import { useMemo, useRef, useEffect, useState } from "react"
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
import { AlertCircle, Flag, Trophy } from "lucide-react"

interface BracketRoadToFinalProps {
  teams: Record<string, Team>
  className?: string
}

const ROUND_DEFS: { round: string; probKey: keyof TeamProbability; label: string; width: number }[] = [
  { round: "Round of 32", probKey: "roundOf32", label: "R32", width: 155 },
  { round: "Round of 16", probKey: "roundOf16", label: "R16", width: 160 },
  { round: "Quarter-Finals", probKey: "quarterFinal", label: "QF", width: 170 },
  { round: "Semi-Finals", probKey: "semiFinal", label: "SF", width: 175 },
  { round: "Final", probKey: "final", label: "Final", width: 175 },
]

const CHAMPION_WIDTH = 140
const COL_GAP = 10
const CONNECTOR_COLOR = "rgba(6, 182, 212, 0.2)"
const CONNECTOR_COLOR_OPP = "rgba(255, 255, 255, 0.08)"
const ROW_H = 28
const LABEL_H = 40
const CARD_PAD = 8

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

// ─── Main Content ────────────────────────────────────────────────────

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

  const roundOpponents = useMemo(() => {
    const pools: Record<string, { id: string; prob: number }[]> = {}
    for (const def of ROUND_DEFS) {
      const all = opponentPools?.[def.round] ?? []
      pools[def.round] = all
        .map((id) => ({
          id,
          prob: result.teamProbabilities[id]?.[def.probKey] ?? 0,
        }))
        .filter((o) => o.prob > 0)
        .sort((a, b) => b.prob - a.prob)
    }
    return pools
  }, [opponentPools, result.teamProbabilities])

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

  const champGivenFinal =
    probs.final > 0 ? Math.round((probs.champion / probs.final) * 1000) / 10 : 0

  return (
    <div className={cn("py-4", "space-y-4")}>
      <TeamHeader team={team} probs={probs} champGivenFinal={champGivenFinal} />

      {/* ── Bracket Columns ── */}
      <HorizontalBracket
        team={team}
        probs={probs}
        roundOpponents={roundOpponents}
        teams={teams}
        champGivenFinal={champGivenFinal}
      />
    </div>
  )
}

// ─── Horizontal Bracket Layout ───────────────────────────────────────

const MAX_OPPONENTS = 7

function HorizontalBracket({
  team,
  probs,
  roundOpponents,
  teams,
  champGivenFinal,
}: {
  team: Team
  probs: TeamProbability
  roundOpponents: Record<string, { id: string; prob: number }[]>
  teams: Record<string, Team>
  champGivenFinal: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 })

  const totalWidth =
    ROUND_DEFS.reduce((s, d) => s + d.width, 0) +
    (ROUND_DEFS.length - 1) * COL_GAP +
    16

  const colLefts = useMemo(() => {
    const lefts: number[] = []
    let x = 8
    for (let i = 0; i < ROUND_DEFS.length; i++) {
      lefts.push(x)
      x += ROUND_DEFS[i].width + COL_GAP
    }
    return lefts
  }, [])

  const oppCounts = useMemo(
    () => ROUND_DEFS.map((d) => Math.min(roundOpponents[d.round]?.length ?? 0, MAX_OPPONENTS)),
    [roundOpponents]
  )

  const myTeamY = LABEL_H + CARD_PAD + ROW_H / 2
  const firstOppY = LABEL_H + CARD_PAD + ROW_H + 1 + ROW_H / 2

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      setSvgSize({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    ro.observe(containerRef.current)
    const rect = containerRef.current.getBoundingClientRect()
    setSvgSize({ w: rect.width, h: rect.height })
    return () => ro.disconnect()
  }, [])

  const connectorPaths = useMemo(() => {
    const paths: string[] = []
    for (let i = 0; i < ROUND_DEFS.length - 1; i++) {
      const x1 = colLefts[i] + ROUND_DEFS[i].width
      const x2 = colLefts[i + 1]
      const midX = (x1 + x2) / 2

      paths.push(`M ${x1} ${myTeamY} L ${x2} ${myTeamY}`)

      const n = oppCounts[i]
      if (n > 0) {
        const lastOppY = firstOppY + (n - 1) * ROW_H
        paths.push(`M ${x1} ${lastOppY} L ${midX} ${lastOppY} L ${midX} ${myTeamY}`)
      }
    }
    return paths
  }, [colLefts, myTeamY, firstOppY, oppCounts])

  const totalH = LABEL_H + CARD_PAD + ROW_H + 1 + Math.max(...oppCounts, 1) * ROW_H + CARD_PAD + 12

  return (
    <div className="overflow-x-auto pb-4" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
      <div
        ref={containerRef}
        className="relative"
        style={{ minWidth: totalWidth, height: totalH }}
      >
        {/* SVG connectors */}
        {svgSize.w > 0 && (
          <svg
            className="absolute inset-0 pointer-events-none"
            width={svgSize.w}
            height={svgSize.h}
            style={{ overflow: "visible" }}
          >
            {connectorPaths.map((d, i) => {
              const isMainLine = !d.includes("L")
              return (
                <path
                  key={i}
                  d={d}
                  stroke={isMainLine ? CONNECTOR_COLOR : CONNECTOR_COLOR_OPP}
                  strokeWidth={isMainLine ? 2 : 1}
                  fill="none"
                  strokeLinecap="round"
                />
              )
            })}
          </svg>
        )}

        {/* Rounds */}
        {ROUND_DEFS.map((def, idx) => {
          const reachProb = probs[def.probKey]
          const opps = roundOpponents[def.round] ?? []
          const shown = opps.slice(0, MAX_OPPONENTS)
          const rest = opps.length - MAX_OPPONENTS

          return (
            <div
              key={def.round}
              className="absolute top-0 flex flex-col"
              style={{ left: colLefts[idx], width: def.width }}
            >
              <div className="text-center mb-1.5">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400/70">
                  {def.label}
                </span>
              </div>

              <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/[0.04] overflow-hidden">
                <div className="flex items-center gap-1.5 px-2 py-1.5 bg-cyan-500/10 border-b border-cyan-500/10">
                  <img
                    src={getFlagImageUrl(team.id, 20)}
                    alt={team.code}
                    className="h-4 w-4 object-contain flex-shrink-0"
                  />
                  <span className="text-[10px] font-bold text-cyan-300 truncate leading-none">
                    {team.code}
                  </span>
                  <span className="text-[8px] font-mono text-cyan-300/50 ml-auto flex-shrink-0 tabular-nums">
                    {reachProb}%
                  </span>
                </div>

                {shown.length === 0 ? (
                  <div className="px-2 py-2">
                    <span className="text-[9px] text-white/20 italic">TBD</span>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.03]">
                    {shown.map((opp) => {
                      const oppTeam = teams[opp.id]
                      return (
                        <div
                          key={opp.id}
                          className="flex items-center gap-1.5 px-2 py-1 hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                            {oppTeam ? (
                              <img
                                src={getFlagImageUrl(oppTeam.id, 16)}
                                alt={oppTeam.code}
                                className="h-3.5 w-3.5 object-contain"
                              />
                            ) : (
                              <span className="text-[8px]">❓</span>
                            )}
                          </div>
                          <span className="text-[9px] text-white/50 truncate leading-none flex-1">
                            {oppTeam?.code || opp.id}
                          </span>
                          <span className="text-[7px] font-mono text-white/20 flex-shrink-0 tabular-nums">
                            {opp.prob}%
                          </span>
                        </div>
                      )
                    })}
                    {rest > 0 && (
                      <div className="px-2 py-1 text-[8px] text-white/20 italic text-center">
                        +{rest} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Champion */}
        <div
          className="absolute top-0 flex flex-col"
          style={{
            left: colLefts[ROUND_DEFS.length - 1] + ROUND_DEFS[ROUND_DEFS.length - 1].width + COL_GAP,
            width: CHAMPION_WIDTH,
          }}
        >
          <div className="text-center mb-1.5">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gold">
              Champion
            </span>
          </div>

          <div
            className="flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-gold/30 bg-gradient-to-b from-gold/[0.06] to-gold/[0.02] p-3"
            style={{ marginTop: myTeamY - LABEL_H - CARD_PAD }}
          >
            <img
              src={getFlagImageUrl(team.id, 48)}
              alt={team.code}
              className="h-10 w-10 object-contain drop-shadow-lg"
            />
            <span className="text-[11px] font-black uppercase tracking-wider text-gold text-center leading-tight">
              {team.code}
            </span>
            <span className="text-[10px] font-mono text-gold/60 tabular-nums">
              {probs.champion}%
            </span>
            {champGivenFinal > 0 && (
              <span className="text-[7px] text-gold/30 text-center leading-tight">
                {champGivenFinal}% if Final
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Team Header ─────────────────────────────────────────────────────

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
  return (
    R32_MATCHES.find((m) => {
      const a = m.sourceA.type === "group_winner" && m.sourceA.group === group
      const b = m.sourceB.type === "group_winner" && m.sourceB.group === group
      return a || b
    }) ?? null
  )
}

function getTeamSideInMatch(matchId: number, group: string): "A" | "B" | null {
  const slot = ALL_BRACKET_MATCHES.find((m) => m.matchId === matchId)
  if (!slot) return null
  const isA = slot.sourceA.type === "group_winner" && slot.sourceA.group === group
  const isB = slot.sourceB.type === "group_winner" && slot.sourceB.group === group
  if (isA) return "A"
  if (isB) return "B"
  return null
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

  const r32OpponentSource = teamSide === "A" ? r32Match.sourceB : r32Match.sourceA
  pools["Round of 32"] = dedupe(getTeamsFromSource(r32OpponentSource, teams, new Set()))

  const childToParent = new Map<number, { parentMatchId: number; childSide: string }>()
  for (const slot of ALL_BRACKET_MATCHES) {
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

    const parentSlot = ALL_BRACKET_MATCHES.find(
      (s) => s.matchId === parent.parentMatchId
    )
    if (!parentSlot) break

    const opponentChildSide = parent.childSide === "A" ? "B" : "A"
    const opponentSource =
      opponentChildSide === "A" ? parentSlot.sourceA : parentSlot.sourceB

    pools[rd.round] = dedupe(getTeamsFromSource(opponentSource, teams, new Set()))
    currentMatchId = parent.parentMatchId
  }

  return pools
}

function dedupe(arr: string[]): string[] {
  return [...new Set(arr)]
}
