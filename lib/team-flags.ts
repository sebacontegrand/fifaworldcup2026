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
