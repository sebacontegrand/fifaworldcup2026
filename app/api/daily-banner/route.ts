import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { generateAnalysis } from "@/lib/ai/groq"
import { getTeamByName } from "@/lib/simulation"
import scheduleData from "@/data/fifa_2026_group_stage.json"

interface ScheduleMatch {
  match_number: number
  stage: string
  group: string
  date: string
  time_local: string
  time_utc: string
  home_team: string
  away_team: string
  stadium: string
  city: string
  country: string
  time_art?: string
  tv_argentina?: string[]
}

type FactMatch = {
  teamAId: string
  teamBId: string
  scoreA: number
  scoreB: number
  isFact: boolean
  teamAName: string | null
  teamBName: string | null
  round: string
}

interface MatchResultItem {
  teamA: string
  teamB: string
  scoreA: number
  scoreB: number
}

interface BannerCacheEntry {
  summary: string | null
  date: string
  matchCount: number
  generatedAt: string
  hasKey: boolean
  matches: MatchResultItem[]
}

const bannerCache = new Map<string, BannerCacheEntry>()

export async function GET() {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split("T")[0]

  const cacheKey = yesterdayStr
  const cached = bannerCache.get(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }

  // Fetch ALL fact matches from DB (group + knockout)
  const allFactMatches = await prisma.match.findMany({
    where: { isFact: true, teamAId: { not: null }, teamBId: { not: null } },
    select: { teamAId: true, teamBId: true, scoreA: true, scoreB: true, teamAName: true, teamBName: true, round: true, kickoffUTC: true },
  })

  const factMatches = allFactMatches.filter(
    (m) => m.teamAId && m.teamBId && m.scoreA !== null && m.scoreB !== null
  )

  interface SchedResult {
    homeName: string
    awayName: string
    homeId: string
    awayId: string
    homeScore: number
    awayScore: number
  }
  const yesterdayResults: SchedResult[] = []

  // Group stage: cross-reference schedule JSON with DB fact matches
  const schedMatches = (scheduleData as { matches: ScheduleMatch[] }).matches.filter(
    (m) => m.date === yesterdayStr && m.home_team !== "TBD"
  )
  for (const s of schedMatches) {
    const homeTeam = getTeamByName(s.home_team)
    const awayTeam = getTeamByName(s.away_team)
    const matchedIds = [homeTeam.id, awayTeam.id]
    const found = factMatches.find((f) => {
      return matchedIds.includes(f.teamAId!) && matchedIds.includes(f.teamBId!)
    })
    if (found) {
      const homeScore = found.teamAId === homeTeam.id ? found.scoreA! : found.scoreB!
      const awayScore = found.teamBId === awayTeam.id ? found.scoreB! : found.scoreA!
      yesterdayResults.push({
        homeName: s.home_team,
        awayName: s.away_team,
        homeId: homeTeam.id,
        awayId: awayTeam.id,
        homeScore,
        awayScore,
      })
    }
  }

  // Knockout stage: query DB matches directly by kickoffUTC
  const knockoutYesterday = factMatches.filter((m) => {
    if (m.round === "group") return false
    if (!m.kickoffUTC) return false
    return m.kickoffUTC.toISOString().split("T")[0] === yesterdayStr
  })
  for (const m of knockoutYesterday) {
    yesterdayResults.push({
      homeName: m.teamAName ?? m.teamAId!,
      awayName: m.teamBName ?? m.teamBId!,
      homeId: m.teamAId!,
      awayId: m.teamBId!,
      homeScore: m.scoreA!,
      awayScore: m.scoreB!,
    })
  }

  if (yesterdayResults.length === 0) {
    const result = { summary: null, date: yesterdayStr, matchCount: 0, generatedAt: new Date().toISOString(), hasKey: false, matches: [] }
    bannerCache.set(cacheKey, result as any)
    return NextResponse.json(result)
  }

  // Deduplicate (a match might match both schedule JSON and DB knockout query)
  const seen = new Set<string>()
  const uniqueResults = yesterdayResults.filter((r) => {
    const key = `${r.homeName}-${r.awayName}-${r.homeScore}-${r.awayScore}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const hasKey = !!process.env.GROQ_API_KEY
  let summary: string

  if (hasKey) {
    const matchLines = uniqueResults
      .map((r) => `${r.homeName} ${r.homeScore}-${r.awayScore} ${r.awayName}`)
      .join("\n")

    try {
      summary = await generateAnalysis(
        [
          {
            role: "system",
            content:
              "You are a football commentator. Write a single short paragraph (max 80 words) summarizing yesterday's World Cup results. Highlight the most interesting stat, upset, or storyline. Be punchy and exciting. No markdown, no bullet points, just one paragraph.",
          },
          {
            role: "user",
            content: `Yesterday's ${uniqueResults.length} World Cup match results:\n${matchLines}`,
          },
        ],
        { model: "fast", temperature: 0.7 }
      )
    } catch (e) {
      console.error("Daily banner Groq call failed:", e)
      summary = fallbackSummary()
    }
  } else {
    summary = fallbackSummary()
  }

  const matches = uniqueResults.map((r) => ({
    teamAId: r.homeId,
    teamBId: r.awayId,
    teamA: r.homeName,
    teamB: r.awayName,
    scoreA: r.homeScore,
    scoreB: r.awayScore,
  }))

  const result = {
    summary,
    date: yesterdayStr,
    matchCount: uniqueResults.length,
    generatedAt: new Date().toISOString(),
    hasKey,
    matches,
  }
  bannerCache.set(cacheKey, result)
  return NextResponse.json(result)
}

function fallbackSummary(): string {
  return "Yesterday's World Cup matches delivered goals, drama, and tournament-defining moments. Check the Live Results page for full match details and updated group standings."
}
