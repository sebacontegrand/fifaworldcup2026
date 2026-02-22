import { expectedScore, type Team } from "./simulation"

// ─── Game Theory: Nash Equilibrium & Payoff Matrices ─────────────────

/**
 * Strategic options for a team in a match
 */
export type Strategy = "attacking" | "balanced" | "defensive"

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
 * Calculate payoff for a strategic matchup
 * Payoff = (win probability * 3) + (draw probability * 1) - risk factor
 */
function calculatePayoff(
  eloA: number,
  eloB: number,
  stratA: Strategy,
  stratB: Strategy
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

  // Payoff = expected points
  const payoffA = winA * 3 + drawProb * 1
  const payoffB = winB * 3 + drawProb * 1

  return {
    payoffA: Math.round(payoffA * 100) / 100,
    payoffB: Math.round(payoffB * 100) / 100,
    winA: Math.round(winA * 1000) / 10,
    draw: Math.round(drawProb * 1000) / 10,
    winB: Math.round(winB * 1000) / 10,
  }
}

/**
 * Generate full payoff matrix for a head-to-head matchup
 * Includes Nash Equilibrium identification
 */
export function generatePayoffMatrix(teamA: Team, teamB: Team): PayoffMatrix {
  const strategies: Strategy[] = ["attacking", "balanced", "defensive"]
  const matrix: PayoffMatrix["matrix"] = []

  for (const stratA of strategies) {
    for (const stratB of strategies) {
      const result = calculatePayoff(
        teamA.eloRating,
        teamB.eloRating,
        stratA,
        stratB
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

  // Find Nash Equilibrium (no player can improve by unilaterally changing strategy)
  let nashEquilibrium: { strategyA: Strategy; strategyB: Strategy } = {
    strategyA: "balanced",
    strategyB: "balanced",
  }

  for (const cell of matrix) {
    const { strategyA, strategyB, payoffA, payoffB } = cell

    // Check if A can improve by changing strategy (B stays)
    const canAImprove = matrix.some(
      (m) =>
        m.strategyB === strategyB &&
        m.strategyA !== strategyA &&
        m.payoffA > payoffA
    )

    // Check if B can improve by changing strategy (A stays)
    const canBImprove = matrix.some(
      (m) =>
        m.strategyA === strategyA &&
        m.strategyB !== strategyB &&
        m.payoffB > payoffB
    )

    // Nash Equilibrium: neither can improve
    if (!canAImprove && !canBImprove) {
      nashEquilibrium = { strategyA, strategyB }
      break
    }
  }

  // Find dominant strategies
  const findDominant = (isTeamA: boolean): Strategy | null => {
    for (const strat of strategies) {
      let isDominant = true
      for (const otherStrat of strategies) {
        if (strat === otherStrat) continue
        // Check against all opponent strategies
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
