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
  const { amount, source } = body

  if (!amount || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
  }

  if (!source || !["connection", "live_guess"].includes(source)) {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 })
  }

  const chipBalance = await prisma.chipBalance.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, balance: amount, lifetimeEarnings: amount },
    update: {
      balance: { increment: amount },
      lifetimeEarnings: { increment: amount },
    },
  })

  return NextResponse.json({ balance: chipBalance.balance, lifetimeEarnings: chipBalance.lifetimeEarnings, earned: amount })
}
