import type { KitColors, KitPattern, SportsDBKitResponse } from "./types"

const SPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json"
const API_KEY = process.env.NEXT_PUBLIC_SPORTSDB_API_KEY || "3"

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

function parseKitColor(hex?: string): string | null {
  if (!hex) return null
  const trimmed = hex.trim()
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed}`
  return null
}

function inferPattern(primary: string, secondary: string): KitPattern {
  if (!primary || !secondary) return "solid"
  return "solid"
}

export async function lookupTeamKit(teamName: string): Promise<KitColors | null> {
  const data = await fetchJSON<{ teams: SportsDBKitResponse[] }>(
    `${SPORTSDB_BASE}/${API_KEY}/searchteams.php?t=${encodeURIComponent(teamName)}`
  )
  const team = data?.teams?.[0]
  if (!team) return null

  const primary = parseKitColor(team.strKitColour1) ?? parseKitColor(team.strTeamJersey) ?? null
  const secondary = parseKitColor(team.strKitColour2) ?? null

  if (!primary) return null

  return {
    primary,
    secondary: secondary || "#FFFFFF",
    pattern: inferPattern(primary, secondary || "#FFFFFF"),
  }
}

export async function lookupTeamKitById(sportsDbId: string): Promise<KitColors | null> {
  const data = await fetchJSON<{ teams: SportsDBKitResponse[] }>(
    `${SPORTSDB_BASE}/${API_KEY}/lookupteam.php?id=${sportsDbId}`
  )
  const team = data?.teams?.[0]
  if (!team) return null

  const primary = parseKitColor(team.strKitColour1) ?? parseKitColor(team.strTeamJersey) ?? null
  const secondary = parseKitColor(team.strKitColour2) ?? null

  if (!primary) return null

  return {
    primary,
    secondary: secondary || "#FFFFFF",
    pattern: inferPattern(primary, secondary || "#FFFFFF"),
  }
}
