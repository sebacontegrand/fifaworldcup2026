export type KitPattern = "solid" | "stripes" | "checkered"

export interface KitColors {
  primary: string
  secondary: string
  pattern: KitPattern
}

export interface SportsDBKitResponse {
  idTeam: string
  strTeam: string
  strAlternate?: string
  strKitColour1?: string
  strKitColour2?: string
  strKitColour3?: string
  strTeamJersey?: string
  strEquipment?: string
  strBadge?: string
}

export interface KitLookupResult {
  source: "data" | "thesportsdb"
  primary: string
  secondary: string
  pattern: KitPattern
  lastFetched?: string
}
