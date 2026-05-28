import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const match = await prisma.match.findUnique({ where: { id } })
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 })
  }

  const guesses = await prisma.guess.findMany({
    where: { matchId: id, points: { not: null } },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { points: "desc" },
  })

  const entries = guesses.map((g, idx) => ({
    rank: idx + 1,
    userId: g.userId,
    name: g.user.name,
    image: g.user.image,
    guessedScoreA: g.scoreA,
    guessedScoreB: g.scoreB,
    points: g.points,
  }))

  return NextResponse.json({
    match: {
      id: match.id,
      teamAName: match.teamAName,
      teamBName: match.teamBName,
      scoreA: match.scoreA,
      scoreB: match.scoreB,
    },
    entries,
  })
}
