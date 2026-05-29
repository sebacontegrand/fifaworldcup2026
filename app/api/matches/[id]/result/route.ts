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

function calcAccuracyMultiplier(scoreA: number, scoreB: number, actualA: number, actualB: number): number {
  if (scoreA === actualA && scoreB === actualB) return 5
  const diff = (scoreA - scoreB) - (actualA - actualB)
  if (diff === 0) return 3
  if ((scoreA > scoreB && actualA > actualB) || (scoreB > scoreA && actualB > actualA)) return 1.5
  return 0
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || (ADMIN_EMAIL && session.user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase())) {
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

  // Resolve chip bets on this match
  const bets = await prisma.bet.findMany({
    where: { matchId: id, payout: null },
    include: { user: true },
  })

  for (const bet of bets) {
    const accuracy = calcAccuracyMultiplier(bet.scoreA, bet.scoreB, scoreA, scoreB)
    let payout = 0
    if (accuracy > 0) {
      let effectiveMultiplier = accuracy * bet.oddsMultiplier
      payout = Math.round(bet.wagerAmount * effectiveMultiplier)
    }

    // Apply card effects
    if (bet.cardId) {
      const userCard = await prisma.userCard.findUnique({
        where: { userId_cardTemplateId: { userId: bet.userId, cardTemplateId: bet.cardId } },
        include: { card: true },
      })
      if (userCard?.card) {
        if (userCard.card.effect === "hedge" && accuracy === 0) {
          payout = Math.round(bet.wagerAmount * 0.5)
        } else if (userCard.card.effect === "lock_in" && payout > 0) {
          payout = Math.max(payout, bet.wagerAmount * 2)
        } else if (userCard.card.effect === "boost" && payout > 0) {
          payout = Math.round(payout * (userCard.card.multiplier ?? 1.5))
        }
      }
    }

    await prisma.$transaction([
      prisma.bet.update({
        where: { id: bet.id },
        data: { payout },
      }),
      prisma.chipBalance.update({
        where: { userId: bet.userId },
        data: {
          balance: { increment: payout },
          lifetimeEarnings: payout > 0 ? { increment: payout } : undefined,
        },
      }),
    ])
  }

  return NextResponse.json({ ok: true, guessesScored: guesses.length, betsResolved: bets.length })
}
