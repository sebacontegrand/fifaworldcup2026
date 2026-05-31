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

  addPlayer(player: Player) {
    if (this.players.has(player.id)) return
    this.players.set(player.id, player)
    for (const t of player.teams) {
      if (!this.teamPlayers.has(t.teamId)) {
        this.teamPlayers.set(t.teamId, [])
      }
      this.teamPlayers.get(t.teamId)!.push(player)
      const teamMates = this.teamPlayers.get(t.teamId)!
      for (const mate of teamMates) {
        if (mate.id === player.id) continue
        if (!this.adjacency.has(player.id)) this.adjacency.set(player.id, new Map())
        if (!this.adjacency.has(mate.id)) this.adjacency.set(mate.id, new Map())
        const pConn = this.adjacency.get(player.id)!
        const mConn = this.adjacency.get(mate.id)!
        if (!pConn.has(mate.id)) pConn.set(mate.id, [])
        if (!mConn.has(player.id)) mConn.set(player.id, [])
        pConn.get(mate.id)!.push(t.teamId)
        mConn.get(player.id)!.push(t.teamId)
      }
    }
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

  getRandomPair(maxIntermediaries: number): { playerA: Player; playerB: Player } | null {
    const allPlayers = this.getAllPlayers()
    if (allPlayers.length < 2) return null

    const candidates: { playerA: Player; playerB: Player; pathLen: number }[] = []

    const sampleSize = Math.min(allPlayers.length, maxIntermediaries >= 4 ? allPlayers.length : 60)
    const shuffled = [...allPlayers].sort(() => Math.random() - 0.5).slice(0, sampleSize)

    const requiredHops = maxIntermediaries + 1

    for (let i = 0; i < shuffled.length; i++) {
      for (let j = i + 1; j < shuffled.length; j++) {
        const a = shuffled[i].id
        const b = shuffled[j].id
        const result = this.findShortestPath(a, b, requiredHops)
        const hops = result ? result.path.length - 1 : 0
        if (result && hops === requiredHops) {
          candidates.push({
            playerA: shuffled[i],
            playerB: shuffled[j],
            pathLen: hops,
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

  getRandomNoConnectionPair(maxIntermediaries: number): { playerA: Player; playerB: Player } | null {
    const allPlayers = this.getAllPlayers()
    if (allPlayers.length < 2) return null

    const candidates: { playerA: Player; playerB: Player }[] = []
    const maxHops = maxIntermediaries + 1

    for (let i = 0; i < allPlayers.length; i++) {
      for (let j = i + 1; j < allPlayers.length; j++) {
        const a = allPlayers[i].id
        const b = allPlayers[j].id
        const result = this.findShortestPath(a, b, maxHops)
        if (!result) {
          candidates.push({ playerA: allPlayers[i], playerB: allPlayers[j] })
          if (candidates.length >= 20) break
        }
      }
      if (candidates.length >= 20) break
    }

    if (candidates.length > 0) {
      return candidates[Math.floor(Math.random() * candidates.length)]
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
