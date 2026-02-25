import { expectedScore, type Team, type TacticalStyle, getStrategyModifiedStrengths } from "./simulation"

// ─── Game Theory: Nash Equilibrium & Payoff Matrices ─────────────────

/**
 * Strategic options for a team in a match
 */
export type Strategy = "attacking" | "balanced" | "defensive"

/**
 * Tournament context for context-aware utility
 */
export interface TournamentContext {
  stage: "group" | "knockout"
  scoreline: number  // goal advantage (positive = leading, negative = trailing)
  minute: number     // 0-90+
}

export interface PayoffMatrix {
  teamA: string
  teamB: string
  matrix: {
    strategyA: Strategy
    strategyB: Strategy
    payoffA: number
    payoffB: number
    winProbA: number
    drawProb: number
    winProbB: number
  }[]
  nashEquilibrium: {
    strategyA: Strategy
    strategyB: Strategy
  }
  mixedEquilibrium: {
    teamA: Record<Strategy, number>  // probability distribution over strategies
    teamB: Record<Strategy, number>
  }
  dominantStrategy: {
    teamA: Strategy | null
    teamB: Strategy | null
  }
}

/**
 * Strategy modifiers on base Elo advantage
 * Attacking: Higher expected goals but more vulnerable
 * Balanced: Standard Elo-based prediction
 * Defensive: Lower expected goals conceded but fewer chances created
 */
const STRATEGY_MODIFIERS: Record<
  Strategy,
  Record<Strategy, { attackMod: number; defenseMod: number }>
> = {
  attacking: {
    attacking: { attackMod: 1.3, defenseMod: 0.7 },
    balanced: { attackMod: 1.2, defenseMod: 0.85 },
    defensive: { attackMod: 1.0, defenseMod: 0.9 },
  },
  balanced: {
    attacking: { attackMod: 1.0, defenseMod: 1.0 },
    balanced: { attackMod: 1.0, defenseMod: 1.0 },
    defensive: { attackMod: 0.9, defenseMod: 1.1 },
  },
  defensive: {
    attacking: { attackMod: 0.8, defenseMod: 1.3 },
    balanced: { attackMod: 0.85, defenseMod: 1.15 },
    defensive: { attackMod: 0.7, defenseMod: 1.3 },
  },
}

/**
 * Context-aware utility function
 * Group stage: draw = 1 point value
 * Knockout: draw = 0 value (must win)
 * Trailing team: higher utility for attacking
 */
function contextAwareUtility(
  winProb: number,
  drawProb: number,
  loseProb: number,
  context?: TournamentContext
): number {
  if (!context) {
    // Default: group stage standard utility
    return winProb * 3 + drawProb * 1
  }

  if (context.stage === "knockout") {
    // In knockout: draw has no utility (leads to ET/penalties = ~coin flip)
    const drawUtility = 0.45 // slight disadvantage in extra time
    return winProb * 1.0 + drawProb * drawUtility + loseProb * 0
  }

  // Group stage with scoreline awareness
  if (context.scoreline > 0) {
    // Leading: draw is acceptable, conservative play has higher utility
    const leadBonus = Math.min(context.scoreline * 0.2, 0.5)
    return winProb * 3 + drawProb * (1 + leadBonus)
  } else if (context.scoreline < 0) {
    // Trailing: only a win matters, desperation factor increases with time
    const urgency = Math.max(0, (context.minute - 60) / 30) // ramps from 60'
    const drawPenalty = -0.5 * urgency
    return winProb * (3 + urgency) + drawProb * (1 + drawPenalty)
  }

  return winProb * 3 + drawProb * 1
}

/**
 * Calculate payoff for a strategic matchup with context awareness
 */
function calculatePayoff(
  eloA: number,
  eloB: number,
  stratA: Strategy,
  stratB: Strategy,
  context?: TournamentContext
): { payoffA: number; payoffB: number; winA: number; draw: number; winB: number } {
  const modA = STRATEGY_MODIFIERS[stratA][stratB]
  const modB = STRATEGY_MODIFIERS[stratB][stratA]

  // Modified Elo based on strategic choices
  const effectiveEloA = eloA * modA.attackMod * modA.defenseMod
  const effectiveEloB = eloB * modB.attackMod * modB.defenseMod

  const eA = expectedScore(effectiveEloA, effectiveEloB)
  const eB = 1 - eA

  // Draw probability affected by combined defensive play
  const defenseLevel =
    (stratA === "defensive" ? 1 : 0) + (stratB === "defensive" ? 1 : 0)
  const baseDraw =
    0.25 + defenseLevel * 0.08 - (stratA === "attacking" && stratB === "attacking" ? 0.08 : 0)
  const drawProb = Math.min(0.4, Math.max(0.1, baseDraw))

  const remaining = 1 - drawProb
  const winA = remaining * eA
  const winB = remaining * eB

  // Context-aware utility
  const payoffA = contextAwareUtility(winA, drawProb, winB, context)
  const payoffB = contextAwareUtility(
    winB, drawProb, winA,
    context ? { ...context, scoreline: -context.scoreline } : undefined
  )

  return {
    payoffA: Math.round(payoffA * 100) / 100,
    payoffB: Math.round(payoffB * 100) / 100,
    winA: Math.round(winA * 1000) / 10,
    draw: Math.round(drawProb * 1000) / 10,
    winB: Math.round(winB * 1000) / 10,
  }
}

