import type { Player, ValidationResult, Difficulty, GameConfig, GameMode } from "./types"
import { getMaxConnectionsForDifficulty } from "./types"
import { getGraphInstance } from "./graph"

const CHIP_REWARDS: Record<Difficulty, number> = {
  easy: 100,
  medium: 200,
  hard: 400,
  expert: 800,
}

export function calculateChipReward(difficulty: Difficulty, usedHint: boolean): number {
  if (usedHint) return 0
  return CHIP_REWARDS[difficulty]
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
