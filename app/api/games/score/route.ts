import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { gameType, difficulty, score, totalPossible } = body

  if (!gameType || !["trivia_flag", "trivia_kit", "trivia_player", "sort_teams", "sort_players"].includes(gameType)) {
    return NextResponse.json({ error: "Invalid gameType" }, { status: 400 })
  }

  if (!difficulty || !["easy", "medium", "hard"].includes(difficulty)) {
    return NextResponse.json({ error: "Invalid difficulty" }, { status: 400 })
  }

  if (typeof score !== "number" || score < 0) {
    return NextResponse.json({ error: "Invalid score" }, { status: 400 })
  }

  if (typeof totalPossible !== "number" || totalPossible < 0) {
    return NextResponse.json({ error: "Invalid totalPossible" }, { status: 400 })
  }

  const gameScore = await prisma.gameScore.create({
    data: {
      userId: session.user.id,
      gameType,
      difficulty,
      score,
      totalPossible,
    },
  })

  return NextResponse.json({ id: gameScore.id, score: gameScore.score })
}
