import teamsData from "@/data/teams.json"

// ─── Types ───────────────────────────────────────────────────────────
export interface Team {
  id: string
  name: string
  code: string
  flag: string
  group: string
  fifaRanking: number
  confederation: string
  eloRating: number
  topPlayers: { name: string; position: string; club: string; age: number }[]
  stats: { worldCupAppearances: number; bestFinish: string; recentForm: string }
}

export interface MatchResult {
  teamA: string
  teamB: string
  scoreA: number
  scoreB: number
  winner: string | null // null = draw
}

export interface GroupStanding {
  teamId: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

export interface SimulationResult {
  groupStandings: Record<string, GroupStanding[]>
  groupMatches: Record<string, MatchResult[]>
  knockoutBracket: KnockoutRound[]
  teamProbabilities: Record<string, TeamProbability>
  matchupProbabilities: Record<string, MatchupProbability>
}

export interface TeamProbability {
  groupAdvance: number
  roundOf32: number
  roundOf16: number
  quarterFinal: number
  semiFinal: number
  final: number
  champion: number
}

export interface MatchupProbability {
  teamA: string
  teamB: string
  winA: number
  draw: number
  winB: number
  expectedGoalsA: number
  expectedGoalsB: number
}

export interface KnockoutMatch {
  round: string
  matchId: number
  teamA: string | null
  teamB: string | null
  winner: string | null
}

export interface KnockoutRound {
  round: string
  matches: KnockoutMatch[]
}

export type TacticalStyle = "Normal" | "Defensive" | "Attacking"

export interface TeamSimulationConfig {
  eloAdjustment: number
  injuredPlayers: string[] // List of player names
  tacticalStyle: TacticalStyle
  isHostOverride: boolean | null
}

export interface SimulationConfig {
  teamSettings: Record<string, TeamSimulationConfig>
  globalSettings: {
    chaosFactor: number // 0 to 1
  }
}

export interface MatchOverride {
  scoreA: number
  scoreB: number
  winnerId?: string
}

export interface TournamentState {
  matchOverrides: Record<string, MatchOverride> // key: "teamAId_teamBId"
  stageAnchors: {
    semifinals: string[] // team IDs
    finals: string[] // team IDs
    champion: string | null // team ID
  }
}



// ─── Elo Probability Calculations ────────────────────────────────────

/**
 * Expected score (win probability) for team A against team B
 * using the standard Elo formula: E_A = 1 / (1 + 10^((R_B - R_A) / 400))
 */
export function expectedScore(eloA: number, eloB: number): number {
  return 1 / (1 + Math.pow(10, (eloB - eloA) / 400))
}

/**
 * Draw probability modeled as a function of Elo difference
 * Higher draw probability when teams are closely matched
 * Calibrated to ~25% baseline draw rate (World Cup group stage average)
 */
export function drawProbability(eloA: number, eloB: number): number {
  const diff = Math.abs(eloA - eloB)
  return 0.28 * Math.exp(-0.5 * diff / 200)
}

/**
 * Full match probability breakdown: win A, draw, win B
 */
export function matchProbabilities(
  eloA: number,
  eloB: number
): { winA: number; draw: number; winB: number } {
  const pDraw = drawProbability(eloA, eloB)
  const eA = expectedScore(eloA, eloB)
  const eB = 1 - eA

  // Scale win probabilities to fill remaining probability after draw
  const remaining = 1 - pDraw
  return {
    winA: remaining * eA,
    draw: pDraw,
    winB: remaining * eB,
  }
}

// ─── Expected Goals (Poisson Model) ──────────────────────────────────

/**
 * Expected goals for a team based on Elo advantage
 * Base rate ~1.3 goals per team per match (World Cup average)
 * Modified by Elo difference
 */
export function expectedGoals(eloTeam: number, eloOpponent: number): number {
  const base = 1.3
  const diff = eloTeam - eloOpponent
  // Each 100 Elo points difference = ~0.2 goals advantage
  return Math.max(0.3, base + diff / 500)
}

/**
 * Poisson random variable - simulates number of goals
 */
function poissonRandom(lambda: number): number {
  let L = Math.exp(-lambda)
  let k = 0
  let p = 1
  do {
    k++
    p *= Math.random()
  } while (p > L)
  return k - 1
}

// ─── Match Simulation ────────────────────────────────────────────────

const HOST_NATIONS = ["USA", "MEX", "CAN"]

/**
 * Simulate a single match between two teams
 * Returns goals scored by each team using Poisson distribution
 */
export function simulateMatch(
  teamA: Team,
  teamB: Team,
  allowDraw: boolean = true,
  config?: SimulationConfig,
  overrides?: Record<string, MatchOverride>
): MatchResult {
  // Check for overrides
  const overrideKey = `${teamA.id}_${teamB.id}`
  const reverseKey = `${teamB.id}_${teamA.id}`
  const override = overrides?.[overrideKey] || overrides?.[reverseKey]

  if (override) {
    const isReverse = !!overrides?.[reverseKey]
    return {
      teamA: teamA.id,
      teamB: teamB.id,
      scoreA: isReverse ? override.scoreB : override.scoreA,
      scoreB: isReverse ? override.scoreA : override.scoreB,
      winner: override.winnerId || null,
    }
  }

  const settingsA = config?.teamSettings[teamA.id]
  const settingsB = config?.teamSettings[teamB.id]

  let eloA = teamA.eloRating + (settingsA?.eloAdjustment || 0)
  let eloB = teamB.eloRating + (settingsB?.eloAdjustment || 0)

  // Injured players: -30 Elo per removed player
  eloA -= (settingsA?.injuredPlayers?.length || 0) * 30
  eloB -= (settingsB?.injuredPlayers?.length || 0) * 30

  // Host advantage
  const isHostA = settingsA?.isHostOverride ?? HOST_NATIONS.includes(teamA.code)
  const isHostB = settingsB?.isHostOverride ?? HOST_NATIONS.includes(teamB.code)
  if (isHostA) eloA += 50
  if (isHostB) eloB += 50

  // Chaos Factor: reduces the impact of Elo difference
  if (config?.globalSettings.chaosFactor) {
    const chaos = config.globalSettings.chaosFactor
    const avgElo = (eloA + eloB) / 2
    eloA = eloA * (1 - chaos) + avgElo * chaos
    eloB = eloB * (1 - chaos) + avgElo * chaos
  }

  let xgA = expectedGoals(eloA, eloB)
  let xgB = expectedGoals(eloB, eloA)

  // Tactical styles
  if (settingsA?.tacticalStyle === "Defensive") { xgA *= 0.7; xgB *= 0.8; }
  if (settingsA?.tacticalStyle === "Attacking") { xgA *= 1.3; xgB *= 1.2; }
  if (settingsB?.tacticalStyle === "Defensive") { xgB *= 0.7; xgA *= 0.8; }
  if (settingsB?.tacticalStyle === "Attacking") { xgB *= 1.3; xgA *= 1.2; }

  let scoreA = poissonRandom(xgA)
  let scoreB = poissonRandom(xgB)


  // If no draw allowed (knockout stage), simulate extra time/penalties
  if (!allowDraw && scoreA === scoreB) {
    // Extra time: reduced goal rate
    const etA = poissonRandom(xgA * 0.3)
    const etB = poissonRandom(xgB * 0.3)
    scoreA += etA
    scoreB += etB

    // Penalties if still tied (50/50 with slight Elo advantage)
    if (scoreA === scoreB) {
      const penProb = expectedScore(eloA, eloB)
      if (Math.random() < penProb) {
        scoreA += 1
      } else {
        scoreB += 1
      }
    }
  }

  return {
    teamA: teamA.id,
    teamB: teamB.id,
    scoreA,
    scoreB,
    winner: scoreA > scoreB ? teamA.id : scoreB > scoreA ? teamB.id : null,
  }
}

// ─── Group Stage Simulation ──────────────────────────────────────────

export function getTeamsByGroup(): Record<string, Team[]> {
  const groups: Record<string, Team[]> = {}
  for (const team of teamsData as Team[]) {
    if (!groups[team.group]) groups[team.group] = []
    groups[team.group].push(team)
  }
  return groups
}

function simulateGroupStage(
  teams: Record<string, Team[]>,
  config?: SimulationConfig,
  tournamentState?: TournamentState
): {
  standings: Record<string, GroupStanding[]>
  matches: Record<string, MatchResult[]>
} {
  const standings: Record<string, GroupStanding[]> = {}
  const matches: Record<string, MatchResult[]> = {}

  for (const [group, groupTeams] of Object.entries(teams)) {
    const teamStandings: Record<string, GroupStanding> = {}
    matches[group] = []

    // Initialize standings
    for (const team of groupTeams) {
      teamStandings[team.id] = {
        teamId: team.id,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      }
    }

    // Round-robin matches
    for (let i = 0; i < groupTeams.length; i++) {
      for (let j = i + 1; j < groupTeams.length; j++) {
        const result = simulateMatch(groupTeams[i], groupTeams[j], true, config, tournamentState?.matchOverrides)
        matches[group].push(result)

        const sA = teamStandings[groupTeams[i].id]
        const sB = teamStandings[groupTeams[j].id]

        sA.played++
        sB.played++
        sA.goalsFor += result.scoreA
        sA.goalsAgainst += result.scoreB
        sB.goalsFor += result.scoreB
        sB.goalsAgainst += result.scoreA

        if (result.winner === groupTeams[i].id) {
          sA.won++
          sA.points += 3
          sB.lost++
        } else if (result.winner === groupTeams[j].id) {
          sB.won++
          sB.points += 3
          sA.lost++
        } else {
          sA.drawn++
          sB.drawn++
          sA.points += 1
          sB.points += 1
        }

        sA.goalDifference = sA.goalsFor - sA.goalsAgainst
        sB.goalDifference = sB.goalsFor - sB.goalsAgainst
      }
    }

    // Sort by points, then GD, then GF
    standings[group] = Object.values(teamStandings).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.goalDifference !== a.goalDifference)
        return b.goalDifference - a.goalDifference
      return b.goalsFor - a.goalsFor
    })
  }

  return { standings, matches }
}

