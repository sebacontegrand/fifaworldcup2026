import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import scheduleData from "@/data/fifa_2026_group_stage.json"

function parseUTCDate(match: { date: string; time_utc?: string }): Date | null {
  if (!match.time_utc) return null

  const timeUtc = match.time_utc.replace(/\./g, "").trim()

  const dateMatch = timeUtc.match(/\(([A-Z][a-z]+)\s*(\d+)\)/)
  let effectiveDate = match.date
  if (dateMatch) {
    const monthAbbr = dateMatch[1]
    const day = parseInt(dateMatch[2])
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const monthIndex = months.indexOf(monthAbbr)
    if (monthIndex !== -1) {
      const baseYear = parseInt(match.date.split("-")[0])
      effectiveDate = `${baseYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    }
  }

  const timeMatch = timeUtc.match(/(\d+):(\d+)\s*UTC/)
  if (!timeMatch) return null

  const hours = parseInt(timeMatch[1])
  const minutes = parseInt(timeMatch[2])

  return new Date(`${effectiveDate}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00Z`)
}

function findScheduleMatch(teamAName: string | null, teamBName: string | null): any | null {
  if (!teamAName || !teamBName) return null

  const scheduleMatches = (scheduleData as any).matches || []

  const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "")

  const nameVariants: Record<string, string[]> = {
    "czechia": ["czechia", "czechrepublic"],
    "usa": ["usa", "unitedstates"],
    "turkiye": ["turkiye", "turkey"],
  }

  const aNorm = normalize(teamAName)
  const bNorm = normalize(teamBName)

  const getVariants = (norm: string): string[] => {
    for (const [variant, names] of Object.entries(nameVariants)) {
      if (names.includes(norm)) return names
    }
    return [norm]
  }

  const aVariants = getVariants(aNorm)
  const bVariants = getVariants(bNorm)

  return scheduleMatches.find((m: any) => {
    const homeNorm = normalize(m.home_team)
    const awayNorm = normalize(m.away_team)
    return (aVariants.includes(homeNorm) && bVariants.includes(awayNorm)) ||
           (aVariants.includes(awayNorm) && bVariants.includes(homeNorm))
  }) || null
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { scoreA, scoreB } = body

  if (typeof scoreA !== "number" || typeof scoreB !== "number") {
    return NextResponse.json({ error: "Invalid scores" }, { status: 400 })
  }

  const match = await prisma.match.findUnique({ where: { id } })
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 })
  }
  if (match.isFact) {
    return NextResponse.json({ error: "Match result is already confirmed" }, { status: 400 })
  }

  const schedMatch = findScheduleMatch(match.teamAName, match.teamBName)
  if (schedMatch) {
    const kickoff = parseUTCDate(schedMatch)
    if (kickoff && kickoff <= new Date()) {
      return NextResponse.json({ error: "Match has already started — predictions are locked" }, { status: 400 })
    }
  }

  const guess = await prisma.guess.upsert({
    where: { userId_matchId: { userId: session.user.id, matchId: id } },
    create: {
      userId: session.user.id,
      matchId: id,
      scoreA,
      scoreB,
    },
    update: {
      scoreA,
      scoreB,
    },
  })

  return NextResponse.json(guess)
}
