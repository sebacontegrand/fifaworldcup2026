import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  const balances = await prisma.chipBalance.findMany({
    where: { lifetimeEarnings: { gt: 0 } },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
    orderBy: { lifetimeEarnings: "desc" },
  })

  const totalBets = await prisma.bet.groupBy({
    by: ["userId"],
    _count: { id: true },
    _sum: { wagerAmount: true },
    where: { payout: { not: null } },
  })

  const betMap = new Map(totalBets.map(b => [b.userId, { count: b._count.id, wagered: b._sum.wagerAmount ?? 0 }]))

  const leaderboard = balances.map((b, idx) => ({
    rank: idx + 1,
    userId: b.userId,
    name: b.user.name,
    image: b.user.image,
    balance: b.balance,
    lifetimeEarnings: b.lifetimeEarnings,
    bets: betMap.get(b.userId)?.count ?? 0,
    totalWagered: betMap.get(b.userId)?.wagered ?? 0,
  }))

  return NextResponse.json({ leaderboard, totalPlayers: balances.length })
}
