import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import teamsData from "@/data/teams.json"

type Team = { id: string; name: string; eloRating: number }

function calcOddsMultiplier(teamA: Team, teamB: Team): number {
  const eloDiff = teamA.eloRating - teamB.eloRating
  const winProb = 1 / (1 + Math.pow(10, -eloDiff / 400))
  const midProb = Math.min(Math.max(winProb, 0.2), 0.8)
  const multiplier = 1 / midProb
  return Math.round(Math.min(Math.max(multiplier, 0.5), 3.0) * 100) / 100
}

function calcAccuracyMultiplier(scoreA: number, scoreB: number, actualA: number, actualB: number): number {
  if (scoreA === actualA && scoreB === actualB) return 5
  const diff = (scoreA - scoreB) - (actualA - actualB)
  if (diff === 0) return 3
  if ((scoreA > scoreB && actualA > actualB) || (scoreB > scoreA && actualB > actualA)) return 1.5
  return 0
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { matchId, scoreA, scoreB, wagerAmount, cardId } = body

  if (typeof scoreA !== "number" || typeof scoreB !== "number" || typeof wagerAmount !== "number") {
    return NextResponse.json({ error: "Invalid bet parameters" }, { status: 400 })
  }

  if (wagerAmount < 10) {
    return NextResponse.json({ error: "Minimum wager is 10 chips" }, { status: 400 })
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } })
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 })
  }
  if (match.isFact) {
    return NextResponse.json({ error: "Match already played" }, { status: 400 })
  }
  if (!match.teamAId || !match.teamBId) {
    return NextResponse.json({ error: "Match teams not set" }, { status: 400 })
  }

  const teams = teamsData as Team[]
  const teamA = teams.find(t => t.id === match.teamAId)
  const teamB = teams.find(t => t.id === match.teamBId)
  if (!teamA || !teamB) {
    return NextResponse.json({ error: "Team data not found" }, { status: 500 })
  }

  let balance = await prisma.chipBalance.findUnique({ where: { userId: session.user.id } })
  if (!balance) {
    balance = await prisma.chipBalance.create({ data: { userId: session.user.id } })
  }

  if (balance.balance < wagerAmount) {
    return NextResponse.json({ error: "Insufficient chips" }, { status: 400 })
  }

  const existing = await prisma.bet.findUnique({
    where: { userId_matchId: { userId: session.user.id, matchId } },
  })
  if (existing) {
    return NextResponse.json({ error: "Already bet on this match" }, { status: 400 })
  }

  let finalWager = wagerAmount
  let cardUsedId: string | null = cardId ?? null

  if (cardId) {
    const userCard = await prisma.userCard.findUnique({
      where: { userId_cardTemplateId: { userId: session.user.id, cardTemplateId: cardId } },
      include: { card: true },
    })
    if (!userCard || userCard.quantity < 1) {
      return NextResponse.json({ error: "Card not owned" }, { status: 400 })
    }
    if (userCard.card.cooldownHours > 0 && userCard.lastUsedAt) {
      const cooldownMs = userCard.card.cooldownHours * 60 * 60 * 1000
      const timeSinceLastUse = Date.now() - new Date(userCard.lastUsedAt).getTime()
      if (timeSinceLastUse < cooldownMs) {
        const hoursLeft = Math.ceil((cooldownMs - timeSinceLastUse) / (60 * 60 * 1000))
        return NextResponse.json({ error: `Card on cooldown. ${hoursLeft}h remaining.` }, { status: 400 })
      }
    }
    if (userCard.card.effect === "double_down") {
      finalWager = wagerAmount * 2
    }
  }

  const oddsMultiplier = calcOddsMultiplier(teamA, teamB)

  await prisma.$transaction([
    prisma.chipBalance.update({
      where: { userId: session.user.id },
      data: { balance: { decrement: finalWager } },
    }),
    prisma.bet.create({
      data: {
        userId: session.user.id,
        matchId,
        scoreA,
        scoreB,
        wagerAmount: finalWager,
        oddsMultiplier,
        cardId: cardUsedId,
      },
    }),
  ])

  if (cardId) {
    const userCard = await prisma.userCard.findUnique({
      where: { userId_cardTemplateId: { userId: session.user.id, cardTemplateId: cardId } },
    })
    if (userCard && userCard.quantity > 0) {
      if (userCard.quantity === 1) {
        await prisma.userCard.delete({ where: { id: userCard.id } })
      } else {
        await prisma.userCard.update({
          where: { id: userCard.id },
          data: { quantity: { decrement: 1 }, lastUsedAt: new Date() },
        })
      }
    }
  }

  return NextResponse.json({
    bet: { matchId, scoreA, scoreB, wagerAmount: finalWager, oddsMultiplier },
    remainingBalance: balance.balance - finalWager,
  })
}