// ─── Knockout Stage Simulation ───────────────────────────────────────

/**
 * 2026 World Cup bracket structure:
 * 48 teams -> Top 2 from each group (24) + 8 best third-placed teams = 32
 * Round of 32 -> Round of 16 -> QF -> SF -> Final
 */
function getBestThirdPlaced(
  standings: Record<string, GroupStanding[]>
): string[] {
  const thirdPlaced: (GroupStanding & { group: string })[] = []

  for (const [group, groupStandings] of Object.entries(standings)) {
    if (groupStandings.length >= 3) {
      thirdPlaced.push({ ...groupStandings[2], group })
    }
  }

  // Sort third-placed teams by points, GD, GF
  thirdPlaced.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDifference !== a.goalDifference)
      return b.goalDifference - a.goalDifference
    return b.goalsFor - a.goalsFor
  })

  // Best 8 third-placed teams advance
  return thirdPlaced.slice(0, 8).map((t) => t.teamId)
}

function simulateKnockout(
  standings: Record<string, GroupStanding[]>,
  teamMap: Record<string, Team>,
  config?: SimulationConfig,
  tournamentState?: TournamentState
): { rounds: KnockoutRound[]; results: Record<string, string> } {
  const bestThird = getBestThirdPlaced(standings)
  const results: Record<string, string> = {}

  // Get advancing teams: top 2 from each group + 8 best thirds
  const advancingIds: string[] = []
  for (const groupStandings of Object.values(standings)) {
    advancingIds.push(groupStandings[0].teamId) // 1st
    advancingIds.push(groupStandings[1].teamId) // 2nd
  }
  advancingIds.push(...bestThird)

  // Mark teams that advance from groups
  for (const id of advancingIds) {
    results[id] = "roundOf32"
  }

  // Simplified bracket: pair teams from different groups
  // Group winners vs best thirds, runners-up vs each other
  let currentRound = [...advancingIds]

  const rounds: KnockoutRound[] = []
  const roundNames = [
    "Round of 32",
    "Round of 16",
    "Quarter-Finals",
    "Semi-Finals",
    "Final",
  ]
  const resultKeys = [
    "roundOf16",
    "quarterFinal",
    "semiFinal",
    "final",
    "champion",
  ]

  for (let r = 0; r < roundNames.length; r++) {
    const matches: KnockoutMatch[] = []
    const nextRound: string[] = []

    for (let i = 0; i < currentRound.length; i += 2) {
      if (i + 1 < currentRound.length) {
        const teamA = teamMap[currentRound[i]]
        const teamB = teamMap[currentRound[i + 1]]

        if (teamA && teamB) {
          let result = simulateMatch(teamA, teamB, false, config, tournamentState?.matchOverrides)
          let winnerId = result.winner || (result.scoreA > result.scoreB ? teamA.id : teamB.id)

          // Handle Stage Anchors
          const anchors = tournamentState?.stageAnchors
          const currentRoundIndex = r

          const aAnchoredToNext = anchors?.semifinals.includes(teamA.id) && currentRoundIndex < 3 ||
            anchors?.finals.includes(teamA.id) && currentRoundIndex < 4 ||
            anchors?.champion === teamA.id && currentRoundIndex < 5

          const bAnchoredToNext = anchors?.semifinals.includes(teamB.id) && currentRoundIndex < 3 ||
            anchors?.finals.includes(teamB.id) && currentRoundIndex < 4 ||
            anchors?.champion === teamB.id && currentRoundIndex < 5

          if (aAnchoredToNext && !bAnchoredToNext) {
            winnerId = teamA.id
          } else if (bAnchoredToNext && !aAnchoredToNext) {
            winnerId = teamB.id
          }

          matches.push({
            round: roundNames[r],
            matchId: i / 2,
            teamA: teamA.id,
            teamB: teamB.id,
            winner: winnerId,
          })

          nextRound.push(winnerId)
          results[winnerId] = resultKeys[r]
        }
      }
    }

    rounds.push({ round: roundNames[r], matches })
    currentRound = nextRound
  }

  return { rounds, results }
}

