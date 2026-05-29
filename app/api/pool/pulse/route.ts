import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  const bets = await prisma.bet.groupBy({
    by: ["matchId"],
    _count: { id: true },
    _sum: { wagerAmount: true },
    orderBy: { _count: { id: "desc" } },
    take: 20,
  })

  const matchIds = bets.map(b => b.matchId)
  const matches = await prisma.match.findMany({
    where: { id: { in: matchIds } },
    select: { id: true, teamAName: true, teamBName: true },
  })

  const matchMap = new Map(matches.map(m => [m.id, m]))

  const pulse = bets.map(b => {
    const m = matchMap.get(b.matchId)
    return {
      matchId: b.matchId,
      label: m ? `${m.teamAName ?? "?"} vs ${m.teamBName ?? "?"}` : "Unknown",
      totalBets: b._count.id,
      totalChips: b._sum.wagerAmount ?? 0,
    }
  })

  return NextResponse.json(pulse)
}
