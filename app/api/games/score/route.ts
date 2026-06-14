import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

async function ensureUser(session: { user: { id: string; name?: string | null; email?: string | null; image?: string | null } }) {
  const exists = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } })
  if (exists) return

  const email = session.user.email ?? `user_${session.user.id}@placeholder.wc2026`
  try {
    await prisma.user.create({
      data: { id: session.user.id, name: session.user.name ?? null, email, image: session.user.image ?? null },
    })
  } catch {
    const fallbackEmail = `user_${session.user.id}_${Date.now()}@placeholder.wc2026`
    await prisma.user.create({
      data: { id: session.user.id, name: session.user.name ?? null, email: fallbackEmail, image: session.user.image ?? null },
    })
  }
}

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

  await ensureUser(session)

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
