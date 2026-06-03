import teamsData from "@/data/teams.json"

const teamFlagMap = new Map<string, string>(
  (teamsData as { code: string; flag: string }[]).map((t) => [t.code, t.flag])
)

const fallbackFlags: Record<string, string> = {
  POL: "🇵🇱",
}

export function getFlagByCode(code: string): string {
  return teamFlagMap.get(code) ?? fallbackFlags[code] ?? ""
}

const FIFA_TO_ISO: Record<string, string> = {
  MEX: "mx", RSA: "za", KOR: "kr", CAN: "ca", QAT: "qa", SUI: "ch",
  BRA: "br", MAR: "ma", HAI: "ht", SCO: "gb-sct", USA: "us", PAR: "py",
  AUS: "au", GER: "de", CUW: "cw", CIV: "ci", ECU: "ec", NED: "nl",
  JPN: "jp", TUN: "tn", BEL: "be", EGY: "eg", IRN: "ir", NZL: "nz",
  ESP: "es", CPV: "cv", KSA: "sa", URU: "uy", FRA: "fr", SEN: "sn",
  NOR: "no", ARG: "ar", ALG: "dz", AUT: "at", JOR: "jo", POR: "pt",
  UZB: "uz", COL: "co", ENG: "gb-eng", CRO: "hr", GHA: "gh", PAN: "pa",
  CZE: "cz", BIH: "ba", TUR: "tr", SWE: "se", IRQ: "iq", COD: "cd",
  POL: "pl",
}

const FLAGCDN_SIZES = [20, 40, 80, 160, 320, 640]

function closestFlagSize(size: number): number {
  return FLAGCDN_SIZES.reduce((prev, curr) =>
    Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev
  )
}

export function getFlagImageUrlByCode(code: string, size: number = 40): string {
  const iso = FIFA_TO_ISO[code]
  if (!iso) return ""
  return `https://flagcdn.com/w${closestFlagSize(size)}/${iso}.png`
}

export function getFlagImageUrl(teamId: string, size: number = 40): string {
  const team = (teamsData as { id: string; code: string }[]).find((t) => t.id === teamId)
  if (!team) return ""
  const iso = FIFA_TO_ISO[team.code]
  if (!iso) return ""
  return `https://flagcdn.com/w${closestFlagSize(size)}/${iso}.png`
}

export function getFlagImageSrcSet(teamId: string): string {
  const team = (teamsData as { id: string; code: string }[]).find((t) => t.id === teamId)
  if (!team) return ""
  const iso = FIFA_TO_ISO[team.code]
  if (!iso) return ""
  return [
    `https://flagcdn.com/w80/${iso}.png 80w`,
    `https://flagcdn.com/w160/${iso}.png 160w`,
    `https://flagcdn.com/w320/${iso}.png 320w`,
  ].join(", ")
}
