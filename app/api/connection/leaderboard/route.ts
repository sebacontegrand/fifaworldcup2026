import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  const scores = await prisma.connectionScore.findMany({
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  })

  const userMap = new Map<
    string,
    {
      userId: string
      name: string | null
      image: string | null
      totalScore: number
      gamesPlayed: number
      bestScore: number
      fastedTime: number | null
      avgChainLength: number
    }
  >()

  for (const s of scores) {
    const existing = userMap.get(s.userId)
    if (existing) {
      existing.totalScore += s.score
      existing.gamesPlayed += 1
      existing.bestScore = Math.max(existing.bestScore, s.score)
      if (existing.fastedTime === null || s.timeSeconds < existing.fastedTime) {
        existing.fastedTime = s.timeSeconds
      }
      existing.avgChainLength =
        (existing.avgChainLength * (existing.gamesPlayed - 1) + s.chainLength) / existing.gamesPlayed
    } else {
      userMap.set(s.userId, {
        userId: s.userId,
        name: s.user.name,
        image: s.user.image,
        totalScore: s.score,
        gamesPlayed: 1,
        bestScore: s.score,
        fastedTime: s.timeSeconds,
        avgChainLength: s.chainLength,
      })
    }
  }

  const leaderboard = Array.from(userMap.values())
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((entry, idx) => ({
      rank: idx + 1,
      ...entry,
    }))

  return NextResponse.json({ leaderboard, totalPlayers: leaderboard.length })
}