// ─── Monte Carlo Simulation ─────────────────────────────────────────

const SIMULATION_ITERATIONS = 10000

export function runFullSimulation(
  config?: SimulationConfig,
  tournamentState?: TournamentState
): SimulationResult {
  const teamsByGroup = getTeamsByGroup()
  const allTeams = teamsData as Team[]
  const teamMap: Record<string, Team> = {}
  for (const team of allTeams) {
    teamMap[team.id] = team
  }

  // Accumulators for probabilities
  const probAccum: Record<
    string,
    {
      groupAdvance: number
      roundOf32: number
      roundOf16: number
      quarterFinal: number
      semiFinal: number
      final: number
      champion: number
    }
  > = {}
  for (const team of allTeams) {
    probAccum[team.id] = {
      groupAdvance: 0,
      roundOf32: 0,
      roundOf16: 0,
      quarterFinal: 0,
      semiFinal: 0,
      final: 0,
      champion: 0,
    }
  }

  // Run Monte Carlo
  for (let i = 0; i < SIMULATION_ITERATIONS; i++) {
    const { standings } = simulateGroupStage(teamsByGroup, config, tournamentState)

    // Count group advancement
    const bestThird = getBestThirdPlaced(standings)
    for (const groupStandings of Object.values(standings)) {
      if (groupStandings[0]) probAccum[groupStandings[0].teamId].groupAdvance++
      if (groupStandings[1]) probAccum[groupStandings[1].teamId].groupAdvance++
    }
    for (const id of bestThird) {
      probAccum[id].groupAdvance++
    }

    // Run knockout and accumulate
    const { results } = simulateKnockout(standings, teamMap, config, tournamentState)

    const stageOrder = [
      "roundOf32",
      "roundOf16",
      "quarterFinal",
      "semiFinal",
      "final",
      "champion",
    ] as const

    for (const [teamId, stage] of Object.entries(results)) {
      const stageIdx = stageOrder.indexOf(
        stage as (typeof stageOrder)[number]
      )
      if (stageIdx >= 0) {
        for (let s = 0; s <= stageIdx; s++) {
          probAccum[teamId][stageOrder[s]]++
        }
      }
    }
  }

  // Convert to percentages
  const teamProbabilities: Record<string, TeamProbability> = {}
  for (const [teamId, acc] of Object.entries(probAccum)) {
    teamProbabilities[teamId] = {
      groupAdvance:
        Math.round((acc.groupAdvance / SIMULATION_ITERATIONS) * 1000) / 10,
      roundOf32:
        Math.round((acc.roundOf32 / SIMULATION_ITERATIONS) * 1000) / 10,
      roundOf16:
        Math.round((acc.roundOf16 / SIMULATION_ITERATIONS) * 1000) / 10,
      quarterFinal:
        Math.round((acc.quarterFinal / SIMULATION_ITERATIONS) * 1000) / 10,
      semiFinal:
        Math.round((acc.semiFinal / SIMULATION_ITERATIONS) * 1000) / 10,
      final: Math.round((acc.final / SIMULATION_ITERATIONS) * 1000) / 10,
      champion:
        Math.round((acc.champion / SIMULATION_ITERATIONS) * 1000) / 10,
    }
  }

  // Generate head-to-head matchup probabilities
  const matchupProbabilities: Record<string, MatchupProbability> = {}
  for (const group of Object.values(teamsByGroup)) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const tA = group[i]
        const tB = group[j]
        const key = `${tA.id}-${tB.id}`
        const probs = matchProbabilities(tA.eloRating, tB.eloRating)
        matchupProbabilities[key] = {
          teamA: tA.id,
          teamB: tB.id,
          winA: Math.round(probs.winA * 1000) / 10,
          draw: Math.round(probs.draw * 1000) / 10,
          winB: Math.round(probs.winB * 1000) / 10,
          expectedGoalsA:
            Math.round(expectedGoals(tA.eloRating, tB.eloRating) * 10) / 10,
          expectedGoalsB:
            Math.round(expectedGoals(tB.eloRating, tA.eloRating) * 10) / 10,
        }
      }
    }
  }

  // Run one "representative" simulation for display
  const { standings, matches } = simulateGroupStage(teamsByGroup, config, tournamentState)
  const { rounds } = simulateKnockout(standings, teamMap, config, tournamentState)

  return {
    groupStandings: standings,
    groupMatches: matches,
    knockoutBracket: rounds,
    teamProbabilities,
    matchupProbabilities,
  }
}

// ─── Utility Functions ───────────────────────────────────────────────

export function getTeam(id: string): Team | undefined {
  return (teamsData as Team[]).find((t) => t.id === id)
}

export function getTeamsByGroupId(groupId: string): Team[] {
  return (teamsData as Team[]).filter(
    (t) => t.group.toLowerCase() === groupId.toLowerCase()
  )
}

export function getAllGroups(): string[] {
  const groups = new Set((teamsData as Team[]).map((t) => t.group))
  return Array.from(groups).sort()
}

export function getMatchupKey(teamAId: string, teamBId: string): string {
  return teamAId < teamBId ? `${teamAId}-${teamBId}` : `${teamBId}-${teamAId}`
}
