"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { getFlagImageUrl } from "@/lib/team-flags"
import type { KnockoutRound, Team, TeamProbability } from "@/lib/simulation"
import { buildBracketEdges, getTeamCrossings } from "@/lib/bracket-seeding"
import type { BracketTeamSlot, BracketEdge } from "@/lib/bracket-seeding"
import { X, Filter, Crosshair, ZoomIn, ZoomOut } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

// ─── Constants ────────────────────────────────────────────────────────

const BASE_MATCH_WIDTH = 170
const MOBILE_MATCH_WIDTH = 140
const MATCH_HEIGHT = 52
const BASE_COLUMN_GAP = 60
const MOBILE_COLUMN_GAP = 40
const ROW_GAP = 6
const TEAM_ROW_HEIGHT = 26

const ROUND_COLORS: Record<string, string> = {
  "Round of 32": "from-blue-500/20 to-blue-600/10 border-blue-500/30",
  "Round of 16": "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30",
  "Quarter-Finals": "from-purple-500/20 to-purple-600/10 border-purple-500/30",
  "Semi-Finals": "from-amber-500/20 to-amber-600/10 border-amber-500/30",
  "Final": "from-gold/20 to-gold/10 border-gold/30",
}

const ROUND_BADGE_COLORS: Record<string, string> = {
  "Round of 32": "bg-blue-500/20 text-blue-300",
  "Round of 16": "bg-cyan-500/20 text-cyan-300",
  "Quarter-Finals": "bg-purple-500/20 text-purple-300",
  "Semi-Finals": "bg-amber-500/20 text-amber-300",
  "Final": "bg-gold/20 text-gold",
}

// ─── Layout Helpers ───────────────────────────────────────────────────

interface MatchLayout {
  matchId: number
  roundIdx: number
  matchIdx: number
  x: number
  y: number
  centerY: number
  round: string
}

function computeLayout(
  roundDefs: { round: string; matches: { matchId: number }[] }[],
  isMobile: boolean
): { layouts: MatchLayout[]; bracketWidth: number; bracketHeight: number } {
  const layouts: MatchLayout[] = []
  const MW = isMobile ? MOBILE_MATCH_WIDTH : BASE_MATCH_WIDTH
  const CG = isMobile ? MOBILE_COLUMN_GAP : BASE_COLUMN_GAP

  function getCenterY(roundIdx: number, matchIdx: number): number {
    if (roundIdx === 0) {
      return matchIdx * (MATCH_HEIGHT + ROW_GAP) + MATCH_HEIGHT / 2
    }
    const parentA = getCenterY(roundIdx - 1, matchIdx * 2)
    const parentB = getCenterY(roundIdx - 1, matchIdx * 2 + 1)
    return (parentA + parentB) / 2
  }

  const totalR32Matches = roundDefs[0]?.matches.length ?? 16
  const bracketHeight = totalR32Matches * (MATCH_HEIGHT + ROW_GAP) - ROW_GAP + MATCH_HEIGHT

  for (let r = 0; r < roundDefs.length; r++) {
    const x = r * (MW + CG)
    for (let m = 0; m < roundDefs[r].matches.length; m++) {
      const centerY = getCenterY(r, m)
      layouts.push({
        matchId: roundDefs[r].matches[m].matchId,
        roundIdx: r,
        matchIdx: m,
        x,
        y: centerY - MATCH_HEIGHT / 2,
        centerY,
        round: roundDefs[r].round,
      })
    }
  }

  const bracketWidth = roundDefs.length * (MW + CG) + 140

  return { layouts, bracketWidth, bracketHeight }
}

// ─── Connector Lines ──────────────────────────────────────────────────

interface ConnectorLine {
  matchId: number
  path: string
  childMatchIds: number[]
}

