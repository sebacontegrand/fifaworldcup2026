import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { score, difficulty, mode, chainLength, shortestPossible, attempts, timeSeconds, playerA, playerB } = body

  if (!score || !difficulty || !mode || !playerA || !playerB) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const entry = await prisma.connectionScore.create({
    data: {
      userId: session.user.id,
      score,
      difficulty,
      mode,
      chainLength: chainLength ?? 0,
      shortestPossible: shortestPossible ?? 0,
      attempts: attempts ?? 1,
      timeSeconds: timeSeconds ?? 0,
      playerA,
      playerB,
    },
  })

  return NextResponse.json({ success: true, id: entry.id })
}
