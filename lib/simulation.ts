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
  attackStrength: number
  defenseStrength: number
  eloSigma: number
  topPlayers: { name: string; position: string; club: string; age: number }[]
  stats: { worldCupAppearances: number; bestFinish: string; recentForm: string }
}

export interface MatchResult {
  teamA: string
  teamB: string
  scoreA: number
  scoreB: number
  winner: string | null // null = draw
  wentToExtraTime?: boolean
  wentToPenalties?: boolean
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
    targetUpsetIndex: number // 10% to 50%
    targetPenaltyRate: number // 10% to 50%
    entropyMultiplier: number // 0.1 to 3.0
    propagateUncertainty: boolean
    homeAdvantageStrength: number // Elo points (default 80)
  }
}

export const DEFAULT_CONFIG: SimulationConfig = {
  teamSettings: {},
  globalSettings: {
    targetUpsetIndex: 15,    // Baseline upset frequency ~15%
    targetPenaltyRate: 15,   // Baseline penalty rate ~15%
    entropyMultiplier: 1.0,  // Baseline Elo uncertainty scalar
    propagateUncertainty: true,
    homeAdvantageStrength: 80,
  },
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

// ─── Extended Analytics Types ────────────────────────────────────────

export interface ExtendedMetrics {
  penaltyShootoutRate: number
  tournamentEntropy: number
  upsetIndex: { teamA: string; teamB: string; upsetProb: number; eloGap: number }[]
  topVolatileTeams: { teamId: string; sigma: number }[]
}

export interface SimulationResult {
  groupStandings: Record<string, GroupStanding[]>
  groupMatches: Record<string, MatchResult[]>
  knockoutBracket: KnockoutRound[]
  teamProbabilities: Record<string, TeamProbability>
  matchupProbabilities: Record<string, MatchupProbability>
  extendedMetrics: ExtendedMetrics
}

// ─── Bayesian Elo System ─────────────────────────────────────────────

/**
 * Box-Muller transform for Normal(0,1) random variable
 */
function normalRandom(): number {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

/**
 * Sample an Elo rating from its Bayesian distribution N(mean, sigma)
 */
function sampleElo(mean: number, sigma: number): number {
  return mean + normalRandom() * sigma
}

/**
 * Expected score (win probability) for team A against team B
 * using the standard Elo formula: E_A = 1 / (1 + 10^((R_B - R_A) / 400))
 */
export function expectedScore(eloA: number, eloB: number): number {
  return 1 / (1 + Math.pow(10, (eloB - eloA) / 400))
}

/**
 * Dynamic K-factor based on match context
 * - importance: World Cup knockout (1.5) > group (1.0) > friendly (0.5)
 * - marginFactor: ln(goalDiff + 1) scaling
 */
function dynamicKFactor(
  goalDiff: number,
  importance: number = 1.0
): number {
  const K_BASE = 40
  const marginFactor = Math.log(Math.abs(goalDiff) + 1)
  return K_BASE * importance * (0.5 + 0.5 * marginFactor)
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

// ─── Dixon-Coles Bivariate Poisson Model ─────────────────────────────

const MU = 0.26 // log of base rate (~1.3 goals)

/**
 * Compute expected goals using Dixon-Coles attack/defense split
 * λ_home = exp(μ + attack_home − defense_away + homeAdv)
 * λ_away = exp(μ + attack_away − defense_home)
 */
function dixonColesLambda(
  attackTeam: number,
  defenseOpponent: number,
  homeAdvantage: number = 0
): number {
  return Math.exp(MU + attackTeam - defenseOpponent + homeAdvantage)
}

/**
 * Dixon-Coles low-score correction factor ρ
 * Adjusts probabilities for 0-0, 1-0, 0-1, 1-1 outcomes
 * to correct for the empirical over-representation of low scores
 */
function dixonColesCorrection(
  x: number,
  y: number,
  lambdaA: number,
  lambdaB: number,
  rho: number
): number {
  if (x === 0 && y === 0) return 1 - lambdaA * lambdaB * rho
  if (x === 1 && y === 0) return 1 + lambdaB * rho
  if (x === 0 && y === 1) return 1 + lambdaA * rho
  if (x === 1 && y === 1) return 1 - rho
  return 1
}

/**
 * Poisson probability mass function
 */
function poissonPMF(k: number, lambda: number): number {
  let result = Math.exp(-lambda)
  for (let i = 1; i <= k; i++) {
    result *= lambda / i
  }
  return result
}

/**
 * Compute Dixon-Coles match probabilities for exact scorelines
 * Returns P(win A), P(draw), P(win B)
 */
export function dixonColesMatchProbs(
  lambdaA: number,
  lambdaB: number,
  rho: number = -0.13
): { winA: number; draw: number; winB: number } {
  let winA = 0, draw = 0, winB = 0
  const MAX_GOALS = 8

  for (let i = 0; i <= MAX_GOALS; i++) {
    for (let j = 0; j <= MAX_GOALS; j++) {
      const pBase = poissonPMF(i, lambdaA) * poissonPMF(j, lambdaB)
      const correction = dixonColesCorrection(i, j, lambdaA, lambdaB, rho)
      const p = pBase * Math.max(0, correction)

      if (i > j) winA += p
      else if (i === j) draw += p
      else winB += p
    }
  }

  // Normalize to account for truncation
  const total = winA + draw + winB
  return {
    winA: winA / total,
    draw: draw / total,
    winB: winB / total,
  }
}

/**
 * Legacy expectedGoals function (still used in matchup probabilities display)
 */
export function expectedGoals(eloTeam: number, eloOpponent: number): number {
  const base = 1.3
  const diff = eloTeam - eloOpponent
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

/**
 * Dixon-Coles corrected Poisson sample
 * Uses rejection sampling to account for the ρ correction
 */
function dixonColesSample(
  lambdaA: number,
  lambdaB: number,
  rho: number = -0.13
): [number, number] {
  // Sample from independent Poissons then accept/reject based on ρ correction
  for (let attempt = 0; attempt < 100; attempt++) {
    const goalsA = poissonRandom(lambdaA)
    const goalsB = poissonRandom(lambdaB)
    const correction = dixonColesCorrection(goalsA, goalsB, lambdaA, lambdaB, rho)

    // Rejection sampling: accept with probability proportional to correction
    if (correction >= 1 || Math.random() < correction) {
      return [goalsA, goalsB]
    }
  }

  // Fallback: independent Poisson (rare fallthrough)
  return [poissonRandom(lambdaA), poissonRandom(lambdaB)]
}

// ─── Strategy-λ Integration ──────────────────────────────────────────

/**
 * Modify attack/defense strengths based on tactical pairing
 * Attack vs Defensive → higher variance
 */
export function getStrategyModifiedStrengths(
  attack: number,
  defense: number,
  ownStyle: TacticalStyle,
  oppStyle: TacticalStyle
): { attack: number; defense: number } {
  let atkMod = 0
  let defMod = 0

  // Own style modifiers
  if (ownStyle === "Attacking") { atkMod += 0.15; defMod += 0.10 }
  if (ownStyle === "Defensive") { atkMod -= 0.15; defMod -= 0.15 }

  // Interaction with opponent style
  if (ownStyle === "Attacking" && oppStyle === "Attacking") { atkMod += 0.08 }
  if (ownStyle === "Attacking" && oppStyle === "Defensive") { atkMod -= 0.05; defMod += 0.05 }
  if (ownStyle === "Defensive" && oppStyle === "Attacking") { defMod -= 0.08 }

  return {
    attack: attack + atkMod,
    defense: defense + defMod,
  }
}

// ─── Match Simulation ────────────────────────────────────────────────

const HOST_NATIONS = ["USA", "MEX", "CAN"]
const INJURY_RATE_PER_MATCH = 0.05 // 5% chance a star player is unavailable

/**
 * Simulate a single match between two teams using Dixon-Coles model
 * with Bayesian Elo sampling and strategy-λ integration
 */
export function simulateMatch(
  teamA: Team,
  teamB: Team,
  isKnockout: boolean,
  config: SimulationConfig,
  sampledElos?: Record<string, number>
): MatchResult {
  const settingsA = config.teamSettings[teamA.id]
  const settingsB = config.teamSettings[teamB.id]
  const homeStrength = config.globalSettings.homeAdvantageStrength ?? 80

  // Use sampled or base Elo
  let eloA = (sampledElos?.[teamA.id] ?? teamA.eloRating) + (settingsA?.eloAdjustment || 0)
  let eloB = (sampledElos?.[teamB.id] ?? teamB.eloRating) + (settingsB?.eloAdjustment || 0)

  // Stochastic injury modeling
  let injuredCountA = settingsA?.injuredPlayers?.length || 0
  let injuredCountB = settingsB?.injuredPlayers?.length || 0

  // Additional random injuries per match
  for (const player of teamA.topPlayers) {
    if (!settingsA?.injuredPlayers?.includes(player.name) && Math.random() < INJURY_RATE_PER_MATCH) {
      injuredCountA++
    }
  }
  for (const player of teamB.topPlayers) {
    if (!settingsB?.injuredPlayers?.includes(player.name) && Math.random() < INJURY_RATE_PER_MATCH) {
      injuredCountB++
    }
  }

  // Injured players: -30 Elo per removed player
  eloA -= injuredCountA * 30
  eloB -= injuredCountB * 30

  // Host advantage (calibrated to configurable Elo points)
  const isHostA = settingsA?.isHostOverride ?? HOST_NATIONS.includes(teamA.code)
  const isHostB = settingsB?.isHostOverride ?? HOST_NATIONS.includes(teamB.code)
  const homeAdvParam = isHostA ? (homeStrength / 800) : isHostB ? -(homeStrength / 800) : 0

  // Chaos factor: derived from targetUpsetIndex.
  // Capped at 0.35 so even at max slider the stronger team retains a meaningful edge.
  const rawChaos = (config.globalSettings.targetUpsetIndex - 15) / 35
  const chaosFactor = Math.max(0, Math.min(0.35, rawChaos * 0.35))
  if (chaosFactor > 0) {
    const avgElo = (eloA + eloB) / 2
    eloA = eloA * (1 - chaosFactor) + avgElo * chaosFactor
    eloB = eloB * (1 - chaosFactor) + avgElo * chaosFactor
  }

  // Dixon-Coles: get attack/defense strengths
  let attackA = teamA.attackStrength ?? 0
  let defenseA = teamA.defenseStrength ?? 0
  let attackB = teamB.attackStrength ?? 0
  let defenseB = teamB.defenseStrength ?? 0

  // Scale attack/defense by Elo advantage
  const eloDiffScale = (eloA - eloB) / 1000
  attackA += eloDiffScale * 0.3
  defenseA -= eloDiffScale * 0.2
  attackB -= eloDiffScale * 0.3
  defenseB += eloDiffScale * 0.2

  // Apply tactical style modifiers
  const styleA = settingsA?.tacticalStyle || "Normal"
  const styleB = settingsB?.tacticalStyle || "Normal"
  const modifiedA = getStrategyModifiedStrengths(attackA, defenseA, styleA, styleB)
  const modifiedB = getStrategyModifiedStrengths(attackB, defenseB, styleB, styleA)

  // Compute Dixon-Coles λ values
  const lambdaA = dixonColesLambda(modifiedA.attack, modifiedB.defense, Math.max(0, homeAdvParam))
  const lambdaB = dixonColesLambda(modifiedB.attack, modifiedA.defense, Math.max(0, -homeAdvParam))

  // Sample goals using Dixon-Coles corrected Poisson
  let [scoreA, scoreB] = dixonColesSample(lambdaA, lambdaB)

  let wentToExtraTime = false
  let wentToPenalties = false

  // If knockout stage, simulate extra time/penalties
  if (isKnockout && scoreA === scoreB) {
    wentToExtraTime = true

    // Extra time (30 mins ≈ 1/3 of a match).
    // Scale down goal probability as user raises targetPenaltyRate.
    // Floor at 0.15 so ET can still produce goals even at max penalty target.
    const penaltyBias = Math.max(0, (config.globalSettings.targetPenaltyRate - 15) / 50)
    const etGoalScale = 0.33 * Math.max(0.15, 1 - penaltyBias);
    const etLambdaA = lambdaA * etGoalScale;
    const etLambdaB = lambdaB * etGoalScale;
    const [etA, etB] = dixonColesSample(etLambdaA, etLambdaB)
    scoreA += etA
    scoreB += etB

    // Penalties if still tied
    if (scoreA === scoreB) {
      wentToPenalties = true
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
    wentToExtraTime,
    wentToPenalties,
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
  config: SimulationConfig,
  tournamentState?: TournamentState,
  sampledElos?: Record<string, number>
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
        const teamA = groupTeams[i]
        const teamB = groupTeams[j]

        // Check for overrides
        const overrideKey = `${teamA.id}_${teamB.id}`
        const reverseKey = `${teamB.id}_${teamA.id}`
        const override = tournamentState?.matchOverrides?.[overrideKey] || tournamentState?.matchOverrides?.[reverseKey]

        let result: MatchResult
        if (override) {
          const isReverse = !!tournamentState?.matchOverrides?.[reverseKey]
          result = {
            teamA: teamA.id,
            teamB: teamB.id,
            scoreA: isReverse ? override.scoreB : override.scoreA,
            scoreB: isReverse ? override.scoreA : override.scoreB,
            winner: override.winnerId || null,
          }
        } else {
          const sampled = sampledElos
            ? { [teamA.id]: sampledElos[teamA.id], [teamB.id]: sampledElos[teamB.id] }
            : undefined

          result = simulateMatch(
            teamA, teamB, false, config, sampled
          )
        }
        matches[group].push(result)

        const sA = teamStandings[teamA.id]
        const sB = teamStandings[teamB.id]

        sA.played++
        sB.played++
        sA.goalsFor += result.scoreA
        sA.goalsAgainst += result.scoreB
        sB.goalsFor += result.scoreB
        sB.goalsAgainst += result.scoreA

        if (result.winner === teamA.id) {
          sA.won++
          sA.points += 3
          sB.lost++
        } else if (result.winner === teamB.id) {
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
  config: SimulationConfig,
  tournamentState?: TournamentState,
  sampledElos?: Record<string, number>
): {
  rounds: KnockoutRound[]
  results: Record<string, string>
  penaltyCount: number
  totalKnockoutMatches: number
  upsets: { lower: string; higher: string; eloGap: number }[]
} {
  const bestThird = getBestThirdPlaced(standings)
  const results: Record<string, string> = {}
  let penaltyCount = 0
  let totalKnockoutMatches = 0
  const upsets: { lower: string; higher: string; eloGap: number }[] = []

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
          // Check for overrides
          const overrideKey = `${teamA.id}_${teamB.id}`
          const reverseKey = `${teamB.id}_${teamA.id}`
          const override = tournamentState?.matchOverrides?.[overrideKey] || tournamentState?.matchOverrides?.[reverseKey]

          let result: MatchResult
          if (override) {
            const isReverse = !!tournamentState?.matchOverrides?.[reverseKey]
            result = {
              teamA: teamA.id,
              teamB: teamB.id,
              scoreA: isReverse ? override.scoreB : override.scoreA,
              scoreB: isReverse ? override.scoreA : override.scoreB,
              winner: override.winnerId || null,
            }
          } else {
            const sampled = sampledElos
              ? { [teamA.id]: sampledElos[teamA.id], [teamB.id]: sampledElos[teamB.id] }
              : undefined

            result = simulateMatch(teamA, teamB, true, config, sampled)
          }

          let winnerId = result.winner || (result.scoreA > result.scoreB ? teamA.id : teamB.id)

          totalKnockoutMatches++
          if (result.wentToPenalties) penaltyCount++

          // Track upsets
          const eloAVal = sampledElos?.[teamA.id] ?? teamA.eloRating
          const eloBVal = sampledElos?.[teamB.id] ?? teamB.eloRating
          if (eloAVal > eloBVal && winnerId === teamB.id) {
            upsets.push({ lower: teamB.id, higher: teamA.id, eloGap: eloAVal - eloBVal })
          } else if (eloBVal > eloAVal && winnerId === teamA.id) {
            upsets.push({ lower: teamA.id, higher: teamB.id, eloGap: eloBVal - eloAVal })
          }

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

  return { rounds, results, penaltyCount, totalKnockoutMatches, upsets }
}

// ─── Monte Carlo Simulation ─────────────────────────────────────────

const DEFAULT_ITERATIONS = 10000

/**
 * Shannon entropy of a probability distribution (in bits)
 */
function shannonEntropy(probs: number[]): number {
  return -probs
    .filter(p => p > 0)
    .reduce((sum, p) => sum + p * Math.log2(p), 0)
}

export function runFullSimulation(
  config: SimulationConfig,
  tournamentState?: TournamentState,
  iterations: number = DEFAULT_ITERATIONS
): SimulationResult {
  const teamsByGroup = getTeamsByGroup()
  const allTeams = teamsData as Team[]
  const teamMap: Record<string, Team> = {}
  for (const team of allTeams) {
    teamMap[team.id] = team
  }

  const propagateUncertainty = config.globalSettings.propagateUncertainty ?? true

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

  // Extended metrics accumulators
  let totalPenalties = 0
  let totalKnockoutMatches = 0
  const upsetCounts: Record<string, { count: number; totalGap: number }> = {}

  // Run Monte Carlo
  for (let i = 0; i < iterations; i++) {
    // Sample Elo ratings from Bayesian distributions (if enabled)
    // Sample Bayesian Elos to propagate uncertainty across the whole tournament
    let sampledElos: Record<string, number> | undefined
    if (propagateUncertainty) {
      sampledElos = {};
      for (const team of allTeams) {
        // Dampen entropy multiplier with sqrt curve so high values don't cause wild swings
        // e.g. 1.0x → 1.0, 2.0x → 1.41, 3.0x → 1.73. Floor at 0.5x.
        const dampedMultiplier = Math.max(0.5, Math.sqrt(config.globalSettings.entropyMultiplier));
        const sigma = (team.eloSigma ?? 50) * dampedMultiplier;
        sampledElos[team.id] = sampleElo(team.eloRating, sigma);
      }
    }

    const { standings } = simulateGroupStage(teamsByGroup, config, tournamentState, sampledElos)

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
    const { results, penaltyCount, totalKnockoutMatches: tkm, upsets } =
      simulateKnockout(standings, teamMap, config, tournamentState, sampledElos)

    totalPenalties += penaltyCount
    totalKnockoutMatches += tkm

    // Track upsets
    for (const upset of upsets) {
      const key = `${upset.lower}_${upset.higher}`
      if (!upsetCounts[key]) upsetCounts[key] = { count: 0, totalGap: 0 }
      upsetCounts[key].count++
      upsetCounts[key].totalGap += upset.eloGap
    }

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
  const championProbs: number[] = []
  for (const [teamId, acc] of Object.entries(probAccum)) {
    const cp = acc.champion / iterations
    championProbs.push(cp)
    teamProbabilities[teamId] = {
      groupAdvance:
        Math.round((acc.groupAdvance / iterations) * 1000) / 10,
      roundOf32:
        Math.round((acc.roundOf32 / iterations) * 1000) / 10,
      roundOf16:
        Math.round((acc.roundOf16 / iterations) * 1000) / 10,
      quarterFinal:
        Math.round((acc.quarterFinal / iterations) * 1000) / 10,
      semiFinal:
        Math.round((acc.semiFinal / iterations) * 1000) / 10,
      final: Math.round((acc.final / iterations) * 1000) / 10,
      champion:
        Math.round((acc.champion / iterations) * 1000) / 10,
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

        // Use Dixon-Coles for matchup probabilities
        const lambdaA = dixonColesLambda(
          tA.attackStrength ?? 0,
          tB.defenseStrength ?? 0,
          HOST_NATIONS.includes(tA.code) ? 0.1 : 0
        )
        const lambdaB = dixonColesLambda(
          tB.attackStrength ?? 0,
          tA.defenseStrength ?? 0,
          HOST_NATIONS.includes(tB.code) ? 0.1 : 0
        )
        const dcProbs = dixonColesMatchProbs(lambdaA, lambdaB)

        matchupProbabilities[key] = {
          teamA: tA.id,
          teamB: tB.id,
          winA: Math.round(dcProbs.winA * 1000) / 10,
          draw: Math.round(dcProbs.draw * 1000) / 10,
          winB: Math.round(dcProbs.winB * 1000) / 10,
          expectedGoalsA: Math.round(lambdaA * 10) / 10,
          expectedGoalsB: Math.round(lambdaB * 10) / 10,
        }
      }
    }
  }

  // Compute extended metrics
  const penaltyShootoutRate = totalKnockoutMatches > 0
    ? Math.round((totalPenalties / totalKnockoutMatches) * 1000) / 10
    : 0

  const tournamentEntropy = Math.round(shannonEntropy(championProbs) * 100) / 100

  // Top upsets by frequency
  const upsetIndex = Object.entries(upsetCounts)
    .map(([key, val]) => {
      const [lower, higher] = key.split("_")
      return {
        teamA: lower,
        teamB: higher,
        upsetProb: Math.round((val.count / iterations) * 1000) / 10,
        eloGap: Math.round(val.totalGap / val.count),
      }
    })
    .sort((a, b) => b.upsetProb - a.upsetProb)
    .slice(0, 10)

  // Most volatile teams (highest sigma)
  const topVolatileTeams = allTeams
    .map(t => ({ teamId: t.id, sigma: t.eloSigma ?? 50 }))
    .sort((a, b) => b.sigma - a.sigma)
    .slice(0, 5)

  // Run one "representative" simulation for display
  const { standings, matches } = simulateGroupStage(teamsByGroup, config, tournamentState)
  const { rounds } = simulateKnockout(standings, teamMap, config, tournamentState)

  return {
    groupStandings: standings,
    groupMatches: matches,
    knockoutBracket: rounds,
    teamProbabilities,
    matchupProbabilities,
    extendedMetrics: {
      penaltyShootoutRate,
      tournamentEntropy,
      upsetIndex,
      topVolatileTeams,
    },
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
