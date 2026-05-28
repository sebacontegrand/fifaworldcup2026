import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  const factMatches = await prisma.match.findMany({
    where: { isFact: true },
    select: { id: true, teamAName: true, teamBName: true, scoreA: true, scoreB: true },
  })

  if (factMatches.length === 0) {
    return NextResponse.json({ matches: [], leaderboard: [] })
  }

  const guesses = await prisma.guess.findMany({
    where: {
      matchId: { in: factMatches.map((m) => m.id) },
      points: { not: null },
    },
    include: { user: { select: { id: true, name: true, image: true } } },
  })

  // Aggregate points per user
  const userPoints: Record<string, { userId: string; name: string | null; image: string | null; totalPoints: number; exactGuesses: number; correctWinners: number; totalGuesses: number }> = {}

  for (const g of guesses) {
    if (!userPoints[g.userId]) {
      userPoints[g.userId] = {
        userId: g.userId,
        name: g.user.name,
        image: g.user.image,
        totalPoints: 0,
        exactGuesses: 0,
        correctWinners: 0,
        totalGuesses: 0,
      }
    }
    const up = userPoints[g.userId]
    up.totalPoints += g.points ?? 0
    up.totalGuesses++
    if (g.points === 5) up.exactGuesses++
    else if (g.points === 2) up.correctWinners++
  }

  const leaderboard = Object.values(userPoints)
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((entry, idx) => ({ rank: idx + 1, ...entry }))

  return NextResponse.json({
    matches: factMatches.map((m) => ({
      id: m.id,
      label: `${m.teamAName ?? "?"} vs ${m.teamBName ?? "?"}`,
      score: `${m.scoreA}-${m.scoreB}`,
    })),
    leaderboard,
  })
}
