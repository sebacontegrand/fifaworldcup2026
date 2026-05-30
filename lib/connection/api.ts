const SPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json"
const API_KEY = process.env.NEXT_PUBLIC_SPORTSDB_API_KEY || "3"

export interface SportsDBPlayer {
  idPlayer: string
  strPlayer: string
  strCutout?: string
  strThumb?: string
  strPosition?: string
  strNationality?: string
  strTeam?: string
  idTeam?: string
  strSport?: string
}

export interface SportsDBTeam {
  idTeam: string
  strTeam: string
  strBadge?: string
  strCountry?: string
}

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function searchPlayers(query: string): Promise<SportsDBPlayer[]> {
  const data = await fetchJSON<{ player: SportsDBPlayer[] }>(
    `${SPORTSDB_BASE}/${API_KEY}/searchplayers.php?p=${encodeURIComponent(query)}`
  )
  return data?.player ?? []
}

export async function getPlayerById(id: string): Promise<SportsDBPlayer | null> {
  const data = await fetchJSON<{ players: SportsDBPlayer[] }>(
    `${SPORTSDB_BASE}/${API_KEY}/lookupplayer.php?id=${id}`
  )
  return data?.players?.[0] ?? null
}

export async function getPlayerTeams(playerId: string): Promise<SportsDBTeam[]> {
  const data = await fetchJSON<{ teams: SportsDBTeam[] }>(
    `${SPORTSDB_BASE}/${API_KEY}/lookupallteams.php?id=${encodeURIComponent(playerId)}`
  )
  return data?.teams ?? []
}

export async function searchTeam(teamName: string): Promise<SportsDBTeam | null> {
  const data = await fetchJSON<{ teams: SportsDBTeam[] }>(
    `${SPORTSDB_BASE}/${API_KEY}/searchteams.php?t=${encodeURIComponent(teamName)}`
  )
  return data?.teams?.[0] ?? null
}

export async function getTeamPlayers(teamId: string): Promise<SportsDBPlayer[]> {
  const data = await fetchJSON<{ player: SportsDBPlayer[] }>(
    `${SPORTSDB_BASE}/${API_KEY}/lookupallplayers.php?id=${encodeURIComponent(teamId)}`
  )
  return data?.player ?? []
}
