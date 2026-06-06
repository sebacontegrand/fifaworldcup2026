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

async function reverseMatchPayouts(matchId: string) {
  const paidBets = await prisma.bet.findMany({
    where: { matchId, payout: { not: null } },
  })

  if (paidBets.length === 0) return

  const ops: any[] = []
  for (const bet of paidBets) {
    const payout = bet.payout ?? 0
    ops.push(
      prisma.bet.update({
        where: { id: bet.id },
        data: { payout: null },
      }),
      prisma.chipBalance.update({
        where: { userId: bet.userId },
        data: {
          balance: { decrement: payout },
          ...(payout > 0 ? { lifetimeEarnings: { decrement: payout } } : {}),
        },
      }),
    )
  }

  await prisma.$transaction(ops)
}

async function resolveMatchBets(matchId: string, actualA: number, actualB: number) {
  const bets = await prisma.bet.findMany({
    where: { matchId, payout: null },
    include: { user: true },
  })

  if (bets.length === 0) return 0

  for (const bet of bets) {
    const accuracy = calcAccuracyMultiplier(bet.scoreA, bet.scoreB, actualA, actualB)
    let payout = 0
    if (accuracy > 0) {
      let effectiveMultiplier = accuracy * bet.oddsMultiplier
      payout = Math.round(bet.wagerAmount * effectiveMultiplier)
    }

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
        } else if (userCard.card.effect === "insurance") {
          const predictedWinner = bet.scoreA > bet.scoreB ? "A" : bet.scoreB > bet.scoreA ? "B" : "draw"
          const actualWinner = actualA > actualB ? "A" : actualB > actualA ? "B" : "draw"
          if (predictedWinner === actualWinner) {
            payout = Math.max(payout, Math.round(userCard.card.multiplier ?? 50))
          }
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

  return bets.length
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
  const { scoreA, scoreB, reset } = body

  const match = await prisma.match.findUnique({ where: { id } })
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 })
  }

  // === RESET MODE: erase the fact result ===
  if (reset) {
    await reverseMatchPayouts(id)

    await prisma.guess.updateMany({
      where: { matchId: id },
      data: { points: null },
    })

    await prisma.match.update({
      where: { id },
      data: { scoreA: null, scoreB: null, isFact: false },
    })

    return NextResponse.json({ ok: true, reset: true })
  }

  // === SAVE / UPDATE MODE ===
  if (typeof scoreA !== "number" || typeof scoreB !== "number") {
    return NextResponse.json({ error: "Invalid scores" }, { status: 400 })
  }

  // If the match was already a fact, reverse existing payouts and reset guess points
  if (match.isFact) {
    await reverseMatchPayouts(id)
    await prisma.guess.updateMany({
      where: { matchId: id },
      data: { points: null },
    })
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

  // Resolve chip bets on this match (finds bets with payout: null)
  const betsResolved = await resolveMatchBets(id, scoreA, scoreB)

  // 📧 Fire-and-forget email notifications to users who guessed/bet on this match
  import("@/lib/email").then(({ sendMatchResultNotifications }) => {
    sendMatchResultNotifications(id, scoreA, scoreB).catch(console.error)
  })

  return NextResponse.json({ ok: true, guessesScored: guesses.length, betsResolved })
}
