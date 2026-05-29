import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const bets = await prisma.bet.findMany({
    where: { userId: session.user.id },
    include: {
      match: {
        select: { id: true, teamAName: true, teamBName: true, scoreA: true, scoreB: true, isFact: true, round: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json(bets)
}