/**
 * Compute mixed-strategy Nash equilibrium using support enumeration
 * For a 3x3 game, finds the probability distribution over strategies for each player
 */
function computeMixedEquilibrium(
  matrix: PayoffMatrix["matrix"]
): { teamA: Record<Strategy, number>; teamB: Record<Strategy, number> } {
  const strategies: Strategy[] = ["attacking", "balanced", "defensive"]

  // Build payoff matrices for each player
  const payoffA: number[][] = []
  const payoffB: number[][] = []

  for (let i = 0; i < 3; i++) {
    payoffA.push([])
    payoffB.push([])
    for (let j = 0; j < 3; j++) {
      const cell = matrix.find(
        m => m.strategyA === strategies[i] && m.strategyB === strategies[j]
      )!
      payoffA[i].push(cell.payoffA)
      payoffB[i].push(cell.payoffB)
    }
  }

  // Use iterated best response to approximate mixed equilibrium
  let probA = [1 / 3, 1 / 3, 1 / 3]
  let probB = [1 / 3, 1 / 3, 1 / 3]

  for (let iter = 0; iter < 200; iter++) {
    // Best response for A given B's mixed strategy
    const expectedPayoffA = [0, 0, 0]
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expectedPayoffA[i] += probB[j] * payoffA[i][j]
      }
    }

    // Softmax response (smooth best response with temperature decay)
    const temp = Math.max(0.05, 1.0 - iter / 200)
    const maxA = Math.max(...expectedPayoffA)
    const expA = expectedPayoffA.map(v => Math.exp((v - maxA) / temp))
    const sumA = expA.reduce((s, v) => s + v, 0)
    const newProbA = expA.map(v => v / sumA)

    // Best response for B given A's mixed strategy
    const expectedPayoffB = [0, 0, 0]
    for (let j = 0; j < 3; j++) {
      for (let i = 0; i < 3; i++) {
        expectedPayoffB[j] += probA[i] * payoffB[i][j]
      }
    }

    const maxB = Math.max(...expectedPayoffB)
    const expB = expectedPayoffB.map(v => Math.exp((v - maxB) / temp))
    const sumB = expB.reduce((s, v) => s + v, 0)
    const newProbB = expB.map(v => v / sumB)

    // Damped update
    const alpha = 0.3
    probA = probA.map((p, i) => p * (1 - alpha) + newProbA[i] * alpha)
    probB = probB.map((p, j) => p * (1 - alpha) + newProbB[j] * alpha)
  }

  // Round probabilities
  const round2 = (x: number) => Math.round(x * 100) / 100

  return {
    teamA: {
      attacking: round2(probA[0]),
      balanced: round2(probA[1]),
      defensive: round2(probA[2]),
    },
    teamB: {
      attacking: round2(probB[0]),
      balanced: round2(probB[1]),
      defensive: round2(probB[2]),
    },
  }
}

/**
 * Generate full payoff matrix for a head-to-head matchup
 * Includes Nash Equilibrium identification and mixed-strategy computation
 */
