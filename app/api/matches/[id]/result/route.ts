import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

function calcGuessPoints(guessScoreA: number, guessScoreB: number, actualScoreA: number, actualScoreB: number): number {
  if (guessScoreA === actualScoreA && guessScoreB === actualScoreB) return 5
  if (guessScoreA === actualScoreA || guessScoreB === actualScoreB) return 2
  return 0
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || (ADMIN_EMAIL && session.user.email !== ADMIN_EMAIL)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
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

  // Update match with real result and mark as fact
  await prisma.match.update({
    where: { id },
    data: { scoreA, scoreB, isFact: true },
  })

  // Calculate points for all guesses on this match
  const guesses = await prisma.guess.findMany({ where: { matchId: id } })

  for (const guess of guesses) {
    const points = calcGuessPoints(guess.scoreA, guess.scoreB, scoreA, scoreB)
    await prisma.guess.update({
      where: { id: guess.id },
      data: { points },
    })
  }

  return NextResponse.json({ ok: true, guessesScored: guesses.length })
}