function computeConnectors(
  edges: BracketEdge[],
  layouts: MatchLayout[],
  isMobile: boolean
): ConnectorLine[] {
  const layoutMap = new Map<number, MatchLayout>()
  for (const l of layouts) layoutMap.set(l.matchId, l)
  const MW = isMobile ? MOBILE_MATCH_WIDTH : BASE_MATCH_WIDTH
  const CG = isMobile ? MOBILE_COLUMN_GAP : BASE_COLUMN_GAP

  const connectors: ConnectorLine[] = []

  const parentMap = new Map<number, BracketEdge[]>()
  for (const edge of edges) {
    if (!parentMap.has(edge.parentMatchId)) {
      parentMap.set(edge.parentMatchId, [])
    }
    parentMap.get(edge.parentMatchId)!.push(edge)
  }

  for (const [parentId, childEdges] of parentMap) {
    const parentLayout = layoutMap.get(parentId)
    if (!parentLayout || childEdges.length < 2) continue

    const childA = childEdges.find(e => e.childSide === "A")
    const childB = childEdges.find(e => e.childSide === "B")
    const childLayoutA = childA ? layoutMap.get(childA.childMatchId) : undefined
    const childLayoutB = childB ? layoutMap.get(childB.childMatchId) : undefined
    if (!childLayoutA || !childLayoutB) continue

    const childRightX = parentLayout.x - CG + MW
    const midX = childRightX + CG / 2
    const parentLeftX = parentLayout.x

    const cA = childLayoutA.centerY
    const cB = childLayoutB.centerY
    const avg = (cA + cB) / 2

    const path = `M ${childRightX} ${cA} L ${midX} ${cA} L ${midX} ${cB} L ${midX} ${avg} L ${parentLeftX} ${avg}`

    connectors.push({
      matchId: parentId,
      path,
      childMatchIds: [childA!.childMatchId, childB!.childMatchId],
    })
  }

  return connectors
}

// ─── Team Path Tracing ────────────────────────────────────────────────

interface TeamPathInfo {
  matchIds: number[]
  reachedRound: string
  isChampion: boolean
}

function getTeamPath(
  teamId: string,
  rounds: KnockoutRound[],
  layouts: MatchLayout[]
): TeamPathInfo {
  const matchIds: number[] = []
  let reachedRound = ""
  let isChampion = false

  for (const round of rounds) {
    for (const match of round.matches) {
      if (match.teamA === teamId || match.teamB === teamId) {
        matchIds.push(match.matchId)
        if (match.winner === teamId) {
          reachedRound = round.round
          if (round.round === "Final") isChampion = true
        }
      }
    }
  }

  return { matchIds, reachedRound, isChampion }
}

// ─── Main Component ───────────────────────────────────────────────────

interface BracketCrossingsProps {
  rounds: KnockoutRound[]
  teams: Record<string, Team>
  teamProbabilities?: Record<string, TeamProbability>
  bracketSeeding: BracketTeamSlot[]
  advancingIds: string[]
  className?: string
}