export function generatePayoffMatrix(
  teamA: Team,
  teamB: Team,
  context?: TournamentContext
): PayoffMatrix {
  const strategies: Strategy[] = ["attacking", "balanced", "defensive"]
  const matrix: PayoffMatrix["matrix"] = []

  for (const stratA of strategies) {
    for (const stratB of strategies) {
      const result = calculatePayoff(
        teamA.eloRating,
        teamB.eloRating,
        stratA,
        stratB,
        context
      )
      matrix.push({
        strategyA: stratA,
        strategyB: stratB,
        payoffA: result.payoffA,
        payoffB: result.payoffB,
        winProbA: result.winA,
        drawProb: result.draw,
        winProbB: result.winB,
      })
    }
  }

  // Find pure-strategy Nash Equilibrium
  let nashEquilibrium: { strategyA: Strategy; strategyB: Strategy } = {
    strategyA: "balanced",
    strategyB: "balanced",
  }

  for (const cell of matrix) {
    const { strategyA, strategyB, payoffA, payoffB } = cell

    const canAImprove = matrix.some(
      (m) =>
        m.strategyB === strategyB &&
        m.strategyA !== strategyA &&
        m.payoffA > payoffA
    )

    const canBImprove = matrix.some(
      (m) =>
        m.strategyA === strategyA &&
        m.strategyB !== strategyB &&
        m.payoffB > payoffB
    )

    if (!canAImprove && !canBImprove) {
      nashEquilibrium = { strategyA, strategyB }
      break
    }
  }

  // Compute mixed-strategy equilibrium
  const mixedEquilibrium = computeMixedEquilibrium(matrix)

  // Find dominant strategies
  const findDominant = (isTeamA: boolean): Strategy | null => {
    for (const strat of strategies) {
      let isDominant = true
      for (const otherStrat of strategies) {
        if (strat === otherStrat) continue
        for (const oppStrat of strategies) {
          const payoffStrat = matrix.find(
            (m) =>
              (isTeamA ? m.strategyA : m.strategyB) === strat &&
              (isTeamA ? m.strategyB : m.strategyA) === oppStrat
          )
          const payoffOther = matrix.find(
            (m) =>
              (isTeamA ? m.strategyA : m.strategyB) === otherStrat &&
              (isTeamA ? m.strategyB : m.strategyA) === oppStrat
          )
          if (
            payoffStrat &&
            payoffOther &&
            (isTeamA ? payoffStrat.payoffA : payoffStrat.payoffB) <=
            (isTeamA ? payoffOther.payoffA : payoffOther.payoffB)
          ) {
            isDominant = false
            break
          }
        }
        if (!isDominant) break
      }
      if (isDominant) return strat
    }
    return null
  }

  return {
    teamA: teamA.id,
    teamB: teamB.id,
    matrix,
    nashEquilibrium,
    mixedEquilibrium,
    dominantStrategy: {
      teamA: findDominant(true),
      teamB: findDominant(false),
    },
  }
}

// ─── Minimax Analysis ────────────────────────────────────────────────

export interface MinimaxResult {
  teamId: string
  bestCase: { opponent: string; winProb: number }
  worstCase: { opponent: string; winProb: number }
  minimaxValue: number // the guaranteed minimum expected points
  riskLevel: "low" | "medium" | "high"
}

/**
 * Minimax analysis for a team in knockout stage
 * Evaluates the worst-case scenario for each possible opponent
 * and finds the team's guaranteed minimum payoff
 */
export function minimaxAnalysis(
  team: Team,
  possibleOpponents: Team[]
): MinimaxResult {
  let bestCase = { opponent: "", winProb: 0 }
  let worstCase = { opponent: "", winProb: 100 }

  for (const opp of possibleOpponents) {
    const eA = expectedScore(team.eloRating, opp.eloRating)
    const winProbPct = Math.round(eA * 1000) / 10

    if (winProbPct > bestCase.winProb) {
      bestCase = { opponent: opp.id, winProb: winProbPct }
    }
    if (winProbPct < worstCase.winProb) {
      worstCase = { opponent: opp.id, winProb: winProbPct }
    }
  }

  // Minimax value: the expected points assuming worst-case opponent
  const minimaxValue =
    Math.round(worstCase.winProb * 3 + (100 - worstCase.winProb) * 0.5) / 100

  let riskLevel: "low" | "medium" | "high" = "medium"
  if (worstCase.winProb > 55) riskLevel = "low"
  else if (worstCase.winProb < 40) riskLevel = "high"

  return {
    teamId: team.id,
    bestCase,
    worstCase,
    minimaxValue,
    riskLevel,
  }
}

// ─── Tournament Path Analysis ────────────────────────────────────────

export interface PathAnalysis {
  teamId: string
  dreamPath: { round: string; opponent: string; winProb: number }[]
  dangerPath: { round: string; opponent: string; winProb: number }[]
}

/**
 * Analyze best-case and worst-case tournament paths for a team
 */
export function analyzeTournamentPath(
  team: Team,
  allTeams: Team[]
): PathAnalysis {
  const others = allTeams.filter((t) => t.id !== team.id)
  const sorted = others.sort((a, b) => a.eloRating - b.eloRating)

  const rounds = ["Round of 32", "Round of 16", "Quarter-Finals", "Semi-Finals", "Final"]

  // Dream path: weakest opponents at each stage
  const dreamPath = rounds.map((round, i) => {
    const opp = sorted[i] || sorted[sorted.length - 1]
    return {
      round,
      opponent: opp.id,
      winProb:
        Math.round(expectedScore(team.eloRating, opp.eloRating) * 1000) / 10,
    }
  })

  // Danger path: strongest opponents at each stage
  const dangerPath = rounds.map((round, i) => {
    const opp = sorted[sorted.length - 1 - i] || sorted[0]
    return {
      round,
      opponent: opp.id,
      winProb:
        Math.round(expectedScore(team.eloRating, opp.eloRating) * 1000) / 10,
    }
  })

  return { teamId: team.id, dreamPath, dangerPath }
}
