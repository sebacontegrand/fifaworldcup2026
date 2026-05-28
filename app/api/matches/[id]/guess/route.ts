import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
  if (match.isFact) {
    return NextResponse.json({ error: "Match result is already confirmed" }, { status: 400 })
  }

  const guess = await prisma.guess.upsert({
    where: { userId_matchId: { userId: session.user.id, matchId: id } },
    create: {
      userId: session.user.id,
      matchId: id,
      scoreA,
      scoreB,
    },
    update: {
      scoreA,
      scoreB,
    },
  })

  return NextResponse.json(guess)
}
