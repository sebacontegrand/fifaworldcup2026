import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)

  const matches = await prisma.match.findMany({
    orderBy: [
      { round: "asc" },
      { groupId: "asc" },
      { matchOrder: "asc" },
    ],
    include: {
      guesses: session?.user
        ? { where: { userId: session.user.id } }
        : false,
    },
  })

  const data = matches.map((m) => ({
    id: m.id,
    round: m.round,
    groupId: m.groupId,
    matchOrder: m.matchOrder,
    teamAId: m.teamAId,
    teamBId: m.teamBId,
    teamAName: m.teamAName,
    teamBName: m.teamBName,
    scoreA: m.scoreA,
    scoreB: m.scoreB,
    isFact: m.isFact,
    guess: (m as any).guesses?.[0] ?? null,
  }))

  return NextResponse.json(data)
}