export function BracketCrossings({
  rounds,
  teams,
  teamProbabilities,
  bracketSeeding,
  advancingIds,
  className,
}: BracketCrossingsProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [hoveredTeamId, setHoveredTeamId] = useState<string | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [showOpponents, setShowOpponents] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [isMobile, setIsMobile] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const edges = useMemo(() => buildBracketEdges(), [])

  const { layouts, bracketWidth, bracketHeight } = useMemo(
    () => computeLayout(rounds, isMobile),
    [rounds, isMobile]
  )

  const connectors = useMemo(
    () => computeConnectors(edges, layouts, isMobile),
    [edges, layouts, isMobile]
  )

  const layoutMap = useMemo(() => {
    const m = new Map<number, MatchLayout>()
    for (const l of layouts) m.set(l.matchId, l)
    return m
  }, [layouts])

  // Get all groups from advancing teams
  const allGroups = useMemo(() => {
    const groups = new Set<string>()
    for (const id of advancingIds) {
      const team = teams[id]
      if (team) groups.add(team.group)
    }
    return [...groups].sort()
  }, [advancingIds, teams])

  // Team path info when selected
  const selectedPath = useMemo(() => {
    if (!selectedTeamId) return null
    return getTeamPath(selectedTeamId, rounds, layouts)
  }, [selectedTeamId, rounds, layouts])

  // Possible opponents for selected team
  const crossings = useMemo(() => {
    if (!selectedTeamId) return null
    return getTeamCrossings(selectedTeamId, bracketSeeding, advancingIds)
  }, [selectedTeamId, bracketSeeding, advancingIds])

  // Build intersections: for each match, which teams' paths go through it
  const matchTeamMap = useMemo(() => {
    const map = new Map<number, string[]>()
    for (const id of advancingIds) {
      const path = getTeamPath(id, rounds, layouts)
      for (const matchId of path.matchIds) {
        if (!map.has(matchId)) map.set(matchId, [])
        map.get(matchId)!.push(id)
      }
    }
    return map
  }, [advancingIds, rounds, layouts])

  // Reset selection
  const clearSelection = useCallback(() => {
    setSelectedTeamId(null)
  }, [])

  // Find match in rounds data
  const findMatch = useCallback(
    (matchId: number) => {
      for (const round of rounds) {
        for (const match of round.matches) {
          if (match.matchId === matchId) return match
        }
      }
      return null
    },
    [rounds]
  )

  // ─── Render ───────────────────────────────────────────────────────

  if (!rounds.length || !advancingIds.length) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-16 text-white/30", className)}>
        <Crosshair className="h-10 w-10 mb-3 opacity-30" />
        <p className="text-sm font-bold">No bracket data available</p>
        <p className="text-xs mt-1">Run a simulation first to see crossing paths.</p>
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      {/* Controls bar */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-white/40" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 hidden sm:inline">
            Group:
          </span>
          <select
            value={selectedGroup ?? ""}
            onChange={(e) => setSelectedGroup(e.target.value || null)}
            className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs text-white/80"
          >
            <option value="">All Groups</option>
            {allGroups.map((g) => (
              <option key={g} value={g}>Group {g}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={showOpponents}
            onChange={(e) => setShowOpponents(e.target.checked)}
            className="rounded border-white/20"
          />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 hidden sm:inline">
            Show Opponent Pools
          </span>
        </label>

        {/* Zoom controls (mobile) */}
        <div className="flex items-center gap-1 ml-auto sm:ml-0">
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            className="rounded-md border border-white/10 bg-black/40 px-1.5 py-1 text-[10px] text-white/60 hover:text-white"
          >
            <ZoomOut className="h-3 w-3" />
          </button>
          <span className="text-[10px] font-mono text-white/40 w-8 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            className="rounded-md border border-white/10 bg-black/40 px-1.5 py-1 text-[10px] text-white/60 hover:text-white"
          >
            <ZoomIn className="h-3 w-3" />
          </button>
        </div>

        {selectedTeamId && (
          <button
            onClick={clearSelection}
            className="flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-300"
          >
            <X className="h-3 w-3" />
            Clear Selection
          </button>
        )}
      </div>

      {/* Scrollable bracket area */}
      <div
        ref={containerRef}
        className="overflow-x-auto overflow-y-hidden -mx-4 px-4 sm:mx-0 sm:px-0 touch-pan-x"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div
          className="relative"
          style={{
            width: bracketWidth,
            height: bracketHeight,
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
          }}
        >
          {/* SVG Connectors Layer */}
          <svg
            ref={svgRef}
            className="absolute inset-0 pointer-events-none z-0"
            width={bracketWidth}
            height={bracketHeight}
            style={{ minWidth: bracketWidth, minHeight: bracketHeight }}
          >
            <defs>
              <linearGradient id="connectorGlow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(6,182,212,0)" />
                <stop offset="50%" stopColor="rgba(6,182,212,0.6)" />
                <stop offset="100%" stopColor="rgba(6,182,212,0)" />
              </linearGradient>
            </defs>

            {connectors.map((conn) => {
              const isHighlighted =
                selectedPath?.matchIds.includes(conn.matchId) ||
                selectedPath?.matchIds.some((id) => conn.childMatchIds.includes(id))

              return (
                <motion.path
                  key={conn.matchId}
                  d={conn.path}
                  fill="none"
                  stroke={isHighlighted ? "rgba(6,182,212,0.6)" : "rgba(255,255,255,0.08)"}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                  className={isHighlighted ? "drop-shadow-[0_0_4px_rgba(6,182,212,0.3)]" : ""}
                  animate={{
                    pathLength: 1,
                    opacity: isHighlighted ? 1 : 0.4,
                  }}
                  initial={{ pathLength: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                />
              )
            })}
          </svg>

          {/* Match Cards Layer */}
          <AnimatePresence mode="popLayout">
          {layouts.map((layout) => {
            const match = findMatch(layout.matchId)
            if (!match) return null

            const tA = match.teamA ? teams[match.teamA] : null
            const tB = match.teamB ? teams[match.teamB] : null

            const isSelected = match.teamA === selectedTeamId || match.teamB === selectedTeamId
            const isOnSelectedPath = selectedPath?.matchIds.includes(layout.matchId)

            const isHovered = match.teamA === hoveredTeamId || match.teamB === hoveredTeamId

            const passesGroupFilter =
              !selectedGroup ||
              (tA?.group === selectedGroup) ||
              (tB?.group === selectedGroup)

            if (!passesGroupFilter) return null

            const MW = isMobile ? MOBILE_MATCH_WIDTH : BASE_MATCH_WIDTH

            return (
              <motion.div
                key={layout.matchId}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{
                  opacity: 1,
                  scale: isOnSelectedPath ? 1.02 : 1,
                  y: 0,
                }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={cn(
                  "absolute rounded-lg border overflow-hidden bg-card/80 backdrop-blur-sm",
                  ROUND_COLORS[layout.round] ?? "border-white/10",
                  isOnSelectedPath
                    ? "shadow-lg shadow-cyan-500/20 border-cyan-500/50 z-10"
                    : match.winner
                      ? "shadow-md"
                      : "shadow-sm",
                  isSelected ? "ring-2 ring-cyan-400" : "",
                )}
                style={{
                  left: layout.x,
                  top: layout.y,
                  width: MW,
                  height: MATCH_HEIGHT,
                }}
              >
                {/* Team A */}
                <TeamRowContent
                  team={tA}
                  isWinner={match.winner === match.teamA}
                  teamProbabilities={teamProbabilities}
                  round={layout.round}
                  isSelected={match.teamA === selectedTeamId}
                  isHovered={match.teamA === hoveredTeamId}
                  onClick={() => setSelectedTeamId(match.teamA === selectedTeamId ? null : match.teamA)}
                  onHover={setHoveredTeamId}
                  position="top"
                  isMobile={isMobile}
                />

                {/* Team B */}
                <TeamRowContent
                  team={tB}
                  isWinner={match.winner === match.teamB}
                  teamProbabilities={teamProbabilities}
                  round={layout.round}
                  isSelected={match.teamB === selectedTeamId}
                  isHovered={match.teamB === hoveredTeamId}
                  onClick={() => setSelectedTeamId(match.teamB === selectedTeamId ? null : match.teamB)}
                  onHover={setHoveredTeamId}
                  position="bottom"
                  isMobile={isMobile}
                />
              </motion.div>
            )
          })}
          </AnimatePresence>

          {/* Champion column */}
          {(() => {
            const finalRound = rounds[rounds.length - 1]
            const finalMatch = finalRound?.matches[0]
            const champion = finalMatch?.winner ? teams[finalMatch.winner] : null
            const champProb = champion && teamProbabilities
              ? teamProbabilities[champion.id]?.champion
              : undefined

            const championY = bracketHeight / 2 - 60
            const MW = isMobile ? MOBILE_MATCH_WIDTH : BASE_MATCH_WIDTH
            const CG = isMobile ? MOBILE_COLUMN_GAP : BASE_COLUMN_GAP

            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
                className="absolute flex flex-col items-center gap-2 rounded-xl border-2 border-gold/40 bg-gradient-to-b from-gold/10 to-gold/5 p-4 shadow-lg shadow-gold/10"
                style={{
                  left: rounds.length * (MW + CG) + 10,
                  top: championY,
                  width: isMobile ? 100 : 130,
                }}
              >
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gold">
                  Champion
                </span>
                {champion ? (
                  <>
                    <img
                      src={getFlagImageUrl(champion.id, 64)}
                      alt={champion.code}
                      className="h-10 w-10 sm:h-12 sm:w-12 object-contain drop-shadow-lg"
                    />
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-gold text-center leading-tight">
                      {champion.name}
                    </span>
                    {champProb !== undefined && (
                      <span className="text-[9px] font-mono text-gold/60">
                        {Math.round(champProb)}% prob
                      </span>
                    )}
                  </>
                ) : (
                  <motion.span
                    className="text-3xl"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    TBD
                  </motion.span>
                )}
              </motion.div>
            )
          })()}
        </div>
      </div>

      {/* Bottom panel: Crossings detail */}
      <AnimatePresence>
      {selectedTeamId && selectedPath && crossings && (
        <motion.div
          key={selectedTeamId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <CrossingDetail
            team={teams[selectedTeamId]}
            path={selectedPath}
            crossings={crossings}
            teams={teams}
            findMatch={findMatch}
          />
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  )
}

// ─── Team Row Sub-Component ───────────────────────────────────────────

function TeamRowContent({
  team,
  isWinner,
  teamProbabilities,
  round,
  isSelected,
  isHovered,
  onClick,
  onHover,
  position,
  isMobile,
}: {
  team: Team | null
  isWinner: boolean
  teamProbabilities?: Record<string, TeamProbability>
  round: string
  isSelected: boolean
  isHovered: boolean
  onClick: () => void
  onHover: (id: string | null) => void
  position: "top" | "bottom"
  isMobile?: boolean
}) {
  const probKeyMap: Record<string, keyof TeamProbability> = {
    "Round of 32": "roundOf16",
    "Round of 16": "quarterFinal",
    "Quarter-Finals": "semiFinal",
    "Semi-Finals": "final",
    "Final": "champion",
  }
  const probKey = probKeyMap[round] || "champion"
  const prob = team ? teamProbabilities?.[team.id]?.[probKey] : undefined

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-2 py-1 min-w-0 cursor-pointer transition-all duration-150",
        position === "top" ? "border-b border-white/5" : "",
        isWinner ? "bg-primary/10" : "hover:bg-white/10",
        isSelected ? "bg-cyan-500/15" : "",
        isHovered && !isSelected ? "bg-white/5" : "",
      )}
      onClick={(e) => {
        e.stopPropagation()
        if (team) onClick()
      }}
      onMouseEnter={() => team && onHover(team.id)}
      onMouseLeave={() => onHover(null)}
    >
      {team ? (
        <img
          src={getFlagImageUrl(team.id, isMobile ? 16 : 20)}
          alt={team.code}
          className={cn("object-contain flex-shrink-0", isMobile ? "h-3 w-3" : "h-3.5 w-3.5")}
        />
      ) : (
        <span className="text-xs flex-shrink-0">-</span>
      )}
      <span
        className={cn(
          "font-bold flex-1 truncate leading-tight",
          isMobile ? "text-[10px]" : "text-[11px]",
          isWinner ? "text-primary" : team ? "text-white/70" : "text-white/30",
          isSelected ? "text-cyan-300" : "",
        )}
      >
        {team?.name || "TBD"}
      </span>
      {prob !== undefined && (
        <span
          className={cn(
            "flex-shrink-0 tabular-nums",
            isMobile ? "text-[8px]" : "text-[9px]",
            "font-mono",
            isWinner ? "text-primary/80" : "text-white/30",
          )}
        >
          {Math.round(prob)}%
        </span>
      )}
    </div>
  )
}

// ─── Crossing Detail Panel ────────────────────────────────────────────

function CrossingDetail({
  team,
  path,
  crossings,
  teams,
  findMatch,
}: {
  team: Team | null
  path: TeamPathInfo
  crossings: { round: string; possibleOpponents: string[]; matchId: number }[]
  teams: Record<string, Team>
  findMatch: (matchId: number) => { teamA: string | null; teamB: string | null; winner: string | null } | null
}) {
  if (!team) return null

  return (
    <div className="mt-6 rounded-xl border border-cyan-500/20 bg-gradient-to-b from-cyan-500/5 to-transparent p-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="flex items-center gap-3 mb-4">
        <img
          src={getFlagImageUrl(team.id, 32)}
          alt={team.code}
          className="h-8 w-8 object-contain"
        />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black uppercase tracking-tight text-cyan-300">
              {team.name}
            </span>
            <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
              {path.isChampion ? "Champion" : path.reachedRound || "Round of 32"}
            </span>
          </div>
          <span className="text-[10px] text-white/40 font-mono">
            Group {team.group} · {team.code}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {crossings.map((cross) => {
          const match = findMatch(cross.matchId)
          const actualOpponent = match
            ? match.teamA === team.id ? match.teamB : match.teamA
            : null

          return (
            <div
              key={cross.round}
              className="rounded-lg border border-white/10 bg-black/30 p-3"
            >
              <div className="text-[9px] font-black uppercase tracking-wider text-white/40 mb-2">
                {cross.round}
              </div>

              {/* Actual opponent */}
              {actualOpponent && teams[actualOpponent] && (
                <div className="flex items-center gap-1.5 mb-2 rounded bg-green-500/10 px-2 py-1">
                  <span className="text-[9px] font-bold uppercase text-green-400 mr-1">vs</span>
                  <img
                    src={getFlagImageUrl(actualOpponent, 16)}
                    alt={teams[actualOpponent].code}
                    className="h-3 w-3 object-contain"
                  />
                  <span className="text-xs font-bold text-white/80">
                    {teams[actualOpponent].name}
                  </span>
                </div>
              )}

              {/* Possible opponents pool */}
              {cross.possibleOpponents.length > 0 && (
                <div>
                  <div className="text-[8px] font-bold uppercase tracking-wider text-white/30 mb-1">
                    Possible opponents ({cross.possibleOpponents.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cross.possibleOpponents.map((oppId) => {
                      const opp = teams[oppId]
                      if (!opp || oppId === team.id) return null
                      const isActual = oppId === actualOpponent
                      return (
                        <span
                          key={oppId}
                          className={cn(
                            "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold",
                            isActual
                              ? "bg-green-500/20 text-green-300"
                              : "bg-white/5 text-white/50",
                          )}
                        >
                          <img
                            src={getFlagImageUrl(oppId, 12)}
                            alt={opp.code}
                            className="h-2.5 w-2.5 object-contain"
                          />
                          {opp.code}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
