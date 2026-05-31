import type { Player, ValidationResult, Difficulty, GameConfig, GameMode } from "./types"
import { getMaxConnectionsForDifficulty } from "./types"
import { getGraphInstance } from "./graph"

export function calculateScore(params: {
  chainLength: number
  shortestPossible: number
  attempts: number
  timeSeconds: number
  difficulty: Difficulty
  mode: GameMode
}): number {
  const { chainLength, shortestPossible, attempts, timeSeconds, difficulty } = params

  const difficultyMultiplier: Record<Difficulty, number> = {
    easy: 1,
    medium: 2,
    hard: 3,
    expert: 5,
  }

  const optimalBonus = chainLength === shortestPossible ? 200 : Math.max(0, 100 - (chainLength - shortestPossible) * 50)

  const timeBonus = Math.max(0, Math.floor((300 - timeSeconds) / 10) * 5)

  const attemptsPenalty = Math.max(0, (attempts - 1) * 25)

  const base = 500
  const diff = difficultyMultiplier[difficulty]

  return Math.max(0, (base + optimalBonus + timeBonus - attemptsPenalty) * diff)
}

export function validateSolution(
  playerA: Player,
  playerB: Player,
  chain: Player[]
): ValidationResult {
  const graph = getGraphInstance()
  const ids = [playerA.id, ...chain.map((p) => p.id), playerB.id]

  if (chain.length === 0) {
    const directConnections = graph.getConnectedPlayers(playerA.id)
    const sharedTeam = directConnections.get(playerB.id)
    if (sharedTeam) {
      return {
        valid: true,
        chain: [
          { player: playerA },
          { player: playerB, sharedTeam: sharedTeam[0] },
        ],
        score: 1000,
      }
    }
    return {
      valid: false,
      chain: [],
      errors: ["These players never played together. Add intermediary players."],
    }
  }

  const result = graph.validateChain(ids)

  if (!result.valid) {
    return {
      valid: false,
      chain: [],
      errors: result.errors,
    }
  }

  const chainWithTeams = ids.map((id, i) => ({
    player: graph.getPlayer(id)!,
    sharedTeam: i > 0 ? result.sharedTeams[i - 1]?.[0] : undefined,
  }))

  return {
    valid: true,
    chain: chainWithTeams,
  }
}

export function getHint(
  playerA: Player,
  playerB: Player,
  difficulty: Difficulty
): Player[] | null {
  const graph = getGraphInstance()
  const maxHops = getMaxConnectionsForDifficulty(difficulty) + 1
  const result = graph.findShortestPath(playerA.id, playerB.id, maxHops)

  if (!result) return null

  return result.path.slice(1, -1).map((id) => graph.getPlayer(id)!).filter(Boolean)
}

export function generateGameConfig(difficulty: Difficulty, mode: GameMode): GameConfig {
  return {
    difficulty,
    mode,
    maxConnections: getMaxConnectionsForDifficulty(difficulty),
  }
}
