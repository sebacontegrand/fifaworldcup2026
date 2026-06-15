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

  const schedMatches = (scheduleData as { matches: ScheduleMatch[] }).matches.filter(
    (m) => m.date === yesterdayStr && m.home_team !== "TBD"
  )

  if (schedMatches.length === 0) {
    const result = { summary: null, date: yesterdayStr, matchCount: 0, generatedAt: new Date().toISOString(), hasKey: false, matches: [] }
    bannerCache.set(cacheKey, result as any)
    return NextResponse.json(result)
  }

  const allMatches = await prisma.match.findMany({
    where: { isFact: true, teamAId: { not: null }, teamBId: { not: null } },
    select: { teamAId: true, teamBId: true, scoreA: true, scoreB: true, teamAName: true, teamBName: true, round: true, isFact: true },
  })

  const factMatches: FactMatch[] = allMatches.filter(
    (m) => m.teamAId && m.teamBId && m.scoreA !== null && m.scoreB !== null
  ) as FactMatch[]

  interface SchedResult {
    homeId: string
    awayId: string
    homeName: string
    awayName: string
    homeScore: number
    awayScore: number
  }
  const yesterdayResults: SchedResult[] = []
  for (const s of schedMatches) {
    const homeTeam = getTeamByName(s.home_team)
    const awayTeam = getTeamByName(s.away_team)
    const matchedIds = [homeTeam.id, awayTeam.id]
    const found = factMatches.find((f) => {
      return f.teamAId && f.teamBId && matchedIds.includes(f.teamAId) && matchedIds.includes(f.teamBId)
    })
    if (found) {
      const homeScore = found.teamAId === homeTeam.id ? found.scoreA : found.scoreB
      const awayScore = found.teamBId === awayTeam.id ? found.scoreB : found.scoreA
      yesterdayResults.push({
        homeId: homeTeam.id,
        awayId: awayTeam.id,
        homeName: s.home_team,
        awayName: s.away_team,
        homeScore,
        awayScore,
      })
    }
  }

  if (yesterdayResults.length === 0) {
    const result = { summary: null, date: yesterdayStr, matchCount: 0, generatedAt: new Date().toISOString(), hasKey: false, matches: [] }
    bannerCache.set(cacheKey, result as any)
    return NextResponse.json(result)
  }

  const hasKey = !!process.env.GROQ_API_KEY
  let summary: string

  if (hasKey) {
    const matchLines = yesterdayResults
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
            content: `Yesterday's ${yesterdayResults.length} World Cup match results:\n${matchLines}`,
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

  const matches = yesterdayResults.map((r) => ({
    teamA: r.homeName,
    teamB: r.awayName,
    scoreA: r.homeScore,
    scoreB: r.awayScore,
  }))

  const result = {
    summary,
    date: yesterdayStr,
    matchCount: yesterdayResults.length,
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
