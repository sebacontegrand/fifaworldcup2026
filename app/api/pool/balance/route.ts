import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let balance = await prisma.chipBalance.findUnique({
    where: { userId: session.user.id },
  })

  if (!balance) {
    balance = await prisma.chipBalance.create({
      data: { userId: session.user.id },
    })
  }

  return NextResponse.json(balance)
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let balance = await prisma.chipBalance.findUnique({
    where: { userId: session.user.id },
  })

  if (!balance) {
    balance = await prisma.chipBalance.create({
      data: { userId: session.user.id },
    })
  }

  const now = new Date()
  const lastDaily = balance.lastDailyAt
  const isNewDay = !lastDaily || lastDaily.toDateString() !== now.toDateString()

  if (!isNewDay) {
    return NextResponse.json({ error: "Already claimed today" }, { status: 400 })
  }

  const isConsecutiveDay = lastDaily
    ? (now.getTime() - lastDaily.getTime()) < 48 * 60 * 60 * 1000
    : false

  const newStreak = isConsecutiveDay ? balance.dailyStreak + 1 : 1
  const streakBonus = Math.min((newStreak - 1) * 10, 50)

  balance = await prisma.chipBalance.update({
    where: { userId: session.user.id },
    data: {
      balance: { increment: 50 + streakBonus },
      lifetimeEarnings: { increment: 50 + streakBonus },
      dailyStreak: newStreak,
      lastDailyAt: now,
    },
  })

  return NextResponse.json({ balance: balance.balance, dailyStreak: newStreak, bonus: 50 + streakBonus })
}
