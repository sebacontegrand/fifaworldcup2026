import type { Player } from "./types"
import { getUniquePlayers } from "./players-data"

export class PlayerGraph {
  adjacency: Map<string, Map<string, string[]>>
  players: Map<string, Player>
  teamPlayers: Map<string, Player[]>

  constructor(players?: Player[]) {
    this.adjacency = new Map()
    this.players = new Map()
    this.teamPlayers = new Map()
    this.buildGraph(players ?? getUniquePlayers())
  }

  private buildGraph(players: Player[]) {
    const teamMap = new Map<string, Map<string, Player>>()

    for (const p of players) {
      this.players.set(p.id, p)
      for (const t of p.teams) {
        if (!teamMap.has(t.teamId)) {
          teamMap.set(t.teamId, new Map())
        }
        teamMap.get(t.teamId)!.set(p.id, p)
      }
    }

    for (const [teamId, teamPlayers] of teamMap) {
      const arr = Array.from(teamPlayers.values())
      this.teamPlayers.set(teamId, arr)
      const ids = Array.from(teamPlayers.keys())
      for (const pid of ids) {
        if (!this.adjacency.has(pid)) {
          this.adjacency.set(pid, new Map())
        }
        for (const otherId of ids) {
          if (pid === otherId) continue
          const connections = this.adjacency.get(pid)!
          if (!connections.has(otherId)) {
            connections.set(otherId, [])
          }
          connections.get(otherId)!.push(teamId)
        }
      }
    }
  }

  getPlayer(id: string): Player | undefined {
    return this.players.get(id)
  }

  getPlayerByName(name: string): Player | undefined {
    return Array.from(this.players.values()).find(
      (p) => p.name.toLowerCase().includes(name.toLowerCase())
    )
  }

  searchPlayers(query: string): Player[] {
    const q = query.toLowerCase()
    return Array.from(this.players.values()).filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.nationality.toLowerCase().includes(q) ||
        p.teams.some((t) => t.teamName.toLowerCase().includes(q))
    )
  }

  getAllPlayers(): Player[] {
    return Array.from(this.players.values())
  }

  getConnectedPlayers(playerId: string): Map<string, string[]> {
    return this.adjacency.get(playerId) ?? new Map()
  }

  findShortestPath(startId: string, endId: string, maxDepth = 4): { path: string[]; sharedTeams: string[][] } | null {
    if (startId === endId) return { path: [startId], sharedTeams: [] }

    const visited = new Set<string>([startId])
    const queue: { id: string; path: string[]; teams: string[][] }[] = [{ id: startId, path: [startId], teams: [] }]

    while (queue.length > 0) {
      const current = queue.shift()!
      if (current.path.length - 1 > maxDepth) continue

      const connections = this.adjacency.get(current.id)
      if (!connections) continue

      for (const [neighborId, sharedTeams] of connections) {
        if (visited.has(neighborId)) continue

        const newPath = [...current.path, neighborId]
        const newTeams = [...current.teams, sharedTeams]

        if (neighborId === endId) {
          return { path: newPath, sharedTeams: newTeams }
        }

        if (newPath.length - 1 < maxDepth) {
          visited.add(neighborId)
          queue.push({ id: neighborId, path: newPath, teams: newTeams })
        }
      }
    }

    return null
  }

  validateChain(chain: string[]): { valid: boolean; sharedTeams: string[][]; errors: string[] } {
    const errors: string[] = []
    const sharedTeams: string[][] = []

    for (let i = 0; i < chain.length - 1; i++) {
      const a = chain[i]
      const b = chain[i + 1]

      const connections = this.adjacency.get(a)
      if (!connections || !connections.has(b)) {
        errors.push(`"${this.players.get(a)?.name}" and "${this.players.get(b)?.name}" never played together`)
        sharedTeams.push([])
      } else {
        sharedTeams.push(connections.get(b)!)
      }
    }

    return { valid: errors.length === 0, sharedTeams, errors }
  }

  getRandomPair(difficulty: number): { playerA: Player; playerB: Player } | null {
    const allPlayers = this.getAllPlayers()
    if (allPlayers.length < 2) return null

    const candidates: { playerA: Player; playerB: Player; pathLen: number }[] = []

    const sampleSize = Math.min(30, allPlayers.length)
    const shuffled = [...allPlayers].sort(() => Math.random() - 0.5).slice(0, sampleSize)

    for (let i = 0; i < shuffled.length; i++) {
      for (let j = i + 1; j < shuffled.length; j++) {
        const a = shuffled[i].id
        const b = shuffled[j].id
        const result = this.findShortestPath(a, b, difficulty)
        if (result && result.path.length - 1 >= 1 && result.path.length - 1 <= difficulty) {
          candidates.push({
            playerA: shuffled[i],
            playerB: shuffled[j],
            pathLen: result.path.length - 1,
          })
        }
      }
    }

    if (candidates.length > 0) {
      const pick = candidates[Math.floor(Math.random() * candidates.length)]
      return { playerA: pick.playerA, playerB: pick.playerB }
    }

    return null
  }
}

let _instance: PlayerGraph | null = null

export function getGraphInstance(): PlayerGraph {
  if (!_instance) {
    _instance = new PlayerGraph()
  }
  return _instance
}
