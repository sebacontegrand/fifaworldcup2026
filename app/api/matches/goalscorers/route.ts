import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  const goals = await prisma.matchGoal.groupBy({
    by: ["playerName"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 20,
  })

  const topScorers = goals.map((g) => ({
    player: g.playerName,
    goals: g._count.id,
  }))

  return NextResponse.json(topScorers)
}
